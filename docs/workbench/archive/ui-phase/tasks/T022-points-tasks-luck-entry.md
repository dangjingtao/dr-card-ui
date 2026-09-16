# T022｜泡泡值任务页与独立明细

## 状态与类型

- 状态：`Accepted`（T022 施工与整改评审通过；用户视觉验收纳入 T024 变更批次）
- 类型：UI / Flow / Change Request
- 优先级：P0

## 当前事实与差距

- 当前泡泡值页面直接承载余额、筛选 Tab 与流水列表，没有独立的纯明细页。
- 当前泡泡福利只有「每日签到」与「体验券兑换」两个入口。
- 当前页面没有本轮要求的任务占位卡片。
- 本卡是对已验收 T006 的新增需求，不修改 T006 的历史验收结论。

## 目标

将现有泡泡值页面改造成资产、福利与任务承载页，并新增仅包含筛选和流水的泡泡值明细页。

## 原型范围

- 需求文档：[`2026-08-27-ui-change-requirements.md`](../../requirements/2026-08-27-ui-change-requirements.md) §4。
- 列表、Tab、余额卡和金色福利卡复用现有已实现样式。

## 不在范围

- 不实现真实任务系统、任务进度同步或泡泡值结算。
- 不补齐澡运抽签规则与结果持久化。
- 不重新定义泡泡值收入、消耗或兑换业务规则。

## 依赖与阻塞决策

- 依赖当前泡泡值流水夹具与 `/checkin`、体验券兑换入口。
- 新增明细页路由可在施工时按现有路由命名规则确定，并同步登记路由表。
- 澡运目标页仅做占位。

## 实施要求

- 原泡泡值页面保留资产卡和泡泡福利区，流水区域改成设计完整的任务占位卡片。
- 资产卡「看明细」进入新增纯明细页。
- 纯明细页仅展示全部/收入/消耗 Tab、流水列表及空态。
- 泡泡福利区按「每日签到 / 澡运 / 体验券兑换」顺序展示三个同风格入口。
- 澡运入口和目标页先提供明确占位状态。
- 底部主按钮文案改为「泡泡值兑换」，原跳转逻辑保持不变。

## 状态与交互矩阵

- 任务页默认态。
- 明细页全部/收入/消耗/空态。
- 每日签到、澡运占位、体验券兑换三个入口。
- 「看明细」进入与返回。
- 「泡泡值兑换」跳转。

## 验收标准

- 任务卡片在 375 × 812 下层级清楚，不与福利区或底部按钮重叠。
- 明细页不混入任务、福利或资产营销内容。
- 三个 Tab 能真实切换列表结果并保留现有空态。
- 三个福利入口顺序正确且均可达。
- 页面所有新增内容继续消费项目 Token 和现有组件。

## 必交证据

- 任务页、纯明细页四种状态和澡运占位页截图。
- 「看明细」、三个福利入口及兑换按钮点击记录。
- 375 × 812 长页与安全区检查。
- `npm run typecheck`、`npm run build` 与控制台检查结果。

## 产出

- 泡泡值任务页、独立明细页、三入口福利区与澡运占位。

### 代码改动

