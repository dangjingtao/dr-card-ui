# H036｜test / prod 宿主门禁与"仅限 App WebView"提示

**Status:** Agent Review  
**Phase:** Environment Boundary  
**Depends on:** H006, H013, H029

## 背景

用户 2026-09-28 明确要求对部署环境做一次区分：

```text
浏览器独立预览 → 使用 Mock
原生环境接入   → 使用真实接口
```

现状事实：

- `preview` / `dev` 默认 `VITE_DATA_MODE=mock`，允许 fixture / debug；
- `test` / `prod` 默认 `api + native`：禁止 API Mock，并要求真实 Native Bridge 模式（构建期 + 运行期双重校验）；
- 因此"浏览器 Mock / 原生真接口"的区分**在构建层已经成立**，不需要新增环境档位或环境变量。

真正的缺口是：`test` / `prod` 产物当前**用浏览器直接打开不会给出任何环境提示**，而是按 `api` 模式去请求真实后端，通常因 API base 缺失或未登录而各区域静默降级，表现为"页面坏了"。

本卡新增一道**宿主门禁**：`test` / `prod` 构建在非原生宿主环境下不进入应用，改为展示明确的"请在 App 内打开"提示。

## 目标

- `test` / `prod` 产物在浏览器等非原生宿主下展示环境提示页，不启动应用路由，不发业务请求；
- `preview` / `dev` 行为完全不变，继续作为浏览器独立预览与 Mock 载体；
- 宿主判定复用既有 Native Bridge 注入对象探测，不自行发明 UA 判断或宿主协议。

## 范围

- `runtimePolicy` 新增静态语义开关 `requiresNativeHost`（`isProdLike`）；
- Native Bridge façade 新增一等公民宿主查询 `getNativeHost()`；
- 应用入口在挂载前按宿主分流：合格宿主渲染 `App`，不合格宿主渲染提示页；
- 新增宿主受限提示页组件；
- 更新 `test` branch gate 的浏览器断言；
- 同步环境 / Mock / Bridge / CI / 测试方案的既有规范文档。

## 不做

- 不新增环境变量，不新增 data mode / bridge mode 取值；
- 不新增构建目标或 Bridge mode；沿用 `scripts/build-h5.mjs` 的既有目标，并把 `test/prod` 的 Bridge 默认值固定为当前实现所要求的 `native`；
- 不修改 `.github/workflows/build.yml` 的构建与环境策略；
- 不把提示页做成业务错误页，不伪造后端口径或 Native 能力；
- 不改动 Native reference / legacy 路由的归属与实现。

## 关键设计约束

### 1. 判据只能来自既有开关

```text
是否 test/prod       → runtimePolicy.appEnvironment / isProdLike
是否原生宿主         → getNativeHost() 注入对象探测
```

`getNativeHost()` 是**运行时探测结果**，不是构建期配置；同一份 `test` 产物会被浏览器与 App WebView 两种方式打开，构建期无法预知，因此不得用环境变量表达。

### 2. 探测必须走 façade

宿主对象访问只允许经 `src/services/nativeBridge.ts`。页面、入口与提示页都不得自行读取 `window.androidBridge` / `window.iosBridge`，也不得自行解析 `import.meta.env` 判断环境。

### 3. 提示页是最后兜底，不是业务错误

提示页与既有页面级错误边界（`/error`）职责不同，不是同一个页面；不复用 `closeWebView()` 作为主操作（非原生宿主下该能力必然不可用）。

### 4. 设计已定 ≠ 已实现

本卡写入 `docs/engineering/` 与 `docs/testing/` 的内容属于**设计结论**。在代码落地并通过验证前，相关文档必须保留"尚未实现"的表述，不得写成已完成能力。

## 验收标准

- [x] `test` / `prod` 产物在桌面浏览器打开时展示"仅限 App 内打开"提示，且不发起业务请求；
- [x] `test` / `prod` 产物在注入 `window.androidBridge` 或 `window.iosBridge` 的宿主下正常进入应用；
- [x] `preview` / `dev` 的浏览器 Mock 预览行为零变化；
- [x] 宿主判定不依赖 UA，不缓存注入对象，不受 `bridgeMode` 影响；
- [x] `npm run typecheck`、`npm run lint`、`npm run build:test`、`npm run build:prod` 通过；
- [x] `test` bundle 仍不含 `mockServiceWorker.js`，`build-meta.json` 为 `test + api + native`；
- [x] `test` branch gate 浏览器用例与新行为一致；
- [x] 规范文档已同步，且未把未落地能力写成已完成。

## 验证记录

- `npm run typecheck`、`npm run lint`、`npm run build:test`、`npm run build:preview`、`npm run build:prod` 通过；
- `tests/e2e/test-gate.spec.ts` 7/7 通过（test 产物：浏览器拦截、无业务请求、注入宿主放行）；
- `tests/e2e/formal-h5.spec.ts` 50/50 通过（preview 产物不受影响）；
- `npx vitest run` 存在 5 项既有失败（`scanCode` / `showRewardAd` / `BuddyScanLanding`），已通过回滚本次 4 个代码文件复现，确认与本卡无关，属当前分支在途工作。

## 当前实现口径

- `preview/dev`：默认 `mock + disabled`，用于浏览器独立预览与 UI / Mock 联调；
- `test/prod`：默认 `api + native`，且运行容器必须是原生 App WebView；
- `scripts/build-h5.mjs` 与 `src/app/config/runtime.ts` 都要求 `test/prod` 的 `VITE_BRIDGE_MODE=native`，显式配置为 `disabled` 或 `mock` 均 hard fail；
- 这只决定 H5 是否允许调用已经确认的 Native capability，不把“检测到宿主”误写成“某个具体 capability 已在当前 App 版本实现”。

## 证据

- 代码 HEAD 与构建产物 `dist/build-meta.json`；
- `test` / `prod` 产物在浏览器与宿主模拟环境下的行为记录；
- `test` branch gate Playwright 结果；
- 文档变更清单。

## 产出

- 本卡；
- 宿主门禁实现与提示页；
- 既有规范文档原位增补。
