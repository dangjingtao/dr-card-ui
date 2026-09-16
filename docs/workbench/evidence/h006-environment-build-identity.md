# H006｜环境配置与构建身份证据

## 结论

H006 已把 H5 的 App 环境、数据源模式、Bridge 模式、API base 与构建身份收成显式、可校验的配置；没有为 H008/H015 伪造真实后端或 Native 协议。

## 配置矩阵

| 场景 | App env | Vite mode | Data mode | Fixture / Debug |
|---|---|---|---|---|
| 本地 dev 默认 | `dev` | `development` | `mock` | 允许 |
| 本地 dev 显式 API | `dev` | `development` | `api` | 禁止 |
| Cloudflare dev | `dev` | `development` | 固定 `mock` | 允许 |
| Cloudflare preview / feature branch | `preview` | `preview` | 固定 `mock` | 允许 |
| test | `test` | `test` | `api` | 禁止 |
| prod | `prod` | `production` | `api` | 禁止 |

`test/prod` 在构建前拒绝 `VITE_DATA_MODE=mock`；同样拒绝 `VITE_BRIDGE_MODE=mock`。运行时 `src/app/config/runtime.ts` 会再次验证环境组合，形成双重防线。

## 实现

- 新增 `.env.example`：只包含非敏感变量说明。
- 新增 `src/vite-env.d.ts`：为 `VITE_APP_ENV`、`VITE_DATA_MODE`、`VITE_API_BASE_URL`、`VITE_BRIDGE_MODE`、build identity 提供类型。
- `src/app/config/runtime.ts` 统一暴露 `runtimePolicy`：环境、data/bridge mode、API base 是否已配置、fixture/debug 能力和 build identity。
- `scripts/build-h5.mjs` 成为显式构建入口：`dev / preview / test / prod / cf / auto`。
- 每个成功 build 写出 `dist/build-meta.json`，包含 App env、Vite mode、data/bridge mode、是否配置 API base、SHA/build ID/source branch；不写 API URL。
- dev/preview 的 DebugPanel 显示 `env/data/bridge · branch@sha · buildId`。
- `npm run build` 是迁移安全入口：本地无 Cloudflare 上下文时按 prod；存在 `CF_PAGES_BRANCH` 时按 Pages 分支规则解析，避免旧 Dashboard 仍调用 `npm run build` 时把 branch preview 误构建成 prod。
- 正式推荐的 Pages 构建入口是 `npm run build:cf`。

## 未伪造的能力

- `VITE_API_BASE_URL` 当前允许为空，因为 H008 的真实 backend base URL / auth / envelope 尚未确认。空值只表示 backend 未配置，绝不触发 Mock fallback。
- `VITE_BRIDGE_MODE` 默认 `disabled`。H015 协议未提供，本卡只建立 mode，不实现任何 Native 方法。
- 商城未纳入本卡施工。

## Cloudflare 边界

仓库中没有 `wrangler.toml` 或其他可声明 Git-integrated Pages Dashboard build command 的配置文件，因此 GitHub 侧无法读取或修改 Dashboard 中当前保存的命令文本。

仓库明确要求最终 Pages 配置为：

- production branch：`prod`
- build command：`npm run build:cf`
- `prod → prod/API`
- `test → test/API`
- `dev → dev/Mock`
- `preview → preview/Mock`
- 其他 feature / PR branch → preview/Mock
- `main` hard fail，因为它是 legacy 保留分支

迁移期间 `npm run build` 的 auto 逻辑提供保护。Cloudflare bot 已成功部署包含最新构建脚本的 head `5db2fcdc41fd99e864a360322c18d46fef47fe1c`；但“Dashboard 文本已经改成 build:cf”不能由 GitHub API 证明，因此不作该断言。

## CI 证据

GitHub Actions Build run：`35051522249`

最终工程 head：`eef6976278bc237659e91680abcac500dd5d4820`

全部通过：

- Static hygiene
- Typecheck
- development server smoke
- dev build + build identity
- local dev 显式 API dry-run
- Cloudflare feature → preview/Mock 映射
- Cloudflare auto fallback → preview/Mock 映射
- Cloudflare dev + API 非法组合拒绝
- Cloudflare main 非法目标拒绝
- Cloudflare preview build + SHA identity
- test build + API identity
- test API Mock 拒绝
- prod Bridge Mock 拒绝
- prod build + SHA identity
- SPA fallback
- production preview smoke
- `/build-meta.json` 可由 preview server 提供

## 当前结论

H006 已满足进入 Agent Review 的工程条件。剩余需要 reviewer 关注的是：环境矩阵是否存在语义漏洞、Cloudflare auto 迁移保护是否可能误判分支，以及运行时与构建前校验是否存在不一致。