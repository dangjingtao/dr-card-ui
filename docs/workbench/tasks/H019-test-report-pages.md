# H019｜测试报告与 Cloudflare Pages 证据站

**Status:** Blocked  
**Phase:** Delivery  
**Depends on:** H018

## 目标

让每次 test CI 的结果既有机器原始证据，又有人能快速阅读和追溯的独立报告页面。

## 范围

- GitHub Actions Summary 输出 concise 状态与报告入口。
- 生成机器 JSON、Playwright HTML，以及失败时必要 screenshot/trace/video。
- 独立 Cloudflare Pages 报告站，不部署进生产 H5 Pages 项目。
- 支持 `/latest/` 与 `/commits/<sha>/`，后者保持 commit 级可追溯。
- GitHub Artifact 继续作为原始证据备份。
- 报告记录 SHA、branch、env、API mode、Bridge 验证状态、测试汇总与失败用例。

## 不做

- 不引入 Allure 等重量平台，除非后续真实需要。
- 不在报告中暴露 token、API key、凭据或敏感真实用户数据。

## 验收

- 一次 test CI 可产出可读报告 + 原始 artifact，并能按 commit 定位。
- 报告站与生产 H5 完全隔离。
- CF 发布失败时原始 GitHub evidence 仍然存在。

## 已落地

- PR #30 `H019: publish durable test evidence and Pages report` 已合入 `dev`。
- merge commit：`e107df52dcc9fcb81ca52a3373e6200ec44150c8`。
- 报告生成器：`scripts/build-test-evidence.mjs`，生成 `/latest/`、`/commits/<sha>/`、可读 HTML、机器 JSON、Playwright HTML 与 Actions Summary。
- test gate 会上传：
  - `h019-test-evidence-<sha>`：原始 Playwright / build metadata；
  - `h019-evidence-site`：累计 evidence site。
- 累计证据更新已串行化；恢复时明确选择最新未过期 artifact；restore 不是 success 时不会覆盖最后一份好历史，也不会发布 Cloudflare。
- 独立 Cloudflare 发布有硬保护：`CF_TEST_EVIDENCE_PROJECT=dr-card-ui` 时拒绝发布，避免污染正式 H5 Pages 项目。
- Build #438（run `35208549812`）：success；formal-H5 回归、H019 evidence assembler、test/prod 构建等均通过。
- OpenCode Review #158：success，最终结论 `no blocking findings`；前序 concurrency、commit index、early-failure history truncation 等问题均已修复。

## 真实 `dev → test` 证据

验证 PR #31 仅用于触发真实 Test branch gate，已关闭且未合并。

GitHub Actions run：`35208999427`。

- Test branch gate：success。
- test bundle identity：`test + api`。
- Mock Service Worker 泄漏检查：通过。
- production-like Playwright gate：4/4 passed，0 unexpected，0 flaky，0 skipped。
- 首次 cumulative restore：success；仓库无旧 H019 evidence artifact 时正确以新历史启动。
- Actions Summary：生成成功。
- raw artifact：`h019-test-evidence-4336d25ae935855e270b3b2efbb76928f3a75b0f`，Artifact ID `10491287874`，SHA-256 `633a4693691e20fa36529c76037b1e9574ff08f8699805d2ac25b1d0acb160d9`。
- cumulative artifact：`h019-evidence-site`，Artifact ID `10491447229`，SHA-256 `e18b98d1c36a4f64dc431da2e67bf273a7f20b075c50ff142d4410d76ea4e706`。
- cumulative ZIP 已人工复验，包含：
  - `/latest/index.html`、`summary.json`、`results.json`、Playwright HTML；
  - `/commits/4336d25ae935855e270b3b2efbb76928f3a75b0f/` 下同套 commit 级证据；
  - root index 与 `summary.md`。
- `summary.json` 正确记录 `appEnvironment=test`、`dataMode=api`、`bridgeMode=disabled`、Playwright 4 passed，并明确声明 H015 Native Bridge 未验证。

## 当前阻塞

独立 Cloudflare evidence Pages 尚未实际发布。

真实 test gate 显示：

- `CLOUDFLARE_API_TOKEN`：已配置；
- `CLOUDFLARE_ACCOUNT_ID`：已配置；
- `CF_TEST_EVIDENCE_PROJECT`：**未配置**；
- 因此 `Publish independent H019 evidence Pages` 被正确跳过，且没有退而发布到正式 `dr-card-ui` 项目。

### 解阻条件

1. 创建或指定一个独立 Cloudflare Pages 项目，例如专用于 H019 evidence；
2. 在 GitHub Repository Variable 中设置 `CF_TEST_EVIDENCE_PROJECT=<独立项目名>`；
3. 可选设置 `CF_TEST_EVIDENCE_BRANCH`，未设置时使用 `main`；
4. 再跑一次真实 `dev → test` gate，确认独立 Pages 发布成功并验证 `/latest/` 与 `/commits/<sha>/` 可访问。

在独立 Cloudflare evidence site 实际发布前，不把 H019 标记为 `Accepted`。
