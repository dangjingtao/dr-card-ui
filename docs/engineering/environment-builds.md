# H5 环境与构建身份

H006 将 `preview → dev → test → prod` 的产品分支语义和 Vite mode、Mock/API 策略、Bridge 模式、构建身份收成显式规则。这里描述的是正式 H5；`main` 仍是 legacy 保留分支，不承担正式生产 H5 的环境语义。

## 环境矩阵

| App env | Vite mode | 默认 data mode | fixture/debug | Bridge 默认 | 运行宿主要求 |
|---|---|---|---|---|---|
| `dev` | `development` | `mock` | 允许 | `disabled` | 不限（浏览器可独立预览） |
| `preview` | `preview` | `mock` | 允许 | `disabled` | 不限（浏览器可独立预览） |
| `test` | `test` | `api` | 禁止 | `native` | 仅原生宿主 |
| `prod` | `production` | `api` | 禁止 | `native` | 仅原生宿主 |

`test/prod` 明确固定为真实 API + Native Bridge：禁止 `VITE_DATA_MODE=mock`，并要求 `VITE_BRIDGE_MODE=native`。`scripts/build-h5.mjs` 在 Vite 启动前 hard fail，`src/app/config/runtime.ts` 在浏览器运行时再校验一次，避免通过错误环境变量静默回退。

## 运行宿主要求（H036）

`test/prod` 只承载真实 API + Native Bridge 集成，因此**不允许浏览器直接打开**。`test/prod` 构建在非原生宿主下不进入应用，而是展示"请在卡博士 App 内打开"提示。

- 判据：`runtimePolicy.requiresNativeHost`（由 `isProdLike` 派生）叠加 `getNativeHost()` 的注入对象探测结果；
- 该判定发生在应用挂载前（`src/main.tsx`），非原生宿主下不启动路由、不发业务请求；
- 它是**运行时探测**，不是构建期配置：同一份 `test` 产物会被浏览器与 App WebView 两种方式打开，构建期无法预知，因此不为它引入任何环境变量；
- `preview` / `dev` 不受影响，继续作为浏览器独立预览与 Mock 载体。

实现位置：

- `src/app/config/runtime.ts`：`requiresNativeHost`；
- `src/pages/UnsupportedHostNotice.tsx`：`isUnsupportedHost()` 判定与提示页；
- `src/main.tsx`：挂载前分流。

## 调试能力口径

- `dev` / `preview`：2026-09-29 Maintainer 明确定案，Eruda 默认初始化，无需 `?debug=1`；这是开发/视觉联调能力，不代表业务 `DebugPanel` 常显。
- 页面业务状态调试 `DebugPanel` 仍严格由 `?debug=1` 显式开启，两者互不替代。
- `test` / `prod`：`runtimePolicy.isProdLike` 直接阻止 Eruda 初始化，正式产物不启用该调试控制台。

## 环境变量

`.env.example` 是非敏感示例。运行时只通过 `src/app/config/runtime.ts` 读取环境变量，页面不得自行解析 `import.meta.env` 来决定业务行为。

- `VITE_APP_ENV`：`preview | dev | test | prod`。正常由构建脚本注入，并必须与 Vite mode 一致。
- `VITE_DATA_MODE`：`mock | api`。不填写时按上表取默认值。
- `VITE_API_BASE_URL`：真实后端根地址。`test` 构建必须提供该值，且必须为绝对 `http(s)` URL；缺失时 `build:test` 直接失败。`preview/dev` 仍可为空；空值绝不表示回退 Mock。`prod` 的正式后端地址由生产发布环境单独配置，不复用 test 地址。
- `VITE_BRIDGE_MODE`：`disabled | mock | native`。默认值按环境确定：`preview/dev = disabled`，`test/prod = native`。`test/prod` 显式覆盖为任何非 `native` 值都会在构建期与运行期失败；这里只表达是否允许调用已确认的 Native 能力，不据此发明宿主协议。
- `VITE_BUILD_SHA` / `VITE_BUILD_ID` / `VITE_SOURCE_BRANCH`：构建身份，通常由构建脚本从 GitHub / Cloudflare / git 上下文注入。

## 构建命令

- `npm run build:dev`
- `npm run build:preview`
- `npm run build:test`
- `npm run build:prod`
- `npm run build:cf`：Cloudflare Pages 正式入口，按 `CF_PAGES_BRANCH` 选择环境。
- `npm run build`：迁移安全入口。本地默认 `prod`；检测到 `CF_PAGES_BRANCH` 时自动使用 Cloudflare 分支映射，防止旧 Pages Dashboard 仍调用 `npm run build` 时把 branch preview 误构建成 prod。

每次成功构建都会生成 `dist/build-meta.json`，只包含非敏感诊断信息：App env、Vite mode、data/bridge mode、是否配置 API base，以及 build SHA / ID / source branch；不会把 API URL复制进该诊断文件。

GitHub Actions 的 `test` gate 从仓库 Actions Variable `VITE_API_BASE_URL` 注入测试后端地址，并要求 `build-meta.json.apiBaseConfigured=true`。该 URL 属于非敏感运行配置；token / salt 等凭证不得以 `VITE_*` 变量保存。Cloudflare Pages 不继承 GitHub Actions Variables，Pages 的 Preview 环境需单独配置同名变量。由于 Pages 的 preview 配置会覆盖所有非 production 分支，`scripts/build-h5.mjs` 只允许 Cloudflare `test` 目标消费这项 API base；Cloudflare `dev` / `preview` / feature 目标会忽略它并继续保持 Mock + current-origin 边界。

## Cloudflare Pages

正式 H5 现在区分两个 Pages 项目：

- `dr-card-ui`：UI preview / 正式 prod 的现有项目；继续按仓库既有 Git 分支映射工作；
- `dr-card-ui-test`：独立 test 环境。只有 `test` 分支 push 且 Test branch gate 通过后，GitHub Actions 才会把已构建的 `dist/` 直接部署到该项目；其生产分支语义固定为 `test`。

`dr-card-ui-test` 的测试后端地址来自 GitHub Actions Variable `VITE_API_BASE_URL`，构建时写入 test bundle；Cloudflare 只托管静态产物，不再要求在 Pages Dashboard 额外维护同一份 test API 地址。部署后 CI 会读取 `https://<test-project>.pages.dev/build-meta.json`，确认 `test + api + native + apiBaseConfigured=true` 且 SHA 与当前 `test` commit 一致。

现有 `dr-card-ui` 项目继续遵循：

- Pages build command：`npm run build:cf`
- 正式 production branch：`prod`
- `prod` → production/prod/API/native
- `dev` → development/dev/Mock/disabled
- `preview` → preview/preview/Mock/disabled
- 其它 feature / PR branch → preview/preview/Mock/disabled
- `main` → hard fail；它是 legacy 保留分支，不允许被误发布为正式 H5 production

Cloudflare 的 Preview 配置作用域不是产品 `preview` 环境本身，不能用来表达独立的 test 运行环境；test 因此使用独立 Pages 项目而不是复用现有项目的 Preview 变量。

## 构建身份排查

preview/dev 可用 `?debug=1` 打开 DebugPanel，面板顶部会显示：

`appEnv/dataMode/bridgeMode · sourceBranch@shortSha · buildId`

任何环境也都可以在代码里读取 `runtimePolicy.build`；部署产物还可以直接查看 `/build-meta.json`。这三者应指向同一构建事实。
