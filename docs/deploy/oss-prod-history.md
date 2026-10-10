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

## #169 实现（目前不接真实发布）

- `scripts/oss-prod-release-core.mjs`：对对象存储抽象接口提供 `makeCandidate`、`publish`、`rollback`、`retentionPlan` 和 `pruneHistory`。
- `scripts/oss-prod-store.mjs`：OSS util 2 传输层；只允许访问 `kbs-web/prod/last/` 和 `kbs-web/prod/history/` 的**精确文件 key**。默认只读；生产入口切换和历史删除需 #170 单独显式启用。
- `scripts/oss-prod-release.test.mjs`：Node 内建测试，使用内存 OSS 伪实现，模拟成功、异常中断、hash 碰撞、缺损旧文件、历史恢复与第六条归档清理。
- `.github/workflows/oss-prod-history-safety.yml`：无云密钥的 PR/push 纯逻辑回归；额外确认旧 `oss-production.yml` 仍保留并未接入新的 `prod/last` 上传。

## 安全发布调用顺序（供 #170 接入）

1. 构建 `H5_OSS_ARTIFACT=1 OSS_WEB_TARGET=prod npm run build:prod`，验证 `scripts/verify-oss-web-package.mjs prod`，由真实 Git SHA、Run ID、Attempt 和本地 `dist/` 生成 manifest（每个文件的路径/字节数/SHA256）。
2. 读取 `last/release-manifest.json`，若目录里有旧 `index.html` 但缺少 manifest、旧文件 hash 不正确，则 **fail closed**，不伪造回滚起点。首次空目录发布需显式批准 bootstrap。
3. 将此前已验证版本的完整静态目录复制到 `history/<release-id>/`，逐文件读回校验；同 ID 内容冲突、部分归档残留都要失败，不能覆盖。更新 `history/catalog.json`；其每条记录包含不可碰撞 release ID、SHA 和该版上线时间。
4. 校验新包静态资源：新 hash 文件逐个上传，旧资源不删除。若新包试图通过原有不带版本的路径覆盖不同内容，**拒绝**，需先将文件名内容寻址/加 hash。
5. 由 CI 对 `prod` 分支最新 HEAD 进行二次验证；只有新版本属于最新分支才可切换入口。`build-meta.json` 与 `release-manifest.json` 先上传，`index.html` 最后切换。多对象更新不宣称原子事务。
6. **#170 必须注入真实 Healthcheck**：新版本实际固定入口、静态文件和构建身份验证通过才算发布成功。失败时恢复上一已校验版本的 entry/meta/manifest，不触发历史清理。恢复也失败要记录严重异常并保留一切现场。
7. 按 #171 的验收准入，新的成功发布才可以调用 `pruneHistory`。默认是 `dry-run`；启用删除时要求 Healthcheck 成功证明、当前 last ID 对应；超出 5 个历史版本后，按原上线时间删最旧的超额版本，只能删 `history/<id>/` 下清单列出的具体对象，**不可以目录级 rm**。
8. 回滚操作要求管理者明确授权所选的 `from → to` 历史 ID，先还原静态资产，最后切入口并重新真实健康检查；回滚不触发历史删除。

## 缓存与真实访问

- `last/index.html`、发布元数据：`Cache-Control: no-cache, must-revalidate`；
- 带稳定内容 hash 的 `assets/*`：`public, max-age=31536000, immutable`，且文件路径碰撞必须检查；
- 非 hash 静态文件：保守重新校验（no-cache），不同内容不能在相同 key 直接覆盖；
- 被旧 HTML 引用的 JS/CSS 必须继续保留，不能在发布开始时先清空 `last`；
- 公司端仍需确认 HTTPS、代理回源、SPA fallback、App WebView 与公开扫码页。#169 的内存测试不等于线上 WebView 验收。

## 待 #170 / #171

- **现在不得启用** `OSS_PROD_RELEASE_ENABLED` 或任何生产切换/历史清理；`oss-production.yml` 原版制品上传继续不变，不对 `last/` 产生写入。
- 真实 Healthcheck 协议需先调查并验证，不能靠 `ok: true` 常量冒充；`pruneHistory` 的 attestation 必须由真实流水线赋值，且 `allowDelete` 只能在已批准的生产环境里开启。
- OSS RAM 最小权限、操作串行化/重试幂等、首次发行迁移、失败回滚是否可用、缓存和 CDN，须实际验证后才能放开开关。
- 归档对象的不可覆盖，在 #169 有逻辑上的读后写检查和同一 CI 互斥要求，**不是对象存储层原子条件写**；若启用前要求强不可覆盖，还须确认 OSS 条件写/RAM 权限策略。不要虚称完成。
- `h5/releases/`、`_ci-smoke/`、Cloudflare 继续原状，不由本卡清理。
