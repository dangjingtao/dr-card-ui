# T001｜事实基线与验收矩阵

## 状态与类型

- 状态：`Accepted`（owner 于 2026-08-24 明确确认通过，并确认当前仓库实现、路由与页面状态为当前正确事实源）
- 类型：Design / Infrastructure
- 优先级：P0

## 当前事实与差距

- 已有 72 节点页面索引和 6 份模块说明。
- `docs/design/design-baseline.md` 旧版曾标记 `PASS`，并把“不靠谱的设计历史”写成质量下限；本次已撤销该结论并修正用途。
- 72 节点逐节点矩阵已完成，见 [`evidence-matrix.md`](../evidence-matrix.md)，含：是否实施、对应路由、实现等级、决策风险、决策索引、截图与验收状态。
- 当前实现等级分布与历史快照见 `evidence-matrix.md` §3；owner 于 2026-08-24 确认以当前仓库实际实现、路由注册表与页面状态作为继续施工的正确事实源，旧快照不再反向否定当前页面。
- 当前主导航为五项：首页 / 泡泡 / 扫码 / 服务 / 我的；五页 375×812 截图与运行断言已更新。施工方事实刷新工作至此关闭，最终产品验收仍由用户作出。

## 目标

建立全项目唯一的事实与验收台账，使 72 个节点都能回答“做不做、为什么、在哪里、做到什么程度、凭什么通过”。

## 原型范围

- 全部 #1–#72。
- 60 个实施节点与 12 个范围关闭节点必须互斥且合计为 72。

## 不在范围

- 不实现具体页面。
- 不替产品统一泡泡值/积分、品牌命名、兑换码长度等冲突。

## 依赖与阻塞决策

- 依据：`docs/prototype/`、Mockplus 离线包、`AGENTS.md`。
- 已纠正旧基线中的 `PASS` 和“历史稿质量下限”表述；后续必须用逐页证据完成基线验真。

## 实施要求

- 建立逐节点矩阵：节点号、名称、模块、任务卡、路由/状态、实现等级、决策风险、证据、验收状态。
- 实现等级只能为：`Missing / Placeholder / Partial / Implemented / Verified / Excluded / Scope-Closed`。
- `Verified` 必须有截图、交互和工程证据；仅构建通过不得使用。
- `Excluded / Scope-Closed` 必须反向链接到 T014 或其他决策记录，未链接的 `Excluded` 视为漏决策。
- 所有决策记录从矩阵反向链接到具体任务卡。

## 验收标准

- 72 个节点无遗漏、无重复归属错误。
- 60 + 12 覆盖公式成立。
- 当前五个种籽页、五项 Tab、全量路由注册表与实现等级和代码事实一致。
- 历史 `PASS` 不再被误读为用户验收通过。

## 必交证据

- 逐节点矩阵文件：[`evidence-matrix.md`](../evidence-matrix.md)。
- 自动/人工覆盖计数结果：60 + 12 = 72，见矩阵 §3/§5。
- 5 个种籽页的代码定位与截图：见矩阵 §2，截图在 [`evidence/screenshots/`](../evidence/screenshots/)；全量路由定位见 [`route-table.md`](../route-table.md)。
- 修订前后差异说明：见矩阵 §6。
- 决策索引：[`decisions/README.md`](../decisions/README.md)。
- 工程证据：`npm run typecheck`、`npm run build`、`BASE_URL=<running-app> node scripts/verify-t001.mjs` 通过。

## 产出

- 事实矩阵、覆盖评估、决策索引：[`evidence-matrix.md`](../evidence-matrix.md)、[`decisions/README.md`](../decisions/README.md)。
- 截图脚本：[`scripts/capture-t001.mjs`](../../../scripts/capture-t001.mjs)。
- 用户评审记录：owner 于 2026-08-24 明确确认 T001 通过；当前仓库实现、路由与页面状态为当前正确事实源。
