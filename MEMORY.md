# 割草游戏 — 项目索引手册

> 最后更新：2026-06-26  
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

尚未创建 `src/`。可玩预览见 [docs/preview/](./docs/preview/)（2026-06-26：主界面 + 局内 demo）。规划见 [docs/18-配置与目录结构.md](./docs/18-配置与目录结构.md)。

### 本地预览

```bash
cd E:\项目\割草游戏
python -m http.server 5501
```

- 主界面：http://127.0.0.1:5501/docs/preview/main-screen.html
- 局内：http://127.0.0.1:5501/docs/preview/battle-vertical.html

## 全局规则

[.rules.MD](./.rules.MD)

## 操作日志

[.action_log.md](./.action_log.md)
