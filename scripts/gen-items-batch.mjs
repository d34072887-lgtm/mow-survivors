import fs from 'fs';
import path from 'path';

const base = 'data/configs/items';

function writeItem(it, subdir = 'stat') {
  const dir = path.join(base, subdir);
  fs.mkdirSync(dir, { recursive: true });
  const obj = {
    version: 1,
    id: it.id,
    name: it.name,
    tier: it.tier,
    itemCategory: it.itemCategory ?? (it.curse ? 'curse' : 'stat'),
    sellPrice: it.sellPrice,
  };
  if (it.tags) obj.tags = it.tags;
  if (it.perStack) obj.perStack = it.perStack;
  if (it.conditional) obj.conditional = it.conditional;
  if (it.gambleSideEffect) obj.gambleSideEffect = it.gambleSideEffect;
  if (it.archetypeFit) obj.archetypeFit = it.archetypeFit;
  if (it.consumableEffect) obj.consumableEffect = it.consumableEffect;
  fs.writeFileSync(path.join(dir, `${it.id}.json`), JSON.stringify(obj, null, 2) + '\n');
}

const commons = [
  { id: 'itm_rusty_bandage', name: '生锈绷带', tier: 'common', perStack: [{ statId: 'hpRegen', type: 'flat', value: 2 }], sellPrice: 6 },
  { id: 'itm_worn_boots', name: '磨穿布鞋', tier: 'common', perStack: [{ statId: 'moveSpeed', type: 'percent', value: 0.03 }], sellPrice: 7 },
  { id: 'itm_spare_change', name: '找零硬币', tier: 'common', perStack: [{ statId: 'goldGain', type: 'percent', value: 0.03 }], sellPrice: 6 },
  { id: 'itm_sharpener', name: '卷笔刀刃', tier: 'common', perStack: [{ statId: 'attack', type: 'flat', value: 2 }], sellPrice: 7 },
  { id: 'itm_vitamin_c', name: '维C含片', tier: 'common', perStack: [{ statId: 'maxHp', type: 'percent', value: 0.02 }], sellPrice: 6 },
  { id: 'itm_scrap_plate', name: '废料护板', tier: 'common', tags: ['tank'], perStack: [{ statId: 'armor', type: 'flat', value: 2 }], sellPrice: 8 },
  { id: 'itm_rabbit_foot', name: '兔脚挂饰', tier: 'common', perStack: [{ statId: 'dodge', type: 'percent', value: 0.01 }], sellPrice: 7 },
  { id: 'itm_pepper_shell', name: '胡椒弹壳', tier: 'common', tags: ['burst'], perStack: [{ statId: 'attackSpeed', type: 'percent', value: 0.02 }], sellPrice: 8 },
  { id: 'itm_orbit_gyro', name: '陀螺芯', tier: 'common', tags: ['orbit'], perStack: [{ statId: 'attackSpeed', type: 'percent', value: 0.02 }], sellPrice: 8 },
  { id: 'itm_pierce_nail', name: '穿甲钉', tier: 'common', tags: ['pierce'], perStack: [{ statId: 'pierce', type: 'flat', value: 1 }], sellPrice: 9 },
  { id: 'itm_aoe_resonator', name: '地脉共鸣石', tier: 'common', tags: ['aoe'], perStack: [{ statId: 'aoeScale', type: 'percent', value: 0.04 }], sellPrice: 9 },
  { id: 'itm_crosshair_dot', name: '准星贴纸', tier: 'common', tags: ['ranged'], perStack: [{ statId: 'critRate', type: 'percent', value: 0.02 }], sellPrice: 8 },
  { id: 'itm_melee_weight', name: '握把配重', tier: 'common', tags: ['melee'], perStack: [{ statId: 'attack', type: 'flat', value: 1 }], sellPrice: 7 },
];

