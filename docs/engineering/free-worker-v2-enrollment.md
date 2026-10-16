# 卡博士 Web · 三创免费 Worker V2 接入审查

状态：**接入 PR 待审查；默认禁用**。本文件仅记录仓库级接入，不批准执行任何 Issue。

## 分支与现有工作流

- 此仓库 GitHub 默认分支为 `main`，仅用于登记 Actions 手动运行入口；**实际 H5 工程基线是 `dev`**，正式晋级遵循 `preview → dev → test → prod`。不得向 `main` 投交付 PR，也不得自动推进 `test/prod`。
- 新入口 `.github/workflows/sanchuang-free-worker.yml` 与历史 `.github/workflows/sanchuang-opencode-worker.yml` **并存**，保留旧版，不自动切换，不对同一个 Issue 并行触发两套 Worker。
- 新入口 pin 到组织安全加固版 `985ff50c297b844af65a920bd38f9c0b1ae31098`，保留两款官方免费模型 `mimo-v2.6-flash-free` / `deepseek-v4.1-flash-free`，无付费自动回退、无新 PAT。
- 仓库级 `ENROLLED=false`：**即使本接入 PR 意外合并，也不能派工**。不得为通过检查而弱化此保护。

## 实际检查及当前阻塞

- `dev` 当前已有真实的 `npm run lint`、`npm run typecheck`、`npm test`、`npm run build:dev`，Worker 独立验证作业使用 `npm ci --no-audit --no-fund` 先安装依赖，然后逐项执行。它们是与本项目 `build.yml` 同源的真实质量检查；浏览器 E2E、App WebView/JSBridge 验收仍属 PR 后续独立关卡。
- **接入阻塞：**`dev` 中保留了仅含 `"$schema"` 的 `opencode.json`。组织 V2 受信 Skill 装载步骤明确拒绝仓库级 OpenCode 配置，不能通过“允许配置覆盖”绕过。必须先单独审查并处理该文件（按既有契约不影响业务配置），再启用 Worker；本接入 PR 不擅自删除或改写 `dev` 内容。
- 将来启用需另一个经过审查的提交，把 `ENROLLED` 设成 `true`；同时核查 GitHub Actions 创建 PR 权限（默认 Token 保持 Read）、工程分支状态和真实低风险 Issue 授权。只允许 `feat/worker-* → dev` Draft PR。

## 派工、交付与权限

仅接受维护者针对一个仍 Open 的 Issue 的明确授权，手动选择工作流与免费模型。仓库级审批不等于 Issue 授权；不自动重试、不偷换模型、不关闭 Issue、不合并、不发布。执行器以独立只读 Worker → 验证 Runner → 隔离写权限 Delivery Runner 交付 Draft PR。

在默认分支登记的入口绝不定义 `push`、`pull_request` 等自动触发，也不修改发布工作流。GitHub 连接器不支持手动派工时，应使用 GitHub Actions UI，不能默认进入用户电脑执行 `gh`。
