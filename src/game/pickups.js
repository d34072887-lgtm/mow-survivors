import { TUNING } from '../data/tuning.js';

/** 金币掉落：弹出 → 落地 → 进吸附半径后飞向玩家 */
export class Pickups {
  constructor() { this.list = []; }
  dropGold(x, y, amount, rng) {
    // 拆成 1~3 枚，视觉更「掉宝」
    const n = amount >= 6 ? 3 : amount >= 3 ? 2 : 1;
    let left = amount;
    for (let i = 0; i < n; i++) {
      const v = i === n - 1 ? left : Math.max(1, Math.round(amount / n));
      left -= v;
      const a = rng.range(0, Math.PI * 2), s = rng.range(30, 70);
      this.list.push({ kind: 'gold', x, y, z: 0, vz: rng.range(60, 110), vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, value: v, magnet: false, t: 0 });
    }
  }
  update(dt, player, onCollect) {
    const radius = TUNING.pickupRadius * (1 + player.stats.get('pickupRange'));
    const list = this.list;
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      p.t += dt;
      const dx = player.x - p.x, dy = player.y - p.y;
      const d = Math.hypot(dx, dy);
      if (!p.magnet && d < radius && p.t > 0.25) p.magnet = true;
      if (p.magnet) {
        const sp = TUNING.magnetSpeed + (radius * 2 - d) * 4;
        p.x += (dx / (d || 1)) * sp * dt; p.y += (dy / (d || 1)) * sp * dt; p.z = Math.max(0, p.z - 200 * dt);
        if (d < 8) { list[i] = list[list.length - 1]; list.pop(); onCollect(p); }
      } else {
        // 抛物线落地
        p.vz -= 360 * dt; p.z += p.vz * dt;
        if (p.z <= 0) { p.z = 0; p.vz = 0; p.vx *= 0.6; p.vy *= 0.6; }
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.t > 25) { list[i] = list[list.length - 1]; list.pop(); }
      }
    }
  }
  clear() { this.list.length = 0; }
}