const uncommons = [
  { id: 'itm_hot_sauce', name: '地狱辣酱', tier: 'uncommon', perStack: [{ statId: 'attack', type: 'percent', value: 0.01 }, { statId: 'attackSpeed', type: 'percent', value: 0.01 }], sellPrice: 12 },
  { id: 'itm_mint_leaf', name: '薄荷叶片', tier: 'uncommon', tags: ['gamble'], perStack: [{ statId: 'luck', type: 'flat', value: 1 }, { statId: 'wealth', type: 'flat', value: 1 }], sellPrice: 13 },
  { id: 'itm_broken_mirror', name: '碎镜碎片', tier: 'uncommon', perStack: [{ statId: 'luck', type: 'flat', value: 1 }, { statId: 'dodge', type: 'percent', value: 0.01 }], sellPrice: 12 },
  { id: 'itm_turbo_fan', name: '涡轮风扇', tier: 'uncommon', tags: ['orbit'], perStack: [{ statId: 'attackSpeed', type: 'percent', value: 0.04 }], sellPrice: 14 },
  { id: 'itm_bounty_stamp', name: '悬赏邮戳', tier: 'uncommon', perStack: [{ statId: 'goldGain', type: 'percent', value: 0.04 }, { statId: 'attack', type: 'percent', value: 0.01 }], sellPrice: 13 },
  { id: 'itm_steady_pulse', name: '稳态脉搏仪', tier: 'uncommon', tags: ['sustain'], perStack: [{ statId: 'hpRegen', type: 'flat', value: 3 }, { statId: 'maxHp', type: 'percent', value: 0.02 }], sellPrice: 14 },
  { id: 'itm_crit_whetstone', name: '暴击磨刀石', tier: 'uncommon', perStack: [{ statId: 'critRate', type: 'percent', value: 0.02 }, { statId: 'critDamage', type: 'percent', value: 0.04 }], sellPrice: 15 },
  { id: 'itm_quick_reflex', name: '反射神经片', tier: 'uncommon', perStack: [{ statId: 'dodge', type: 'percent', value: 0.02 }, { statId: 'pickupRange', type: 'percent', value: 0.03 }], sellPrice: 12 },
  { id: 'itm_range_extender', name: '伸缩导轨', tier: 'uncommon', tags: ['ranged'], perStack: [{ statId: 'range', type: 'percent', value: 0.04 }], sellPrice: 12 },
  { id: 'itm_grease_stain', name: '机油污渍', tier: 'uncommon', perStack: [{ statId: 'moveSpeed', type: 'percent', value: 0.03 }, { statId: 'dodge', type: 'percent', value: -0.01 }], sellPrice: 10 },
  { id: 'itm_thorn_patch', name: '荆棘贴片', tier: 'uncommon', tags: ['tank'], perStack: [{ statId: 'armor', type: 'flat', value: 1 }, { statId: 'moveSpeed', type: 'percent', value: -0.01 }], sellPrice: 11 },
  { id: 'itm_heavy_coin', name: '沉重硬币', tier: 'uncommon', tags: ['gamble'], perStack: [{ statId: 'wealth', type: 'flat', value: 1 }, { statId: 'moveSpeed', type: 'percent', value: -0.01 }], sellPrice: 11 },
  { id: 'itm_whisper_dice', name: '低语骰子', tier: 'uncommon', itemCategory: 'curse', tags: ['gamble'], perStack: [{ statId: 'luck', type: 'flat', value: 3 }], gambleSideEffect: { enhanceBreakRisk: 0.01 }, sellPrice: 14 },
  { id: 'itm_iron_will', name: '钢铁意志', tier: 'uncommon', tags: ['tank'], perStack: [{ statId: 'damageReduction', type: 'percent', value: 0.01 }, { statId: 'moveSpeed', type: 'percent', value: -0.02 }], sellPrice: 12 },
  { id: 'itm_feral_totem', name: '野性图腾', tier: 'uncommon', tags: ['build_capture'], perStack: [{ statId: 'petMergeBonus', type: 'percent', value: 0.03 }, { statId: 'luck', type: 'flat', value: 1 }], sellPrice: 16 },
  { id: 'itm_treasure_map_fragment', name: '藏宝图残页', tier: 'uncommon', tags: ['build_dig'], perStack: [{ statId: 'wealth', type: 'flat', value: 2 }, { statId: 'luck', type: 'flat', value: 2 }], sellPrice: 16 },
  { id: 'itm_ball_artisan', name: '制球匠手套', tier: 'uncommon', tags: ['build_capture'], perStack: [{ statId: 'luck', type: 'flat', value: 2 }], archetypeFit: { heroArchetype: 'capture', perStackMultiplier: 1.5 }, sellPrice: 17 },
  { id: 'itm_shovel_grip', name: '金柄铲握把', tier: 'uncommon', tags: ['build_dig'], perStack: [{ statId: 'wealth', type: 'flat', value: 3 }], archetypeFit: { heroArchetype: 'dig', perStackMultiplier: 1.5 }, sellPrice: 17 },
];

