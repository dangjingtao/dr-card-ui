# T003｜Com Design 移动组件验真

## 状态与类型

- 状态：`Accepted`（用户于 2026-08-21 在业务页消费证据未成立的情况下明确验收，非智能体自审）
- 类型：Component
- 优先级：P0

## 当前事实与差距

- 33 个组件名称已导出，核心实现集中在 `ComDesign.tsx`，其余同名文件为一行 re-export，导出无断链。
- 已完成：组件/状态矩阵、触控目标 ≥40px、表单可访问语义、弹层 Esc/焦点陷阱/滚动锁定/安全区、危险态 role、`ProgressIndicator` 值域修正。证据见 `src/components/ui/README.md`。
- 已完成：删除无引用重复包装 `mobile/Header.tsx`、`mobile/EmptyState.tsx`。
- 未完成（用户验收时明确豁免，缺口仍在）：T005、T006、T009 覆盖的页面尚未消费任何 ui 组件，业务页消费证据不成立，不能用 `Tokens.tsx` 等参照页截图替代；该证据转由 T005 / T006 / T009 各自页面卡补齐。
- 未完成：全仓库仍有 22 个组件零消费；`Settings.tsx`、`Profile.tsx`、`Home.tsx` 等页面存在手写等价 UI。
- 待决策：`mobile/PromptOverlay.tsx` 与 `ui/Dialog` 职责重叠且缺四项弹层无障碍能力，处置需改壳层。
- 待决策：`BottomNavigation` 金色仍以 `reference/首页` 为准，暂不改公共 Token。
- 组件“存在”不等于适合卡博士移动场景。

## 目标

把基础组件从导出清单变成经过移动端状态和真实页面使用验证的工程能力。

## 原型范围

- 表单：Input、Textarea、Select、Checkbox、Radio、Switch。
- 操作与反馈：Button、IconButton、Dialog、BottomSheet、Toast/Snackbar、Loading、Skeleton。
- 导航与内容：TopAppBar、BottomNavigation、Tabs、SegmentedControl、ListItem、Card、Section、EmptyState、Stepper、Timeline。

## 不在范围

- 不在本卡实现会员卡、泡泡值卡、卡券等品牌业务组件。
- 不用组件展示页替代业务页面验收。

## 依赖与阻塞决策

- 依赖 T002 Token 契约。
- 依赖 T004 定义移动安全区、层级和路由容器。

## 实施要求

- 每个组件覆盖适用的 default/pressed/focus/disabled/error/loading/empty 状态。
- 触控目标不小于项目约定；表单标签、错误提示和对话框具备基本可访问语义。
- 在至少一条真实业务流程中验证组件组合，不只做孤立 Demo。
- 清理重复的 mobile 与 ui 组件职责，保留兼容层时写明去向。

## 验收标准

- 组件展示可访问，33 个导出无断链。
- 关键交互可通过键盘和触控完成。
- Overlay 不穿透，焦点/关闭路径明确，底部安全区正确。
- 至少由 T005、T006、T009 各消费一组组件并提交截图。**未满足**：用户于 2026-08-21 验收时明确豁免此项，该证据转由 T005 / T006 / T009 各自页面卡补齐。

## 必交证据

- 组件/状态矩阵。已交付，见 `src/components/ui/README.md`。
- 展示页截图与交互检查记录。交互检查记录已交付，见 `src/components/ui/README.md`。
- 三个业务页面消费证据。**未交付**，随上述豁免转由页面卡补齐。
- 类型检查、构建和控制台结果。已交付：Node v22.23.2，`npm run typecheck` 与 `npm run build` 通过。

## 产出

- 组件实现、组件文档、展示路由或测试夹具。
