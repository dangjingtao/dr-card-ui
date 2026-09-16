# T012｜通知与消息详情

## 状态与类型

- 状态：`Accepted`（用户于 2026-08-22 审查确认通过）
- 类型：UI / Flow
- 优先级：P1

## 当前事实与差距

- `/notifications` 已按 reference 通知标准页实现（D-008/D-010）：**4 Tab（全部/未读/系统/活动）**，由 reference 确认（B-010 已关闭）。
- 列表含分类圆点/标签、摘要两行截断、`今天/昨天/更早` 分组、派生未读角标；`?state=unread` 进入未读态（#42），`?overlay=clear` 进入「全部标为已读」确认弹窗 + 结果反馈 Toast（#43，D-012）。
- `/notifications/:id` 已改为**按 `:id` 渲染真实单条正文**（D-011，B-011 已关闭）：分类标签 + 时间 + 多段正文 + 可选补充说明 + 活动类底部 CTA，命中失败渲染兜底空态；进入即已读，返回列表未读数同步变化。
- 已读状态由模块级共享状态 `src/app/state/notifications.ts` 提供（D-013），刷新后回到夹具初始态，保证 `?state=` 可复现。
- 剩余差距：真实推送、通知权限、消息服务与实时同步仍不在范围；4 节点截图与未读变化操作记录待补（缺 `scripts/capture-t012.mjs`）。

## 目标

完成消息列表、未读状态、一键已读确认和消息详情的可验证闭环。

## 原型范围

- #11 通知
- #42 通知副本（未读状态）
- #43 清除消息
- #44 消息详情

## 不在范围

- 真实推送、消息服务、通知权限和实时同步。
- 不做删除消息；#43 只承载「全部标为已读」确认层（D-012）。

## 依赖与阻塞决策

- 依赖 T003/T004。
- 消息分类、进入详情是否自动已读、CTA 类型和一键已读语义已确认，见 [decisions/T012-notifications.md](../decisions/T012-notifications.md)（D-010–D-013，关闭 B-010/B-011）。

## 实施要求

- 列表项表达类型、标题、摘要、时间、未读标记和可操作性。
- “一键已读”必须有确认/结果反馈，不以删除消息代替。
- 详情进入/返回后列表未读数按已确认规则变化。
- fixture 覆盖有消息、无消息、长标题和未读混合。

## 状态与交互矩阵

| 状态 | 定位方式 |
| --- | --- |
| #11 默认列表（未读混合） | `/notifications` |
| #42 未读态 | `/notifications?state=unread` |
| #43 清除确认（打开/取消/确认） | `/notifications?overlay=clear` |
| 分类筛选 | 页内 系统 / 活动 Tab |
| 列表空态 | `/notifications?state=unread` 后执行「一键已读」并确认（未读 Tab 归零） |
| #44 详情（系统类，含补充说明） | `/notifications/n1` |
| #44 详情（活动类，含 CTA） | `/notifications/n2` |
| 详情兜底空态 | `/notifications/none` |
| 长文案（列表截断） | `/notifications` 列表页 `n2` / `n6`：标题 `truncate`、摘要 `line-clamp-2` |

## 验收标准

- 4 个节点逐一可定位。
- 消息数量、未读标记和详情状态前后一致。
- 未经决策不出现历史 4 Tab 或自行定义的 CTA。
- 长文案和空态在 375 宽度下可用。

## 必交证据

- 分类与已读规则决策记录：[decisions/T012-notifications.md](../decisions/T012-notifications.md)（D-010–D-013）。
- 采集脚本：`scripts/capture-t012.mjs`（375×812，含点击交互与控制台采集）。用法 `BASE_URL=http://localhost:5310 node scripts/capture-t012.mjs`。
- 4 节点截图：`t012-11-list-all` / `t012-42-state-unread` / `t012-43-dialog-clear` / `t012-44-detail-system`（`docs/workbench/evidence/screenshots/`）。
- 未读变化操作记录：脚本内断言「点开 `n1` 详情后返回，「全部」Tab 角标必须变化」，实测输出 `全部3 -> 全部2`；对应截图 `t012-11-list-all`（读前）与 `t012-unread-after-read`（读后）。一键已读确认后角标由未读数 3 切为总数 6（`t012-43-toast-all-read`）。
- 分类 Tab 截图：`t012-tab-unread` / `t012-tab-system` / `t012-tab-activity`。
- 空态截图：列表空态 `t012-list-empty-unread`（一键已读后未读 Tab 归零）；详情兜底空态 `t012-44-detail-fallback`。
- 长文案截图：`t012-11-list-all`（列表标题 `truncate`、摘要 `line-clamp-2` 生效，`n2` 摘要出现省略号）。**说明**：`n6` 详情正文仅两段，`t012-44-detail-longtext` 只能证明详情段落排版正常，不构成详情页长正文压力验证。
- 类型检查、构建和控制台结果：`npx tsc --noEmit` 退出码 0；`npm run build` 通过（1632 modules，CSS 50.70 kB / JS 339.64 kB）；采集过程中控制台无 error / pageerror，仅有 React Router v7 future flag 的既有全局告警（非本任务引入）。

## 产出

- 通知列表、详情、已读状态模型和验收证据。
