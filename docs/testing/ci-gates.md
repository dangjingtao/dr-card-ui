# 卡博士 H5 CI 门禁

本文记录当前已经落地的 GitHub Actions 检查，以及 `test` 分支进入真实 App 验收前由 CI 自动完成的门禁。

> 说明：CI 负责自动化工程与浏览器层验证，不能替代真实 App WebView、Native JSBridge、软键盘、安全区、系统返回、宿主生命周期和真机兼容性验收。

## 1. 通用 Build 门禁

`.github/workflows/build.yml` 对 `preview`、`dev`、`test`、`prod`、`main` 的 push / pull request 运行基础 Build job。

当前包括：

1. Node 20；
2. `npm ci --no-audit --no-fund`；
3. TypeScript typecheck；
4. Vite development server smoke；
5. development bundle 构建；
6. production bundle 构建；
7. Cloudflare SPA fallback `_redirects` 检查；
8. production preview smoke，并检查 `/` 与 `/profile` 可访问。

这些检查证明工程至少可以安装、类型检查、构建并以基础路由运行，不代表业务或 App 集成已经验收。

## 2. `test` 专属 CI 门禁

当发生以下任一情况时，额外运行 `Test branch gate`：

- push 到 `test`；
- Pull Request 的目标分支是 `test`。

### 2.1 固定 test 环境语义

CI 显式设置：

```text
VITE_APP_ENV=test
VITE_DATA_MODE=api
```

并先执行环境策略检查：

```text
APP_ENV 必须为 test
DATA_MODE 必须为 api
DATA_MODE 不得为 mock
```

这是 `test` 分支的硬门禁。

当前 MSW 尚未正式接入工程，因此该检查首先锁定环境契约；MSW 落地后仍沿用同一规则。

### 2.2 Test bundle

`package.json` 已提供：

```text
npm run build:test
```

其行为为：

1. typecheck；
2. 图片资源校验；
3. `vite build --mode test`。

CI 中的 `VITE_*` 环境变量由 GitHub Actions 固定提供，避免把本地开发的 Mock 选择带进 `test` 构建。

### 2.3 Mock Service Worker 产物保护

Test bundle 构建完成后检查 `dist/`：

```text
不得出现 mockServiceWorker.js
```

如果发现该文件，`Test branch gate` 立即失败。

该检查的目标不是禁止仓库存在 Mock 开发代码，而是禁止 `test` 发布产物带入可启动的 MSW Service Worker 资产。

## 3. 浏览器回归门禁

当前仓库已有 Playwright 依赖和 `scripts/verify-t015.mjs` 回归脚本。

`test` CI 会：

1. 安装 Playwright Chromium；
2. 启动刚刚生成的 test bundle；
3. 以 `375 × 812` 移动端视口运行 60 个路由节点回归；
4. 检查关键标志文案；
5. 检查是否误入 404；
6. 检查坏图；
7. 检查重复状态栏 / 标题栏 / Tabbar；
8. 检查明显横向溢出；
9. 检查浏览器 console / page error；
10. 检查关闭节点是否意外重新进入路由表。

任何失败都会使 `Test branch gate` 失败。

这套回归是当前可复用的浏览器基础验收，不等同于后续正式业务 E2E 的最终形态。新业务接入真实 API 后，应逐步增加面向业务语义的稳定 E2E，而不是无限扩张历史 UI 验收脚本。

### 3.1 Native 参考 / legacy 路由不属于 H5 业务验收范围

当前 H5 团队原则上不施工、不重构、不验收主要提供给 Native 同事参考的 legacy 路由树及其关联页面。

当前明确包括：

```text
/legacy-home*
/legacy-service*
/legacy-profile*
```

以及虽然路径本身不含 `legacy`，但路由归属明确属于上述 Native 参考链路的页面，例如当前：

```text
/device/*
/vending/*
```

CI / E2E 的范围判断以 **路由归属与产品职责** 为准，不通过简单字符串匹配 `legacy` 决定。

因此：

- 这些页面不作为 H5 `test` 业务通过标准；
- 不因为这些参考页缺少 H5 API、Mock、路由动画或业务 E2E 就阻断 H5 发布；
- 共享代码若导致正式 H5 无法构建或运行，仍属于工程级阻断，需要做最小必要修复；
- 如果某个页面未来正式转交 H5 负责，必须先明确转正，再把它加入正常测试矩阵与 CI 门禁。

当前 `scripts/verify-t015.mjs` 的 60 节点回归并未把上述 Native 参考页面作为业务验收节点，这与当前工作范围一致。

## 4. CI 证据

浏览器回归结果会输出：

```text
docs/workbench/evidence/t015-results.json
```

GitHub Actions 无论成功还是失败，都尝试上传该文件为 artifact：

```text
test-browser-regression-<commit-sha>
```

当前保留 14 天。

其用途是定位失败节点、页面路径和具体问题，不代替正式 App 发布验收记录。

## 5. CI 通过后还必须人工 / 真机验证的内容

以下项目不能因为 GitHub Actions 变绿而标记为通过：

- Android / iOS 真实 App WebView；
- Native JSBridge 是否真正注入；
- Bridge 参数、回调、取消、超时和旧版本兼容；
- 系统返回键 / App 返回行为；
- 软键盘顶起、遮挡和恢复；
- 顶部 / 底部安全区；
- WebView 与 Native 页面切换；
- App 前后台生命周期；
- App 自身 H5 缓存与版本更新；
- 真实 API 的完整业务验收；
- 支付、充值、核销等有副作用业务的最终结果确认。

因此 `test → prod` 的关系仍是：

```text
CI PASS
  ↓
获得进入 App / 真机验收的资格
  ↓
App WebView + Real API + Native Bridge 验收
  ↓
记录发布证据
  ↓
test → prod
```

## 6. 后续已确定但尚未落地的 CI 能力

以下能力已经在测试方案中确定方向，但当前仓库还没有对应依赖或稳定契约，因此本次没有伪造实现：

- Vitest；
- React Testing Library；
- Zod schema / API contract 自动测试；
- Zustand / storage adapter / service 单元测试；
- 正式业务 Playwright spec；
- 部署到 Cloudflare `test` 后的 post-deploy smoke；
- 对真实测试 API 的 contract / smoke；
- bundle size regression；
- 独立 Android / iOS 真机自动化。

这些能力应随真实 service、Mock、Bridge 和后端契约落地逐步加入，而不是先写一套空跑 CI。
