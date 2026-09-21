import { toast } from './toast.js';

const QUOTES = [
  '今天的幸运值不错……要不要一起去抓一只圆滚滚的伙伴？',
  '铁扇飞轮我磨好了，走吧，别让史莱姆等太久。',
  '听说草地那边今天特别多史莱姆……刚好缺一只粉色的。',
  '出发前深呼吸——好，走位交给你，出手交给我。',
];

/** 主界面（迁自 docs/preview/main-screen.html）：看谁、听一句、点出发 */
export class Home {
  constructor({ onStart }) {
    this.onStart = onStart;
    this.q = 0;
    this.quoteEl = document.getElementById('quoteText');
    this.sheet = document.getElementById('sheet');
    this.backdrop = document.getElementById('sheetBackdrop');
    this.pets = [];
    this._bind();
  }

  _bind() {
    document.getElementById('btnStart').addEventListener('click', () => this.onStart());
    document.getElementById('navBattle').addEventListener('click', () => this.onStart());
    document.querySelectorAll('[data-toast]').forEach((b) => b.addEventListener('click', () => toast(b.dataset.toast)));
    document.getElementById('openSheet').addEventListener('click', () => this.openSheet());
    this.backdrop.addEventListener('click', () => this.closeSheet());
    document.getElementById('claimLuck').addEventListener('click', (e) => { e.target.textContent = '已领'; e.target.disabled = true; toast('今日试手气已领取'); });
    document.getElementById('heroDots').addEventListener('click', (e) => {
      const b = e.target.closest('.dot'); if (!b) return;
      if (b.classList.contains('on')) return;
      toast(`${b.getAttribute('aria-label')} · 下个版本解锁`);
    });
    document.querySelector('.hero-stage').addEventListener('click', (e) => { if (!e.target.closest('button')) this.nextQuote(); });
  }

  nextQuote() {
    this.q = (this.q + 1) % QUOTES.length;
    this.quoteEl.style.opacity = '0';
    setTimeout(() => { this.quoteEl.textContent = QUOTES[this.q]; this.quoteEl.style.opacity = '1'; }, 220);
  }

  openSheet() { this.sheet.classList.add('open'); this.backdrop.classList.add('open'); this.sheet.setAttribute('aria-hidden', 'false'); }
  closeSheet() { this.sheet.classList.remove('open'); this.backdrop.classList.remove('open'); this.sheet.setAttribute('aria-hidden', 'true'); }

  /** 一局打完回来：把抓到的伙伴、金币写回主界面（会话内，不落盘） */
  applyResult(result, totalGold) {
    if (!result) return;
    this.pets = this.pets.concat(result.captures).slice(-6);
    const row = document.getElementById('homePetRow');
    row.innerHTML = '';
    for (let i = 0; i < 6; i++) {
      const d = document.createElement('div');
      const pet = this.pets[i];
      d.className = pet ? 'pet-dot' : 'pet-dot empty';
      d.textContent = pet ? pet.emoji : '+';
      row.appendChild(d);
    }
    document.getElementById('homePetCount').textContent = `${this.pets.length} / 6`;
    document.getElementById('pillLabel').textContent = `${this.pets.length} 只伙伴 · 上局第 ${result.round} 回合${result.win ? ' · 通关' : ''}`;
    document.getElementById('homeGold').textContent = totalGold.toLocaleString('zh-CN');
    this.quoteEl.textContent = result.win ? '史莱姆王都被我们打趴了！下次去更远的草地看看？' : '没关系，史莱姆也有不听话的时候。再走一趟？';
  }

  renderInitialPets() {
    const row = document.getElementById('homePetRow');
    if (row.children.length) return;
    const init = ['🟢', '🩷', '🔵'];
    for (let i = 0; i < 6; i++) { const d = document.createElement('div'); d.className = init[i] ? 'pet-dot' : 'pet-dot empty'; d.textContent = init[i] || '+'; row.appendChild(d); }
    this.pets = init.map((e) => ({ emoji: e }));
  }
}
