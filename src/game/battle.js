import { TUNING } from '../data/tuning.js';
import { EventBus } from '../core/events.js';
import { Camera } from './world.js';
import { Player } from './player.js';
import { Monsters } from './monsters.js';
import { Spawner } from './spawner.js';
import { WeaponSystem } from './weapons.js';
import { Pickups } from './pickups.js';
import { Fx } from './fx.js';
import { Rounds } from '../systems/round.js';
import { lane } from '../systems/stats.js';

/**
 * 一局战斗：回合状态机 prep → battle → clearing → (发 round:end，等外部 nextRound) …；
 * 不碰 DOM，渲染器 / HUD 只读它的字段。
 */
export class Battle {
  constructor({ configs, sprites, rng, viewW, viewH, zoom }) {
    this.cfg = configs;
    this.rng = rng;
    this.events = new EventBus();
    this.time = 0;
    this.camera = new Camera(viewW, viewH, zoom);
    const { w, h } = TUNING.world;
    this.player = new Player(configs.hero, w / 2, h / 2);
    this.monsters = new Monsters(sprites.monsters);
    this.spawner = new Spawner(configs.monsters, rng);
    this.weapons = new WeaponSystem(6);
    this.pickups = new Pickups();
    this.fx = new Fx();
    this.rounds = new Rounds(configs.rounds);
    for (const id of configs.hero.startingWeapons || []) this.weapons.add(configs.weapons[id], this.player);

    this.round = 0; this.rule = null;
    this.phase = 'idle';           // idle | prep | battle | clearing | between | over
    this.phaseT = 0;
    this.timeLeft = 0;
    this.gold = 0; this.kills = 0; this.captures = [];
    this.freeze = 0;
    this.result = null;
    this.camera.snapTo(this.player.x, this.player.y);
  }

  /* ───── 回合流转 ───── */
  nextRound() {
    this.round++;
    this.rule = this.rounds.rule(this.round);
    this.spawner.startRound(this.rule);
    this.timeLeft = this.rule.duration;
    this.phase = 'prep'; this.phaseT = 1.3;
    this.events.emit('banner', this.rule.boss ? `第 ${this.round} 回合 · ${this.cfg.monsters[this.rule.boss].displayName}来了` : `第 ${this.round} 回合`);
    if (this.rule.boss) {
      const def = this.cfg.monsters[this.rule.boss];
      const bx = this.player.x, by = Math.max(60, this.player.y - this.camera.worldH * 0.55);
      this.monsters.spawn(def, bx, by, { hpMul: 1, atkMul: this.rule.atkMul });
    }
  }

  get bossAlive() { return !!this.monsters.boss; }
  get skillReady() { return this.player.canUseSkill(); }

  useSkill() {
    if (!this.player.useSkill()) return false;
    const s = this.player.skill;
    let n = 0;
    for (const m of this.monsters.list) {
      if (Math.hypot(m.x - this.player.x, m.y - this.player.y) <= s.radius) { m.marked = s.duration; n++; }
    }
    this.fx.burst(this.player.x, this.player.y - 12, { count: 14, color: '#ffd1e0', speed: 120, life: 0.5, size: 2.5, gravity: -30 });
    this.events.emit('toast', n ? `诱捕标记 · 圈住 ${n} 只` : '诱捕标记 · 附近没有怪');
    return true;
  }

