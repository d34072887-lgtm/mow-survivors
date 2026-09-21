/**
 * 输入：浮动虚拟摇杆（docs/26：单一方案 = 摇杆；15% 死区 + 推力曲线）+ 桌面 WASD/方向键（仅开发预览）
 * 摇杆区是整块拇指区：手指按在哪，底座就出现在哪。
 */
export class Input {
  constructor({ zone, joystick, stick, maxRadius = 46, deadzone = 0.15 }) {
    this.zone = zone;
    this.joyEl = joystick;
    this.stickEl = stick;
    this.maxRadius = maxRadius;
    this.deadzone = deadzone;
    this.x = 0; this.y = 0;     // 处理后的推力向量（-1..1）
    this.active = false;
    this.pointerId = null;
    this.origin = { x: 0, y: 0 };
    this.keys = new Set();
    this.anyTouch = false;
    this._bind();
  }

  _bind() {
    const z = this.zone;
    z.addEventListener('pointerdown', (e) => this._down(e));
    z.addEventListener('pointermove', (e) => this._move(e));
    z.addEventListener('pointerup', (e) => this._up(e));
    z.addEventListener('pointercancel', (e) => this._up(e));
    z.addEventListener('lostpointercapture', (e) => this._up(e));
    window.addEventListener('keydown', (e) => { if (this._isKey(e.code)) { this.keys.add(e.code); e.preventDefault(); } });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());
  }

  _isKey(code) { return /^(Arrow(Up|Down|Left|Right)|Key[WASDJ]|Space)$/.test(code); }

  _down(e) {
    if (this.active) return;
    this.active = true; this.anyTouch = true;
    this.pointerId = e.pointerId;
    try { this.zone.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    const r = this.zone.getBoundingClientRect();
    const half = this.joyEl.offsetWidth / 2 || 50;
    // 底座出现在手指处，但不超出摇杆区
    const ox = Math.min(Math.max(e.clientX - r.left, half), r.width - half);
    const oy = Math.min(Math.max(e.clientY - r.top, half), r.height - half);
    this.origin = { x: ox, y: oy };
    this.joyEl.style.left = `${ox}px`;
    this.joyEl.style.top = `${oy}px`;
    this.joyEl.classList.add('live');
    this._apply(e.clientX - r.left - ox, e.clientY - r.top - oy);
  }

  _move(e) {
    if (!this.active || e.pointerId !== this.pointerId) return;
    const r = this.zone.getBoundingClientRect();
    this._apply(e.clientX - r.left - this.origin.x, e.clientY - r.top - this.origin.y);
  }

  _up(e) {
    if (!this.active || (e.pointerId !== undefined && e.pointerId !== this.pointerId)) return;
    this.active = false; this.pointerId = null;
    this.x = 0; this.y = 0;
    this.stickEl.style.transform = 'translate(0px, 0px)';
    this.joyEl.classList.remove('live');
    this.joyEl.style.left = '50%';
    this.joyEl.style.top = '50%';
  }

  _apply(dx, dy) {
    const dist = Math.hypot(dx, dy);
    const R = this.maxRadius;
    const clamped = Math.min(dist, R);
    const nx = dist > 0 ? dx / dist : 0, ny = dist > 0 ? dy / dist : 0;
    this.stickEl.style.transform = `translate(${nx * clamped}px, ${ny * clamped}px)`;
    let mag = clamped / R;
    if (mag < this.deadzone) mag = 0;
    else mag = Math.pow((mag - this.deadzone) / (1 - this.deadzone), 1.25); // 推力曲线：轻推微调，推满全速
    this.x = nx * mag; this.y = ny * mag;
  }

  /** 合并摇杆 + 键盘，返回 {x,y}（长度 ≤ 1） */
  axis() {
    let x = this.x, y = this.y;
    if (!this.active && this.keys.size) {
      if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1;
      if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1;
      if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) y -= 1;
      if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) y += 1;
      const l = Math.hypot(x, y);
      if (l > 1) { x /= l; y /= l; }
    }
    return { x, y };
  }

  /** 按住空格/J 也可放技能（开发用） */
  skillKeyPressed() { return this.keys.has('Space') || this.keys.has('KeyJ'); }
}
