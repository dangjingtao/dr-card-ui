# H5 认证边界

当前正式 H5 已确认 **Native → H5 登录凭证获取协议**，但 backend 认证、token 生命周期与未登录处理仍未全部确认。

## 当前已确认事实

- 正式 H5 不再依赖 `pages/legacy/userInfoStore.ts` 等 Native reference / 历史演示状态；
- Android 登录凭证入口：`window.androidBridge.getLoginToken()`；
- iOS 登录凭证入口：`window.iosBridge.getLoginToken()`；
- 两端均无参数、同步返回 JSON string；
- 当前返回结构：`{"token":"..."}`；
- Native 回填写明最低 App 版本目标为 2.13；
- Native 同时注明两端方法已注入，但内部实现仍需改为读取真实登录态；
- H5 统一通过 `src/services/nativeBridge.ts` 获取并验证结果，业务页面不得直接访问宿主对象。

旧 iOS `webkit.messageHandlers.getAuthorizationInfo.postMessage({}) → window.onToken(token)` 仅作为历史联调 / Bridge Lab Raw Probe 证据保留，不再是 production auth contract。

## 当前仍待确认

Native Bridge 解决的是“如何从 App 拿到登录 token”，以下问题仍不能自行推断：

- token 与后端 HTTP Authorization / Cookie 的最终绑定方式；
- token 过期、刷新、登出与跨 WebView 生命周期同步；
- 未登录时 Native `getLoginToken()` 返回什么；
- token 为空 / 过期时由 Native 拉起登录，还是 H5 展示登录入口；
- backend 401 / 403 与 Native 登录态失效如何协调。

## 与后续任务的关系

- H003：切断 legacy runtime 登录依赖；
- H007：HTTP client / error 基础；
- H008：仍需 backend base URL 与真实 API / 认证使用方式；
- H015：历史 Native boundary；
- H029：正式建立 Android / iOS 统一 `getLoginToken()` Bridge v2 contract；
- H030–H034：继续接其它 Native 能力，不改变本认证边界。

详细 Native Bridge v2 契约见 `docs/engineering/native-bridge-v2-contract.md`。