const rares = [
  { id: 'itm_last_stand', name: '绝境徽章', tier: 'rare', conditional: { condition: { type: 'hp_percent_lte', value: 0.15 }, modifiers: [{ statId: 'damageReduction', type: 'percent', value: 0.08 }], perStackBonus: [{ statId: 'damageReduction', type: 'percent', value: 0.02 }] }, sellPrice: 26 },
  { id: 'itm_berserk_pulse', name: '狂怒起搏器', tier: 'rare', conditional: { condition: { type: 'hp_percent_lte', value: 0.5 }, modifiers: [{ statId: 'attack', type: 'percent', value: 0.10 }], perStackBonus: [{ statId: 'attack', type: 'percent', value: 0.02 }] }, sellPrice: 28 },
  { id: 'itm_greedy_eyes', name: '贪婪之眼', tier: 'rare', conditional: { condition: { type: 'wealth_gte', value: 80 }, modifiers: [{ statId: 'goldGain', type: 'percent', value: 0.06 }] }, sellPrice: 24 },
  { id: 'itm_lucky_streak', name: '连运符', tier: 'rare', conditional: { condition: { type: 'luck_gte', value: 50 }, modifiers: [{ statId: 'critRate', type: 'percent', value: 0.05 }] }, sellPrice: 26 },
  { id: 'itm_pierce_momentum', name: '贯穿势能', tier: 'rare', tags: ['pierce'], conditional: { condition: { type: 'weapon_tag_count', tag: 'pierce', value: 3 }, modifiers: [{ statId: 'pierce', type: 'flat', value: 1 }] }, sellPrice: 25 },
  { id: 'itm_orbit_storm', name: '轨道风暴', tier: 'rare', tags: ['orbit'], conditional: { condition: { type: 'weapon_tag_count', tag: 'orbit', value: 4 }, modifiers: [{ statId: 'aoeScale', type: 'percent', value: 0.06 }] }, sellPrice: 26 },
  { id: 'itm_melee_bulwark', name: '近战壁垒', tier: 'rare', tags: ['melee'], conditional: { condition: { type: 'weapon_tag_count', tag: 'melee', value: 4 }, modifiers: [{ statId: 'armor', type: 'flat', value: 3 }] }, sellPrice: 24 },
  { id: 'itm_enhance_gambit', name: '强化赌局', tier: 'rare', conditional: { condition: { type: 'enhance_level_sum_gte', value: 18 }, modifiers: [{ statId: 'enhanceSuccess', type: 'percent', value: 0.03 }] }, sellPrice: 22 },
  { id: 'itm_debt_note', name: '欠条', tier: 'rare', itemCategory: 'curse', perStack: [{ statId: 'attack', type: 'percent', value: 0.08 }], gambleSideEffect: { casinoWinRate: -0.03 }, sellPrice: 20 },
  { id: 'itm_phantom_step', name: '幻影步', tier: 'rare', conditional: { condition: { type: 'dodge_gte', value: 0.15 }, modifiers: [{ statId: 'moveSpeed', type: 'percent', value: 0.10 }] }, sellPrice: 24 },
  { id: 'itm_iron_lungs', name: '铁肺囊', tier: 'rare', tags: ['tank'], conditional: { condition: { type: 'hp_max_gte', value: 600 }, modifiers: [{ statId: 'hpRegen', type: 'flat', value: 8 }] }, sellPrice: 23 },
  { id: 'itm_crit_script', name: '暴击剧本', tier: 'rare', conditional: { condition: { type: 'critRate_gte', value: 0.25 }, modifiers: [{ statId: 'critDamage', type: 'percent', value: 0.12 }] }, sellPrice: 27 },
  { id: 'itm_empty_wallet', name: '空钱包', tier: 'rare', tags: ['gamble'], conditional: { condition: { type: 'wealth_lte', value: 20 }, modifiers: [{ statId: 'luck', type: 'flat', value: 6 }] }, sellPrice: 21 },
  { id: 'itm_siege_plate', name: '攻城重铠片', tier: 'rare', tags: ['tank'], conditional: { condition: { type: 'armor_gte', value: 30 }, modifiers: [{ statId: 'damageReduction', type: 'percent', value: 0.05 }] }, sellPrice: 25 },
  { id: 'itm_regen_surge', name: '再生浪潮', tier: 'rare', tags: ['sustain'], conditional: { condition: { type: 'hpRegen_gte', value: 15 }, modifiers: [{ statId: 'lifeSteal', type: 'percent', value: 0.02 }] }, sellPrice: 23 },
  { id: 'itm_hoarder_glee', name: '囤囤乐', tier: 'rare', conditional: { condition: { type: 'gold_gte', value: 800 }, modifiers: [{ statId: 'goldGain', type: 'percent', value: 0.10 }] }, sellPrice: 22 },
  { id: 'itm_fresh_blood', name: '新鲜血液', tier: 'rare', tags: ['sustain'], conditional: { condition: { type: 'hp_percent_gte', value: 0.95 }, modifiers: [{ statId: 'lifeSteal', type: 'percent', value: 0.03 }] }, sellPrice: 22 },
  { id: 'itm_night_owl', name: '夜枭镜片', tier: 'rare', conditional: { condition: { type: 'move_speed_gte', value: 0.25 }, modifiers: [{ statId: 'critRate', type: 'percent', value: 0.04 }] }, sellPrice: 23 },
];

