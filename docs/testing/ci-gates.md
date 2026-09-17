# 卡博士 H5 CI 门禁

本文记录当前已经落地的 GitHub Actions 检查，以及 `test` 分支进入真实 App 验收前由 CI 自动完成的门禁。

> CI 负责自动化工程与浏览器层验证，不能替代真实 App WebView、Native JSBridge、软键盘、安全区、系统返回、宿主生命周期和真机兼容性验收。

## 1. 通用 Build 门禁

`.github/workflows/build.yml` 对 `preview`、`dev`、`test`、`prod`、`main` 的 push / pull request 运行基础 Build job。

当前包括：

1. Node 20 + `npm ci`；
2. 静态卫生检查与 TypeScript typecheck；
3. Vitest / React Testing Library 单元与组件测试；
4. H007–H015 已落地基础能力的 retained verify；
5. development / preview / test / prod 构建身份与 Mock 泄漏检查；
6. Cloudflare branch-to-mode policy；
7. SPA fallback 与基础 preview smoke；
8. H018 Playwright formal-H5 浏览器回归。

这些检查证明工程可以安装、类型检查、测试、构建，并在浏览器层维持正式 H5 基础质量；不代表真实 App 或业务已经验收。

## 2. H018 formal-H5 Playwright 基线

### 2.1 路由范围事实源

正式 H5 浏览器回归直接消费：

```ts
ACTIVE_FORMAL_H5_ROUTES
```

该集合来自 `src/app/router/routeScope.ts`，因此 CI 不再维护另一份“60 节点”手工名单。

范围规则：

- active formal-H5：进入通用 route smoke；
- Native reference：不进入 H5 业务 gate；
- deferred formal-H5：当前商城 `/mall*` 不进入 gate；
- 动态参数路由不通过伪造 ID 做全量枚举，待真实业务契约或稳定 fixture 存在时按业务 spec 补充。

当前 Native reference 明确包括 `/legacy-home*`、`legacy-service*`、`legacy-profile*`，以及按产品归属属于 Native reference 的 `/device/*`、`/vending/*`、`/signin*`。

### 2.2 通用 formal-H5 route smoke

`tests/e2e/formal-h5.spec.ts` 在 preview / Mock 语义下，以仓库主要移动端视觉基准 `375 × 812` 检查 active formal-H5 静态路由：

- 路由仍被运行时识别为 active formal-H5；
- 浏览器 `pageerror` 与 `console.error`；
- 可见坏图；
- 页面主滚动容器明显横向溢出；
- 一条代表性的正式 H5 UI 导航链路（会员中心 → 通知 → 浏览器返回）。

健康检查不依赖固定毫秒数睡眠。测试会等待 active route 可见、字体就绪、可见图片完成 load/error settle 后，再判断 runtime error、坏图和横向溢出。

这是一组工程回归，不做逐页面像素比对，也不以历史摹客节点文案作为发布门槛。

### 2.3 `test` branch gate

当 push 到 `test`，或 Pull Request 的目标分支是 `test` 时，额外运行 `Test branch gate`。

CI 固定：

```text
VITE_APP_ENV=test
VITE_DATA_MODE=api
```

并验证：

- test bundle 能成功构建；
- `build-meta.json` 为 `test + api`；
- `dist/` 不存在 `mockServiceWorker.js`；
- CI 启动 production-like test bundle，Playwright 通过 `PLAYWRIGHT_BASE_URL` 接入该产物；
- `/`、`/profile`、`/settings` 三个关键正式 H5 路由可运行且无浏览器 runtime failure、坏图和明显横向溢出。

H008 仍因真实 backend base URL / auth / 核心接口契约未知而 Blocked，因此本门禁不把“真实 API 业务成功”伪装成已完成能力。

## 3. T015 的历史定位

`scripts/verify-t015.mjs` 是 UI 高保真阶段留下的历史回归证据。H018 起：

- 它不再决定正式 H5 是否可以晋级；
- package script 的正式标识为 `verify:legacy:t015`；
- `verify:t015` 仅保留兼容别名，并转发到 historical script；
- 不再为了让旧 60 节点脚本全绿而修改当前正式 H5 产品事实。

旧结果文件 `docs/workbench/evidence/t015-results.json` 继续作为历史证据保留，不删除、不冒充当前 Playwright 报告。

## 4. Playwright 运行与产物

常规本地 formal-H5 回归：

```bash
npm run test:e2e
# 等价于
npm run test:e2e:formal
```

未提供 `PLAYWRIGHT_BASE_URL` 时，Playwright 会自动构建 preview bundle 并启动本地 preview server。

`test:e2e:test-gate` 专门验证已经构建的 `test + api` bundle，不直接复用默认 preview server。手工复现时应先构建并启动 test bundle，再显式提供目标地址，例如：

```bash
npm run build:test
npm run preview -- --port 4173 --strictPort
# 另一个终端
PLAYWRIGHT_BASE_URL=http://127.0.0.1:4173 npm run test:e2e:test-gate
```

CI 对已经构建好的 preview/test bundle 设置 `PLAYWRIGHT_BASE_URL`，避免重复构建，也保证测试的环境身份与待验产物一致。

Playwright 默认保留：

- HTML report：`playwright-report/`；
- JSON result（CI）：`test-results/playwright-results.json`；
- 失败 screenshot；
- 失败 trace；
- 失败 video。

## 5. H019 测试证据交付

H019 在 H018 的 `test` branch gate 上增加独立证据层，不改变测试本身的通过标准。

每次真实 test gate 会生成：

- GitHub Actions Summary：状态、commit、branch、env/API mode、Bridge 验证状态和 Playwright 汇总；
- 原始 GitHub Artifact：Playwright HTML、JSON、失败 screenshot/trace/video（若产生）及 `build-meta.json`；
- 累计 evidence site artifact：保留 `/latest/` 与 `/commits/<sha>/`，可按 commit 追溯；
- 可选独立 Cloudflare Pages evidence site。

Cloudflare 发布必须使用独立 Pages 项目。workflow 会拒绝把 evidence site 发布到正式 `dr-card-ui` Pages 项目。

需要的仓库配置：

- Secret `CLOUDFLARE_API_TOKEN`；
- Secret `CLOUDFLARE_ACCOUNT_ID`；
- Variable `CF_TEST_EVIDENCE_PROJECT`：独立 evidence Pages 项目名，不能是 `dr-card-ui`；
- Optional Variable `CF_TEST_EVIDENCE_BRANCH`：未配置时使用 `main`。

Cloudflare 未配置或发布失败不会抹掉测试证据：Actions Summary 与 GitHub Artifact 仍然保留。累计站点会优先恢复最新未过期的 `h019-evidence-site` Artifact，再写入当前 commit 快照。

Evidence 页面显式声明：Browser CI evidence 不是 App WebView、真实 API 业务或 Native JSBridge 的验收结论。

## 6. CI 通过后仍需人工 / 真机验证

以下内容不能因为 GitHub Actions 变绿而标记为通过：

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

因此 `test → prod` 仍是：

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
