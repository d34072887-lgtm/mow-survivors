import { PATTERN_PARAMS, WEAPON_TUNING, QUALITY_ORDER, QUALITY_MUL } from '../data/patterns.js';

let uid = 1;

/** 一把武器实例：配置 + 品质 + 冷却 */
export class WeaponInstance {
  constructor(def) {
    this.uid = uid++;
    this.def = def;
    this.id = def.id;
    this.quality = 'white';
    this.params = { ...PATTERN_PARAMS[def.attackPattern], ...(WEAPON_TUNING[def.id] || {}) };
    this.cd = Math.random() * 0.3;
    this.angle = Math.random() * Math.PI * 2;
    this.swingSeq = 0;
  }
  get pattern() { return this.def.attackPattern; }
  get qualityMul() { return QUALITY_MUL[this.quality] || 1; }
  upgradeQuality() {
    const i = QUALITY_ORDER.indexOf(this.quality);
    if (i < QUALITY_ORDER.length - 1) { this.quality = QUALITY_ORDER[i + 1]; return true; }
    return false;
  }
  /** 该品质下武器的面板贡献（docs/23 §3：合成升品质 → 白值放大） */
  statMods() {
    const tier = this.def.qualityTiers?.white?.baseStats || [];
    return tier.map((s) => ({ ...s, value: s.statId === 'attack' ? s.value * this.qualityMul : s.value }));
  }
}

/** 6 格武器 + 弹体 / 挥砍 / 地波 / 环绕的更新与命中 */
export class WeaponSystem {
  constructor(maxSlots = 6) {
    this.maxSlots = maxSlots;
    this.weapons = [];
    this.projectiles = [];
    this.arcs = [];
    this.waves = [];
  }

  /** 加武器：已有同 ID → 升品质；否则占新格。返回 {added|upgraded|full} */
  add(def, player) {
    const same = this.weapons.find((w) => w.id === def.id);
    if (same) {
      if (!same.upgradeQuality()) return 'max';
      player.stats.removeSource(`weapon:${same.uid}`);
      player.stats.addModifiers(same.statMods(), `weapon:${same.uid}`);
      return 'upgraded';
    }
    if (this.weapons.length >= this.maxSlots) return 'full';
    const w = new WeaponInstance(def);
    this.weapons.push(w);
    player.stats.addModifiers(w.statMods(), `weapon:${w.uid}`);
    return 'added';
  }

  has(id) { return this.weapons.some((w) => w.id === id); }
  get(id) { return this.weapons.find((w) => w.id === id); }

