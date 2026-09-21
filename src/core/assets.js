/**
 * 资源加载 + 精灵烘焙
 * 大图 sheet（1536×1024）只在加载时按「屏上目标尺寸 × 设备像素」缩一次成小画布，
 * 运行时 1:1 贴，既省 GPU 也让 AI 大像素块自然变成小像素（docs/26 软像素）。
 */
export async function loadJSON(url) {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`加载失败 ${url} (${res.status})`);
  return res.json();
}

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`图片加载失败 ${url}`));
    img.src = url;
  });
}

/** 加载一套 sheet + manifest */
export async function loadSpriteSheet(dir) {
  const manifest = await loadJSON(`${dir}/manifest.json`);
  const image = await loadImage(`${dir}/${manifest.sheet?.image || 'sheet.png'}`);
  return { manifest, image };
}

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

/** HSL 色相偏移（用于史莱姆变种上色）；只跑在烘焙后的小画布上 */
export function tintCanvas(canvas, { hue = 0, sat = 1, light = 0 }) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    const r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0; const l = (max + min) / 2;
    if (max !== min) {
      const dd = max - min;
      s = l > 0.5 ? dd / (2 - max - min) : dd / (max + min);
      if (max === r) h = (g - b) / dd + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / dd + 2;
      else h = (r - g) / dd + 4;
      h /= 6;
    }
    h = (h + hue / 360 + 1) % 1;
    s = Math.min(1, s * sat);
    const l2 = Math.min(1, Math.max(0, l + light));
    const q = l2 < 0.5 ? l2 * (1 + s) : l2 + s - l2 * s;
    const p = 2 * l2 - q;
    const f = (t) => { t = (t + 1) % 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; };
    d[i] = f(h + 1 / 3) * 255; d[i + 1] = f(h) * 255; d[i + 2] = f(h - 1 / 3) * 255;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

/**
 * 烘焙一套动画。
 * @param sheet   {manifest,image}
 * @param opts    targetH：动画最高帧对应的世界高度（px）；k：设备像素/世界像素；
 *                flipFrom：{ left:'walk_right' } 用右向帧镜像生成左向；tint：{hue,sat,light}
 * @returns { anims: { name: { frames:[{canvas,flash,w,h,px,py}], fps } } }
 */
export function bakeSprites(sheet, { targetH, k, tint = null, flipFrom = {} }) {
  const { manifest, image } = sheet;
  const anims = {};
  const bakeAnim = (name, frameIds, fps, flip = false) => {
    const refH = Math.max(...frameIds.map((id) => manifest.frames[id].frame.h));
    const s = targetH / refH; // 世界 px / 源 px
    const frames = frameIds.map((id) => {
      const fr = manifest.frames[id];
      const { x, y, w, h } = fr.frame;
      const pivot = fr.pivot || { x: 0.5, y: 0.9 };
      const cw = Math.ceil(w * s * k), ch = Math.ceil(h * s * k);
      const canvas = makeCanvas(cw, ch);
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      if (flip) { ctx.translate(cw, 0); ctx.scale(-1, 1); }
      ctx.drawImage(image, x, y, w, h, 0, 0, cw, ch);
      if (tint) tintCanvas(canvas, tint);
      // 命中闪白：同尺寸白色剪影
      const flash = makeCanvas(cw, ch);
      const fctx = flash.getContext('2d');
      fctx.drawImage(canvas, 0, 0);
      fctx.globalCompositeOperation = 'source-in';
      fctx.fillStyle = '#fffaf2';
      fctx.fillRect(0, 0, cw, ch);
      const ww = cw / k, wh = ch / k;
      return { canvas, flash, w: ww, h: wh, px: (flip ? 1 - pivot.x : pivot.x) * ww, py: pivot.y * wh };
    });
    anims[name] = { frames, fps: fps || 8 };
  };
  for (const [name, a] of Object.entries(manifest.animations || {})) {
    bakeAnim(name, a.frames, a.frameRate);
  }
  for (const [name, from] of Object.entries(flipFrom)) {
    const a = manifest.animations[from];
    if (a) bakeAnim(name, a.frames, a.frameRate, true);
  }
  return { anims };
}

/** 极简动画播放器：每个实体一个，共享烘焙帧 */
export class Animator {
  constructor(sprites, anim, phase = 0) {
    this.sprites = sprites;
    this.anim = anim;
    this.t = phase;
    this.speed = 1;
  }
  play(anim) { if (anim !== this.anim && this.sprites.anims[anim]) { this.anim = anim; this.t = 0; } }
  update(dt) { this.t += dt * this.speed; }
  frame() {
    const a = this.sprites.anims[this.anim];
    if (!a) return null;
    const i = Math.floor(this.t * a.fps) % a.frames.length;
    return a.frames[i < 0 ? 0 : i];
  }
}