const legendaries = [
  { id: 'itm_omega_cog', name: '欧米伽齿轮', tier: 'legendary', conditional: { condition: { type: 'weapon_pattern_unique_gte', value: 6 }, modifiers: [{ statId: 'attackSpeed', type: 'percent', value: 0.15 }, { statId: 'critDamage', type: 'percent', value: 0.20 }] }, sellPrice: 55 },
  { id: 'itm_blood_covenant', name: '血之契约', tier: 'legendary', tags: ['sustain'], conditional: { condition: { type: 'lifeSteal_gte', value: 0.08 }, modifiers: [{ statId: 'maxHp', type: 'flat', value: 20 }, { statId: 'hpRegen', type: 'flat', value: 5 }] }, sellPrice: 52 },
  { id: 'itm_auction_throne', name: '拍卖王座', tier: 'legendary', itemCategory: 'venue', tags: ['gamble'], conditional: { condition: { type: 'wealth_gte', value: 150 }, modifiers: [{ statId: 'auctionSnatchRate', type: 'percent', value: -0.08 }, { statId: 'goldGain', type: 'percent', value: 0.15 }] }, sellPrice: 58 },
  { id: 'itm_casino_ace', name: '赌场王牌', tier: 'legendary', itemCategory: 'venue', tags: ['gamble'], conditional: { condition: { type: 'luck_gte', value: 80 }, modifiers: [{ statId: 'casinoWinRate', type: 'percent', value: 0.10 }, { statId: 'casinoEnforcerDelay', type: 'percent', value: 0.12 }] }, sellPrice: 56 },
  { id: 'itm_pierce_dimension', name: '贯穿次元', tier: 'legendary', tags: ['pierce'], conditional: { condition: { type: 'pierce_gte', value: 5 }, modifiers: [{ statId: 'range', type: 'percent', value: 0.20 }, { statId: 'pierce', type: 'flat', value: 2 }] }, sellPrice: 54 },
  { id: 'itm_tank_fortress', name: '移动堡垒', tier: 'legendary', tags: ['tank'], conditional: { condition: { type: 'all', rules: [{ type: 'hp_max_gte', value: 1200 }, { type: 'armor_gte', value: 40 }] }, modifiers: [{ statId: 'damageReduction', type: 'percent', value: 0.12 }] }, sellPrice: 60 },
  { id: 'itm_glass_cannon_suite', name: '玻璃大炮组', tier: 'legendary', itemCategory: 'curse', conditional: { condition: { type: 'attack_gte', value: 120 }, modifiers: [{ statId: 'critDamage', type: 'percent', value: 0.25 }] }, perStack: [{ statId: 'maxHp', type: 'percent', value: -0.05 }], sellPrice: 50 },
  { id: 'itm_enchanters_grimoire', name: '附魔魔典', tier: 'legendary', conditional: { condition: { type: 'affix_count_gte', value: 10 }, modifiers: [{ statId: 'enchantRareWeight', type: 'percent', value: 0.15 }] }, sellPrice: 53 },
  { id: 'itm_mirror_twin', name: '镜影双子', tier: 'legendary', conditional: { condition: { type: 'all', rules: [{ type: 'dodge_gte', value: 0.25 }, { type: 'critRate_gte', value: 0.20 }] }, modifiers: [{ statId: 'attack', type: 'percent', value: 0.15 }] }, sellPrice: 51 },
  { id: 'itm_chaos_orb', name: '混沌宝珠', tier: 'legendary', itemCategory: 'curse', tags: ['gamble'], perStack: [{ statId: 'luck', type: 'flat', value: 5 }, { statId: 'wealth', type: 'flat', value: 5 }], gambleSideEffect: { enhanceBreakRisk: 0.03 }, sellPrice: 48 },
  { id: 'itm_six_shooter_oath', name: '六枪誓约', tier: 'legendary', tags: ['ranged'], conditional: { condition: { type: 'weapon_tag_count', tag: 'ranged', value: 5 }, modifiers: [{ statId: 'attackSpeed', type: 'percent', value: 0.20 }] }, sellPrice: 52 },
  { id: 'itm_horde_engine', name: '尸潮引擎', tier: 'legendary', tags: ['aoe'], conditional: { condition: { type: 'all', rules: [{ type: 'weapon_tag_count', tag: 'aoe', value: 3 }, { type: 'aoeScale_gte', value: 0.30 }] }, modifiers: [{ statId: 'aoeScale', type: 'percent', value: 0.15 }] }, sellPrice: 54 },
  { id: 'itm_pet_whisper', name: '万兽低语', tier: 'legendary', tags: ['build_capture'], conditional: { condition: { type: 'pet_deploy_gte', value: 4 }, modifiers: [{ statId: 'petDamage', type: 'percent', value: 0.20 }] }, sellPrice: 55 },
  { id: 'itm_midas_curse', name: '迈达斯诅咒', tier: 'legendary', itemCategory: 'curse', perStack: [{ statId: 'goldGain', type: 'percent', value: 0.15 }, { statId: 'moveSpeed', type: 'percent', value: -0.03 }], sellPrice: 45 },
];

