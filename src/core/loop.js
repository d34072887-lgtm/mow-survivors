/** rAF 主循环：可变步长 + 上限，避免切后台回来一口气追帧 */
export class Loop {
  constructor(update, render, maxDt = 0.05) {
    this.update = update;
    this.render = render;
    this.maxDt = maxDt;
    this.running = false;
    this.last = 0;
    this._tick = this._tick.bind(this);
  }
  start() {
    if (this.running) return;
    this.running = true;
    this.last = 0;
    requestAnimationFrame(this._tick);
  }
  stop() { this.running = false; }
  _tick(ts) {
    if (!this.running) return;
    if (!this.last) { this.last = ts; requestAnimationFrame(this._tick); return; }
    const dt = Math.min((ts - this.last) / 1000, this.maxDt);
    this.last = ts;
    this.update(dt);
    this.render(dt);
    requestAnimationFrame(this._tick);
  }
}
