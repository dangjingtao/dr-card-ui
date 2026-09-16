# H007｜Axios HTTP Client 与统一错误模型

**Status:** Agent Review  
**Phase:** Foundation  
**Depends on:** H006

## 目标

建立正式 H5 唯一 HTTP 出口和统一错误语义，结束页面未来各自调用 fetch/axios、各自解释错误的风险。

## 范围

- 引入 Axios 并建立集中 HTTP client。
- 配置 base URL、timeout、基础 headers 与必要 interceptor 边界。
- 定义 `AppError`，统一区分网络、HTTP、业务/契约等错误类别。
- 页面不直接创建 Axios 实例；service 层作为业务请求入口。
- 认证注入预留接口，但认证协议未确认前不虚构 token 规则。

## 不做

- 不在本卡接所有业务 API。
- 不用 Native 充当默认 HTTP proxy。
- 不把 toast/UI 反馈写进 HTTP client。

## 验收

- 有单一可复用 HTTP client 和错误模型。
- 示例/基础测试能证明成功、timeout、HTTP error 会落到确定错误类型。
- typecheck/build 通过。

## 实施结果

- 已引入 Axios `1.19.0`，npm lockfile 由 CI 环境真实生成。
- 已建立 `src/services/http/`：默认 `httpClient`、`createHttpClient`、统一 `AppError` 与错误归一化。
- 默认 timeout 为 `10_000ms`，默认 `Accept: application/json`。
- `VITE_API_BASE_URL` 未配置时，相对请求会明确抛 `HTTP_BASE_URL_MISSING`，不会静默命中 H5 当前域名。
- 已提供协议中立的 auth header provider；未硬编码 Bearer/Cookie/Native 等未确认认证方式。
- `npm run verify:h007` 已进入普通 Build workflow，并验证 success / auth hook / timeout / HTTP 503 / network / missing-base 六类行为。
- PR #14 的完整 dev / preview / test / prod Build workflow 已通过。

## 证据

- 工程说明：[`../../engineering/http-client.md`](../../engineering/http-client.md)
- 验收证据：[`../evidence/h007-http-error-foundation.md`](../evidence/h007-http-error-foundation.md)
- PR：#14 `feat: establish H007 Axios HTTP foundation`
- CI：Build run `35057927771`，结论 `success`

> H008 的真实 backend base URL、认证方式与核心接口契约仍未确认。H007 不以伪造这些协议作为收口条件。

当前等待用户验收；只有用户可以将本卡更新为 `Accepted`。
