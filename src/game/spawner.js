import { TUNING } from '../data/tuning.js';

/** 按回合规则刷怪（docs/05）：视野外一圈、限制同屏数、精英概率、Boss 回合细流 */
export class Spawner {
  constructor(monsterDefs, rng) {
    this.defs = monsterDefs;
    this.rng = rng;
    this.rule = null;
    this.spawned = 0; this.elites = 0;
    this.acc = 0;
  }

  startRound(rule) {
    this.rule = rule;
    this.spawned = 0; this.elites = 0;
    this.acc = rule.duration > 0 ? (rule.duration * 0.82) / rule.spawnTotal * 0.6 : 0; // 开局稍等一下就来第一只
  }

  /**
   * 出怪点：以玩家为圆心 spawnRing 距离的环上随机一点（竖屏上下边太远，纯视野外刷怪会让怪 10 多秒才进场）。
   * 屏内出生用「从草里冒出来」的入场动画遮掩（spawnT）。
   */
  edgePoint(camera, player) {
    const { w, h } = TUNING.world;
    const [r0, r1] = TUNING.spawnRing;
    const cx = player ? player.x : camera.x + camera.worldW / 2;
    const cy = player ? player.y : camera.y + camera.worldH / 2;
    for (let tries = 0; tries < 10; tries++) {
      const a = this.rng.range(0, Math.PI * 2);
      const d = this.rng.range(r0, r1);
      const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
      if (x > 24 && x < w - 24 && y > 24 && y < h - 24) return { x, y };
    }
    return { x: Math.min(w - 40, Math.max(40, cx + this.rng.range(-1, 1) * r1)), y: Math.min(h - 40, Math.max(40, cy + this.rng.range(-1, 1) * r1)) };
  }

  pickNormal() {
    const entry = this.rng.weighted(this.rule.pool);
    return this.defs[entry.id];
  }

  /** 每帧调用；返回要生成的 [{def, x, y}] */
  update(dt, camera, player, onScreen) {
    const r = this.rule;
    const out = [];
    if (!r) return out;
    if (r.duration > 0) {
      if (this.spawned >= r.spawnTotal) return out;
      const interval = (r.duration * 0.82) / r.spawnTotal; // 最后 18% 时间不再出新怪，留给玩家清场
      this.acc += dt;
      while (this.acc >= interval && this.spawned < r.spawnTotal && onScreen + out.length < r.maxOnScreen) {
        this.acc -= interval;
        this.spawned++;
        let def = this.pickNormal();
        if (r.eliteChance > 0 && this.elites < r.eliteMax && this.rng.chance(r.eliteChance)) { def = this.defs[r.eliteId]; this.elites++; }
        out.push({ def, ...this.edgePoint(camera, player) });
      }
      if (this.acc > interval * 2) this.acc = interval * 2; // 满屏时不无限积压
    } else if (r.trickleEvery) {
      this.acc += dt;
      if (this.acc >= r.trickleEvery && onScreen < r.maxOnScreen) {
        this.acc = 0;
        out.push({ def: this.pickNormal(), ...this.edgePoint(camera, player) });
      }
    }
    return out;
  }

  /** 时间到但还没刷完的（满屏压着）就不再刷 */
  done() { return !this.rule || this.rule.duration <= 0 || this.spawned >= this.rule.spawnTotal; }
}
