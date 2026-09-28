# H5 环境与构建身份

H006 将 `preview → dev → test → prod` 的产品分支语义和 Vite mode、Mock/API 策略、Bridge 模式、构建身份收成显式规则。这里描述的是正式 H5；`main` 仍是 legacy 保留分支，不承担正式生产 H5 的环境语义。

## 环境矩阵

| App env | Vite mode | 默认 data mode | fixture/debug | Bridge 默认 | 运行宿主要求 |
|---|---|---|---|---|---|
| `dev` | `development` | `mock` | 允许 | `disabled` | 不限（浏览器可独立预览） |
| `preview` | `preview` | `mock` | 允许 | `disabled` | 不限（浏览器可独立预览） |
| `test` | `test` | `api` | 禁止 | `disabled` | 仅原生宿主 |
| `prod` | `production` | `api` | 禁止 | `disabled` | 仅原生宿主 |

`test/prod` 明确禁止 `VITE_DATA_MODE=mock` 与 `VITE_BRIDGE_MODE=mock`。`scripts/build-h5.mjs` 在 Vite 启动前 hard fail，`src/app/config/runtime.ts` 在浏览器运行时再校验一次，避免通过错误环境变量静默回退。

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

## 环境变量

`.env.example` 是非敏感示例。运行时只通过 `src/app/config/runtime.ts` 读取环境变量，页面不得自行解析 `import.meta.env` 来决定业务行为。

- `VITE_APP_ENV`：`preview | dev | test | prod`。正常由构建脚本注入，并必须与 Vite mode 一致。
- `VITE_DATA_MODE`：`mock | api`。不填写时按上表取默认值。
- `VITE_API_BASE_URL`：真实后端根地址。H008 仍 blocked，因此 H006 允许为空；一旦填写必须为绝对 `http(s)` URL。空值表示“后端尚未配置”，绝不表示回退 Mock。
- `VITE_BRIDGE_MODE`：`disabled | mock | native`。默认 `disabled`；这里只建立环境开关，不发明任何 Native 方法。`test/prod` 要真实调用宿主能力（含登录取凭证）时必须为 `native`，否则 `ensureNativeMode` 会以 `bridge-disabled` 失败；`test/prod` 禁止 `mock`。
- `VITE_BUILD_SHA` / `VITE_BUILD_ID` / `VITE_SOURCE_BRANCH`：构建身份，通常由构建脚本从 GitHub / Cloudflare / git 上下文注入。

## 构建命令

- `npm run build:dev`
- `npm run build:preview`
- `npm run build:test`
- `npm run build:prod`
- `npm run build:cf`：Cloudflare Pages 正式入口，按 `CF_PAGES_BRANCH` 选择环境。
- `npm run build`：迁移安全入口。本地默认 `prod`；检测到 `CF_PAGES_BRANCH` 时自动使用 Cloudflare 分支映射，防止旧 Pages Dashboard 仍调用 `npm run build` 时把 branch preview 误构建成 prod。

每次成功构建都会生成 `dist/build-meta.json`，只包含非敏感诊断信息：App env、Vite mode、data/bridge mode、是否配置 API base，以及 build SHA / ID / source branch；不会把 API URL复制进该诊断文件。

## Cloudflare Pages

仓库当前没有 `wrangler.toml` 或可声明 Pages Dashboard build command 的仓库配置，因此仅凭 GitHub 仓库 API不能证明或修改现有 Dashboard 设置。

仓库内的目标规则是：

- Pages build command：`npm run build:cf`
- 正式 production branch：`prod`
- `prod` → production/prod/API
- `test` → test/test/API
- `dev` → development/dev/Mock
- `preview` → preview/preview/Mock
- 其它 feature / PR branch → preview/preview/Mock
- `main` → hard fail；它是 legacy 保留分支，不允许被误发布为正式 H5 production

在 Dashboard 完成切换前，`npm run build` 的 auto 模式提供迁移保护，但它不是最终推荐的 Pages 配置。

## 构建身份排查

preview/dev 可用 `?debug=1` 打开 DebugPanel，面板顶部会显示：

`appEnv/dataMode/bridgeMode · sourceBranch@shortSha · buildId`

任何环境也都可以在代码里读取 `runtimePolicy.build`；部署产物还可以直接查看 `/build-meta.json`。这三者应指向同一构建事实。
