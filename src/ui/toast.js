let timer = 0;
const el = () => document.getElementById('toast');
export function toast(text, ms = 1600) {
  const t = el();
  t.textContent = text;
  t.classList.add('show');
  clearTimeout(timer);
  timer = setTimeout(() => t.classList.remove('show'), ms);
}
