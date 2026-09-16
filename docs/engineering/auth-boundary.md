# H5 认证边界

当前正式 H5 **没有已确认的生产认证协议**。H003 的目标是先停止把 Native reference 的 mock 用户状态当成正式 H5 登录事实源，而不是在缺少协议时自行发明一套认证。

## 当前事实

- `pages/legacy/userInfoStore.ts` 属于 Native reference / 历史演示状态。
- 它的 `account`、`isRegistered` 等字段只能说明 reference 页面如何演示登录流程，不能证明真实 App WebView 的登录态。
- 因此正式 H5 壳层不再根据该 store 判断是否登录，也不再把 `/` 自动重定向到 `/legacy-profile/login`。
- 浏览器开发环境中的正式 H5 路由保持可直接访问，便于 UI、Mock 与后续 API/Bridge 工程继续施工。

## 待确认协议

以下问题目前均未定案，禁止在代码中猜测：

- 登录态由 Native App 通过 JSBridge 注入，还是由 H5 自己建立；
- 后端是否使用 HttpOnly Cookie、短期 token 或其他授权方式；
- WebView 首次进入时如何获取用户身份 / 会话上下文；
- 未登录、过期、刷新失败时由 Native 处理还是由 H5 展示登录入口；
- token 刷新、登出、跨 WebView 生命周期同步的责任归属。

真实协议确认后，应在明确的 auth / service / bridge 边界实现，不得重新依赖 `pages/legacy/*` mock 状态。

## 与后续任务的关系

- H003：只切断 legacy runtime 反向依赖并记录未决认证边界。
- H007：建立 HTTP client / error 基础，但不会自行决定认证协议。
- H008：真实 API 垂直链路仍因 backend base URL、认证方式、接口契约未确认而 Blocked。
- H015：Native JSBridge 真实协议确认前同样保持 Blocked。