const curses = [
  { id: 'itm_cursed_gold', name: '诅咒金块', tier: 'rare', itemCategory: 'curse', perStack: [{ statId: 'goldGain', type: 'percent', value: 0.12 }, { statId: 'moveSpeed', type: 'percent', value: -0.04 }], sellPrice: 18 },
  { id: 'itm_vampire_tax', name: '吸血鬼税单', tier: 'rare', itemCategory: 'curse', perStack: [{ statId: 'lifeSteal', type: 'percent', value: 0.03 }, { statId: 'maxHp', type: 'percent', value: -0.03 }], sellPrice: 17 },
  { id: 'itm_jinx_bracelet', name: '厄运手镯', tier: 'rare', itemCategory: 'curse', perStack: [{ statId: 'attack', type: 'percent', value: 0.15 }, { statId: 'dodge', type: 'percent', value: -0.03 }], sellPrice: 19 },
  { id: 'itm_heavy_sin', name: '重负罪印', tier: 'rare', itemCategory: 'curse', tags: ['tank'], perStack: [{ statId: 'damageReduction', type: 'percent', value: 0.06 }, { statId: 'moveSpeed', type: 'percent', value: -0.05 }], sellPrice: 18 },
  { id: 'itm_all_in_ticket', name: '梭哈入场券', tier: 'legendary', itemCategory: 'curse', tags: ['gamble'], perStack: [{ statId: 'luck', type: 'flat', value: 8 }], gambleSideEffect: { casinoWinRate: 0.05, auctionSnatchRate: 0.08 }, sellPrice: 35 },
  { id: 'itm_life_drain_coil', name: '漏电线圈', tier: 'uncommon', itemCategory: 'curse', perStack: [{ statId: 'lifeSteal', type: 'percent', value: 0.02 }, { statId: 'maxHp', type: 'percent', value: -0.02 }], sellPrice: 11 },
];

