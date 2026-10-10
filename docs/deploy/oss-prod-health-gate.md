# #170 · 生产健康门禁与现有 OSS 连接检查复用

设计 #167 → 固定路径 #168 → last/history #169 → 本卡 #170 → 线上验收 #171。

## 已有能力调查（2026-10-10）

仓库现有 `.github/workflows/oss-connection-smoke.yml`，对应 **OSS Connection Smoke**：
- 触发条件仅为 `prod` 分支上该 workflow 文件发生变化；不是每次 H5 发布自动执行。
- 使用 `oss-production` 环境中的 OSS 密钥和经 SHA256 校验的 ossutil v2.4.0；向隔离的 `h5/releases/_ci-smoke/<run>.<attempt>/proof.txt` 写入一个校验对象，然后 `stat`、远程读回与本地逐字节比较。
- **能证明 OSS 连接/写入/读回，不能证明生产网站 HTTP、JS/CSS、React Router、后台 API 或 App WebView 健康。**
- 仓库中未发现第二个可直接复用的公网 HTTP Healthcheck URL、签名方式或响应契约。如果公司运维另有服务端 Healthcheck，需要提供正式调用协议再接入；这里不臆造 API 返回。

因此本刀**不重建连接测试服务**：保留原连接 Smoke 工作流、继续使用同一 ossutil + OSS 实际对象读回校验机制；仅用 `scripts/oss-prod-healthcheck.mjs` 给固定生产 URL 增加缺失的静态页面验证。

## 发布时必须验证

新固定入口只允许 `https://kbs.3cgroup.cn/kbs-web/prod/last/`（不是旧 HTTP，不能跳转至外站或相邻环境）。

**校验顺序：**
1. #169 `makeCandidate` 验证 `prod` 构建、真实 SHA、Run+Attempt 身份；新包的静态文件先上传并远程读回，已有成功版完整保存进 `history/<id>/`。
2. 最后切换固定的 `index.html`；在公司真实 HTTPS 地址用 `GET`（`cache: no-store` + 防缓存查询参数，禁止重定向）读取入口与版本元数据。
3. 校验 `index.html`、`build-meta.json` 与 `release-manifest.json`，要求生产 API+Native 模式、实际 SHA/构建编号/发布 ID 都一致，并验证 HTML/元数据 `Cache-Control` 不长期缓存。
4. 从**当前 HTML** 提取 JS/CSS URL，只允许 `/kbs-web/prod/last/assets/` 同源资产；分别 GET 并检查真实 Content-Type、长度和清单中的 SHA256。返回 404、错误 MIME、旧版、错误缓存或读取失败，均不得宣称成功。
5. 验证失败：#169 自动恢复原先已成功版本的元数据/入口，并**再次从公司网站检查回滚版本**；恢复或复验失败必须显式报严重错误，绝不自动删除历史。
6. 验证成功：再次 OSS 读回 `last/index.html` 对比 SHA256。只有公司真实 URL 与 OSS 读回**双重成功**，才可生成正式清理证明；清理超过 5 个已成功历史版本最旧项。历史清理失败时保留已验证可用的新入口，报出清理失败，禁止把它描述为发布回滚。

**未覆盖的能力**：App WebView/JSBridge、登录、扫码、设备和真实业务 API；需要 #171 真机与真实后台人工验收。

## 默认关闭，运维批准后才放开

`.github/workflows/oss-prod-health-gate.yml` 的 PR/普通分支仅执行无密钥离线测试；真实发布作业必须同时满足：

- `prod` 分支 push（或由明确批准的手工 `workflow_dispatch` 回滚），且 `oss-production` 环境准入通过；
- 仓库 Variables：`OSS_PROD_WEB_ENABLED=true` 与 `OSS_PROD_HEALTHCHECK_CONFIRMED=true`；**当前不设置/不启用**；
- OSS 环境 Secret：现有 `OSS_ACCESS_KEY_ID`、`OSS_ACCESS_KEY_SECRET`；必须核实其最小范围权限与环境分支限制；
- OSS 环境 Variable：`OSS_PROD_WEB_BASE_URL=https://kbs.3cgroup.cn/kbs-web/prod/last/`；公司必须先部署可信 HTTPS 证书、反代映射、SPA fallback、正确 Cache-Control/MIME；
- OSS 环境 Variables：`OSS_PROD_API_BASE_URL` 必须为正式稳定的 HTTPS API，`OSS_PROD_PUBLIC_ORIGIN` 必须是真实 HTTPS 邀请公开站，**不得继续使用开发隧道或私有 OSS 默认域名**；
- `OSS_PROD_BOOTSTRAP_APPROVED=true`：只在明确批准全新空的 `last/` 首次引导时临时设置；如果旧入口存在但缺少正确清单则阻断，不伪造历史版本；
- `OSS_PROD_PRUNE_ENABLED=true`：默认关闭；#171 实际发布/回滚/第 6 个历史清理验收和授权后才设置。关闭时只输出 dry-run 清理计划；
- `OSS_PROD_ROLLBACK_ENABLED=true`：仅已批准的人工恢复场景启用。必须输入两次匹配的合法归档 Release ID，受 GitHub Environment 保护，不允许正常 push 自动回滚至任意历史。

CI 的发布互斥组为 `oss-prod-last-and-history`；过期 SHA 不能切换当前入口。保留旧 `oss-production.yml` 的 `h5/releases/` 证据上传、Cloudflare 和旧 OSS 目录，不做清理与迁移。

## 现实阻塞与验收责任

- 当前已验证的公司 H5 URL 是 **HTTP**；并未取得公司生产 HTTPS 已开通的证据。
- 旧 OSS 构建配置历史上使用 `https://tunnel-dev.3cgroup.cn`，这不能当成正式生产 API。
- 有现成的 **OSS 连接健康检查**，但仓库没有已确认的“站点自身健康检查”接口，本卡补的是最小生产 H5 GET+字节身份校验，并非公司侧另建服务。
- 新 `prod/last` 目前**没有通过真实域名运行的验收证据**。代码、离线测试或 Actions 流程存在，不代表生产已上线。
- #171 必须记录真实 HTTPS 响应、OSS 读回、正确 MIME/缓存、失败注入后的回滚和是否删除超额历史；缺少公司运维交接则 #170 保持 Open。

