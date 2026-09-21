import { TUNING } from './data/tuning.js';
import { loadJSON, loadSpriteSheet, bakeSprites } from './core/assets.js';
import { Loop } from './core/loop.js';
import { Rng } from './core/rng.js';
import { Input } from './core/input.js';
import { Battle } from './game/battle.js';
import { Renderer } from './render/renderer.js';
import { AttributePick } from './systems/pick.js';
import { Home } from './ui/home.js';
import { Hud } from './ui/hud.js';
import { PickUI, MenuUI } from './ui/pick.js';
import { toast } from './ui/toast.js';

const $ = (id) => document.getElementById(id);
const state = { configs: null, sheets: {}, gfx: { hero: { anims: {} }, monsters: {} }, battle: null, paused: false, metaGold: 2480, skillQueued: false };

/* ───────── 配置 & 资源 ───────── */
async function loadConfigs() {
  const hero = await loadJSON('data/configs/heroes/hero_xiaokui.json');
  const pools = await loadJSON('data/configs/shop/weapon-pools.json');
  const weaponList = await Promise.all(pools.entries.map((e) => loadJSON(`data/configs/weapons/${e.weaponId}.json`)));
  const weapons = Object.fromEntries(weaponList.map((w) => [w.id, w]));
  const rounds = await loadJSON('data/configs/spawn-rules/rounds.json');
  const want = new Map();
  for (const r of rounds.rounds) {
    for (const p of r.pool) want.set(p.id, 'normal');
    if (r.eliteId) want.set(r.eliteId, 'elite');
    if (r.boss) want.set(r.boss, 'boss');
  }
  const monsterList = await Promise.all([...want].map(([id, tier]) => loadJSON(`data/configs/monsters/${tier}/${id}.json`)));
  const monsters = Object.fromEntries(monsterList.map((m) => [m.id, m]));
  for (const m of monsterList) if (m.boss?.summonId && !monsters[m.boss.summonId]) monsters[m.boss.summonId] = await loadJSON(`data/configs/monsters/normal/${m.boss.summonId}.json`);
  const pool = await loadJSON(`data/configs/attribute-pools/${hero.attributePoolId}.json`);
  const pricing = await loadJSON('data/configs/attribute-pick/refresh-pricing.json');
  return { hero, weapons, monsters, rounds, pool, pricing };
}

async function loadSheets(cfg) {
  const dirs = new Set([cfg.hero.sprite, ...Object.values(cfg.monsters).map((m) => m.sprite)]);
  await Promise.all([...dirs].map(async (d) => { state.sheets[d] = await loadSpriteSheet(d); }));
}

/** 按当前 k 重新烘焙全部精灵；原地覆盖对象，已有动画器引用不失效 */
function rebake(k) {
  const cfg = state.configs;
  Object.assign(state.gfx.hero, bakeSprites(state.sheets[cfg.hero.sprite], { targetH: TUNING.heroPx, k, flipFrom: { walk_left: 'walk_right' } }));
  for (const m of Object.values(cfg.monsters)) {
    const baked = bakeSprites(state.sheets[m.sprite], { targetH: m.sizePx * 1.1, k, tint: m.tint || null });
    if (!state.gfx.monsters[m.id]) state.gfx.monsters[m.id] = baked; else Object.assign(state.gfx.monsters[m.id], baked);
  }
}

/* ───────── 界面 ───────── */
const home = new Home({ onStart: () => startRun() });
const hud = new Hud();
const pickUI = new PickUI();
const menuUI = new MenuUI();
const renderer = new Renderer($('battle'));
const input = new Input({ zone: $('joyZone'), joystick: $('joystick'), stick: $('joyStick'), ...TUNING.joystick });
let pickSys = null;
let view = { w: 390, h: 600, zoom: 1 };

function showScreen(name) {
  $('screenHome').hidden = name !== 'home';
  $('screenBattle').hidden = name !== 'battle';
}

function measure() {
  const wrap = $('battleWrap');
  const cssW = wrap.clientWidth || 390, cssH = wrap.clientHeight || 600;
  const zoom = renderer.resize(cssW, cssH);
  view = { w: cssW, h: cssH, zoom };
  rebake(renderer.k);
  state.battle?.camera.resize(cssW, cssH, zoom);
}

window.addEventListener('resize', () => { if (!$('screenBattle').hidden) measure(); });

