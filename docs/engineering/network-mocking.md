# H5 网络 Mock 基线

H013 用 MSW 把 API Mock 放到浏览器网络边界。目标不是让页面“知道自己在 Mock”，而是让同一套 page → service → HTTP client 调用在不同环境下由网络层决定响应来源。

## 1. 唯一开关

API Mock 是否启用只取决于 H006 的 `runtimePolicy.dataMode`：

- `mock`：应用启动前动态加载 `src/mocks/browser.ts` 并启动 MSW；
- `api`：不启动 MSW，service / HTTP client 直接走真实 API 配置；
- 页面、组件和 domain state 不读取 `dataMode` 来决定业务数据来源。

Mock 启动发生在 React render 之前。选中了 `mock` 却无法启动 worker 时，不静默切回真实 API。

## 2. 目录职责

```text
src/mocks/
  browser.ts            # 浏览器 MSW worker bootstrap
  fixtures/             # handler 使用的确定性数据
  handlers/             # 网络请求 → Mock response
```

- fixture 只描述 Mock 数据，不承担页面状态管理；
- handler 只描述网络协议行为，不 import 页面组件；
- `browser.ts` 只组合 handler 并启动 worker；
- 正式业务 service 仍放 `src/services/`，不会因为 Mock 模式搬到 `src/mocks/`。

H013 自带的 `__h013/network-probe` 仅用于证明网络边界，不是后台业务契约。真实原型场景的网络化迁移由 H014 处理。

## 3. Mock / API 模式

同一个 HTTP client/service 调用不写两套实现：

```ts
return httpClient.request({
  method: 'GET',
  url: '/some-endpoint',
})
```

在 `mock` 模式，匹配的 MSW handler 在网络层响应；在 `api` 模式，请求走 `VITE_API_BASE_URL`。H008 尚未确认真实 backend base URL / auth / endpoint contract，因此 H013 不新增业务 API 契约。

当前 H013 只有基础设施 probe handler，未命中的请求暂时 bypass；这不是业务 Mock 完成态。H014 应逐步把正式 H5 中仍有价值的假网络场景迁到明确 handler，避免页面继续使用 `setTimeout`、关键字判断或本地 resolver 冒充网络。

## 4. Worker 资产边界

`public/mockServiceWorker.js` 由 `msw@2.15.0` 官方 CLI 生成，不手工修改。

Vite 会默认把 `public/` 内容复制进每次 build，因此 `scripts/build-h5.mjs` 在构建结束后执行环境门禁：

- `dev/preview + mock`：必须存在 `dist/mockServiceWorker.js`，缺失则构建失败；
- `test/prod + api`：主动移除该文件，并再次确认最终产物不存在；
- CI 同时检查 dev/preview 必须有 worker、test/prod 必须没有 worker。

判断“worker 是否泄漏”以最终构建产物为准，不用 SPA preview 对未知 URL 的 HTTP 200/404 结果代替文件检查。

## 5. API Mock 与 Bridge Mock 分离

MSW 只治理 HTTP/network request。Native JSBridge 属于独立宿主边界：

- API Mock：`src/mocks/` + MSW；
- Bridge Mock：未来由 `src/bridge/` 与 H015 协议治理；
- handler 不伪造扫码、相册、Native 导航等宿主能力。

## 6. 后续任务边界

H013 只建立可运行、可验证的网络 Mock 基础设施。

H014 才负责：

- 选择正式 H5 的真实场景补 domain handler；
- 清理页面内 `setTimeout` / keyword branching / fake resolver；
- 让 loading / error / retry 回到真实请求生命周期。

H018 后续可复用同一 handler 描述正式 H5 的 E2E 场景，但 H013 不提前扩张 Playwright 任务范围。
