# 割草游戏 — 项目索引手册

> 最后更新：2026-09-21  
> 代码目录：`E:\项目\割草游戏`（原 `E:\爽得不行`）  
> 中控台文档：`D:\桌面\开发中控台\项目中控文档\割草游戏中控台文档\`

## 项目

网页版割草 / 赌狗养成游戏，模块化、数据驱动，持续扩展英雄、怪物、装备等。

## 文档入口

**主索引**：[docs/README.md](./docs/README.md)

| 类别 | 路径 |
|------|------|
| 概述 | [docs/00-概述.md](./docs/00-概述.md) |
| 流程 | [docs/01-游戏流程.md](./docs/01-游戏流程.md) |
| 核心系统 | [docs/02-核心系统.md](./docs/02-核心系统.md) |
| 附魔台（细则） | [docs/15-附魔台.md](./docs/15-附魔台.md) |
| 待讨论 | [docs/19-已确认与待讨论.md](./docs/19-已确认与待讨论.md) |
| 配置结构 | [docs/18-配置与目录结构.md](./docs/18-配置与目录结构.md) |

## 源码目录

**`src/` 已创建（2026-09-21 首版可玩切片）**，入口 `index.html`，纯前端 ES modules、无构建：

| 目录 | 内容 |
|------|------|
| `src/main.js` | 启动、屏幕切换、一局的事件接线（round:end → 4 选 1 → resume；run:end → 结算） |
| `src/core/` | `loop` 主循环 · `rng` 可种子随机 · `events` EventBus · `assets` 加载 + 精灵烘焙（大图缩一次成小像素画布）· `input` 浮动摇杆/键盘 |
| `src/systems/` | `stats` StatSystem（docs/02 公式）· `round` 回合表 · `pick` 4 选 1（docs/09） |
| `src/game/` | `battle` 一局状态机 · `player` · `monsters`（池 + 追踪 + 分离 + Boss）· `spawner` · `weapons`（melee_arc / ranged_burst / ranged_pierce / orbit / aoe_ground）· `pickups` 金币 · `fx` · `world` 相机 · `spatial` 网格哈希 |
| `src/render/` | `renderer` 设备像素渲染、Y 排序 · `tiles` 程序化草地 |
| `src/ui/` | `home` 主界面 · `hud` · `pick`（4 选 1 / 暂停 / 结算弹层）· `toast` |
| `src/data/` | `tuning` 手感常量（改速度/尺寸只动这里）· `stats` 18 属性注册 · `patterns` 攻击模式参数 |
| `data/configs/` | 新增 `heroes/hero_xiaokui.json`、`monsters/{normal,elite,boss}/*.json`、`spawn-rules/rounds.json`、`attribute-pools/pool_xiaokui.json`、`attribute-pick/refresh-pricing.json`；武器仍读 `weapons/*.json` |

`docs/preview/` 的单文件 demo 保留作参考，已被 `index.html` 取代。

### 本地预览

```bash
cd G:\项目\割草游戏
python -m http.server 5501
```

- 游戏入口：http://localhost:5501/
- 旧 demo：http://localhost:5501/docs/preview/main-screen.html 、 /docs/preview/battle-vertical.html

## 全局规则

[.rules.MD](./.rules.MD)

## 操作日志

[.action_log.md](./.action_log.md)
