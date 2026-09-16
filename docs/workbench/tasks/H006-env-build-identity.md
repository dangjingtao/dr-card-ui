# H006｜环境配置与构建身份

**Status:** Agent Review  
**Phase:** Foundation  
**Depends on:** H001

## 目标

把 dev/test/prod、API/Mock、Bridge 模式与 H5 构建身份变成显式、可校验的配置。

## 范围

- 增加 `.env.example`，只放非敏感示例项。
- 统一读取 `APP_ENV`、`DATA_MODE`、Bridge 模式、API base URL 等配置。
- test/prod 明确禁止 API Mock 回退。
- 构建中暴露可诊断的 commit SHA / build 标识，不泄露秘密。
- 对非法环境组合尽早失败。

## 不做

- 不写真实 token / secret。
- 不把 Git branch 名直接当页面数据源开关；分支只由构建入口解析为明确 App env。
- 不引入 PWA。
- 不伪造 H008 的真实 API base/auth/envelope。
- 不伪造 H015 的 Native JSBridge 方法。

## 实现结果

- 新增 `.env.example` 与 `src/vite-env.d.ts`，环境变量有明确类型与说明。
- `src/app/config/runtime.ts` 已成为运行时单一配置入口，统一暴露 App env、data mode、Bridge mode、API base、fixture/debug 能力与 build identity。
- 新增 `scripts/build-h5.mjs`，提供 `auto/dev/preview/test/prod/cf` 显式构建目标。
- 本地 dev 默认 Mock，也可显式切 API；Cloudflare dev/preview/feature 分支固定 Mock。
- test/prod 固定 API 语义，API Mock 与 Bridge Mock 非法组合在构建前 hard fail，运行时再校验一次。
- `VITE_API_BASE_URL` 未确认时允许为空；空值表示后端未配置，不会触发 Mock fallback。
- Bridge 默认 `disabled`，等待 H015 真实协议。
- 每次构建生成 `dist/build-meta.json`；dev/preview DebugPanel 同时显示环境、branch、SHA 与 build ID。
- `npm run build:cf` 是 Pages 推荐入口；`npm run build` 在迁移期会检测 Cloudflare 上下文并使用同一 branch mapping，避免旧 Dashboard 命令把 branch preview 误构建为 prod。
- `main` 仍是 legacy 保留分支，Cloudflare formal-H5 构建会 hard fail，不把它误当生产。

## 验收

- 本地 dev 可明确选择 Mock/API；CF dev/preview 固定 Mock；test/prod 只能 API。
- 构建产物可定位到 commit/build 身份。
- `.env.example` 足以让新环境知道需要哪些非敏感变量。
- 错误环境组合不会静默回退。

## 证据

详见 [`../evidence/h006-environment-build-identity.md`](../evidence/h006-environment-build-identity.md)。

最终工程 head `eef6976278bc237659e91680abcac500dd5d4820` 的 Build run `35051522249` 全绿，覆盖 dev / Cloudflare preview / test / prod、build identity、非法 Mock 拒绝与 production smoke。

Cloudflare bot 已成功部署包含最新构建脚本的 `5db2fcdc41fd99e864a360322c18d46fef47fe1c`。仓库无法读取 Pages Dashboard 当前保存的 build command 文本，因此只确认“仓库入口与部署能力可用”，不声称 Dashboard 已经手工改成 `npm run build:cf`。

当前状态为 `Agent Review`；待 AI reviewer 对最终 head 复核环境矩阵与 build wrapper。