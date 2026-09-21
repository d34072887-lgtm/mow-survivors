/** 轻量特效：粒子池 / 伤害数字 / 浮字；不碰 DOM，渲染器只读 */
export class Fx {
  constructor(maxParticles = 320) {
    this.particles = [];
    this.numbers = [];
    this.max = maxParticles;
  }
  burst(x, y, { count = 8, color = '#fff', speed = 60, life = 0.45, size = 2.5, gravity = 120, spread = Math.PI * 2, angle = 0 } = {}) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.max) this.particles.shift();
      const a = angle + (Math.random() - 0.5) * spread;
      const s = speed * (0.4 + Math.random() * 0.8);
      this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - speed * 0.3, life, maxLife: life, color, size: size * (0.7 + Math.random() * 0.6), gravity });
    }
  }
  number(x, y, text, color = '#fff', big = false) {
    if (this.numbers.length > 60) this.numbers.shift();
    this.numbers.push({ x: x + (Math.random() - 0.5) * 10, y, text, color, life: big ? 0.9 : 0.6, maxLife: big ? 0.9 : 0.6, vy: big ? -34 : -26, big });
  }
  update(dt) {
    const ps = this.particles;
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i];
      p.life -= dt;
      if (p.life <= 0) { ps[i] = ps[ps.length - 1]; ps.pop(); continue; }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= (1 - 2.5 * dt);
    }
    const ns = this.numbers;
    for (let i = ns.length - 1; i >= 0; i--) {
      const n = ns[i];
      n.life -= dt;
      if (n.life <= 0) { ns.splice(i, 1); continue; }
      n.y += n.vy * dt;
      n.vy *= (1 - 3 * dt);
    }
  }
  clear() { this.particles.length = 0; this.numbers.length = 0; }
}
