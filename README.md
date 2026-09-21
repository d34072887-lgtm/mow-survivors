# 割草游戏（mow-survivors）

竖屏幸存者 / 割草（赌狗养成）。**首版可玩切片已落地**：根目录 `index.html` + `src/`（纯前端 ES modules，无构建）。

## 本地打开

```bash
# 在仓库根目录
python -m http.server 5501
```

打开 http://localhost:5501/ （或 http://127.0.0.1:5501/）

- 主界面 → 点「出 发」直接进局；桌面浏览器会居中成 390 宽的手机框，手机直接全屏。
- 操作：底部整块拇指区任意处按住即出摇杆；右下 🎯 是小葵主动技「诱捕标记」。桌面调试可用 WASD / 方向键，空格放技能。
- `?debug=1` 显示 fps / 实体数。
- ES modules 不能用 `file://` 直接双击打开，必须走静态服务器。

## 目录

```
index.html                 单页入口（主界面 + 局内两个 screen）
src/
  main.js                  启动：读配置 → 主界面 → 出发 → 局内 → 4 选 1 → 结算
  core/    loop / rng / events / assets(精灵烘焙) / input(浮动摇杆)
  systems/ stats(StatSystem) / round(回合表) / pick(4 选 1)
  game/    battle(一局状态机) / player / monsters / spawner / weapons(5 种攻击模式) / pickups / fx / world(相机) / spatial
  render/  renderer(世界渲染) / tiles(程序化草地)
  ui/      home / hud / pick+menu / toast
  data/    tuning(手感常量) / stats(18 属性注册) / patterns(攻击模式参数)
data/configs/              全部数值：heroes / weapons / monsters / spawn-rules / attribute-pools / attribute-pick …
docs/                      设计文档（00/01/02/06/26 为准）；docs/preview/ 是早期单文件 demo，已被根目录 index.html 取代
```

首版范围：小葵 · 5 个回合（R1 = 15 秒 / 15 只史莱姆，R5 史莱姆王）· 回合间 4 选 1（金币刷新加价）· 捕获计数。商店、赌场、拍卖、强化等按 docs/ 逐步加。

设计与约束见 `docs/`，尤其 `docs/26-手机版美术与界面约定.md`。
