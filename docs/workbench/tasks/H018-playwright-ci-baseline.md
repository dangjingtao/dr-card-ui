# H018｜Playwright / CI 正式 H5 基线

**Status:** User Review  
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

- PR：#25 `H018: establish formal H5 Playwright CI baseline`，已合入 `dev`。
- merge commit：`d4b273895d96fcc5067006b9f9b961da4e02f004`。
- 实现 head：`09d0819ac3e4edbe7a375350d7199382db35ba8f`。
- GitHub Actions Build #388：success；保留 H017 4 files / 13 tests、H007–H015 retained verify、dev/preview/test/prod 构建与 smoke 链路，并新增 formal-H5 Playwright regression。
- formal-H5 Playwright：38 tests passed；范围由 `ACTIVE_FORMAL_H5_ROUTES` 生成，Native reference 与 deferred mall 不进入业务 gate。
- 新 gate 覆盖浏览器 runtime error、可见坏图、明显横向溢出，并含 `会员中心 → 通知 → 浏览器返回` 代表性导航链路。
- `test` branch gate 已改为 production-like `test + api` bundle 上的 Playwright gate；H008/H015 未解阻部分仍未伪造成真实 API / Native Bridge 验收。
- 历史 `verify-t015` 保留为 `verify:legacy:t015` 证据入口，不再决定正式 H5 晋级。

待用户验收后方可标记为 `Accepted`。