  /* ───── 主更新 ───── */
  update(dt, axis, skillPressed) {
    if (this.phase === 'over') { this.fx.update(dt); this.camera.follow(this.player.x, this.player.y, dt); return; }
    if (this.phase === 'idle' || this.phase === 'between') return;
    if (this.freeze > 0) { this.freeze -= dt; this.fx.update(dt); return; }
    this.time += dt;
    const p = this.player;

    if (skillPressed) this.useSkill();
    p.update(dt, axis);
    this.camera.follow(p.x, p.y, dt);

    if (this.phase === 'prep') {
      this.phaseT -= dt;
      if (this.phaseT <= 0) this.phase = 'battle';
    }
    if (this.phase === 'battle') {
      for (const s of this.spawner.update(dt, this.camera, p, this.monsters.count())) {
        const m = this.monsters.spawn(s.def, s.x, s.y, this.rule);
        this.fx.burst(m.x, m.y, { count: 5, color: '#e9f2dd', speed: 30, life: 0.35, size: 2, gravity: 0 });
      }
      if (this.rule.duration > 0) {
        this.timeLeft = Math.max(0, this.timeLeft - dt);
        if (this.timeLeft <= 0) this._endRound();
      } else if (!this.bossAlive) this._endRound();
    }

    this.monsters.update(dt, p, {
      onContact: (m) => this._contact(m),
      relocate: (m) => { const pt = this.spawner.edgePoint(this.camera, p); m.x = pt.x; m.y = pt.y; m.spawnT = 0; },
      onBossDash: () => { this.camera.shake(2, 0.2); this.events.emit('toast', '史莱姆王扑过来了！'); },
      onBossSummon: (boss) => this._bossSummon(boss),
    });
    if (this.phase !== 'clearing') this.weapons.update(dt, this);
    this.pickups.update(dt, p, (pk) => this._collect(pk));
    this.fx.update(dt);

    if (this.phase === 'clearing') {
      this.phaseT -= dt;
      // 剩余的怪一只只「噗」掉（回合结束，不给金币）
      if (this.monsters.list.length && this.rng.chance(Math.min(1, dt * 18))) {
        const m = this.monsters.list[this.monsters.list.length - 1];
        this.fx.burst(m.x, m.y - 6, { count: 6, color: '#fff', speed: 50, life: 0.3, size: 2 });
        this.monsters.remove(m);
      }
      if (this.phaseT <= 0 && !this.monsters.list.length) {
        this.phase = 'between';
        this.events.emit('round:end', { round: this.round, final: this.rounds.isFinal(this.round) });
      }
    }
    if (!p.alive && this.phase !== 'over') this._finish(false);
  }

  _endRound() {
    if (this.phase !== 'battle') return;
    this.weapons.clear();
    this.monsters.list.forEach((m) => { m.hitTimes = {}; });
    // 回合结算金币（wealth 加成）+ 小憩回血
    const bonus = Math.round(this.rule.endGold * (1 + this.player.stats.get('wealth') / 100));
    this.gold += bonus;
    this.player.heal(this.player.maxHp * this.rounds.restoreRatio());
    this.events.emit('banner', this.rule.final ? '打赢了！' : `回合结束 · +${bonus} 🪙`);
    if (this.rule.final) { this._finish(true); return; }
    this.phase = 'clearing'; this.phaseT = 0.9;
  }

  _finish(win) {
    this.phase = 'over';
    this.result = { win, round: this.round, kills: this.kills, gold: Math.floor(this.gold), captures: [...this.captures] };
    if (!win) this.fx.burst(this.player.x, this.player.y - 10, { count: 18, color: '#ffe0d6', speed: 90, life: 0.7, size: 3 });
    this.events.emit('run:end', this.result);
  }

  /* ───── 战斗事件 ───── */
  hitMonster(m, raw, { kx = 0, ky = 0, knockback = 0, weapon = null } = {}) {
    if (!m.alive || m.hp <= 0) return;
    const st = this.player.stats;
    const crit = this.rng.chance(st.get('critRate'));
    let dmg = raw * (crit ? 1 + st.get('critDamage') : 1) * this.rng.range(0.92, 1.08);
    dmg = Math.max(1, Math.round(dmg));
    m.hp -= dmg;
    m.flash = 0.09;
    const kb = knockback * (m.tier === 'boss' ? 0.08 : m.tier === 'elite' ? 0.35 : 1);
    m.kbx += kx * kb; m.kby += ky * kb;
    this.fx.number(m.x, m.y - m.size * 0.9, String(dmg), crit ? '#ffb347' : '#fffaf2', crit);
    const ls = st.get('lifeSteal');
    if (ls > 0) this.player.heal(dmg * ls);
    if (m.hp <= 0) this._kill(m, weapon);
    else if (m.tier === 'boss') this.events.emit('boss:hp', m.hp / m.maxHp);
  }

