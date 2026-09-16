# H004｜Fixture / Debug 运行环境隔离

**Status:** Agent Review  
**Phase:** Hygiene  
**Depends on:** H001

## 目标

保留 preview/dev 的确定性演示能力，同时阻止 `?state=`、`?overlay=`、`?debug=1` 在 test/prod 冒充真实业务状态。

## 范围

- 定义 fixture/debug 能力的环境开关和运行策略。
- preview / 本地 Mock 环境可继续使用状态 URL 与调试面板。
- test/prod API 模式不允许 query 参数构造假业务结果；DebugPanel 不应成为生产可开启能力。
- 对现有 fixture hook 做最小兼容迁移，避免一次性改写所有页面。

## 不做

- 不删除历史 fixture 与截图能力。
- 不把 Mock 与 JSBridge Mock 混成同一开关。
- 不提前完成 H006 的完整环境配置与构建身份。
- 不一次性清理全部历史页面的 direct fixture query；后续随 H014 业务迁移清理。

## 实现结果

- 新增 `src/app/config/runtime.ts`，development/preview 默认 `mock`，test/production 默认 `api`；只有 dev/preview + mock 允许 fixture/debug。
- active formal H5 在 `MobileLayout` 渲染页面前统一处理受保护 query；直接浏览器进入/刷新时，test/prod/API mode 会移除 `state/overlay/debug`，不把它们转换为业务状态。
- 旧 SPA 内部导航产生的 `state/overlay` 在 production-like 环境临时转为 router location state，保留既有点击交互；`debug` 没有兼容通道。
- `useFixtureState`、`useOverlay`、`useFixtureNavigate`、`useFixtureDebug` 形成统一兼容层。
- `DebugPanel` 增加 runtime policy 门禁，production-like 构建无法仅靠 `?debug=1` 开启。
- sanitizer 只针对 active formal H5；Native reference 与 deferred 商城不被 H004 改写。
- 新增 `build:preview`，明确 preview 模式，不从 Git branch 名推导 fixture 开关。

## H006 边界

H004 为完成 fixture/debug 隔离建立了最小 runtime policy，因此不再阻塞于 H006。H006 继续负责 `.env.example`、API base URL、Bridge mode、build SHA、非法配置组合硬失败等完整环境/构建身份能力。

## 验收

- dev Mock 环境仍可稳定复现需要的演示状态。
- test/prod active formal H5 在页面渲染前剥离外部 `state/overlay/debug` query；`DebugPanel` 不可通过 URL 开启。
- 真实 app 内点击仍可打开现有弹层/临时状态，不因隔离策略失效。
- Native reference / deferred 商城不被本卡 sanitizer 改写。
- 环境差异由统一 runtime policy 决定，不由页面判断 Git branch 名称。

## 证据

详见 [`../evidence/h004-fixture-debug-isolation.md`](../evidence/h004-fixture-debug-isolation.md)。

工程 head `ac0ea74fdd5` 的 Build run `35045461711` 全绿：Static hygiene、Typecheck、dev/prod build、dev/prod smoke、SPA fallback 均 PASS。

当前状态为 `Agent Review`；Ready 后仍需 AI reviewer 对最新 head 复核。
