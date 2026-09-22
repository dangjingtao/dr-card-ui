# H014｜Mock 场景迁移与页面假网络清理

**Status:** User Review  
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

## 实施结果

### 1. BuddyPhoneInvite

迁移 `src/pages/BuddyPhoneInvite.tsx` 的两段假网络生命周期：

- 手机号搜索不再由页面 `window.setTimeout()` + `resolveBuddyPhoneOutcome()` 本地得出结果；页面改为调用 `searchBuddyByPhone()`。
- 发送邀请不再调用 `buddyShare.ts` 内固定 delay；页面改为调用 `sendBuddyPhoneInvite()`。
- `src/app/state/buddies.ts` 删除 `invitedPhones`、`markPhoneInvited()`、`resolveBuddyPhoneOutcome()` 这组页面侧网络结果模拟；“发送后再次搜索同号 → invited”改由 MSW handler 内的 Mock 服务端状态推进完成。
- 页面仅维护真实请求需要的 loading / stale-request guard / error UI，不读取 `dataMode`，也不判断 Mock 场景。

链路变为：

```text
BuddyPhoneInvite
  → src/services/buddyPhone.ts
  → httpClient
  → MSW handler（dev/preview Mock）或真实 HTTP（API mode）
```

### 2. Exchange

迁移 `src/pages/Exchange.tsx` 的兑换提交固定 timer：

- 删除 700ms `setTimeout()` 假装请求往返。
- 新增 `redeemExchangeProduct()`，提交态由真实 Promise 生命周期驱动。
- `src/mocks/handlers/exchange.ts` 只复现当前原型已经确认的成功提交；B-026 的库存、余额扣减与结算规则仍未确认，因此没有自行发明这些后台规则。

### 3. ServiceChat 判定

本卡未机械迁移 `src/pages/ServiceChat.tsx`。

该页面 timer 混合了“消息发送中/失败”与“机器人回复、人工排队/接入”等 demo 状态。前者具有网络模拟性质，但机器人回复、人工客服队列及其后台协议尚无已确认 API/产品契约；直接 HTTP 化会把现有 demo resolver 固化成伪后台契约。故 H014 保留现状并记录为后续真实聊天/客服契约确认后的迁移候选。

分享海报、复制链接等 `buddyShare.ts` timer 也继续保留：它们属于宿主能力模拟，不属于 HTTP API Mock，符合 H013 的 API Mock / Bridge（宿主）边界分离原则。

## Handler 场景

`src/mocks/fixtures/h014Scenarios.ts` + `src/mocks/handlers/buddyPhone.ts` 使用同一个 `searchBuddyByPhone()` service，通过确定性手机号输入覆盖：

| 场景 | 输入 | Mock 行为 |
|---|---|---|
| success | `13900000000` | HTTP 200，`invitable` |
| empty | `13800000000` | HTTP 200，`not-found` |
| invited | `13800000001` | HTTP 200，`invited` |
| business error | `13800000002` | HTTP 200，业务失败 payload |
| slow | `13800000003` | handler 延迟 1500ms 后成功 |
| 4xx | `13800000400` | HTTP 422 |
| 5xx | `13800000500` | HTTP 503 |
| network failure | `13800000999` | `HttpResponse.error()` |

发送邀请 handler 接受真实请求 body `{ phone }`，在 Mock 网络边界记录已邀请手机号；后续同一搜索 service 返回 `invited`。

Exchange handler 接受 `{ productId }` 并仅返回当前已确认的成功场景。

## API 契约决策

H008 仍因真实 backend base URL、认证方式和 endpoint / DTO 未确认而 `Blocked`，因此 H014 **不宣称新增了真实后台 API 契约**。

为完成 page → service → HTTP → MSW 的网络生命周期迁移，本卡使用 `/__h014/...` 作为明确的前端保留 transport seam。它只用于在真实后台契约缺失期间承载 H014 网络边界，不应被后续开发视为已确认后台 endpoint。真实 endpoint / DTO / auth 到位后，应只替换 service transport mapping，不改页面调用方式。

`httpClient` 在 Mock 模式且未配置 `VITE_API_BASE_URL` 时统一使用当前 H5 origin，使 MSW 能在网络层拦截；API 模式仍保持 H007 的 `HTTP_BASE_URL_MISSING` 失败语义，不做同源 fallback。页面和业务 service 均不读取 Mock/API 开关。

## 验证

新增 `npm run verify:h014`，验证：

- Buddy success / empty / invited / business error / 422 / 503 / slow / network failure 全部通过同一个 service 触发；
- 发送邀请后再次搜索同号会由 handler 状态推进为 `invited`；
- Exchange 提交通过 service → HTTP → MSW；
- 两个迁移页面已无对应请求 `setTimeout`；
- Buddy / Exchange service 不读取 `runtimePolicy`、`VITE_DATA_MODE` 或 `mockScenario`。

Build run `35113086947`（implementation head `75a2f69dc4d48fe8c0886220c2c3bb76e005cb98`）全绿，包含：

- static hygiene；
- `npm run typecheck`；
- H007–H014 verification；
- dev build + worker identity；
- Cloudflare preview build + Mock identity；
- test build + API identity + Mock rejection；
- production build + API identity；
- production preview smoke。

> Connector 施工环境无法直接执行仓库本地 shell；CI 已执行比单一默认 `npm run build` 更完整的 dev / preview / test / prod 构建矩阵，其中 production build 与默认 build 的 prod target 使用同一 `build-h5.mjs` 构建链。

## 证据

- H013 baseline：`c1d7fc650aba14a758a380c31e37d9a5b6ab059c`
- H014 implementation head：`75a2f69dc4d48fe8c0886220c2c3bb76e005cb98`
- Build run：`35113086947` — success
- 实际迁移页面：`src/pages/BuddyPhoneInvite.tsx`、`src/pages/Exchange.tsx`
- 新增业务 service：`src/services/buddyPhone.ts`、`src/services/exchange.ts`
- 新增 handler：`src/mocks/handlers/buddyPhone.ts`、`src/mocks/handlers/exchange.ts`
- 新增场景 fixture：`src/mocks/fixtures/h014Scenarios.ts`
- 新增验证：`scripts/verify-h014-mock-scenarios.mjs`