/* ───────── 一局 ───────── */
function startRun() {
  showScreen('battle');
  measure();
  const rng = new Rng();
  const b = new Battle({ configs: state.configs, sprites: state.gfx, rng, viewW: view.w, viewH: view.h, zoom: view.zoom });
  state.battle = b;
  state.paused = false;
  hud.last = {};
  hud.showHint();
  pickSys = new AttributePick(state.configs.pool, state.configs.pricing, state.configs.weapons, rng);

  b.events.on('banner', (t) => hud.banner(t));
  b.events.on('toast', (t) => toast(t, 1300));
  b.events.on('capture', (c) => toast(`${c.emoji} 抓到了${c.name}！伙伴 +1`, 1500));
  b.events.on('round:end', ({ round }) => runPick(round));
  b.events.on('run:end', (r) => setTimeout(() => showResult(r), 1100));
  b.nextRound();
  loop.start();
}

async function runPick(round) {
  const b = state.battle;
  pickSys.beginRound();
  for (;;) {
    const cards = pickSys.roll(b.player, b.weapons);
    const r = await pickUI.show({ round, gold: b.gold, cards, refreshPrice: pickSys.refreshPrice() });
    if (r.type === 'refresh') {
      const price = pickSys.paidRefresh(Math.floor(b.gold));
      if (price > 0) { b.gold -= price; toast(`刷新 -${price} 🪙 · 下次 ${pickSys.refreshPrice()} 🪙`, 1200); }
      continue;
    }
    toast(pickSys.apply(r.card, b.player, b.weapons), 1400);
    break;
  }
  pickUI.hide();
  if (state.battle === b) b.resume();
}

async function showResult(r) {
  const b = state.battle;
  if (!b || b.result !== r) return;
  state.metaGold += r.gold;
  const body = r.win
    ? `史莱姆王倒下了。\n击杀 ${r.kills} · 金币 ${r.gold} · 伙伴 +${r.captures.length}\n（首版到第 5 回合为止，后面的回合、商店、赌场在路上）`
    : `倒在第 ${r.round} 回合。\n击杀 ${r.kills} · 金币 ${r.gold} · 伙伴 +${r.captures.length}\n试试贴着怪群边缘绕圈，别让史莱姆包住。`;
  const choice = await menuUI.show({ title: r.win ? '打赢了 ✨' : '这局先到这', body, primary: '再来一局', secondary: '返回主界面', pets: r.captures });
  home.applyResult(r, state.metaGold);
  if (choice === 'primary') startRun(); else goHome();
}

function goHome() {
  loop.stop();
  state.battle = null;
  showScreen('home');
}

async function pauseMenu() {
  const b = state.battle;
  if (!b || state.paused || b.phase === 'over' || b.phase === 'between') return;
  state.paused = true;
  const p = b.player;
  const s = p.stats;
  const body = `第 ${b.round} 回合 · 击杀 ${b.kills} · 🪙 ${Math.floor(b.gold)}\n攻击 ${Math.round(s.get('attack'))} · 攻速 +${Math.round(s.get('attackSpeed') * 100)}% · 生命 ${Math.round(p.hp)}/${p.maxHp}\n武器：${b.weapons.weapons.map((w) => w.def.name).join('、')}`;
  const c = await menuUI.show({ title: '暂停', body, primary: '继续', secondary: '返回主界面' });
  state.paused = false;
  if (c === 'secondary') goHome();
}

$('btnPause').addEventListener('click', pauseMenu);
$('btnSkill').addEventListener('pointerdown', (e) => { e.preventDefault(); state.skillQueued = true; });
document.addEventListener('visibilitychange', () => { if (document.hidden && state.battle && !$('screenBattle').hidden) pauseMenu(); });

/* ───────── 主循环 ───────── */
let hintTimer = 0;
const loop = new Loop(
  (dt) => {
    const b = state.battle;
    if (!b) return;
    if (state.paused || menuUI.open) { state.skillQueued = false; return; }
    const skill = state.skillQueued || input.skillKeyPressed();
    state.skillQueued = false;
    b.update(dt, input.axis(), skill);
    hud.update(b);
    if (input.anyTouch || input.keys.size || (hintTimer += dt) > 8) hud.hideHint();
  },
  (dt) => { const b = state.battle; if (b) renderer.render(b, state.gfx, dt); },
);

/* ───────── 启动 ───────── */
async function boot() {
  const msg = $('loadMsg');
  try {
    state.configs = await loadConfigs();
    await loadSheets(state.configs);
    msg.hidden = true;
    home.renderInitialPets();
    showScreen('home');
  } catch (err) {
    console.error(err);
    const isFile = location.protocol === 'file:';
    msg.innerHTML = isFile
      ? '浏览器不允许从 file:// 读取配置。<br>请在仓库根目录跑 <code>python -m http.server 5501</code><br>再打开 <code>http://localhost:5501/</code>'
      : `资源加载失败：${err.message}<br>请确认在仓库根目录启动了静态服务器。`;
    showScreen('battle');
    $('btnStart').disabled = true;
  }
}
boot();
