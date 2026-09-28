# H035｜正式首页 Native OAuth 鉴权

**Status:** User Review  
**Phase:** H5 Authentication  
**Depends on:** H029, H007, H011

## 用户确认的接口口径

- Native App 进入 H5 时调用既有 `getLoginToken()`，取得 `token` 与 `salt`。
- `POST {VITE_API_BASE_URL}/api/oauth/login`，JSON 请求体 `{ salt, token }`。
- 登录响应为 `{ userInfo, accessToken }`；后续同源 API 请求发送 `Authorization: Bearer <accessToken>`。
- 收到 HTTP 401 或响应顶层 `code: 401` 时，重新从 Native 取凭据并登录；并发请求共用一次登录；原请求最多重放一次。
- 登录/重登失败或重放后仍为 401 时进入 `/error?reason=auth`，不循环。

## 实施范围

- API 模式下根首页由鉴权门保护；每次新文档启动重新取 Native 凭据，同文档内复用会话。
- 仅 `accessToken` 通过 `src/storage` 的 `auth-session` session key 保存；`userInfo` 仅留在当前文档内存。Storage 不可用时以内存会话维持当前文档。
- 全局 HTTP client 仅向配置 API 同源请求附加 Bearer token；OAuth 登录请求及跨源请求不附带该 token。
- preview/dev Mock 模式不模拟真实登录，保持浏览器 UI 预览可用。
- Native reference 路由不由 H035 首页鉴权门保护；共享请求层的鉴权启停跟随 active formal H5 路由范围。

## 不做与待确认

- 不处理 403、退出登录、跨 WebView token 同步或 refresh token。
- 业务 401 当前按 HTTP 401 或响应顶层 `code: 401` 识别；其它包装结构待后端确认。
- 真机 Bridge、登录服务可达性、CORS、双端重新取凭据行为需在 App WebView 联调确认。
- sessionStorage 中的短期 accessToken 是本任务按用户授权的会话级实现；不扩展到 localStorage 或长期凭据。

## 当前验证

- HTTP 单测覆盖 HTTP 401 重放、顶层业务 code 401 单次重放和跨源请求不泄露 Authorization。
- 浏览器 Mock 构建不执行 Native 登录；真实 API / App WebView 联调仍待验证。
