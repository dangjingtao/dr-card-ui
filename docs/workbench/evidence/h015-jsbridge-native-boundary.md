# H015｜JSBridge / Native 边界证据

## 1. 已确认的宿主事实

H015 不再以旧任务卡中“没有任何真实协议”的状态为事实基础。仓库的 `jsbrigge-test` 分支已经留下 Android WebView 联调代码与针对真实注入对象的修正提交：

- `5bc88e6d558edb2a814550b6e14b7c58547b336c`：加入 JSBridge Native debug 页；
- `ddc3c64981b2a134a63924802d8a138fa698e70b`：修正 Android JSBridge receiver binding；
- `bb2eb4c6f85db86fba17d3ca07442923b20fa1b1`：改为每次点击从 `window` 重新解析 Android bridge，兼容宿主晚注入。

当前可作为正式边界依据的最小 Android 能力为：

```text
window.androidBridge.getLoginToken()
```

已知事实：

- 全局对象名：`window.androidBridge`；
- 方法名：`getLoginToken`；
- 参数：无；
- 调用形态：Android 注入对象上的同步方法；
- 注入时机：不能假设模块初始化时已存在，因此每次调用都重新解析；
- receiver：调用时必须保留注入对象作为 receiver；
- 返回 DTO / token schema：未确认，因此正式 adapter 返回 `unknown`，不自行发明结构。

`jsbrigge-test` 同时存在 iOS `window.webkit.messageHandlers.getAuthorizationInfo.postMessage({})` 与 `window.onToken(token)` 的联调草稿，但当前没有与 Android 等价的宿主修正/验收证据，因此 H015 不把它提升为正式跨平台协议。

## 2. 正式实现

正式实现位于 `src/services/nativeBridge.ts`：

- 所有正式 H5 宿主全局对象访问集中在 adapter；
- 只有 `VITE_BRIDGE_MODE=native` 才允许 Native 调用；
- 每次调用重新读取 `window.androidBridge`；
- 使用 `method.call(bridge)` 保留 receiver；
- Android 同步返回统一归一为 `Promise`；
- 默认 5 秒 timeout，可由调用方显式覆盖；
- unsupported / capability missing / invocation failed / timeout 使用稳定错误码区分；
- Browser/H5 不返回伪造成功结果；
- `hostVersion` 明确为 `null`，直到 Native 提供真实版本协议；
- iOS 可被 diagnostics 识别，但未确认能力不会被错误标记为已支持。
- H021 额外加入 H5 概念能力 `closeWebView`，当前明确为 `false`，并提供只会返回 `capability-unsupported` 的 adapter seam；它不映射任何未确认的 Android / iOS 方法，只为后续宿主协议提供稳定接入点。

## 3. 自动验证

`scripts/verify-h015-jsbridge.mjs` 覆盖：

1. Android `getLoginToken` 可经 adapter 调用；
2. receiver binding 正确；
3. bridge 晚注入/替换后下一次调用读取新实例；
4. Browser/无 bridge 明确 unsupported；
5. 能力缺失、同步异常、timeout 均可观察；
6. iOS 不会被错误声明支持 Android `getLoginToken`；
7. 正式 H5 页面不得直接访问 `androidBridge` / `webkit.messageHandlers`；
8. adapter 不包含 fake/mock token fallback。

第 7 项严格遵守 H002 与 `AGENTS.md` §3.4 的 ownership 边界：`src/pages/legacy/**`，以及只承载 Native-reference 路由的 `LegacyHome`、`LegacyScan`、`Device*`、`Vending*`、`LegacyService`、`Repair*`、`FeedbackPage` 不进入 H015 的 H5 CI 验收。Native reference 保持“只看、不动、不验”，即使其中未来出现直接宿主调用，也不会反向把 H5 gate 变成 Native reference 的验收器。

CI 通过 `.github/workflows/build.yml` 的 `Verify H015 JSBridge boundary` 运行 `npm run verify:h015`，同时保留既有 `lint`、`typecheck` 和多环境 build gate。

## 4. 人工确认项

代码合并前/后仍建议在当前 App WebView build 中以 `VITE_BRIDGE_MODE=native` 再调用一次 `getLoginToken()`，确认正式 adapter 与当前宿主 build 的注入行为一致。这是对正式 adapter 的宿主回归确认，不再是“方法名/调用方式未知”的协议阻塞。

尚未确认的 iOS callback、Native navigation、宿主 version API 不在本次已确认能力中；后续接入必须继续以真实宿主协议为依据，不能由 H5 侧补猜。