  update(dt, b) {
    const p = b.player, st = p.stats;
    const aspd = 1 + st.get('attackSpeed');
    const rangeMul = 1 + st.get('range');
    const aoeMul = 1 + st.get('aoeScale');
    const attack = st.get('attack');
    const bonusPierce = Math.round(st.get('pierce'));

    for (const w of this.weapons) {
      const P = w.params;
      const dmg = attack * P.coef * w.qualityMul;
      if (w.pattern === 'orbit') {
        w.angle += P.angular * aspd * dt;
        const R = P.radius * rangeMul;
        for (let i = 0; i < P.count; i++) {
          const a = w.angle + (Math.PI * 2 * i) / P.count;
          const bx = p.x + Math.cos(a) * R, by = p.y + Math.sin(a) * R * 0.85;
          b.monsters.query(bx, by, P.bladeR, (m) => {
            const last = m.hitTimes[w.uid] || -9;
            if (b.time - last >= P.hitInterval / aspd) { m.hitTimes[w.uid] = b.time; b.hitMonster(m, dmg, { kx: Math.cos(a), ky: Math.sin(a), knockback: P.knockback, weapon: w }); }
            return false;
          });
        }
        continue;
      }

      w.cd -= dt;
      if (w.cd > 0) continue;
      const cooldown = P.cooldown / aspd;

      if (w.pattern === 'ranged_burst' || w.pattern === 'ranged_pierce') {
        const range = P.range * rangeMul;
        const t = b.monsters.nearest(p.x, p.y, range);
        if (!t) { w.cd = 0.05; continue; }
        let a = Math.atan2(t.y - p.y, t.x - p.x);
        if (P.spreadDeg) a += ((Math.random() - 0.5) * P.spreadDeg * Math.PI) / 180;
        const pierce = (w.pattern === 'ranged_pierce' ? (P.pierce || 1) : 0) + bonusPierce;
        this.projectiles.push({ x: p.x, y: p.y - 10, vx: Math.cos(a) * P.speed, vy: Math.sin(a) * P.speed, r: P.projectileR, dmg, pierce, ttl: range / P.speed + 0.15, hit: new Set(), w, color: P.color, len: w.pattern === 'ranged_pierce' ? 14 : 8 });
        w.cd = cooldown;
        p.faceHint = a;
      } else if (w.pattern === 'melee_arc') {
        const R = P.range * rangeMul * aoeMul;
        const t = b.monsters.nearest(p.x, p.y, R * 1.6);
        if (!t) { w.cd = 0.05; continue; }
        const a = Math.atan2(t.y - p.y, t.x - p.x);
        const half = (P.arcDeg * Math.PI) / 360;
        b.monsters.query(p.x, p.y, R, (m, dx, dy) => {
          let da = Math.atan2(dy, dx) - a;
          da = Math.atan2(Math.sin(da), Math.cos(da));
          if (Math.abs(da) <= half + 0.15) b.hitMonster(m, dmg, { kx: Math.cos(a), ky: Math.sin(a), knockback: P.knockback, weapon: w });
          return false;
        });
        this.arcs.push({ x: p.x, y: p.y, a, R, half, t: 0, dur: 0.2, color: P.color, seq: w.swingSeq++ });
        w.cd = cooldown;
        b.fx.burst(p.x + Math.cos(a) * R * 0.6, p.y + Math.sin(a) * R * 0.6, { count: 4, color: '#fff7e6', speed: 40, life: 0.25, size: 2, gravity: 0 });
      } else if (w.pattern === 'aoe_ground') {
        const R = P.radius * rangeMul * aoeMul;
        if (!b.monsters.nearest(p.x, p.y, R * 1.1)) { w.cd = 0.05; continue; }
        this.waves.push({ x: p.x, y: p.y, R, t: 0, dur: P.duration, dmg, hit: new Set(), w, kb: P.knockback, color: P.color });
        b.camera.shake(2, 0.12);
        w.cd = cooldown;
      }
    }

    this._updateProjectiles(dt, b);
    this._updateWaves(dt, b);
    for (let i = this.arcs.length - 1; i >= 0; i--) { const a = this.arcs[i]; a.t += dt; if (a.t >= a.dur) this.arcs.splice(i, 1); }
  }

  _updateProjectiles(dt, b) {
    const ps = this.projectiles;
    for (let i = ps.length - 1; i >= 0; i--) {
      const pr = ps[i];
      pr.ttl -= dt;
      pr.x += pr.vx * dt; pr.y += pr.vy * dt;
      let dead = pr.ttl <= 0;
      if (!dead) {
        b.monsters.query(pr.x, pr.y, pr.r, (m) => {
          if (pr.hit.has(m.id) || m.spawnT < 0.15) return false;
          pr.hit.add(m.id);
          const l = Math.hypot(pr.vx, pr.vy) || 1;
          b.hitMonster(m, pr.dmg, { kx: pr.vx / l, ky: pr.vy / l, knockback: pr.w.params.knockback, weapon: pr.w });
          if (pr.pierce-- <= 0) { dead = true; return true; }
          return false;
        });
      }
      if (dead) { ps[i] = ps[ps.length - 1]; ps.pop(); }
    }
  }

  _updateWaves(dt, b) {
    const ws = this.waves;
    for (let i = ws.length - 1; i >= 0; i--) {
      const wv = ws[i];
      wv.t += dt;
      const prog = Math.min(1, wv.t / wv.dur);
      const cur = wv.R * prog;
      b.monsters.query(wv.x, wv.y, cur, (m, dx, dy) => {
        if (wv.hit.has(m.id)) return false;
        wv.hit.add(m.id);
        const d = Math.hypot(dx, dy) || 1;
        b.hitMonster(m, wv.dmg, { kx: dx / d, ky: dy / d, knockback: wv.kb, weapon: wv.w });
        return false;
      });
      if (wv.t >= wv.dur + 0.25) ws.splice(i, 1);
    }
  }

  clear() { this.projectiles.length = 0; this.arcs.length = 0; this.waves.length = 0; }
}
