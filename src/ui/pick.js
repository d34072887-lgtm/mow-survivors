/** 回合间 4 选 1 弹层：返回 Promise<{type:'pick',card}|{type:'refresh'}> */
export class PickUI {
  constructor() {
    this.overlay = document.getElementById('pickOverlay');
    this.grid = document.getElementById('pickGrid');
    this.title = document.getElementById('pickTitle');
    this.goldEl = document.getElementById('pickGold');
    this.refreshBtn = document.getElementById('btnRefresh');
    this._resolve = null;
    this.refreshBtn.addEventListener('click', () => this._done({ type: 'refresh' }));
  }
  show({ round, gold, cards, refreshPrice }) {
    this.title.textContent = `第 ${round} 回合结束 · 选一样带走`;
    this.goldEl.textContent = String(Math.floor(gold));
    this.grid.innerHTML = '';
    cards.forEach((c, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `pick-opt t-${c.tier}`;
      btn.style.animation = `none`;
      btn.innerHTML = `<span class="tier">${c.tierName}</span><span class="icon">${c.icon}</span><span class="name">${c.name}</span><span class="desc">${c.desc}</span>`;
      btn.addEventListener('click', () => this._done({ type: 'pick', card: c }));
      this.grid.appendChild(btn);
    });
    const can = gold >= refreshPrice;
    this.refreshBtn.disabled = !can;
    this.refreshBtn.textContent = can ? `🍀 刷新看看 · ${refreshPrice} 🪙` : `🍀 刷新要 ${refreshPrice} 🪙 · 不够`;
    this.overlay.classList.add('open');
    return new Promise((resolve) => { this._resolve = resolve; });
  }
  _done(r) { const f = this._resolve; this._resolve = null; if (f) f(r); }
  hide() { this.overlay.classList.remove('open'); }
}

/** 暂停 / 结算共用弹层：返回 Promise<'primary'|'secondary'> */
export class MenuUI {
  constructor() {
    this.overlay = document.getElementById('menuOverlay');
    this.title = document.getElementById('menuTitle');
    this.body = document.getElementById('menuBody');
    this.shelf = document.getElementById('petShelf');
    this.primary = document.getElementById('btnPrimary');
    this.secondary = document.getElementById('btnSecondary');
    this._resolve = null;
    this.primary.addEventListener('click', () => this._done('primary'));
    this.secondary.addEventListener('click', () => this._done('secondary'));
  }
  show({ title, body, primary, secondary, pets = [] }) {
    this.title.textContent = title;
    this.body.textContent = body;
    this.primary.textContent = primary;
    this.secondary.textContent = secondary;
    this.secondary.hidden = !secondary;
    this.shelf.hidden = !pets.length;
    this.shelf.innerHTML = pets.slice(0, 12).map((p) => `<span title="${p.name}">${p.emoji}</span>`).join('');
    this.overlay.classList.add('open');
    return new Promise((resolve) => { this._resolve = resolve; });
  }
  _done(r) { this.overlay.classList.remove('open'); const f = this._resolve; this._resolve = null; if (f) f(r); }
  get open() { return this.overlay.classList.contains('open'); }
}
