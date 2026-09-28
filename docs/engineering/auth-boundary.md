# H5 认证边界

当前正式 H5 已确认 **Native → H5 登录凭证获取协议**，并按当前开发约定接入 OAuth 登录；token 生命周期与未登录处理仍未全部确认。

## 当前已确认事实

- 正式 H5 不再依赖 `pages/legacy/userInfoStore.ts` 等 Native reference / 历史演示状态；
- Android 登录凭证入口：`window.androidBridge.getLoginToken()`；
- iOS 登录凭证入口：`window.iosBridge.getLoginToken()`；
- 两端均无参数、同步返回 JSON string；
- 当前返回结构：`{"token":"...","salt":"..."}`；H5 兼容旧版 token-only 返回，但需要签名的接口不得把缺失 salt 当作有效凭证；
- Native 回填写明最低 App 版本目标为 2.13；
- Native 同时注明两端方法已注入，但内部实现仍需改为读取真实登录态；
- H5 统一通过 `src/services/nativeBridge.ts` 获取并验证结果，业务页面不得直接访问宿主对象。
- OAuth 开发登录：`POST {VITE_API_BASE_URL}/api/oauth/login`，请求体 `{ salt, token }`；成功响应兼容旧的 `{ userInfo, accessToken }`，以及当前后台返回的 `{ code: 0, data: { userInfo, accessToken, ... } }`；后续同源 API 请求使用 `Authorization: Bearer <accessToken>`。
- 正式 H5 根首页在 `VITE_DATA_MODE=api` 时先完成登录；仅 `accessToken` 暂存于 `sessionStorage`，`userInfo` 保留在当前文档内存。Mock 模式保留独立浏览器预览，不模拟真实登录。
- HTTP 401 或响应顶层 `code: 401` 触发一次单飞重登；原请求最多重放一次。重登失败进入 `/error?reason=auth`，不循环。

旧 iOS `webkit.messageHandlers.getAuthorizationInfo.postMessage({}) → window.onToken(token)` 仅作为历史联调 / Bridge Lab Raw Probe 证据保留，不再是 production auth contract。

## 当前仍待确认

Native Bridge 解决的是“如何从 App 拿到登录 token”，以下问题仍不能自行推断：

- 以上 Authorization 约定来自当前开发联调口径，需由后端最终确认是否同时适用于所有 API；
- 2026-09-24 本地联调（模拟器 WebView 真实登录态）实测：7002 需登录接口只接受 `token` 请求头；仅带 `Authorization: Bearer <accessToken>` 返回 401「请先登录」。Bearer 是否为最终口径仍待后端确认，[userProfile.ts](../../src/services/userProfile.ts) 暂按实测同时携带两种头；
- 同期实测 `GET /api/user/detail` 对有效登录态只返回 `{"code":200,"message":"用户不存在！"}`，真实出参字段待后端补齐；
- token 过期、刷新、登出与跨 WebView 生命周期同步；
- 未登录时 Native `getLoginToken()` 返回什么；
- token 为空 / 过期时由 Native 拉起登录，还是 H5 展示登录入口；
- 业务 401 的完整响应结构；当前只识别响应顶层 `code: 401`，HTTP 401 按标准状态处理；
- backend 403 与 Native 登录态失效如何协调。

## 与后续任务的关系

- H003：切断 legacy runtime 登录依赖；
- H007：HTTP client / error 基础；
- H008：仍需 backend base URL 与真实 API / 认证使用方式；
- H015：历史 Native boundary；
- H029：正式建立 Android / iOS 统一 `getLoginToken()` Bridge v2 contract；
- H030–H034：继续接其它 Native 能力，不改变本认证边界。

详细 Native Bridge v2 契约见 `docs/engineering/native-bridge-v2-contract.md`。
