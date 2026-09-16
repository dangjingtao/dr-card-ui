# HTTP Client 与统一错误模型

H007 建立正式 H5 的唯一 HTTP 基础出口。它只解决“请求如何发出、底层错误如何收敛”的基础问题，不提前定义真实业务 API、认证协议或接口数据契约。

## 调用边界

正式业务代码按以下方向组织：

```text
Page / Hook
  ↓
Business Service（H008 起逐步建立）
  ↓
src/services/http/httpClient
  ↓
Axios
  ↓
HTTP API
```

页面、组件、布局不直接调用 `fetch`、`XMLHttpRequest` 或 Axios。H001 的静态卫生门禁继续负责约束这条边界。

## HTTP Client

入口：`src/services/http/`

- `httpClient`：应用默认单例，读取 `VITE_API_BASE_URL`。
- `createHttpClient(options)`：用于独立验证或未来确有必要的隔离 client；业务页面不自行创建。
- 默认 timeout：`10_000ms`。
- 默认请求头：`Accept: application/json`。
- 返回值：`request<T>()` 直接返回响应 `data`，业务 service 不需要重复剥离 Axios response。

### Base URL

H006 允许 `VITE_API_BASE_URL` 在真实后台契约未确认前为空。H007 不改变这个阻塞事实。

但为了避免空 base URL 时相对路径静默请求到当前 H5 域名，默认 client 对“无 base URL + 相对 URL”直接抛出：

```text
AppError {
  kind: 'configuration',
  code: 'HTTP_BASE_URL_MISSING'
}
```

绝对 `http(s)` URL 仍可用于受控的独立 client / 验证场景。

## 认证注入边界

H007 只提供协议中立的 header provider：

```ts
setHttpAuthHeadersProvider(() => ({
  // 真实 header 名称和值必须等认证协议确认后再接入
}))
```

这里不假定 Bearer Token、Cookie、设备码、Native 注入或任何具体认证规则。H008 获得真实认证契约后再实现。

## AppError

所有 Axios 底层失败必须先收敛成 `AppError`，UI 不直接解释 AxiosError。

| kind | 含义 | 典型来源 |
|---|---|---|
| `configuration` | 客户端运行配置缺失/无效 | API base URL 未配置 |
| `network` | 未获得 HTTP response 的网络失败 | 断网、DNS、连接失败 |
| `timeout` | 请求超时 | `ECONNABORTED` / `ETIMEDOUT` |
| `http` | 服务端返回非成功 HTTP 状态 | 4xx / 5xx |
| `business` | 后端业务语义失败 | 由未来 service 根据真实协议创建 |
| `contract` | 数据不满足运行时契约 | H009 的 Zod 层使用 |
| `cancelled` | 请求被主动取消 | Axios `ERR_CANCELED` |
| `unknown` | 无法归类的异常 | 非 Axios 未知异常 |

`http` 错误保留 `status` 与 response `data` 到 `details`，但 HTTP client 不自行解析业务 envelope，也不弹 toast。

## 验证

`npm run verify:h007` 使用 Vite SSR 直接加载真实 TypeScript 实现，并用 Axios adapter 做无外网确定性验证，覆盖：

- success data 返回；
- auth header hook；
- timeout → `AppError(kind=timeout)`；
- HTTP 503 → `AppError(kind=http, status=503)`；
- network → `AppError(kind=network)`；
- 空 base URL + 相对路径 → `AppError(kind=configuration)`。

该验证已进入普通 Build workflow；H017 之后仍可把这些基础行为迁移/补充为 Vitest 单元测试。

## 本卡明确不做

- 不接真实业务 API；
- 不定义认证 token/cookie 规则；
- 不定义业务 response envelope；
- 不做 Zod contract parsing（H009）；
- 不引入 UI toast / modal；
- 不让 Native JSBridge 代理普通 HTTP。
