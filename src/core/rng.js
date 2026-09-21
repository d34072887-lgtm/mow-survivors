/** 可种子 RNG（docs/02 Random）— mulberry32 */
export class Rng {
  constructor(seed = Date.now()) { this.seed = seed >>> 0; this.s = this.seed || 1; }
  next() {
    let t = (this.s += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  range(a, b) { return a + (b - a) * this.next(); }
  int(a, b) { return a + Math.floor(this.next() * (b - a + 1)); }
  chance(p) { return this.next() < p; }
  pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }
  /** 按 weight 字段抽一个 */
  weighted(arr, weightOf = (x) => x.weight) {
    let total = 0;
    for (const it of arr) total += Math.max(0, weightOf(it) || 0);
    if (total <= 0) return arr[0];
    let r = this.next() * total;
    for (const it of arr) {
      r -= Math.max(0, weightOf(it) || 0);
      if (r <= 0) return it;
    }
    return arr[arr.length - 1];
  }
}

/** 确定性哈希（tile 变体用），返回 0..1 */
export function hash2(x, y, salt = 0) {
  let h = (x * 374761393 + y * 668265263 + salt * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