- 新增 `src/pages/PointsDetail.tsx`：需求 §4.1 的纯明细页，仅含全部/收入/消耗 `SegmentedControl`、流水列表与 `EmptyState` 空态；Tab 与列表样式直接继承原泡泡值页面，不承载任务、福利、资产营销与底部主操作。
- `src/app/router/routes.ts`、`src/app/router/index.tsx`：登记 `/points/detail`（标题「泡泡值明细」、节点 `[5]`、`task: 'T022'`、入口「泡泡值-资产卡『看明细』」、`returnTo: '泡泡值'`、`states: income/expense/empty`）。因非 Tab 路径，`isTabPath` 精确匹配使其自动按二级页渲染返回标题栏且不出 Tab 导航。
- `src/pages/Points.tsx`：资产卡「看明细」改跳 `/points/detail`；泡泡福利区按 §4.3 顺序补齐「每日签到 / 澡运 / 体验券兑换」三个同风格入口；原流水区域改为 `points-tasks-title` 任务占位区（4 张 `PointsTaskCard` + 占位说明 + 「占位」标记）；§4.4 底部主按钮文案改「泡泡值兑换」，样式、位置与 `/exchange` 跳转不变。
- `src/pages/Luck.tsx`：按 §4.3 与整改结论改为**真正不可操作的占位页**——删除 `useNavigate` 与两处 `navigate('/luck/result')`（默认态「抽取今日澡运」、`?state=drawn` 的「查看今日澡运结果」），主 CTA 位置换成非交互的 `div[data-luck-placeholder][aria-disabled]`（虚线描边 + `敬请期待`）并补「澡运玩法筹备中，抽签规则确认后再开放。」副文案；保留「玩法待定」标签与常驻占位说明，不补写未确认的抽签规则（B-003 仍未决，`LUCK_RULE_STATUS.confirmed = false`）。`?state=drawn` 只保留夹具态隔离标注，不再给结果入口。
- `src/app/fixtures/index.ts`：补 `LUCK_PLACEHOLDER`、`POINTS_TASK_PLACEHOLDER_NOTE`、`POINTS_TASK_PLACEHOLDERS`（4 条）与 `pointsTaskPercent`；整改追加 `LUCK_PLACEHOLDER.headline / subline` 承载占位主状态文案，并给 `LUCK_DRAW` 加警示注释（摹客原文留档、定稿前不得据此渲染可点 CTA）。余额与流水继续读既有 `BUBBLE_BALANCE` / `BUBBLE_RECORDS`，无随机值。
- `docs/workbench/route-table.md`：一级 Tab 表 `/points` 行改记 `T006、T022` 与新职责；新增「T022 泡泡值任务页与独立明细」小节登记 `/points/detail`，并注明其与 `/points` 共享节点 #5，第 4 节 60 节点核算口径不变。
- `scripts/capture-t006.mjs`：#5 断言按本卡一分为二，余额/任务卡/主按钮文案留在 `/points`，全部/收入/消耗/空态迁到 `/points/detail`，并补三个福利入口顺序与可达性、「看明细」跳转记录。整改同步反转 #7 断言：默认态与 `?state=drawn` 均断言「抽取今日澡运 / 查看今日澡运结果」按钮数 = 0、`a[href*="/luck/result"]` = 0、占位块可见，`?state=drawn` 仅保留未定稿标注断言。
- `scripts/verify-t001.mjs`、`scripts/verify-reference-pages.mjs`：同步 `/points` 标志文案，并新增 `/points/detail` 参考页检查。
- 新增 `scripts/capture-t022.mjs`：本卡 375 × 812 长页、安全区、层级不重叠与明细页内容隔离的专用取证脚本；整改后 §4.3 改为对 `/luck`、`/luck?state=drawn` 循环断言「无可操作入口 + 不可跳结果页」，并单独校验 `/luck/result` 直达仍可复现（守住 60 节点台账）。

### 证据

375 × 812 截图（`docs/workbench/evidence/screenshots/`）：

| 文件 | 覆盖项 |
| --- | --- |
| `t006-05-points-tasks.png` | 任务页默认态（资产卡 + 三入口福利区 + 任务占位卡） |
| `t006-05-points-detail-all.png` | 明细页全部态（15 条） |
| `t006-05-points-detail-income.png` | 明细页收入态 |
| `t006-05-points-detail-expense.png` | 明细页消耗态 |
| `t006-05-points-detail-empty.png` | 明细页空态「暂时没有更多记录啦」 |
| `t022-07-luck-placeholder.png` | 澡运不可操作占位页（「玩法待定」标签 + 「敬请期待」占位块 + 筹备中说明，无抽取 CTA） |
| `t022-05-points-tasks-bottom.png` | 任务页滚到底：吸底主按钮与安全区 |
| `t022-05-points-detail-bottom.png` | 明细页滚到底：无 Tab 导航、底部安全区留白 |
| `ref-points.png` / `ref-points-detail.png` | 两页参考页控制台与标志文案检查 |

交互记录（真实点击）：

- `node scripts/capture-t006.mjs` 退出码 0：`/points` 余额=1,280、任务占位卡=4 张、主按钮文案「泡泡值兑换」可见；福利入口读取顺序为「每日签到 / 澡运 / 体验券兑换」，逐个点击分别落在 `/checkin`、`/luck`、`/exchange`；资产卡「看明细」点击后 URL → `/points/detail`；明细页全部=15 条，`?state=income` 金额符号集合仅 `+`，`?state=expense` 仅 `-`，`?state=empty` 命中空态文案。
- `node scripts/capture-t022.mjs` 退出码 0：底部主按钮「泡泡值兑换」点击后 URL → `/exchange`（§4.4 跳转逻辑未变）。
- 澡运占位整改验证（同次 `capture-t022.mjs`，`/luck` 与 `/luck?state=drawn` 两态口径一致）：`[data-page-scroll]` 内可操作控件（`button / a / [role=button] / input`）= 0、抽取类文案（`抽取今日澡运|查看今日澡运结果|立即抽取`）命中 = 0、`[href*="/luck/result"]` = 0；点击占位块后 URL 仍分别停在 `/luck`、`/luck?state=drawn`，不进结果页。
- `node scripts/capture-t006.mjs` 澡运节点：`#7 占位态：抽取按钮=0 结果页链接=0 占位块=true`、`#7 ?state=drawn 结果入口=0 未定稿标注=true`；`#41 /luck/result` 经直达 URL 仍完整复现（奖励文案 = true、隔离标识 = 0、档位名 = 0，great/good/minor 三态通过，「返回首页」→ `/`）。

