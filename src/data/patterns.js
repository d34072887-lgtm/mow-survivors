/**
 * 5 种攻击模式的运行参数（docs/23 §2 只定义了行为，这里是首版切片数值）。
 * 距离单位 = 世界 px；cooldown 秒；coef = 伤害 × 玩家 attack。
 */
export const PATTERN_PARAMS = {
  melee_arc:     { cooldown: 0.95, range: 46, arcDeg: 110, coef: 1.15, knockback: 110, color: '#fff3d6' },
  ranged_burst:  { cooldown: 0.70, range: 210, speed: 320, coef: 0.90, knockback: 45, projectileR: 3, color: '#ffe08a' },
  ranged_pierce: { cooldown: 1.25, range: 250, speed: 340, coef: 1.05, knockback: 40, projectileR: 3.5, pierce: 1, color: '#d9f0ff' },
  orbit:         { count: 2, radius: 42, angular: 2.7, hitInterval: 0.45, coef: 0.60, knockback: 70, bladeR: 6, color: '#ffd7cf' },
  aoe_ground:    { cooldown: 2.6, radius: 74, coef: 1.35, knockback: 150, duration: 0.38, color: '#f0c27a' },
};

/** 各武器在模式基础上的口味差异 */
export const WEAPON_TUNING = {
  wpn_rust_knife:  { cooldown: 0.85, coef: 1.0 },
  wpn_glass_blade: { cooldown: 0.9, coef: 1.35, arcDeg: 120 },
  wpn_heavy_maul:  { cooldown: 1.45, coef: 1.7, arcDeg: 140, knockback: 180 },
  wpn_pepper_smg:  { cooldown: 0.26, coef: 0.42, spreadDeg: 9, knockback: 20 },
  wpn_hunter_bow:  { cooldown: 0.78, coef: 1.0, speed: 360 },
  wpn_nail_cross:  { cooldown: 1.2 },
  wpn_iron_fan:    { count: 2 },
  wpn_ground_stomp:{ cooldown: 2.5 },
};

export const WEAPON_ICONS = {
  wpn_rust_knife: '🔪', wpn_glass_blade: '🗡️', wpn_heavy_maul: '🔨', wpn_pepper_smg: '🌶️',
  wpn_hunter_bow: '🏹', wpn_nail_cross: '✝️', wpn_iron_fan: '🪭', wpn_ground_stomp: '🥾',
};

/** 品质倍率（docs/23 §3：同 ID 合成升品质） */
export const QUALITY_ORDER = ['white', 'green', 'blue', 'purple', 'orange'];
export const QUALITY_NAME = { white: '白', green: '绿', blue: '蓝', purple: '紫', orange: '橙' };
export const QUALITY_MUL = { white: 1, green: 1.25, blue: 1.55, purple: 1.95, orange: 2.5 };
