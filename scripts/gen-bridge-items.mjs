import fs from 'fs';
import path from 'path';

const dir = 'data/configs/items/stat';

const bridges = [
  {
    id: 'itm_poacher_kit',
    name: '偷猎者腰囊',
    tier: 'uncommon',
    sellPrice: 18,
    archetypeBridge: {
      targetArchetype: 'capture',
      outsiderOnly: true,
      perStack: [
        { statId: 'luck', type: 'flat', value: 2 },
        { statId: 'petDamage', type: 'percent', value: 0.04 },
      ],
    },
  },
  {
    id: 'itm_weekend_miner',
    name: '周末矿工证',
    tier: 'uncommon',
    sellPrice: 17,
    archetypeBridge: {
      targetArchetype: 'dig',
      outsiderOnly: true,
      perStack: [
        { statId: 'wealth', type: 'flat', value: 2 },
        { statId: 'luck', type: 'flat', value: 1 },
        { statId: 'goldGain', type: 'percent', value: 0.03 },
      ],
    },
  },
  {
    id: 'itm_bouncer_patch',
    name: '保镖肩章',
    tier: 'uncommon',
    sellPrice: 16,
    archetypeBridge: {
      targetArchetype: 'tank',
      outsiderOnly: true,
      perStack: [
        { statId: 'maxHp', type: 'percent', value: 0.05 },
        { statId: 'armor', type: 'flat', value: 2 },
      ],
    },
  },
  {
    id: 'itm_rage_serum',
    name: '狂战士血清',
    tier: 'uncommon',
    sellPrice: 17,
    archetypeBridge: {
      targetArchetype: 'dps',
      outsiderOnly: true,
      perStack: [
        { statId: 'attack', type: 'percent', value: 0.04 },
        { statId: 'critRate', type: 'percent', value: 0.02 },
      ],
    },
  },
  {
    id: 'itm_fake_chips',
    name: '一叠假筹码',
    tier: 'uncommon',
    sellPrice: 16,
    archetypeBridge: {
      targetArchetype: 'gambler',
      outsiderOnly: true,
      perStack: [
        { statId: 'luck', type: 'flat', value: 2 },
        { statId: 'casinoWinRate', type: 'percent', value: 0.03 },
      ],
    },
  },
  {
    id: 'itm_scroll_thief',
    name: '偷来的附魔卷',
    tier: 'uncommon',
    sellPrice: 18,
    archetypeBridge: {
      targetArchetype: 'enchant',
      outsiderOnly: true,
      perStack: [
        { statId: 'luck', type: 'flat', value: 1 },
        { statId: 'enchantRareWeight', type: 'percent', value: 0.03 },
      ],
    },
  },
  {
    id: 'itm_smith_apron',
    name: '借来的铁匠围裙',
    tier: 'uncommon',
    sellPrice: 17,
    archetypeBridge: {
      targetArchetype: 'enhance',
      outsiderOnly: true,
      perStack: [
        { statId: 'enhanceSuccess', type: 'percent', value: 0.02 },
        { statId: 'attack', type: 'percent', value: 0.02 },
      ],
    },
  },
  {
    id: 'itm_beast_collar',
    name: '驯兽项圈',
    tier: 'rare',
    sellPrice: 24,
    archetypeBridge: {
      targetArchetype: 'capture',
      outsiderOnly: true,
      outsiderMultiplier: 1,
      nativeMultiplier: 0.5,
      perStack: [{ statId: 'petDamage', type: 'percent', value: 0.05 }],
      conditional: {
        condition: { type: 'item_stack_gte', itemId: 'itm_beast_collar', value: 3 },
        modifiers: [{ statId: 'maxPetDeploy', type: 'flat', value: 1 }],
      },
    },
  },
  {
    id: 'itm_prospector_lens',
    name: '探矿镜片',
    tier: 'rare',
    sellPrice: 22,
    archetypeBridge: {
      targetArchetype: 'dig',
      outsiderOnly: true,
      perStack: [
        { statId: 'wealth', type: 'flat', value: 3 },
        { statId: 'pickupRange', type: 'percent', value: 0.04 },
      ],
    },
  },
  {
    id: 'itm_iron_gut_pills',
    name: '铁胃药片',
    tier: 'rare',
    sellPrice: 21,
    archetypeBridge: {
      targetArchetype: 'tank',
      outsiderOnly: true,
      perStack: [
        { statId: 'damageReduction', type: 'percent', value: 0.02 },
        { statId: 'hpRegen', type: 'flat', value: 3 },
      ],
    },
  },
  {
    id: 'itm_mercenary_contract',
    name: '佣兵合同',
    tier: 'rare',
    sellPrice: 23,
    archetypeBridge: {
      targetArchetype: 'dps',
      outsiderOnly: true,
      perStack: [{ statId: 'attack', type: 'percent', value: 0.06 }],
    },
  },
  {
    id: 'itm_symbiosis_seed',
    name: '共生种子',
    tier: 'rare',
    sellPrice: 22,
    archetypeBridge: {
      targetArchetype: 'tank',
      outsiderOnly: true,
      perStack: [
        { statId: 'lifeSteal', type: 'percent', value: 0.01 },
        { statId: 'hpRegen', type: 'flat', value: 2 },
      ],
    },
  },
  {
    id: 'itm_dealer_trick',
    name: '庄家袖里牌',
    tier: 'rare',
    sellPrice: 25,
    archetypeBridge: {
      targetArchetype: 'gambler',
      outsiderOnly: true,
      perStack: [
        { statId: 'wealth', type: 'flat', value: 2 },
        { statId: 'casinoEnforcerDelay', type: 'percent', value: 0.06 },
      ],
    },
  },
  {
    id: 'itm_offduty_shovel',
    name: '下班铁铲',
    tier: 'rare',
    itemCategory: 'venue',
    sellPrice: 20,
    archetypeBridge: {
      targetArchetype: 'dig',
      outsiderOnly: true,
      perStack: [{ statId: 'wealth', type: 'flat', value: 2 }],
      conditional: {
        condition: { type: 'venue_active', venue: 'treasure' },
        modifiers: [{ statId: 'shopDiscount', type: 'percent', value: 0.05 }],
      },
    },
  },
  {
    id: 'itm_part_timer_ball',
    name: '兼职精灵球',
    tier: 'uncommon',
    sellPrice: 14,
    archetypeBridge: {
      targetArchetype: 'capture',
      outsiderOnly: true,
      perStack: [{ statId: 'luck', type: 'flat', value: 3 }],
    },
    flavor: '非抓宠英雄叠层后，消耗球仍走 luck+attack 联动捕获',
  },
];

for (const it of bridges) {
  const obj = {
    version: 1,
    id: it.id,
    name: it.name,
    tier: it.tier,
    itemCategory: it.itemCategory ?? 'stat',
    sellPrice: it.sellPrice,
    archetypeBridge: it.archetypeBridge,
  };
  if (it.flavor) obj.flavor = it.flavor;
  fs.writeFileSync(path.join(dir, `${it.id}.json`), JSON.stringify(obj, null, 2) + '\n');
}
console.log('bridge items:', bridges.length);
