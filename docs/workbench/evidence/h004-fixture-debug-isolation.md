# H004｜Fixture / Debug 运行环境隔离证据

## 结论

H004 已把 active formal H5 的 fixture/debug 能力从“任何构建都能由 URL 驱动”收口为明确的运行策略：

- development / preview + Mock：保留 `state / overlay / debug` 确定性 URL 能力；
- test / prod / API mode：外部 `?state=`、`?overlay=`、`?debug=` 在 active formal H5 页面渲染前被壳层剥离；
- test/prod 的真实用户点击仍可通过 router location state 暂时驱动现有弹层/状态，不要求 H004 一次性重写历史页面；
- `debug` 在 production-like 环境没有 router-state 兼容通道，DebugPanel 也有独立环境门禁；
- Native reference 与 deferred 商城不经过该 sanitizer，避免 H004 改写非施工面行为。

## 环境矩阵

| Vite mode / 映射 | App env | Data mode 默认值 | Fixture URL | DebugPanel |
|---|---|---|---|---|
| development | dev | mock | 允许 | 允许（仍需 `?debug=1`） |
| preview | preview | mock | 允许 | 允许（仍需 `?debug=1`） |
| test | test | api | 禁止 | 禁止 |
| production | prod | api | 禁止 | 禁止 |

H006 后续继续补 `.env.example`、API base URL、Bridge mode、build SHA 与非法组合硬失败；H004 只建立 fixture/debug 所需的最小环境真值。

## 关键实现

### `src/app/config/runtime.ts`

提供 `runtimePolicy`，fixture/debug 只有在 `dataMode === mock` 且环境是 `dev/preview` 时开启。test/prod 或 API mode 均 fail closed。

### `src/app/fixtures/useFixture.ts`

新增统一兼容层：

- `protectedFixtureRedirect()`：production-like active formal H5 在页面渲染前清掉外部受保护 query；直接浏览器进入/刷新不会把 query 转成业务状态；
- `useFixtureQueryControls()`：Mock 用 URL，production-like 用 router location state 暂存 app 内部产生的 state/overlay；
- `useFixtureDebug()`：production-like 永远返回 false；
- `useFixtureNavigate()` / `withFixtureQuery()`：跨路由迁移可继续保留 preview/dev 的可复现 URL，同时 production 不主动生成 fixture URL；
- `useOverlay()`：业务弹层不再要求 `?overlay=` 才能打开。

### `src/layouts/MobileLayout.tsx`

sanitizer 只应用于 `isActiveFormalH5Route(route)`。Native reference / deferred 商城保持原行为。

### `src/components/mobile/DebugPanel.tsx`

除了 `?debug=1` 外，还必须满足 `runtimePolicy.debugPanelEnabled`；test/prod/API mode 无法通过拼 URL 打开。

## 实施过程发现

首轮尝试加入“所有 formal 页面禁止直接访问 state/overlay/debug query”的 AST 门禁后，一次扫出 24 个历史 direct-query 点，分布在 13 个页面。

该发现证明历史 prototype 对 URL fixture 的依赖比预估广，但继续逐页强迁会违反 H004“最小兼容迁移”的范围，并提前吞掉 H014 的页面 fixture / 假业务网络迁移。因此最终采用 shell boundary：先消毒 URL，再渲染页面；已经迁到 helper 的搭子、签到、通知等链路保留，剩余历史写法由壳层临时兼容，后续随 H014 业务迁移清理。

## 自动化证据

PR：#10 `refactor: isolate H004 fixture and debug runtime`

最终工程 head：`ac0ea74fdd5199259674107da78606c8b8538c5f`

GitHub Actions Build run：`35045461711`

结果：

- Static hygiene: PASS
- Typecheck: PASS
- Development server smoke: PASS
- Development build: PASS
- Production build: PASS
- Cloudflare SPA fallback asset: PASS
- Production preview smoke: PASS

H001 门禁日志在该 head 下仍为 0 unused / 0 architecture violation。

## 明确未做

- 未删除历史 fixtures；
- 未引入 MSW；
- 未处理 JSBridge Mock；
- 未处理商城；
- 未把全部历史 direct query 一次性重写；
- 未提前完成 H006 的完整环境/构建身份系统；
- 未提前完成 H014 的页面假网络迁移。

## 当前结论

工程实现和 CI 满足 H004 进入 Agent Review 的条件；最终还需 Ready 后 AI review 复核最新 head。
