# H013｜MSW 网络 Mock 基建

**Status:** Accepted  
**Phase:** Foundation  
**Depends on:** H006, H007

## 目标

让 Mock 发生在网络边界，使页面和 service 不感知数据来自 Mock 还是真实后台。

## 范围

- 引入 MSW browser worker。
- 建立 handlers / fixtures / browser bootstrap 的清晰结构。
- 本地 dev 可选 Mock/API；CF dev 固定 Mock。
- test/prod 禁止启用 MSW，构建门禁继续检查 `mockServiceWorker.js` 泄漏。
- API Mock 与 Bridge Mock 完全分开。

## 不做

- 不建独立 Mock Server。
- 不增加 CF Functions/Worker 只为 Mock。

## 验收

- 同一个 Axios/service 调用可在 Mock 与 Real API 模式工作，无页面分支。
- test/prod 不注册 Service Worker，也不存在 Mock fallback。
- 至少一个 handler 证明网络级拦截链路可用。

## 实施结果

- 引入 `msw@2.15.0`；`package-lock.json` 与 `public/mockServiceWorker.js` 由 GitHub Actions 中真实执行 `npm install` / `msw init` 生成，临时 bootstrap workflow 已删除。
- 新增 `src/mocks/browser.ts`、`handlers/`、`fixtures/` 三层结构；H013 自带 `__h013/network-probe` 仅作为基础设施验证 handler，不作为真实后台业务契约。
- `src/main.tsx` 只在 `runtimePolicy.dataMode === 'mock'` 时动态加载 MSW，并在 React render 前等待 worker 启动完成；API 模式不启动 worker，页面与 service 不增加 Mock/API 分支。
- `scripts/build-h5.mjs` 对 worker 资产建立最终产物门禁：Mock 构建必须存在 `dist/mockServiceWorker.js`；API 构建主动移除并确认最终产物不存在。
- dev / Cloudflare preview 保持 Mock 语义并携带 worker；test / prod 保持 API 语义且最终产物无 worker。
- API Mock 与 Bridge Mock 继续完全分离；H013 未实现或伪造任何 Native JSBridge 方法。
- `docs/engineering/network-mocking.md` 已记录启动边界、目录职责、worker 资产规则，以及 H013/H014/H018 的任务边界。

## 证据

- 依赖/worker 生成 run：`35089398036`，成功执行真实 npm/MSW CLI 流程。
- `npm run verify:h013` 使用同一个 `createHttpClient().request()` 调用：先由 `msw/node` + 同一 handlers 拦截并返回 Mock payload，再关闭 MSW、连接真实本地 HTTP server 并返回 real payload；证明切换发生在网络边界而非页面分支。
- 第一轮 PR Build `35089804216` 在 typecheck 抓到 async bootstrap 中 DOM root 非空缩窄没有跨函数保留；已通过固定 `appRootElement` 修复，不涉及 MSW 行为。
- 人工 review 还发现：用 production SPA preview 对 `/mockServiceWorker.js` 的 HTTP 200/404 判断泄漏会被 SPA fallback 误导；该方案已撤回，最终以 `dist` 物理资产检查为权威门禁。
- 实现 head `4d325496869f4b23549ac4e9f70a6e29d7ce85b9` 的 Build run `35089924783` 全绿，覆盖 npm ci、hygiene、typecheck、H007/H009/H010/H011/H012/H013 验证、dev/Cloudflare preview/test/prod 构建与 identity、worker 资产存在/缺失规则、production-like Mock 拒绝、SPA fallback 与 production preview smoke。
- Cloudflare Pages 已成功部署同一实现 head `4d325496869f4b23549ac4e9f70a6e29d7ce85b9`。
- PR #20 已记录独立人工 self-review；最终 diff 仅 13 个 H013 相关文件，无业务页面、Native reference 或 Com Design 扩散，当前无剩余 blocking finding。
- Final User Review head `168541cb2af1ce9b4fa972a355ad3984630cc94c` 的 Build run `35090287630` 全绿，Cloudflare Pages 同一 head 部署成功。

## 代理验收记录

2026-09-16：用户明确表示当前无法进行人工验收，并授权助手代为验收 H013。基于完整人工 review、最终 diff 范围检查、两轮全绿 Build、MSW/真实 HTTP 双链路验证、worker 资产环境门禁与 Cloudflare final-head 部署结果，H013 判定满足任务卡验收条件，状态更新为 `Accepted`。
