# KBS Web 生产固定入口与历史管理（#169）

设计 #167；四环境构建 #168；Healthcheck 与发布门禁 #170；真实验收 #171。

## 固定路径

```text
oss://kbs-sdl/kbs-web/prod/
  last/                       # 唯一生效入口，basename 始终 /kbs-web/prod/last
    index.html
    build-meta.json
    release-manifest.json
    assets/*
    ...
  history/
    catalog.json               # 极小归档目录清单，不是单独的发布数据库
    r<github-run>-a<attempt>/  # 上一个已验证的版本的完整目录
      index.html
      build-meta.json
      release-manifest.json
      assets/*
```

历史文件夹直接保留静态文件，**不强制 ZIP**，也不是能作为独立 URL 打开的 H5。React Router 的 basename 与 JS/CSS 路径仍是 `/kbs-web/prod/last/`。新版本以 `run-id+attempt` 自动生成不冲突的发布 ID，完整 Git SHA 记入 manifest 和原有 `build-meta.json`。

## #169 核心实现（实际发布由 #170 工作流调用）

- `scripts/oss-prod-release-core.mjs`：对对象存储抽象接口提供 `makeCandidate`、`publish`、`rollback`、`retentionPlan` 和 `pruneHistory`。
- `scripts/oss-prod-store.mjs`：OSS util 2 传输层；只允许访问 `kbs-web/prod/last/` 和 `kbs-web/prod/history/` 的**精确文件 key**。默认只读；#170 的受控 GitHub Actions 作业在实际发布时提供写入能力，无额外业务激活开关。
- `scripts/oss-prod-release.test.mjs`：Node 内建测试，使用内存 OSS 伪实现，模拟成功、异常中断、hash 碰撞、缺损旧文件、历史恢复与第六条归档清理。
- `.github/workflows/oss-prod-history-safety.yml`：无云密钥的 PR/push 纯逻辑回归；额外确认旧 `oss-production.yml` 仍保留并未接入新的 `prod/last` 上传。

## 安全发布调用顺序（供 #170 接入）

1. 构建 `H5_OSS_ARTIFACT=1 OSS_WEB_TARGET=prod npm run build:prod`，验证 `scripts/verify-oss-web-package.mjs prod`，由真实 Git SHA、Run ID、Attempt 和本地 `dist/` 生成 manifest（每个文件的路径/字节数/SHA256）。
2. 读取 `last/release-manifest.json`，若目录里有旧 `index.html` 但缺少 manifest、旧文件 hash 不正确，则 **fail closed**，不伪造回滚起点。首次空目录允许初始化，已有未知来源的旧内容仍会阻断覆盖。
3. 将此前已验证版本的完整静态目录复制到 `history/<release-id>/`，逐文件读回校验；同 ID 内容冲突、部分归档残留都要失败，不能覆盖。更新 `history/catalog.json`；其每条记录包含不可碰撞 release ID、SHA 和该版上线时间。
4. 校验新包静态资源：新 hash 文件逐个上传，旧资源不删除。若新包试图通过原有不带版本的路径覆盖不同内容，**拒绝**，需先将文件名内容寻址/加 hash。
5. CI 对**选定来源分支**的最新 HEAD 进行二次验证；来源可以是 `prod` 自动推送，也可以是人工选择的其他分支。`build-meta.json` 与 `release-manifest.json` 先上传，`index.html` 最后切换。多对象更新不宣称原子事务。
6. **#170 的完整 OSS 字节读回必须通过**，否则失败并恢复上一已知版本。公网 HTTP/HTTPS 检查作为额外验收：尚未配置或不健康时保留成功上传的包供真人验证，但明确显示公网待验收，不清理历史。
7. 公网静态验证通过且 OSS 校验成功后，自动调用 `pruneHistory`；要求当前 last ID 与本次清单相符，超出 5 个历史版本后，按原上线时间删最旧的超额版本，只能删 `history/<id>/` 下清单列出的具体对象，**不可以目录级 rm**。清理采用两阶段可恢复协议：先在 `catalog.json` 中记录 `state=deleting` 与完整待删文件清单并读回，之后才逐文件删除；中途任一写入/删除失败，下一次成功验证的生产清理可以继续执行，直到所有文件删除并从 catalog 移除此条记录。
8. 回滚操作要求管理者明确授权所选的 `from → to` 历史 ID，**先把当前正式版本完整归档到 history**（保证可以再向前恢复），然后还原目标历史静态资产，最后切入口并读回 OSS 校验；公网可用时附加 HTTP 检查，回滚不触发历史删除。

## 缓存与真实访问

- `last/index.html`、发布元数据：`Cache-Control: no-cache, must-revalidate`；
- 带稳定内容 hash 的 `assets/*`：`public, max-age=31536000, immutable`，且文件路径碰撞必须检查；
- 非 hash 静态文件：保守重新校验（no-cache），不同内容不能在相同 key 直接覆盖；
- 被旧 HTML 引用的 JS/CSS 必须继续保留，不能在发布开始时先清空 `last`；
- 公司端的 HTTPS（可选升级）、代理回源、SPA fallback、App WebView 与公开扫码页属于人工验收，不是 OSS 上传前置条件。#169 的内存测试不等于线上 WebView 验收。

## 发布与验收边界（#170 已修订）

- 固定生产目录可由 `prod` push 自动发布，或由 GitHub Actions 手动选择任意来源分支发布；不再要求另外开启 `OSS_PROD_WEB_ENABLED` 或其它人工许可变量。
- 默认使用 `http://kbs.3cgroup.cn/kbs-web/prod/last/`；支持其它配置的 HTTP/HTTPS 站点，但固定 OSS 路径保持不变。没有公网代理映射时，OSS 上传成功与公网待验收必须分别报告。
- 不要求正式 API、邀请站点 Origin、HTTPS 证书全部到位后才允许上传。API/Bridge 的实际业务验收留 #171。
- 当前 `oss-production.yml` 旧版不可变制品流程继续保留，`h5/releases/`、`_ci-smoke/` 和 Cloudflare 不清理。
- 真正上传仍需要 OSS 凭据。若 GitHub Environment 自身配置了分支限制，需管理员调整，该限制不由脚本额外施加。
- #171 负责真实域名、人工 App/WebView、缓存、回滚与历史第六版删除等验收。不能将离线测试当作在线验证。
