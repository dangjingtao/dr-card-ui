# H019｜测试报告与 Cloudflare Pages 证据站

**Status:** Accepted  
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
- 独立 Cloudflare 发布有硬保护：目标项目为 `dr-card-ui` 时拒绝发布，避免污染正式 H5 Pages 项目。
- PR #32 `H019: auto-provision isolated evidence Pages project` 已合入 `dev`。
- merge commit：`86ed7b01aa0ad6733eb5bf50e0c5b9b9828732f6`。
- `CF_TEST_EVIDENCE_PROJECT` 现在是可选覆盖；未配置时默认使用独立项目 `dr-card-ui-test-evidence`。
- CI 会先查询独立 Pages 项目；仅在 404 时创建，已有项目直接复用；Cloudflare 建站或发布失败不会抹掉 GitHub evidence。
- Build #438（run `35208549812`）：success；formal-H5 回归、H019 evidence assembler、test/prod 构建等均通过。
- OpenCode Review #158：success，最终结论 `no blocking findings`；前序 concurrency、commit index、early-failure history truncation 等问题均已修复。
- PR #32 Build #443：success；OpenCode Review #159 在合并时仍停留于外部模型 review 步骤，未形成最终 review 结论；该补丁随后通过真实 `dev → test` gate 完成运行时验证。

## 真实 `dev → test` 证据

### 第一轮：GitHub evidence 链验证

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
- cumulative ZIP 已人工复验，包含 `/latest/`、`/commits/<sha>/`、root index、机器 JSON 与 Playwright HTML。
- `summary.json` 正确记录 `appEnvironment=test`、`dataMode=api`、`bridgeMode=disabled`、Playwright 4 passed，并明确声明 H015 Native Bridge 未验证。

### 第二轮：累计历史 + 独立 Cloudflare Pages 实发验证

验证 PR #33 仅用于触发最终真实 Test branch gate，已关闭且未合并。

GitHub Actions run：`35210266910`。

- Test branch gate：success。
- test bundle identity：`test + api`。
- Mock Service Worker 泄漏检查：通过。
- production-like Playwright gate：4/4 passed。
- previous cumulative evidence restore：success。
- 当前快照追加成功，未丢失第一轮历史。
- raw artifact：`h019-test-evidence-aa1f3c15601eeb59a078fb9525ee53a9f3b8037e`，Artifact ID `10492045151`，SHA-256 `275f94e1b690a3468943bdcf048d287bc907eb7f2e264ee2d35d12b32a821cb9`。
- cumulative artifact：`h019-evidence-site`，Artifact ID `10491736542`，SHA-256 `d36ec36f05d398a87f59d6f94bd96cbec957cec7e532af4903f2316ce2800727`。
- cumulative ZIP 已人工复验：第一轮 `4336d25a...` 与第二轮 `aa1f3c15...` 两个 commit 目录同时存在，均含 HTML、JSON 与 Playwright report；`/latest/` 正确指向第二轮。
- CI 自动创建独立 Cloudflare Pages 项目：`dr-card-ui-test-evidence`。
- 独立 Pages 发布：success。
- Wrangler 实际部署 URL：`https://8af5feac.dr-card-ui-test-evidence.pages.dev`。
- 正式 `dr-card-ui` Pages 项目未被用于 H019 evidence 发布。
- Actions Summary 最终记录：restore success、config ready、project ensure success、deploy success。

## 验收结论

H019 已满足本卡三条工程验收条件，并于 2026-09-17 经用户明确验收，状态标记为 `Accepted`。

Evidence 页面与 CI 仍明确声明：Browser CI evidence 不是 App WebView、真实 API 业务或 Native JSBridge 验收。H008 / H015 的阻塞状态不因 H019 完成而改变。
