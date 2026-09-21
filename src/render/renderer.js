import { TUNING } from '../data/tuning.js';
import { bakeTiles, tileAt } from './tiles.js';

const FONT = '"HarmonyOS Sans SC","PingFang SC","Microsoft YaHei UI",sans-serif';
const easeOutBack = (t) => { const c = 1.7; t = Math.min(1, t); return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

/**
 * 世界渲染：全部按设备像素画（k = 设备像素 / 世界像素），精灵 1:1 贴，位置取整 → 清晰不抖。
 * 顺序：地面 → 地波/技能圈 → 影子 → 金币 → Y 排序精灵 → 弹体/飞轮/挥砍 → 粒子/数字 → 暗角
 */
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.k = 1; this.dpr = 1; this.w = 0; this.h = 0;
    this.tiles = null; this.vignette = null;
    this.fps = 0; this._fpsAcc = 0; this._fpsN = 0;
  }

  /** 返回实际使用的 zoom（让 32px tile 落在整数设备像素上） */
  resize(cssW, cssH) {
    this.dpr = Math.min(3, window.devicePixelRatio || 1);
    const zoomWanted = cssW / TUNING.designW;
    this.k = Math.max(1, Math.round(TUNING.tile * this.dpr * zoomWanted)) / TUNING.tile;
    const zoom = this.k / this.dpr;
    this.w = Math.round(cssW * this.dpr); this.h = Math.round(cssH * this.dpr);
    this.canvas.width = this.w; this.canvas.height = this.h;
    this.tiles = bakeTiles(this.k);
    this._bakeVignette();
    return zoom;
  }

  _bakeVignette() {
    const c = document.createElement('canvas');
    c.width = this.w; c.height = this.h;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(this.w / 2, this.h * 0.55, Math.min(this.w, this.h) * 0.45, this.w / 2, this.h * 0.55, Math.hypot(this.w, this.h) * 0.62);
    grd.addColorStop(0, 'rgba(60,40,20,0)'); grd.addColorStop(1, 'rgba(60,40,20,0.22)');
    g.fillStyle = grd; g.fillRect(0, 0, this.w, this.h);
    this.vignette = c;
  }

  render(b, sprites, dt) {
    const { ctx, k } = this;
    const cam = b.camera;
    const ox = Math.round((-cam.x + cam.shakeX) * k), oy = Math.round((-cam.y + cam.shakeY) * k);
    const X = (wx) => Math.round(wx * k) + ox, Y = (wy) => Math.round(wy * k) + oy;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;

    this._drawGround(cam, ox, oy);
    this._drawGroundFx(b, X, Y, k);
    this._drawShadows(b, X, Y, k);
    this._drawPickups(b, X, Y, k);
    this._drawEntities(b, sprites, X, Y, k);
    this._drawWeaponFx(b, X, Y, k);
    this._drawParticles(b, X, Y, k);
    this._drawNumbers(b, X, Y, k);
    ctx.globalAlpha = 1;
    ctx.drawImage(this.vignette, 0, 0);
    if (TUNING.debug) this._drawDebug(b, dt);
  }

  _drawGround(cam, ox, oy) {
    const { ctx, tiles } = this;
    const t = TUNING.tile, s = tiles.size;
    const tx0 = Math.floor(cam.x / t) - 1, ty0 = Math.floor(cam.y / t) - 1;
    const tx1 = Math.ceil((cam.x + cam.worldW) / t) + 1, ty1 = Math.ceil((cam.y + cam.worldH) / t) + 1;
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
      ctx.drawImage(tileAt(tiles, tx, ty), tx * s + ox, ty * s + oy);
    }
  }

  _drawGroundFx(b, X, Y, k) {
    const { ctx } = this;
    const p = b.player;
    // 诱捕标记圈
    if (p.skill.active > 0) {
      const a = 0.35 + 0.15 * Math.sin(b.time * 12);
      ctx.strokeStyle = `rgba(212,132,122,${a})`; ctx.lineWidth = 1.5 * k; ctx.setLineDash([6 * k, 5 * k]);
      ctx.beginPath(); ctx.ellipse(X(p.x), Y(p.y), p.skill.radius * k, p.skill.radius * 0.85 * k, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
    }
    // 地波
    for (const w of b.weapons.waves) {
      const prog = Math.min(1, w.t / w.dur), fade = Math.max(0, 1 - Math.max(0, (w.t - w.dur * 0.6)) / (w.dur * 0.65));
      const r = w.R * prog * k;
      ctx.fillStyle = `rgba(240,194,122,${0.16 * fade})`;
      ctx.beginPath(); ctx.ellipse(X(w.x), Y(w.y), r, r * 0.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = `rgba(255,236,190,${0.9 * fade})`; ctx.lineWidth = 3 * k;
      ctx.beginPath(); ctx.ellipse(X(w.x), Y(w.y), r, r * 0.6, 0, 0, Math.PI * 2); ctx.stroke();
    }
  }

  _drawShadows(b, X, Y, k) {
    const { ctx } = this;
    ctx.fillStyle = 'rgba(60,40,30,0.16)';
    const sh = (x, y, rx, ry) => { ctx.beginPath(); ctx.ellipse(X(x), Y(y) + 1, rx * k, ry * k, 0, 0, Math.PI * 2); ctx.fill(); };
    for (const m of b.monsters.list) { const s = m.spawnT < TUNING.spawnInTime ? m.spawnT / TUNING.spawnInTime : 1; sh(m.x, m.y, m.size * 0.55 * s, m.size * 0.18 * s); }
    const p = b.player; sh(p.x, p.y, 10, 3.5);
  }

  _drawPickups(b, X, Y, k) {
    const { ctx } = this;
    for (const c of b.pickups.list) {
      const bob = c.z > 0 ? 0 : Math.sin(b.time * 6 + c.x) * 1.2;
      const x = X(c.x), y = Y(c.y - c.z - bob), r = 3.2 * k;
      ctx.fillStyle = '#c9983a'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd86b'; ctx.beginPath(); ctx.arc(x - r * 0.15, y - r * 0.15, r * 0.7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff3c4'; ctx.fillRect(x - r * 0.45, y - r * 0.45, Math.max(1, r * 0.35), Math.max(1, r * 0.35));
    }
  }

  _drawEntities(b, sprites, X, Y, k) {
    const { ctx } = this;
    const items = [];
    for (const m of b.monsters.list) items.push({ y: m.y, m });
    items.push({ y: b.player.y, p: b.player });
    items.sort((a, c) => a.y - c.y);
    for (const it of items) {
      if (it.m) this._drawMonster(it.m, X, Y, k, b.time);
      else this._drawPlayer(it.p, sprites.hero, X, Y, k);
    }
    ctx.globalAlpha = 1;
  }

  _drawMonster(m, X, Y, k, time) {
    const { ctx } = this;
    const f = m.anim.frame();
    if (!f) return;
    const s = m.spawnT < TUNING.spawnInTime ? easeOutBack(m.spawnT / TUNING.spawnInTime) : 1;
    const w = f.canvas.width * s, h = f.canvas.height * s;
    const x = X(m.x) - Math.round(f.px * k * s), y = Y(m.y) - Math.round(f.py * k * s);
    ctx.drawImage(f.canvas, x, y, w, h);
    if (m.flash > 0) { ctx.globalAlpha = Math.min(1, m.flash / 0.09) * 0.85; ctx.drawImage(f.flash, x, y, w, h); ctx.globalAlpha = 1; }
    if (m.marked > 0) {
      const a = 0.6 + 0.4 * Math.sin(time * 14);
      ctx.fillStyle = `rgba(212,132,122,${a})`;
      const hx = X(m.x), hy = y - 5 * k;
      ctx.beginPath(); ctx.moveTo(hx, hy + 3 * k); ctx.lineTo(hx - 3.5 * k, hy - 1 * k); ctx.lineTo(hx + 3.5 * k, hy - 1 * k); ctx.closePath(); ctx.fill();
    }
    if (m.tier === 'elite' && m.hp < m.maxHp) {
      const bw = m.size * 1.1 * k, bh = 3 * k, bx = X(m.x) - bw / 2, by = y - 6 * k;
      ctx.fillStyle = 'rgba(60,40,30,0.35)'; ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = '#f0b66e'; ctx.fillRect(bx, by, bw * (m.hp / m.maxHp), bh);
    }
  }

  _drawPlayer(p, hero, X, Y, k) {
    const { ctx } = this;
    const anim = hero.anims[`walk_${p.facing}`] || hero.anims.walk_down;
    const idx = p.moving ? Math.floor(p.animT * anim.fps) % anim.frames.length : 0;
    const f = anim.frames[idx];
    const x = X(p.x) - Math.round(f.px * k), y = Y(p.y) - Math.round(f.py * k);
    if (p.invuln > 0 && p.flash <= 0 && Math.floor(p.invuln * 24) % 2 === 0) ctx.globalAlpha = 0.55;
    ctx.drawImage(f.canvas, x, y);
    ctx.globalAlpha = 1;
    if (p.flash > 0) { ctx.globalAlpha = Math.min(1, p.flash / 0.12) * 0.8; ctx.drawImage(f.flash, x, y); ctx.globalAlpha = 1; }
    if (!p.alive) { ctx.globalAlpha = 0.5; ctx.drawImage(f.flash, x, y); ctx.globalAlpha = 1; }
  }

  _drawWeaponFx(b, X, Y, k) {
    const { ctx } = this;
    const p = b.player;
    // 环绕飞轮：小扇形叶片 + 拖尾
    for (const w of b.weapons.weapons) {
      if (w.pattern !== 'orbit') continue;
      const P = w.params, R = P.radius * (1 + p.stats.get('range'));
      for (let i = 0; i < P.count; i++) {
        const a = w.angle + (Math.PI * 2 * i) / P.count;
        const bx = X(p.x + Math.cos(a) * R), by = Y(p.y + Math.sin(a) * R * 0.85);
        ctx.strokeStyle = 'rgba(255,215,207,0.35)'; ctx.lineWidth = 2 * k;
        ctx.beginPath(); ctx.ellipse(X(p.x), Y(p.y), R * k, R * 0.85 * k, 0, a - 0.9, a - 0.08); ctx.stroke();
        ctx.save(); ctx.translate(bx, by); ctx.rotate(a + b.time * 9);
        ctx.fillStyle = '#f6c9bf'; ctx.beginPath(); ctx.ellipse(0, 0, P.bladeR * k, P.bladeR * 0.45 * k, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff4ef'; ctx.beginPath(); ctx.ellipse(0, 0, P.bladeR * 0.45 * k, P.bladeR * 0.9 * k, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#c46a5f'; ctx.beginPath(); ctx.arc(0, 0, 1.4 * k, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    }
    // 挥砍扇形
    for (const a of b.weapons.arcs) {
      const t = a.t / a.dur, alpha = (1 - t) * 0.7;
      const cx = X(a.x), cy = Y(a.y), r = a.R * k * (0.85 + 0.15 * t);
      ctx.fillStyle = `rgba(255,243,214,${alpha})`;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, a.a - a.half, a.a + a.half); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = `rgba(255,255,255,${alpha + 0.2})`; ctx.lineWidth = 2 * k;
      ctx.beginPath(); ctx.arc(cx, cy, r, a.a - a.half, a.a + a.half); ctx.stroke();
    }
    // 弹体：箭/弹丸
    ctx.lineCap = 'round';
    for (const pr of b.weapons.projectiles) {
      const l = Math.hypot(pr.vx, pr.vy) || 1, nx = pr.vx / l, ny = pr.vy / l;
      const x = X(pr.x), y = Y(pr.y);
      ctx.strokeStyle = pr.color; ctx.lineWidth = pr.r * 1.5 * k;
      ctx.beginPath(); ctx.moveTo(x - nx * pr.len * k, y - ny * pr.len * k); ctx.lineTo(x, y); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, pr.r * 0.7 * k, 0, Math.PI * 2); ctx.fill();
    }
  }

  _drawParticles(b, X, Y, k) {
    const { ctx } = this;
    for (const p of b.fx.particles) {
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life / p.maxLife * 1.5));
      ctx.fillStyle = p.color;
      const s = Math.max(1, Math.round(p.size * k));
      ctx.fillRect(X(p.x) - s / 2, Y(p.y) - s / 2, s, s);
    }
    ctx.globalAlpha = 1;
  }

  _drawNumbers(b, X, Y, k) {
    const { ctx } = this;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const n of b.fx.numbers) {
      const t = n.life / n.maxLife;
      ctx.globalAlpha = Math.min(1, t * 2.2);
      ctx.font = `700 ${Math.round((n.big ? 13 : 10.5) * k)}px ${FONT}`;
      ctx.lineWidth = 3 * k; ctx.strokeStyle = 'rgba(74,63,56,0.55)'; ctx.lineJoin = 'round';
      ctx.strokeText(n.text, X(n.x), Y(n.y)); ctx.fillStyle = n.color; ctx.fillText(n.text, X(n.x), Y(n.y));
    }
    ctx.globalAlpha = 1;
  }

  _drawDebug(b, dt) {
    const { ctx, dpr } = this;
    this._fpsAcc += dt; this._fpsN++;
    if (this._fpsAcc >= 0.5) { this.fps = Math.round(this._fpsN / this._fpsAcc); this._fpsAcc = 0; this._fpsN = 0; }
    ctx.font = `${11 * dpr}px monospace`; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = '#fff';
    ctx.fillText(`fps ${this.fps}  mon ${b.monsters.list.length}  proj ${b.weapons.projectiles.length}  part ${b.fx.particles.length}  k ${this.k.toFixed(2)}  phase ${b.phase}`, 8 * dpr, this.h - 16 * dpr);
  }
}
