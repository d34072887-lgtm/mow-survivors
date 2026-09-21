import { TUNING } from '../data/tuning.js';
import { StatSystem } from '../systems/stats.js';
import { clampToWorld } from './world.js';

/** 玩家（小葵）：移动、受击、主动技能、面板 */
export class Player {
  constructor(heroDef, x, y) {
    this.def = heroDef;
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.r = 9;                       // 碰撞半径（世界 px）
    this.facing = 'down';
    this.faceX = 0; this.faceY = 1;   // 最近的移动方向（近战朝向兜底）
    this.moving = false;
    this.stats = new StatSystem(heroDef.baseStats);
    this.hp = this.stats.get('maxHp');
    this.invuln = 0;
    this.flash = 0;
    this.alive = true;
    this.skill = { ...heroDef.activeSkill, cd: 0, active: 0 };
    this.stats.onChange((id) => { if (id === 'maxHp') this.hp = Math.min(this.hp, this.stats.get('maxHp')); });
    this.animT = 0;
  }

  get maxHp() { return this.stats.get('maxHp'); }
  get speed() { return TUNING.heroSpeed * Math.max(0.3, 1 + this.stats.get('moveSpeed')); }

  update(dt, axis) {
    const target = this.speed;
    const tx = axis.x * target, ty = axis.y * target;
    const mag = Math.hypot(axis.x, axis.y);
    const k = Math.min(1, (mag > 0 ? TUNING.accel : TUNING.decel) * dt);
    this.vx += (tx - this.vx) * k;
    this.vy += (ty - this.vy) * k;
    if (Math.abs(this.vx) < 0.5) this.vx = 0;
    if (Math.abs(this.vy) < 0.5) this.vy = 0;
    this.x += this.vx * dt; this.y += this.vy * dt;
    clampToWorld(this, 12);

    const sp = Math.hypot(this.vx, this.vy);
    this.moving = sp > 2;
    if (mag > 0.05) {
      this.faceX = axis.x / mag; this.faceY = axis.y / mag;
      this.facing = Math.abs(axis.x) > Math.abs(axis.y) ? (axis.x > 0 ? 'right' : 'left') : (axis.y > 0 ? 'down' : 'up');
    }
    this.animT += dt * (this.moving ? Math.max(0.6, sp / target) : 0);

    if (this.invuln > 0) this.invuln -= dt;
    if (this.flash > 0) this.flash -= dt;
    if (this.skill.cd > 0) this.skill.cd -= dt;
    if (this.skill.active > 0) this.skill.active -= dt;

    const regen = this.stats.get('hpRegen');
    if (regen > 0 && this.hp < this.maxHp) this.hp = Math.min(this.maxHp, this.hp + regen * dt);
  }

  /** 返回实际承受伤害（0 = 闪避/无敌） */
  takeDamage(raw, rng) {
    if (this.invuln > 0 || !this.alive) return 0;
    if (rng.chance(this.stats.get('dodge'))) { this.invuln = 0.15; return -1; }
    const armor = this.stats.get('armor');
    let dmg = raw * 100 / (100 + Math.max(0, armor));
    dmg *= Math.max(0.1, 1 - this.stats.get('damageReduction'));
    dmg = Math.max(1, Math.round(dmg));
    this.hp -= dmg;
    this.invuln = TUNING.invulnAfterHit;
    this.flash = 0.12;
    if (this.hp <= 0) { this.hp = 0; this.alive = false; }
    return dmg;
  }

  heal(v) { if (this.alive) this.hp = Math.min(this.maxHp, this.hp + v); }

  canUseSkill() { return this.alive && this.skill.cd <= 0; }
  useSkill() {
    if (!this.canUseSkill()) return false;
    this.skill.cd = this.skill.cooldown;
    this.skill.active = this.skill.duration;
    return true;
  }
}
