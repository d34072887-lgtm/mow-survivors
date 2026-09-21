import { TUNING } from '../data/tuning.js';

/** 相机：玩家锚在画面偏下，跟随插值，钳在世界内；zoom = 视口宽 / 设计宽 390 */
export class Camera {
  constructor(viewW, viewH, zoom) {
    this.x = 0; this.y = 0;
    this.shakeX = 0; this.shakeY = 0; this.shakeAmp = 0; this.shakeT = 0;
    this.resize(viewW, viewH, zoom);
  }
  /** zoom 由渲染器给（保证 tile 落整像素）；不传则按设计宽算 */
  resize(viewW, viewH, zoom) {
    this.viewW = viewW; this.viewH = viewH;
    this.zoom = zoom || viewW / TUNING.designW;
    this.worldW = viewW / this.zoom;     // 视口覆盖的世界宽（≈390）
    this.worldH = viewH / this.zoom;
  }
  snapTo(px, py) {
    this.x = px - this.worldW / 2;
    this.y = py - this.worldH * TUNING.playerAnchorY;
    this._clamp();
  }
  follow(px, py, dt) {
    const tx = px - this.worldW / 2, ty = py - this.worldH * TUNING.playerAnchorY;
    const k = Math.min(1, TUNING.camLerp * dt);
    this.x += (tx - this.x) * k;
    this.y += (ty - this.y) * k;
    this._clamp();
    if (this.shakeT > 0) {
      this.shakeT -= dt;
      const a = this.shakeAmp * Math.max(0, this.shakeT) * 6;
      this.shakeX = (Math.random() * 2 - 1) * a;
      this.shakeY = (Math.random() * 2 - 1) * a;
    } else { this.shakeX = 0; this.shakeY = 0; }
  }
  shake(amp = 3, t = 0.15) { this.shakeAmp = Math.max(this.shakeAmp * (this.shakeT > 0 ? 1 : 0), amp); this.shakeT = t; }
  _clamp() {
    const { w, h } = TUNING.world;
    const m = TUNING.tile; // 露出一圈树篱
    this.x = Math.max(-m, Math.min(w + m - this.worldW, this.x));
    this.y = Math.max(-m, Math.min(h + m - this.worldH, this.y));
  }
  /** 视野矩形（世界坐标） */
  rect(margin = 0) { return { x0: this.x - margin, y0: this.y - margin, x1: this.x + this.worldW + margin, y1: this.y + this.worldH + margin }; }
  inView(x, y, margin = 40) { return x > this.x - margin && x < this.x + this.worldW + margin && y > this.y - margin && y < this.y + this.worldH + margin; }
}

export function clampToWorld(e, pad = 10) {
  const { w, h } = TUNING.world;
  if (e.x < pad) e.x = pad; else if (e.x > w - pad) e.x = w - pad;
  if (e.y < pad) e.y = pad; else if (e.y > h - pad) e.y = h - pad;
}