  _kill(m) {
    this.kills++;
    const def = m.def;
    const goldMul = 1 + this.player.stats.get('goldGain');
    const g = Math.round(this.rng.int(def.gold[0], def.gold[1]) * goldMul);
    if (g > 0) this.pickups.dropGold(m.x, m.y, g, this.rng);
    const col = def.tier === 'boss' ? '#ffd27a' : def.tint ? '#fbe4ea' : '#cfe8b8';
    this.fx.burst(m.x, m.y - m.size * 0.4, { count: def.tier === 'normal' ? 8 : 18, color: col, speed: def.tier === 'normal' ? 70 : 120, life: 0.45, size: m.size * 0.16 });
    this._tryCapture(m);
    if (def.tier === 'boss') { this.camera.shake(6, 0.5); this.freeze = 0.12; this.events.emit('boss:hp', 0); }
    else if (def.tier === 'elite') { this.camera.shake(3, 0.2); this.freeze = 0.05; }
    else this.freeze = Math.max(this.freeze, TUNING.hitStop);
    this.monsters.remove(m);
  }

  /** 捕获（docs/25 §3.1：luck 通道软饱和 + 技能倍率） */
  _tryCapture(m) {
    const base = m.def.captureBase ?? 0;
    if (base <= 0) return;
    const c = TUNING.capture;
    const luck = this.player.stats.get('luck');
    let p = base * (1 + lane(luck, c.luckWeight, c.luckPlateau));
    if (m.marked > 0) p *= this.player.skill.captureMultiplier || 2;
    if (m.tier === 'elite') p *= c.eliteMul;
    if (!this.rng.chance(Math.min(0.9, p))) return;
    this.captures.push({ id: m.def.id, name: m.def.displayName, emoji: m.def.emoji || '🐾' });
    this.fx.number(m.x, m.y - m.size, `${m.def.emoji || '🐾'} 捕获！`, '#ffd1e0', true);
    this.fx.burst(m.x, m.y - m.size * 0.5, { count: 10, color: '#ffd1e0', speed: 60, life: 0.6, size: 2.5, gravity: -60 });
    this.events.emit('capture', this.captures[this.captures.length - 1]);
  }

  _contact(m) {
    if (this.phase === 'clearing') return;
    const p = this.player;
    const took = p.takeDamage(m.attack, this.rng);
    if (took === -1) { this.fx.number(p.x, p.y - 30, '闪避', '#cfe8b8'); return; }
    if (took <= 0) return;
    const dx = p.x - m.x, dy = p.y - m.y, d = Math.hypot(dx, dy) || 1;
    p.vx += (dx / d) * 90; p.vy += (dy / d) * 90;
    m.kbx -= (dx / d) * 40; m.kby -= (dy / d) * 40;
    this.camera.shake(m.tier === 'boss' ? 4 : 1.6, 0.15);
    this.fx.number(p.x, p.y - 30, `-${took}`, '#ff9a8a');
    this.events.emit('player:hit', took);
  }

  _collect(pk) {
    this.gold += pk.value;
    this.fx.burst(pk.x, pk.y - 4, { count: 3, color: '#ffe08a', speed: 30, life: 0.3, size: 1.8, gravity: -40 });
    this.events.emit('gold', this.gold);
  }

  _bossSummon(boss) {
    const b = boss.def.boss;
    const def = this.cfg.monsters[b.summonId];
    if (this.monsters.count() >= (this.rule.maxOnScreen || 14) + 4) return;
    for (let i = 0; i < b.summonCount; i++) {
      const a = (Math.PI * 2 * i) / b.summonCount + this.rng.range(0, 1);
      const m = this.monsters.spawn(def, boss.x + Math.cos(a) * boss.r * 1.4, boss.y + Math.sin(a) * boss.r * 0.9, this.rule);
      m.kbx = Math.cos(a) * 120; m.kby = Math.sin(a) * 120;
    }
    this.fx.burst(boss.x, boss.y - boss.size * 0.5, { count: 12, color: '#fff2b8', speed: 90, life: 0.5, size: 3 });
    this.events.emit('toast', '史莱姆王分裂出小史莱姆');
  }

  /* ───── 4 选 1 后继续 ───── */
  resume() { if (this.phase === 'between') this.nextRound(); }
}
