/** 均匀网格空间哈希：每帧重建，供碰撞 / 分离 / 范围查询 */
export class SpatialHash {
  constructor(cell = 64) { this.cell = cell; this.map = new Map(); }
  clear() { this.map.clear(); }
  _key(cx, cy) { return cx * 73856093 ^ cy * 19349663; }
  insert(e) {
    const c = this.cell;
    const x0 = Math.floor((e.x - e.r) / c), x1 = Math.floor((e.x + e.r) / c);
    const y0 = Math.floor((e.y - e.r) / c), y1 = Math.floor((e.y + e.r) / c);
    for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
      const k = this._key(cx, cy);
      let b = this.map.get(k);
      if (!b) { b = []; this.map.set(k, b); }
      b.push(e);
    }
  }
  /** 遍历圆 (x,y,r) 可能相交的实体（去重），fn 返回 true 可提前结束 */
  query(x, y, r, fn) {
    const c = this.cell;
    const x0 = Math.floor((x - r) / c), x1 = Math.floor((x + r) / c);
    const y0 = Math.floor((y - r) / c), y1 = Math.floor((y + r) / c);
    const seen = new Set();
    for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
      const b = this.map.get(this._key(cx, cy));
      if (!b) continue;
      for (const e of b) {
        if (seen.has(e)) continue;
        seen.add(e);
        const dx = e.x - x, dy = e.y - y, rr = r + e.r;
        if (dx * dx + dy * dy <= rr * rr && fn(e, dx, dy)) return;
      }
    }
  }
}
