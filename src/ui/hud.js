/** 局内 HUD：顶部薄条（血 / 计时 / 金币 / 伙伴 / 击杀 / Boss 血）+ 技能按钮冷却环 + 横幅 */
export class Hud {
  constructor() {
    const $ = (id) => document.getElementById(id);
    this.el = {
      hp: $('hpFill'), timer: $('timer'), gold: $('gold'), pets: $('pets'), kills: $('kills'), round: $('roundTag'),
      bossBar: $('bossBar'), bossFill: $('bossFill'), bossName: $('bossName'), banner: $('banner'),
      skill: $('btnSkill'), cd: $('cdArc'), hint: $('controlHint'),
    };
    this.last = {};
    this.bannerTimer = 0;
  }
  _set(key, value) {
    if (this.last[key] === value) return;
    this.last[key] = value;
    this.el[key].textContent = value;
  }
  update(b) {
    const p = b.player;
    const ratio = Math.max(0, p.hp / p.maxHp);
    const w = `${(ratio * 100).toFixed(1)}%`;
    if (this.last.hpw !== w) { this.last.hpw = w; this.el.hp.style.width = w; this.el.hp.classList.toggle('low', ratio < 0.35); }
    if (b.rule?.duration > 0) this._set('timer', b.phase === 'prep' ? '准备' : `${Math.ceil(b.timeLeft)}`);
    else this._set('timer', b.bossAlive ? 'BOSS' : '✓');
    this._set('gold', String(Math.floor(b.gold)));
    this._set('pets', String(b.captures.length));
    this._set('kills', String(b.kills));
    this._set('round', `第 ${b.round} 回合${b.rule?.final ? ' · 终' : ` / ${b.rounds.total}`}`);

    const boss = b.monsters.boss;
    const showBoss = !!boss;
    if (this.last.showBoss !== showBoss) { this.last.showBoss = showBoss; this.el.bossBar.hidden = !showBoss; if (boss) this.el.bossName.textContent = boss.def.displayName; }
    if (boss) this.el.bossFill.style.width = `${(boss.hp / boss.maxHp * 100).toFixed(1)}%`;

    const s = p.skill;
    const prog = s.cd > 0 ? 1 - s.cd / s.cooldown : 1;
    this.el.cd.style.strokeDashoffset = String(100.5 * (1 - prog));
    const cooling = s.cd > 0;
    if (this.last.cooling !== cooling) { this.last.cooling = cooling; this.el.skill.classList.toggle('cooling', cooling); }
    const on = s.active > 0;
    if (this.last.on !== on) { this.last.on = on; this.el.skill.classList.toggle('on', on); }
  }
  banner(text, ms = 1400) {
    this.el.banner.textContent = text;
    this.el.banner.classList.add('show');
    clearTimeout(this.bannerTimer);
    this.bannerTimer = setTimeout(() => this.el.banner.classList.remove('show'), ms);
  }
  hideHint() { if (this.el.hint) this.el.hint.style.opacity = '0'; }
  showHint() { if (this.el.hint) this.el.hint.style.opacity = '0.85'; }
}
