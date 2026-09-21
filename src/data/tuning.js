/**
 * 全局手感常量：所有尺度从一处推导（docs/26 §2、§3）。
 * 世界单位 = 设计宽 390 下的 CSS px；camera.zoom = 实际宽 / 390。
 */
export const TUNING = {
  designW: 390,
  tile: 32,
  world: { w: 2400, h: 2400 },          // 大地图 + 相机跟随
  playerAnchorY: 0.58,                  // 玩家锚在画面偏下（0.58~0.62）
  camLerp: 7,
  // 尺寸（屏上 px）：玩家 24~40，小怪 16~24，精英 1.5~2×，Boss 2~3×
  heroPx: 32,
  // 移速：docs/26 240px/s@1200 宽 → 78@390 → 「大地图小人偏慢」；预览 demo 用 25 太慢不好玩，
  // 这里取 44（≈1.4 个身位/秒），仍属偏慢档；改这一个数即可整体调快慢。
  heroSpeed: 44,
  accel: 14, decel: 18,                 // 速度插值系数（/s）
  contactCooldown: 0.6,                 // 同一只怪连续碰撞伤害间隔
  invulnAfterHit: 0.25,
  separation: 0.9,                      // 怪物互相推开强度
  knockbackDecay: 9,
  pickupRadius: 34,                     // 金币吸附半径（× (1+pickupRange)）
  magnetSpeed: 260,
  hitStop: 0.03,                        // 击杀命中的微顿帧
  spawnRing: [215, 290],                // 出怪环：离玩家多远冒出来（世界 px）
  spawnInTime: 0.35,                    // 冒出来的入场动画时长
  joystick: { maxRadius: 46, deadzone: 0.15 },
  capture: { base: 0.10, eliteMul: 0.5, luckPlateau: 0.6, luckWeight: 0.012 },
  debug: /[?&]debug=1/.test(typeof location !== 'undefined' ? location.search : ''),
};
