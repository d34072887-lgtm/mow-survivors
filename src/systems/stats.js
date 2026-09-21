import { STAT_DEFS } from '../data/stats.js';

/**
 * StatSystem（docs/02）：final = clamp((base + Σflat) × (1 + Σpercent) × Πmultiply, min, max)
 * 所有来源（英雄 base、武器、4 选 1）都用 sourceId 登记，可整体移除。
 */
export class StatSystem {
  constructor(base = {}) {
    this.base = { ...base };
    this.mods = [];            // {statId,type,value,sourceId}
    this.cache = new Map();
    this.listeners = new Set();
  }
  onChange(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  _dirty(statId) {
    this.cache.delete(statId);
    for (const fn of this.listeners) fn(statId);
  }
  addModifier(statId, type, value, sourceId = 'anon') {
    if (!STAT_DEFS[statId]) return;
    this.mods.push({ statId, type, value, sourceId });
    this._dirty(statId);
  }
  addModifiers(list, sourceId) { for (const m of list) this.addModifier(m.statId, m.type, m.value, sourceId); }
  removeSource(sourceId) {
    const touched = new Set();
    this.mods = this.mods.filter((m) => { if (m.sourceId === sourceId) { touched.add(m.statId); return false; } return true; });
    for (const s of touched) this._dirty(s);
  }
  get(statId) {
    if (this.cache.has(statId)) return this.cache.get(statId);
    const def = STAT_DEFS[statId] || {};
    let flat = 0, percent = 0, mul = 1;
    for (const m of this.mods) {
      if (m.statId !== statId) continue;
      if (m.type === 'flat') flat += m.value;
      else if (m.type === 'percent') { if (def.kind === 'ratio') flat += m.value; else percent += m.value; }
      else if (m.type === 'multiply') mul *= m.value;
    }
    let v = ((this.base[statId] || 0) + flat) * (1 + percent) * mul;
    if (def.min !== undefined) v = Math.max(def.min, v);
    if (def.max !== undefined) v = Math.min(def.max, v);
    this.cache.set(statId, v);
    return v;
  }
  snapshot() {
    const out = {};
    for (const id of Object.keys(STAT_DEFS)) out[id] = this.get(id);
    return out;
  }
}

/** 软饱和联动通道（docs/25 §2.5）：plateau × (1 - e^(-stat×weight/plateau)) */
export function lane(stat, weight, plateau) {
  if (stat <= 0) return 0;
  return plateau * (1 - Math.exp(-stat * weight / plateau));
}
