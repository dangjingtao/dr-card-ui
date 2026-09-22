# H007｜Axios HTTP Client 与统一错误模型证据

日期：2026-09-16  
分支：`h007-http-error-foundation`  
PR：#14 `feat: establish H007 Axios HTTP foundation`

## 结论

H007 已建立正式 H5 的单一 HTTP 基础出口与统一错误语义，并通过静态卫生、TypeScript、专用行为验证及 dev / preview / test / prod 全构建矩阵。当前状态进入 **Agent Review**，仅用户可将任务标记为 `Accepted`。

H008 的真实 backend base URL、认证方式和业务接口契约仍未确认；H007 未为通过验收伪造这些协议。

## 实现入口

- `src/services/http/httpClient.ts`
  - 集中 Axios client；
  - 默认 timeout `10_000ms`；
  - 默认 `Accept: application/json`；
  - 默认单例读取 `VITE_API_BASE_URL`；
  - `request<T>()` 返回 response `data`；
  - 协议中立的 auth headers provider；
  - 空 base URL + 相对请求直接报配置错误，防止误打到 H5 自身域名。
- `src/services/http/appError.ts`
  - `AppError`；
  - `configuration / network / timeout / http / business / contract / cancelled / unknown` 分类；
  - Axios error → `AppError` 统一转换。
- `src/services/http/index.ts`
  - 对业务 service 暴露稳定入口。
- `docs/engineering/http-client.md`
  - 记录正式调用边界、错误模型、认证预留与明确非目标。

## 依赖

Axios 使用精确版本 `1.19.0`。

`package.json` 与 `package-lock.json` 由 GitHub Actions 在 Node 20 / npm 10.8.2 环境执行：

```text
npm install --package-lock-only --ignore-scripts --no-audit --no-fund --save-exact axios@1.19.0
```

生成后写回施工分支；没有手工拼写 lockfile。临时生成 workflow 已在同一流程中自删除，不进入最终工程面。

相关提交：

- `4795cb87f814c0a31a7a8b4de1ff39670050e4c0` — `build: add axios dependency for H007`
- `80fbd09634925dae6d09d14a032b2bde74bf8688` — `feat: add H007 HTTP client and AppError foundation`
- `ad65ebaf38e72d37d1d450f5c47604635d987a47` — `ci: verify H007 HTTP foundation`
- `dbd4b80dafb8eb135fa008e3b3a34f2f89892a9c` — `docs: document H007 HTTP client boundary`

## AppError 语义

| kind | 当前语义 |
|---|---|
| `configuration` | 客户端运行配置缺失/无效；当前用于缺失 API base URL |
| `network` | 未收到 HTTP response 的网络失败 |
| `timeout` | `ECONNABORTED` / `ETIMEDOUT` |
| `http` | 4xx / 5xx 等 HTTP response；保留 `status` 与 response data |
| `business` | 供未来 service 按真实后端业务协议构造 |
| `contract` | 供 H009 运行时契约层使用 |
| `cancelled` | Axios `ERR_CANCELED` |
| `unknown` | 非 Axios 或无法归类异常 |

HTTP client 不解释业务 envelope，也不负责 toast / modal。

## 认证边界

H007 只提供：

```ts
setHttpAuthHeadersProvider(() => ({ ...headers }))
```

未硬编码 `Authorization`、Bearer Token、Cookie、设备码或 Native 注入规则。真实认证协议继续留给 H008 在获得后台契约后接入。

## 专用行为验证

脚本：`scripts/verify-h007-http.mjs`  
命令：`npm run verify:h007`

脚本通过 Vite SSR 加载真实 TypeScript 实现，并使用 Axios adapter 做确定性、无外网验证，覆盖：

1. 成功请求返回 data；
2. auth header hook 可注入 opaque header；
3. timeout → `AppError(kind=timeout)`；
4. HTTP 503 → `AppError(kind=http, status=503)`；
5. network failure → `AppError(kind=network)`；
6. 空 base URL + 相对路径 → `AppError(kind=configuration, code=HTTP_BASE_URL_MISSING)`。

CI 原样输出：

```text
H007 HTTP PASS: success, auth hook, timeout, HTTP error, network error, and missing-base configuration are deterministic.
```

## CI 证据

PR #14 Build workflow：`35057927771`  
Build job：`104671899394`  
结论：**success**

通过项包括：

- `npm ci`；
- Static hygiene；
- Typecheck；
- Verify H007 HTTP foundation；
- development server smoke；
- development bundle + identity；
- local dev explicit API policy；
- Cloudflare branch-to-mode policy；
- Cloudflare preview bundle + identity；
- test bundle + identity；
- production-like Mock rejection；
- production bundle + identity；
- SPA fallback；
- production preview smoke。

静态卫生输出：

```text
H5 hygiene PASS: 129 formal source files checked; 0 unused diagnostic(s) within baseline; 0 architecture violation(s).
H004 fixture-query debt PASS: 9 protected-query access(es) within explicit baseline.
```

构建日志仍明确输出：

```text
VITE_API_BASE_URL is empty; real backend integration remains blocked by H008.
```

这属于预期边界，不是 H007 通过测试后被隐藏的风险。

## Cloudflare 预览

PR #14 分支预览部署成功，稳定分支别名：

`https://h007-http-error-foundation.dr-card-ui.pages.dev`

## 本卡未做

- 未接任何真实业务 API；
- 未定义真实认证协议；
- 未解析业务 response envelope；
- 未引入 Zod（H009）；
- 未在 HTTP client 内加入 toast / modal；
- 未让 Native JSBridge 代理普通 HTTP；
- 未触碰商城 deferred scope。
