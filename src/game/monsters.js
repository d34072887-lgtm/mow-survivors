import { TUNING } from '../data/tuning.js';
import { Animator } from '../core/assets.js';
import { SpatialHash } from './spatial.js';
import { clampToWorld } from './world.js';

let nextId = 1;

/** 怪物管理：对象池 + 追踪 AI + 分离 + Boss 行为 */
export class Monsters {
  constructor(sprites) {
    this.sprites = sprites;       // { [monsterId]: bakedSprites }
    this.list = [];
    this.pool = [];
    this.hash = new SpatialHash(48);
    this.boss = null;
  }

  spawn(def, x, y, { hpMul = 1, atkMul = 1 } = {}) {
    const m = this.pool.pop() || {};
    m.id = nextId++;
    m.def = def; m.tier = def.tier;
    m.x = x; m.y = y; m.vx = 0; m.vy = 0; m.kbx = 0; m.kby = 0;
    m.size = def.sizePx;
    m.r = Math.max(6, def.sizePx * 0.42);
    m.maxHp = Math.round(def.hp * hpMul); m.hp = m.maxHp;
    m.attack = Math.round(def.attack * atkMul);
    m.speed = TUNING.heroSpeed * def.speedRatio;
    m.alive = true; m.flash = 0; m.contactCd = Math.random() * 0.3;
    m.marked = 0; m.hitTimes = {}; m.spawnT = 0; m.dieT = 0;
    m.anim = new Animator(this.sprites[def.id], 'idle', Math.random() * 3);
    m.anim.speed = 0.8 + Math.random() * 0.4;
    m.dashT = 0; m.dashCd = def.boss?.dashEvery || 0; m.summonCd = def.boss?.summonEvery || 0;
    this.list.push(m);
    if (def.tier === 'boss') this.boss = m;
    return m;
  }

  remove(m) {
    const i = this.list.indexOf(m);
    if (i >= 0) { this.list[i] = this.list[this.list.length - 1]; this.list.pop(); }
    if (this.boss === m) this.boss = null;
    m.alive = false;
    this.pool.push(m);
  }

  count(tier) { return tier ? this.list.filter((m) => m.tier === tier).length : this.list.length; }

  update(dt, player, ctx) {
    const { hash } = this;
    hash.clear();
    for (const m of this.list) hash.insert(m);

    for (const m of this.list) {
      m.anim.update(dt);
      if (m.spawnT < 1) m.spawnT += dt;
      if (m.flash > 0) m.flash -= dt;
      if (m.marked > 0) m.marked -= dt;
      if (m.contactCd > 0) m.contactCd -= dt;

      // 追踪
      let dx = player.x - m.x, dy = player.y - m.y;
      const d = Math.hypot(dx, dy) || 1;
      dx /= d; dy /= d;
      let speed = m.speed;
      if (m.def.boss) speed = this._bossAI(m, dt, dx, dy, ctx);
      // 有击退时先吃击退
      m.vx = dx * speed + m.kbx; m.vy = dy * speed + m.kby;
      const decay = Math.max(0, 1 - TUNING.knockbackDecay * dt);
      m.kbx *= decay; m.kby *= decay;

      // 分离：不要叠成一坨
      let sx = 0, sy = 0;
      hash.query(m.x, m.y, m.r, (o, ox, oy) => {
        if (o === m) return false;
        const dist = Math.hypot(ox, oy) || 0.01;
        const overlap = (m.r + o.r) - dist;
        if (overlap > 0) { sx -= (ox / dist) * overlap; sy -= (oy / dist) * overlap; }
        return false;
      });
      m.x += (m.vx + sx * TUNING.separation * 8) * dt;
      m.y += (m.vy + sy * TUNING.separation * 8) * dt;
      clampToWorld(m, m.r);

      // 离玩家太远（跑丢）→ 搬到视野边缘继续压
      if (d > 720 && m.tier !== 'boss' && ctx.relocate) ctx.relocate(m);

      // 接触伤害
      if (m.contactCd <= 0 && m.spawnT >= TUNING.spawnInTime && d < m.r + player.r + 2) {
        m.contactCd = TUNING.contactCooldown;
        ctx.onContact(m);
      }
    }
  }

  _bossAI(m, dt, dx, dy, ctx) {
    const b = m.def.boss;
    let speed = m.speed;
    m.dashCd -= dt;
    if (m.dashT > 0) { m.dashT -= dt; speed *= b.dashSpeedMul; }
    else if (m.dashCd <= 0) { m.dashCd = b.dashEvery; m.dashT = b.dashDuration; ctx.onBossDash?.(m); }
    m.summonCd -= dt;
    if (m.summonCd <= 0) { m.summonCd = b.summonEvery; ctx.onBossSummon?.(m); }
    return speed;
  }

  /** 圆形范围查询 */
  query(x, y, r, fn) { this.hash.query(x, y, r, fn); }

  /** 最近的可打目标；Boss 按 0.55 倍距离计，射手更愿意打它 */
  nearest(x, y, maxDist) {
    let best = null, bd = maxDist * maxDist;
    for (const m of this.list) {
      if (m.spawnT < TUNING.spawnInTime * 0.6) continue;
      const dx = m.x - x, dy = m.y - y;
      let dd = dx * dx + dy * dy;
      if (dd > maxDist * maxDist) continue;
      if (m.tier === 'boss') dd *= 0.3;
      if (dd < bd) { bd = dd; best = m; }
    }
    return best;
  }

  clear() { for (const m of [...this.list]) this.remove(m); this.boss = null; }
}
