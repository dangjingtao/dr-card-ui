# #170 · KBS Web 生产固定目录发布（修订：取消擅自设置的前置条件）

设计 #167 → 构建 #168 → last/history #169 → 发布流程 #170 → 人工端到端验收 #171。

## 这次纠正了什么

以下项目**不再是向 `kbs-web/prod/last/` 上传的前置条件**：

- ❌ 必须从 `prod` 分支发布。现在 `prod` push 可以自动发布，或通过工作流 **Run workflow → publish** 明确选择需要验证的任意分支。
- ❌ 必须设置 `OSS_PROD_WEB_ENABLED`、`OSS_PROD_HEALTHCHECK_CONFIRMED` 或其它额外激活开关。
- ❌ 必须预先开通 HTTPS；当前可使用 `http://kbs.3cgroup.cn/kbs-web/prod/last/`，将来具备 HTTPS 时可替换。
- ❌ 必须事先配置所谓「正式生产 API」与邀请 Origin。构建可使用现有 API 地址（包括开发隧道），也可先留空以便交付静态包、做人工验证。**静态包能打开不代表接口业务可用**。
- ❌ 必须事先配置 `OSS_PROD_BOOTSTRAP_APPROVED` 才能首次发布：空的 last 自动初始化。若 last 有未知旧文件、缺失清单，则必须明确处理数据而不能覆盖。

## 发布入口

GitHub Actions → **OSS Production Health Gate**：

- `prod` 分支 push：正常构建并发布固定 `last/`。
- 手动 `workflow_dispatch` 选择一个分支，再选择 `publish`：从所选分支构建一份 prod 模式的 H5 到同一固定 `last/`，用于真人验证。**选择来源分支不影响固定目录**。
- 手动选择 `rollback`：填入完全一致的历史发布 ID 两次，恢复指定成功归档。回滚时先保护当前版本，且不做历史清理。

`oss-production` GitHub Environment 仍用于提供**实际必需的 OSS 读写密钥**，以及 OSS 凭据的权限隔离；如果已有 Environment 自己限制分支，需要仓库管理员同步调整，否则 GitHub 仍可能阻断手动发布。这属于现有平台权限设置，不是代码的四项限制。

Web 预览默认访问目标：`http://kbs.3cgroup.cn/kbs-web/prod/last/`。可用 GitHub Variable `OSS_PROD_WEB_BASE_URL` 修改成其它 HTTP/HTTPS 域名，只要路径仍为 `/kbs-web/prod/last/`。**URL 能否访问由公司 Nginx/OSS 代理事实决定，工作流不会虚称已配置。**

## 执行与证据

1. 构建 `OSS_WEB_TARGET=prod H5_OSS_ARTIFACT=1`，强制非 Mock 的 prod API/Native 运行模式；若业务 API/邀请域名暂时没配齐，只记录为业务待验收，不阻止打包。必须验证构建身份与资源路径。
2. 按 #169 检查旧 last 的 manifest/资源完整性，归档已存在的受管理版本到 `history/<run-attempt>/`，上传新静态文件并**最后切换 index.html**。保存旧 JS/CSS，避免缓存中的用户白屏。
3. 按现有 **OSS Connection Smoke** 的方式做 OSS 远程对象逐字节读回，至少覆盖 manifest 列出的所有文件。**OSS 读回失败时发布失败并恢复上一已知版本**。
4. 尝试从配置的 HTTP/HTTPS 站点读取 index、metadata、manifest 及 JS/CSS、校验 HTTP status / MIME / 内容身份 / Cache-Control。**若网站还没有配置、校验失败：记录为「公网待验收」，但不撤销已经完整验证的 OSS 上传**，方便真人使用实际新版本排查。
5. **只有公网也验证成功**，才允许按成功发布后的保留规则清理 `history/` 超过 5 个的最老历史版本。页面不通、接口未验收或发生回滚时零历史删除。
6. `Cloudflare` 旧构建、`h5/releases/` 历史版本、`_ci-smoke` 不由该工作流清理。历史删除仍限制为 #169 清单中的精确文件，不能删除 OSS 根目录或 last。

## 复用已有 Healthcheck 的真实边界

现有 `.github/workflows/oss-connection-smoke.yml` 是 OSS 写入、stat 和远端读回测试，并没有“公司网站健康检查”接口。新方案只在发布后尝试附加公网 H5 GET 验证，不新建监控平台。

**#171 真人验收还要核对**：公司代理 URL、SPA 路由刷新、API 请求、原生桥接、缓存、受管理 last 的回滚以及实际保留 5 版。这些是上线评估，不是打包/上传门槛。

**注意**：本文件仅描述 CI 方案，不等于真实公司 OSS 已重新部署。以 GitHub Actions 成功结果和真实域名访问作为证据。