const venues = [
  { id: 'itm_enhance_insurance', name: '强化保单', tier: 'rare', itemCategory: 'venue', perStack: [{ statId: 'enhanceBreakRisk', type: 'percent', value: -0.02 }], sellPrice: 28 },
  { id: 'itm_casino_charm', name: '赌场护身符', tier: 'uncommon', itemCategory: 'venue', tags: ['gamble'], perStack: [{ statId: 'casinoWinRate', type: 'percent', value: 0.04 }], sellPrice: 18 },
  { id: 'itm_merchant_ledger', name: '商贾账本', tier: 'uncommon', itemCategory: 'venue', perStack: [{ statId: 'shopDiscount', type: 'percent', value: 0.03 }], sellPrice: 16 },
  { id: 'itm_refresh_coupon', name: '刷新优惠券', tier: 'uncommon', itemCategory: 'venue', perStack: [{ statId: 'attributeRefreshDiscount', type: 'percent', value: 0.05 }], sellPrice: 14 },
  { id: 'itm_salvage_permit', name: '回收许可证', tier: 'uncommon', itemCategory: 'venue', perStack: [{ statId: 'sellBonus', type: 'percent', value: 0.08 }], sellPrice: 12 },
  { id: 'itm_black_market_pass', name: '黑市通行证', tier: 'rare', itemCategory: 'venue', perStack: [{ statId: 'shopDiscount', type: 'percent', value: 0.02 }], gambleSideEffect: { auctionSnatchRate: 0.03 }, sellPrice: 20 },
];

const consumables = [
  { id: 'itm_ball_great', name: '高级球', tier: 'uncommon', itemCategory: 'consumable', consumableEffect: 'capture_great', sellPrice: 20 },
  { id: 'itm_shovel_gold', name: '金铲', tier: 'rare', itemCategory: 'consumable', consumableEffect: 'dig_deep', sellPrice: 35 },
];

for (const it of [...commons, ...uncommons, ...rares, ...legendaries, ...curses, ...venues]) {
  writeItem(it, 'stat');
}
for (const it of consumables) {
  writeItem(it, 'consumable');
}

console.log('Generated', commons.length + uncommons.length + rares.length + legendaries.length + curses.length + venues.length + consumables.length, 'new items');
