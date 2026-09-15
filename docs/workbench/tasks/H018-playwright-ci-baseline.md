# H018｜Playwright / CI 正式 H5 基线

**Status:** Ready  
**Phase:** Test  
**Depends on:** H002, H004, H013

## 目标

把 CI 从 UI 阶段的 60 节点历史验收脚本迁到当前正式 H5 的 smoke / 关键业务 E2E，避免旧验收事实绑架新工程。

## 已知问题

现有 `verify-t015.mjs` 仍硬编码历史 `/membership` 为“WebView 边界”，已与当前路由事实漂移。

## 范围

- 将 `verify-t015` 明确降级为历史证据，不再作为长期产品事实源。
- 从 formal-H5 路由归属生成/维护当前 smoke 范围，排除 legacy/Native reference 与当前暂缓商城。
- 建立少量高价值业务 E2E，而不是逐页面像素验收。
- test branch gate 保留 build、无 Mock 泄漏、浏览器回归等真正工程门槛。

## 不做

- 不逐个修复旧 capture/verify 脚本使其继续“全绿”。
- 不把 CI PASS 等同 App WebView/业务 Accepted。

## 验收

- CI 不再因过期 UI 节点文案决定正式 H5 是否可晋级。
- formal-H5 关键路由 smoke、console error、坏图/明显横向溢出等基础回归可自动发现。
- legacy/商城暂缓范围不会成为业务 gate。

## 证据

记录新 gate 清单、代表性失败演示/通过结果与 commit SHA。
