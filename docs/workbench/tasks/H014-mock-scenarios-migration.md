# H014｜Mock 场景迁移与页面假网络清理

**Status:** Ready  
**Phase:** Foundation  
**Depends on:** H005, H013

## 目标

把原型期页面内 `setTimeout`、关键字判定和直接 resolver 模拟的“网络行为”逐步迁到 MSW handler，让页面回到真实请求生命周期。

## 范围

- 定义 success / empty / business error / 4xx/5xx / slow / network failure 等必要场景。
- 正常业务差异优先使用真实 query/path/body/header 驱动。
- 仅为边界演示保留明确的 mock scenario 控制，不污染生产 API 语义。
- 优先迁移会继续进入 API 联调的正式 H5 页面。

## 不做

- 不为了全覆盖把每个历史 fixture 都转成 HTTP。
- 不处理商城、legacy。
- 不把 Bridge 能力模拟成 API handler。

## 验收

- 被迁移页面不再自行用固定延时冒充请求。
- Mock 场景稳定、确定、可由同一 service 触发。
- test/prod 路径不依赖这些场景。

## 证据

记录迁移清单、handler 场景和 commit SHA。
