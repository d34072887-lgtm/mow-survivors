/**
 * 18 条主属性注册（docs/25 §2.2）。
 * kind:'value' → percent 修正按 ×(1+Σ%)；kind:'ratio' → 属性本身就是百分比，percent 修正视同 flat 相加。
 */
export const STAT_DEFS = {
  maxHp:           { name: '最大生命', kind: 'value', min: 1,  fmt: (v) => `+${Math.round(v)}` },
  hpRegen:         { name: '生命回复', kind: 'value', fmt: (v) => `+${v.toFixed(1)}/秒` },
  lifeSteal:       { name: '吸血',     kind: 'ratio', fmt: pct },
  attack:          { name: '攻击力',   kind: 'value', fmt: (v) => `+${Math.round(v)}` },
  attackSpeed:     { name: '攻击速度', kind: 'ratio', fmt: pct },
  critRate:        { name: '暴击率',   kind: 'ratio', fmt: pct },
  critDamage:      { name: '暴击伤害', kind: 'ratio', fmt: pct },
  range:           { name: '攻击范围', kind: 'ratio', fmt: pct },
  pierce:          { name: '穿透',     kind: 'value', fmt: (v) => `+${Math.round(v)} 个目标` },
  aoeScale:        { name: '范围缩放', kind: 'ratio', fmt: pct },
  armor:           { name: '防御力',   kind: 'value', fmt: (v) => `+${Math.round(v)}` },
  dodge:           { name: '闪避',     kind: 'ratio', fmt: pct },
  damageReduction: { name: '减伤',     kind: 'ratio', fmt: pct },
  moveSpeed:       { name: '移速',     kind: 'ratio', fmt: pct },
  pickupRange:     { name: '拾取范围', kind: 'ratio', fmt: pct },
  luck:            { name: '幸运',     kind: 'value', min: 0, fmt: (v) => `+${Math.round(v)}` },
  wealth:          { name: '财富',     kind: 'value', min: 0, fmt: (v) => `+${Math.round(v)}` },
  goldGain:        { name: '金币获取', kind: 'ratio', fmt: pct },
};

function pct(v) { return `${v >= 0 ? '+' : ''}${Math.round(v * 100)}%`; }

export const STAT_ICONS = {
  maxHp: '❤️', hpRegen: '🌿', lifeSteal: '🩸', attack: '⚔️', attackSpeed: '⚡', critRate: '✨', critDamage: '💥',
  range: '🎯', pierce: '➶', aoeScale: '🌀', armor: '🛡️', dodge: '🍃', damageReduction: '🧱', moveSpeed: '👟',
  pickupRange: '🧲', luck: '🍀', wealth: '💰', goldGain: '🪙',
};

export const STAT_FLAVOR = {
  maxHp: '更耐打一点', hpRegen: '慢慢回血', lifeSteal: '越打越满', attack: '打得更狠', attackSpeed: '出手更快',
  critRate: '更常暴击', critDamage: '暴得更疼', range: '手更长', pierce: '一线穿多只', aoeScale: '扇形/地波更大',
  armor: '更硬', dodge: '偶尔躲开', damageReduction: '更肉', moveSpeed: '走位更灵', pickupRange: '金币自己飞过来',
  luck: '好东西更常见', wealth: '回合结算多拿钱', goldGain: '杀怪金币更多',
};

/** 描述一条属性修正，供 4 选 1 卡片 */
export function describeMod(statId, type, value) {
  const def = STAT_DEFS[statId];
  if (!def) return `${statId} ${value}`;
  if (type === 'percent' && def.kind === 'value') return `${def.name} ${pct(value)}`;
  return `${def.name} ${def.fmt(value)}`;
}
