# H015｜JSBridge Adapter 与 Native 导航边界

**Status:** Agent Review  
**Phase:** Host Integration  
**Depends on:** H002, H006, H009

## 当前事实与解阻依据

旧卡以“Native JSBridge 真实能力、方法名、参数/回调与版本协议尚未确认”为 Blocker。此后仓库 `jsbrigge-test` 分支已留下真实 Android WebView 联调代码及两次针对宿主注入行为的修正，因此 H015 的最小真实能力已经具备施工依据：

```text
window.androidBridge.getLoginToken()
```

可确认的协议事实：

- 宿主全局对象：`window.androidBridge`；
- 方法：`getLoginToken()`；
- 参数：无；
- Android 注入对象可能晚于 H5 初始化，因此不能缓存 bridge；
- 调用必须保留宿主注入对象的 receiver；
- 返回值在联调页中为同步返回，但正式 DTO/schema 尚未确认，因此 adapter 不猜测 token 结构。

证据提交：

- `5bc88e6d558edb2a814550b6e14b7c58547b336c`：JSBridge Native debug 页；
- `ddc3c64981b2a134a63924802d8a138fa698e70b`：保留 Android JSBridge receiver binding；
- `bb2eb4c6f85db86fba17d3ca07442923b20fa1b1`：每次调用从 `window` 重新解析 bridge。

iOS debug 草稿中虽存在 `webkit.messageHandlers.getAuthorizationInfo` / `window.onToken`，但当前缺少与 Android 等价的正式宿主确认，因此本卡不伪造跨平台等价能力，也不自行发明 Native navigation/version API。

## 目标

建立 H5 与 App 宿主之间唯一、可检测、可失败的 Bridge 边界，并以已确认的 Android `getLoginToken()` 完成第一条正式 Native capability；后续扫码、相机、分享、Native 导航等能力继续通过同一边界扩展。

## 范围

- capability detection、调用封装、Promise 归一化、timeout、unsupported/error；
- host/version 信息与支持判断；未提供的宿主 version 明确返回 `null`，不猜版本；
- Browser/H5 明确 unsupported，不返回假 Native 成功；
- 首个正式能力：Android `getLoginToken()`；
- 页面禁止直接访问宿主全局对象。

## 不做

- 不散落 `window.xxx`；
- 不自行发明扫码、相机、相册、分享、登录、导航协议；
- 不把尚未确认的 iOS 草稿包装成已支持能力；
- 不猜测 `getLoginToken()` 的 token DTO/schema；
- 不让 Native 默认代理 H5 的业务 HTTP。

## 实现结果

- 新增 `src/services/nativeBridge.ts` 作为唯一正式宿主适配层；
- `VITE_BRIDGE_MODE=native` 才允许真实 Native 调用，disabled/mock 不会静默 fallback；
- 每次调用重新解析 `window.androidBridge`，支持晚注入；
- `method.call(bridge)` 保留 Android receiver binding；
- 同步宿主返回归一为 Promise，并提供默认 5 秒 timeout；
- `bridge-disabled`、`bridge-unsupported`、`capability-unsupported`、`invocation-failed`、`invocation-timeout` 分开可观察；
- diagnostics 显式区分 Android / iOS / Browser；host version 未确认时为 `null`；
- 新增 `scripts/verify-h015-jsbridge.mjs`，验证 adapter 行为并扫描 `src/pages`，阻止页面重新直连宿主对象；
- CI 增加 `npm run verify:h015` gate。

## 验收

- [x] 至少一个真实 Native 方法已有仓库内 WebView 联调证据，正式 adapter 只采用该已确认方法；
- [x] Browser/无 bridge 对 unsupported 有确定行为；
- [x] 页面不直接依赖宿主全局对象；
- [x] Promise normalization、timeout、unsupported/error 已收口；
- [x] iOS / version / navigation 未确认部分不会被错误伪装成已支持；
- [ ] 当前 App WebView build 使用正式 adapter 再跑一次 `getLoginToken()` 的人工宿主回归确认；
- [ ] PR CI 通过 `lint`、`typecheck`、`verify:h015` 与完整 build gate。

## 证据

详见 [`../evidence/h015-jsbridge-native-boundary.md`](../evidence/h015-jsbridge-native-boundary.md)。

本卡进入 `Agent Review`；待 PR CI 与当前 App WebView 的正式 adapter 回归确认后进入 `User Review`。`Accepted` 仍只由用户明确验收后更新。