375 × 812 长页与安全区检查（`node scripts/capture-t022.mjs`，退出码 0）：

- 层级不重叠：福利区底 461.5 < 任务区顶 481.5；滚到底后末张任务卡底 657.5 < 吸底按钮顶 674.5；吸底按钮底 750.5 < 底部 Tab 导航顶 751。
- 长页可完整浏览：滚动容器 `scrollHeight` 913 > 视口 663，`data-page-scroll` 单滚动容器可滚到底。
- 明细页内容隔离：返回标题栏 = 1、底部 Tab 导航 = 0，且「泡泡任务 / 泡泡福利 / 泡泡值兑换 / 看明细」命中均为 0 处。
- 澡运占位：`/luck` 占位标签 = 1、占位说明可见、`[data-luck-placeholder]` 可见且文案含「敬请期待」、副文案「澡运玩法筹备中，抽签规则确认后再开放。」可见，与泡泡值福利入口副标题共用同一份 `LUCK_PLACEHOLDER` 文案（入口读到「澡运 / 玩法待定」）。
- `/luck/result` 未被删除或拦截，仅不再从占位页进入：脚本额外断言直达 URL 仍能复现节点 #41（`恭喜你获得 50` 可见 = true）。

工程检查（整改后复跑）：

- `npm run typecheck` 通过（退出码 0）。
- `npm run build` 通过（退出码 0，`✓ built in 1.65s`，CSS 72.23 kB / gzip 13.53 kB，JS 480.72 kB / gzip 144.99 kB）。
- `node scripts/capture-t022.mjs` 通过（退出码 0，「T022 汇总：全部检查通过」）。
- 控制台检查：`/points`、`/points/detail`、`/luck` 无 error / warning；仅 React Router v7 future flag 框架噪音（capture-t022 记 16 条），已归入已知项，与本卡无关。
- 回归：`node scripts/verify-t001.mjs` 6/6 PASS（含 `/points → 泡泡`）；`node scripts/verify-t015.mjs` 58/60 通过、关闭节点偷渡 = 0，其中 `PASS #5 /points`、`PASS #7 /luck`、`PASS #41 /luck/result`（澡运两节点未因整改掉线）；`node scripts/verify-t004.mjs` 中 `/luck/result?state=good → 中吉`、`/draw-success` 重定向至 `/luck/result` 均 PASS。

### 施工边界与遗留

- 未改 Header / BottomNav / PageContainer / ComDesign / 全局 Token；`routes.ts` 与 `fixtures/index.ts` 仅新增 T022 区段。
- 任务卡片为视觉占位，未接入真实任务系统、进度同步与泡泡值结算（本卡「不在范围」）。
- B-002（泡泡配色）与 B-003（澡运抽签规则）仍未决，澡运保持占位，未自行补写规则。
- 澡运整改的边界说明：`/luck/result`（节点 #41）**未删除、未加路由拦截**，因为 `verify-t015.mjs` 的 60 节点硬核算与 `verify-t004.mjs` / `capture-t004.mjs` 都以直达 URL 复现它。整改把「占位态不允许进入 `/luck/result`」实现为「`/luck` 不提供任何可操作入口」，并新增断言守住直达可复现；`?state=drawn` 夹具态保留在 `routes.ts`，仅用于复现 B-003 隔离标注。摹客确认的「抽取今日澡运」文案暂存 `LUCK_DRAW`，玩法定稿后再恢复为真实 CTA。
- 与本卡无关的既有失败保持原状，归属并行卡：`capture-t006.mjs` #6 会员四宫格文案带副标题（T023 侧改动）、`verify-t015.mjs` `FAIL #18 /exchange`、`FAIL #19 /profile` 与 `verify-reference-pages.mjs` `/profile MISSING:热门兑换`（T021 / T023 在建）。
