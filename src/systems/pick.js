import { describeMod, STAT_ICONS, STAT_FLAVOR } from '../data/stats.js';
import { WEAPON_ICONS, QUALITY_ORDER, QUALITY_NAME } from '../data/patterns.js';
import { lane } from './stats.js';

const TIER_NAME = { common: '普通', rare: '稀有', legend: '传说', weapon: '武器' };

/**
 * 回合间 4 选 1（docs/09）：属性卡 + 武器卡同池；luck 软饱和抬稀有/传说权重；同回合刷新加价。
 */
export class AttributePick {
  constructor(poolCfg, pricing, weaponDefs, rng) {
    this.pool = poolCfg;
    this.pricing = pricing;
    this.weaponDefs = weaponDefs;
    this.rng = rng;
    this.refreshes = 0;
  }

  beginRound() { this.refreshes = 0; }

  refreshPrice() {
    // attributeRefreshDiscount 属于 Build 属性（docs/25 §2.4），首版不打折
    return Math.min(this.pricing.max, this.pricing.base + this.pricing.step * this.refreshes);
  }

  /** 生成 4 张不重复的卡 */
  roll(player, weaponSys, count = 4) {
    const luck = player.stats.get('luck');
    const tw = this.pool.tierWeights;
    const luckBoost = lane(luck, 0.02, 1.2); // luck 60 → 约 +0.8
    const tierW = { common: tw.common, rare: tw.rare * (1 + luckBoost), legend: tw.legend * (1 + luckBoost * 1.5) };
    const used = new Set();
    const out = [];
    const weaponCards = this._weaponCards(weaponSys);
    for (let i = 0; i < count && i < 24; i++) {
      let card = null;
      const weaponsSoFar = out.filter((c) => c.kind === 'weapon').length;
      const wantWeapon = weaponCards.length > 0 && weaponsSoFar < 2 && this.rng.chance(this.pool.weaponCardWeight / 100);
      if (wantWeapon) {
        const cands = weaponCards.filter((c) => !used.has(c.id));
        if (cands.length) card = this.rng.weighted(cands);
      }
      if (!card) {
        const tier = this.rng.weighted([{ t: 'common', weight: tierW.common }, { t: 'rare', weight: tierW.rare }, { t: 'legend', weight: tierW.legend }]).t;
        const cands = this.pool.options.filter((o) => o.tier === tier && !used.has(o.id));
        if (!cands.length) { i--; continue; }
        const o = this.rng.weighted(cands);
        card = this._statCard(o);
      }
      used.add(card.id);
      out.push(card);
    }
    return out;
  }

  _statCard(o) {
    return {
      kind: 'stat', id: o.id, tier: o.tier, tierName: TIER_NAME[o.tier], icon: STAT_ICONS[o.statId] || '✦',
      name: describeMod(o.statId, o.type, o.value), desc: STAT_FLAVOR[o.statId] || '', mod: { statId: o.statId, type: o.type, value: o.value },
    };
  }

  _weaponCards(weaponSys) {
    const cards = [];
    const full = weaponSys.weapons.length >= weaponSys.maxSlots;
    for (const def of Object.values(this.weaponDefs)) {
      const owned = weaponSys.get(def.id);
      if (owned) {
        const qi = QUALITY_ORDER.indexOf(owned.quality);
        if (qi >= QUALITY_ORDER.length - 1) continue;
        cards.push({ kind: 'weapon', id: `w_${def.id}`, tier: 'weapon', tierName: '合成', icon: WEAPON_ICONS[def.id] || '🗡️', name: `${def.name} → ${QUALITY_NAME[QUALITY_ORDER[qi + 1]]}`, desc: `同把再来一把，合成升品质（攻击白值放大）`, weaponId: def.id, weight: 45 });
      } else if (!full) {
        cards.push({ kind: 'weapon', id: `w_${def.id}`, tier: 'weapon', tierName: '新武器', icon: WEAPON_ICONS[def.id] || '🗡️', name: def.name, desc: def.flavor || '', weaponId: def.id, weight: def.qualityTiers?.white?.shopWeight || 60 });
      }
    }
    return cards;
  }

  /** 应用选择 */
  apply(card, player, weaponSys) {
    if (card.kind === 'stat') { player.stats.addModifier(card.mod.statId, card.mod.type, card.mod.value, `pick:${card.id}:${Math.random()}`); return `已带走 ${card.name}`; }
    const r = weaponSys.add(this.weaponDefs[card.weaponId], player);
    return r === 'upgraded' ? `${card.icon} 合成成功` : r === 'added' ? `${card.icon} 新武器上手` : '格子满了';
  }

  paidRefresh(gold) {
    const price = this.refreshPrice();
    if (gold < price) return -1;
    this.refreshes++;
    return price;
  }
}
