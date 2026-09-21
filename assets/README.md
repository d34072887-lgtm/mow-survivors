# 割草游戏 — 美术资源

> 最后更新：2026-06-26  
> **尺度与竖屏规范**：见 [`docs/26-手机版美术与界面约定.md`](../docs/26-手机版美术与界面约定.md)

## 双层美术策略

| 层级 | 风格 | 目录 |
|------|------|------|
| **局内** | 小号 chibi 像素（屏上角色约 24～40px 高） | `assets/characters/`、`assets/monsters/` |
| **场外 / UI** | 暖色手绘水彩 | `docs/preview/art-*-warm-watercolor.png` |

## 目录

| 路径 | 内容 |
|------|------|
| `characters/hero_xiaokui/` | 主角「小葵」俯视 walk `4×4` |
| `monsters/slime/` | 史莱姆 idle `2×2` |

每个单位目录含：

- `*-sheet-raw.png` — 品红底原始 sheet（可重抠图）
- `*-sheet.png` — 已抠透明底 sheet
- `frames/` — 单帧 PNG
- `manifest.json` — 帧矩形、动画名、fps、pivot（Phaser/Pixi 可读）

## 预览（纯 HTML）

浏览器打开（建议本地静态服务，以便 `fetch` manifest）：

```text
E:\项目\割草游戏\docs\preview\sprite-preview.html
```

示例：`cd E:\项目\割草游戏` 后 `npx serve .`，再访问 `/docs/preview/sprite-preview.html`

## 引擎用法（HTML Canvas 同样适用）

```javascript
// drawImage(sheet, sx, sy, sw, sh, dx, dy, dw, dh) 按 manifest 切帧即可
// hero_xiaokui: walk_down / walk_right / walk_left / walk_up @ 8fps
// slime: idle @ 6fps
// Phaser/Pixi 是可选封装，不是必须
```

## QC 注意

AI 生成的 sprite sheet **需实机验收**：帧对齐、pivot、方向映射、边缘裁切。不通过则按同一角色 **单动作重生成** 再替换对应 sheet。

## 场外参考

- `docs/preview/art-title-atmosphere-warm-watercolor.png`（氛围）
- `docs/preview/hero-xiaokui-portrait-warm-watercolor.png`（小葵看板立绘 · 主界面）
- 出图规范：`D:\桌面\开发中控台\技能\游戏\mobile-casual-game-ui\references\portrait-home-screen.md`
