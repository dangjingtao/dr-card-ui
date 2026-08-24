# Com Design UI layer

This directory consumes the 33 Com Design Mobile core components as React/Tailwind primitives for dr-card-ui.

- Core contract source: `dangjingtao/com-design` branch `phase5`, commit `e28ba3fabfc8b0d836cb64531c75ad378ce59c8c`.
- Premium Gold theme source: branch `theme-premium-gold-v2`, commit `958c604067800941734ef0866238c7659869a369`.
- Product rule: this app is a consumer of Com Design. Product components may compose or extend Core, but must not redefine Core semantics.

Core catalog (33): Button, IconButton, Input, Textarea, Select, Checkbox, Radio, Switch, ListItem, Tabs, SegmentedControl, TopAppBar, BottomNavigation, Section, Divider, Card, Tag, Badge, Avatar, Toast, Snackbar, Alert, Dialog, BottomSheet, LoadingIndicator, Skeleton, EmptyState, ProgressIndicator, Stepper, Timeline, SearchField, Menu, MenuItem.

## 实现结构

- 全部 33 个组件实现集中在 `ComDesign.tsx`；同名 `.tsx` 文件是单行 re-export，用于保持按组件名导入的路径稳定。
- `index.ts` 统一 `export * from './ComDesign'`，并保留 `Button as default` 兼容旧引用。
- 共享基础设施（同文件顶部，不对外导出）：
  - `focusRing` / `peerFocusRing` / `fieldFocus`：三类 `focus-visible` 可见态，避免各组件各写一套。
  - `useOverlayBehavior(open, onClose, initialFocus)`：Esc 关闭、初始焦点、Tab 焦点陷阱、`body` 滚动锁定、关闭后焦点归还；Dialog / BottomSheet 初始聚焦面板，避免程序化焦点误显示按钮焦点环。
  - `rovingKeyDown(event, orientation)`：`[data-roving]` 元素间的方向键 / Home / End 漫游焦点。

## T003 组件 / 状态矩阵

状态列含义：`—` 表示该状态对组件不适用；`n/a` 表示组件本身无该交互面。

| 组件 | default | pressed | focus-visible | disabled | error | loading | empty | 触控目标 | 关键语义 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Button | ✅ | ✅ | ✅ | ✅ | — | ✅ | — | 40 / 48 | `aria-busy`，loading 即 disabled |
| IconButton | ✅ | ✅ | ✅ | ✅ | — | — | — | 40 / 48 | `aria-label`、`aria-pressed` |
| Input | ✅ | — | ✅ | ✅ | ✅ | — | — | 40 | `label htmlFor`、`aria-invalid`、`aria-describedby`、`read-only` 态 |
| Textarea | ✅ | — | ✅ | ✅ | ✅ | — | — | 88 高 | 同上，附字数计数 |
| Select | ✅ | — | ✅ | ✅ | ✅ | — | ✅ | 40 | 同上；仅未选中时渲染 placeholder option |
| Checkbox | ✅ | — | ✅ | ✅ | — | — | — | 44 行高 | `indeterminate` 写入 DOM + `aria-checked="mixed"` |
| Radio | ✅ | — | ✅ | ✅ | — | — | — | 44 行高 | 原生 radio + `peer` 视觉层 |
| Switch | ✅ | — | ✅ | ✅ | — | — | — | 44 行高 | `role="switch"`、`aria-checked`、`aria-labelledby` |
| ListItem | ✅ | ✅ | ✅ | ✅ | — | — | — | 48 | actionable 用 `button`，`aria-current` / `aria-disabled` |
| Tabs | ✅ | — | ✅ | ✅ | — | — | — | 44 | `role="tablist"/"tab"`、`aria-selected`、roving tabindex |
| SegmentedControl | ✅ | ✅ | ✅ | ✅ | — | — | — | 40 | 同 Tabs |
| TopAppBar | ✅ | — | n/a | — | — | — | — | 56 高 | `header` + `h1`，动作最多 2 个 |
| BottomNavigation | ✅ | ✅ | ✅ | — | — | — | — | 40 + 安全区 | `nav aria-label`、`aria-current="page"` |
| Section | ✅ | — | n/a | — | — | — | — | n/a | `section` + `h2` |
| Divider | ✅ | — | n/a | — | — | — | — | n/a | 纯装饰 |
| Card | ✅ | ✅ | ✅ | ✅ | — | — | — | 由内容决定 | interactive 用 `button` 并透传 props |
| Tag | ✅ | — | n/a | — | — | — | — | 24 高 | 纯展示 |
| Badge | ✅ | — | n/a | — | — | — | — | 18 | 溢出显示 `99+` |
| Avatar | ✅ | — | n/a | — | — | — | ✅ | 24 / 32 / 40 | 无图回落首字母 |
| Toast | ✅ | — | n/a | — | ✅ | — | — | n/a | danger 用 `role="alert"`，其余 `role="status"` |
| Snackbar | ✅ | — | ✅ | — | — | — | — | 动作 40 | `role="status"` |
| Alert | ✅ | — | ✅ | — | ✅ | — | — | 关闭 40 | danger/warning 用 `role="alert"`，其余 `role="status"` |
| Dialog | ✅ | — | ✅ | — | — | — | — | n/a | `role="dialog"`、`aria-modal`、`aria-labelledby`、焦点陷阱 |
| BottomSheet | ✅ | — | ✅ | — | — | — | — | n/a | 同 Dialog，另含底部安全区 padding |
| LoadingIndicator | ✅ | — | n/a | — | — | ✅ | — | n/a | `role="status"`、`aria-busy` |
| Skeleton | ✅ | — | n/a | — | — | ✅ | — | n/a | `aria-hidden` |
| EmptyState | ✅ | — | n/a | — | ✅ | — | ✅ | n/a | 四种 variant，含可恢复错误 |
| ProgressIndicator | ✅ | — | n/a | — | — | ✅ | ✅ | n/a | `role="progressbar"` + `aria-valuemin/max/now/text` |
| Stepper | ✅ | — | n/a | — | ✅ | — | ✅ | n/a | `ol/li`，当前步 `aria-current="step"` |
| Timeline | ✅ | — | n/a | — | — | — | ✅ | n/a | `ol/li` |
| SearchField | ✅ | — | ✅ | ✅ | — | ✅ | ✅ | 40，清除 40 | 隐藏原生清除键，避免与自定义按钮重复 |
| Menu | ✅ | — | ✅ | — | — | — | ✅ | n/a | `role="menu"`、Esc 关闭、纵向漫游焦点 |
| MenuItem | ✅ | ✅ | ✅ | ✅ | — | — | — | 48 | `role="menuitem"`、`aria-current` |

### 交互检查记录

- 触控目标：`SegmentedControl`（36→40）、`SearchField` 清除按钮（36→40）、`Alert` 关闭按钮（未约束→40）、`Snackbar` 动作按钮（未约束→40）、`BottomNavigation` 按钮（补 `min-h-10`）已全部达到 ≥40px。
- 键盘路径：`Tabs` / `SegmentedControl` 横向、`Menu` 纵向支持方向键与 Home/End；`Dialog` / `BottomSheet` 支持 Esc 关闭与 Tab 循环，关闭后焦点归还触发元素。
- 弹层不穿透：遮罩层用 `onPointerDown` 判定 `event.target === event.currentTarget` 关闭，面板本身 `stopPropagation`；打开期间锁定 `body` 滚动。
- 底部安全区：`BottomSheet` 容器 `pb-[calc(16px+env(safe-area-inset-bottom))]`，`BottomNavigation` 容器 `pb-[calc(6px+env(safe-area-inset-bottom))]`。
- 未 Token 化项：`BottomNavigation` 的金色 FAB 与选中色仍为硬编码 hex（品牌视觉），Token 化需新增语义 Token 与 Tailwind 映射，属 Token 公共契约变更，本次不动。
- `BottomNavigation` 精修：FAB 去掉 `border-2 border-white` 与 `inset 0 0 0 4px #FFFFFF` 双层白描边，仅保留投影分离层次；气泡 52→56px、FAB 图标 26→32px、普通项图标 22→24px。FAB 项不再渲染文字标签（仅金色气泡），文案信息由 `aria-label` 承担无障碍可达性。
- `Button` 的 `secondary` / `destructive` 按下态直接消费 CSS 变量（`active:bg-[var(--color-secondary-pressed)]`），因为 `tailwind.config.js` 未映射这两个语义类，且该文件属 Token 公共契约。

## 业务页消费缺口（T003 未完成项）

组件自身的状态、触控与弹层行为已验真，但 T003 验收要求的「至少由 T005、T006、T009 各消费一组组件」**尚未成立**。截至当前核查：

- `src/pages` 下 21 个页面中，只有 7 个从 `../components/ui` 导入组件；去重后 pages 层实际消费 9 个：`Button`、`EmptyState`、`Card`、`Tag`、`Section`、`IconButton`、`Dialog`、`Toast`、`SegmentedControl`。
- 这 7 个页面里，`Tokens.tsx`（工程参照页）、`NodeStub.tsx`、`WebViewBoundary.tsx`、`NotFound.tsx` 属参照与兜底页，按本卡「不用组件展示页替代业务页面验收」不能作为消费证据；真正业务页只有 `Notifications.tsx`、`NotificationDetail.tsx`、`DrawSuccess.tsx`。
- T005（`Home.tsx` / `Onboarding.tsx`）、T006（`Membership.tsx` / `Checkin.tsx` / `Points.tsx`）、T009（`Card.tsx` / `Redeem.tsx` / `ScanVerify.tsx` / `ConfirmVerify.tsx`）覆盖的页面**全部零消费** ui 组件。
- 全仓库零消费组件 22 个：`Input`、`Textarea`、`Select`、`Checkbox`、`Radio`、`Switch`、`ListItem`、`Tabs`、`TopAppBar`、`Divider`、`Badge`、`Avatar`、`Snackbar`、`Alert`、`LoadingIndicator`、`Skeleton`、`ProgressIndicator`、`Stepper`、`Timeline`、`SearchField`、`Menu`、`MenuItem`。（`BottomNavigation` 经 `mobile/BottomNav.tsx`、`BottomSheet` 经 `mobile/FixtureOverlay.tsx` 间接进入运行时。）
- 已存在手写等价 UI 而未复用 Core 的位置：`Tokens.tsx` 手写原生 `<input>` 与四态提示条（未用 `Input` / `Alert`）、`Settings.tsx` 有开关与输入交互（未用 `Switch` / `Input`）、`Profile.tsx` 与 `Home.tsx` 有头像（未用 `Avatar`）。

T003 已由用户于 2026-08-21 在此缺口未闭合的情况下明确验收为 `Accepted`，验收时豁免了「至少由 T005、T006、T009 各消费一组组件」这一项。**豁免不等于缺口消失**：上述消费证据须随 T005 / T006 / T009 页面施工产生，不能用参照页截图替代；本节清单保留作为后续页面卡的施工输入。

## ui 与 mobile 的职责边界

| mobile 组件 | 现状 | 结论与去向 |
| --- | --- | --- |
| `mobile/BottomNav.tsx` | 消费 `ui/BottomNavigation`，注入路由与 `TAB_ROUTES` | 保留。壳层负责路由绑定，Core 负责视觉，不重复。 |
| `mobile/TitleBar.tsx` | 业务标题栏，与 `ui/TopAppBar` 布局规格不同（44px 三列 / 居中大标题） | 保留。视觉以已确认页面为准，不与 `TopAppBar` 合并。 |
| `mobile/Header.tsx` | 曾为 `TitleBar` 的无引用 re-export | 已删除；标题栏统一使用 `mobile/TitleBar.tsx`。 |
| `mobile/EmptyState.tsx` | 曾为 `ui/EmptyState` 的无引用纯透传包装 | 已删除；页面直接使用 `ui/EmptyState`。 |
| `mobile/PageContainer.tsx` / `StatusBar.tsx` | 壳层容器与状态栏，Core 无对应件 | 保留，无重复。 |
| `mobile/FixtureOverlay.tsx` | 原型对照工具，消费 `ui/Dialog` + `ui/BottomSheet` + `ui/Button` | 保留。已复用 Core 弹层，不重复。 |
| `mobile/PromptOverlay.tsx` | 消费 `ui/Dialog` 的 `presentation="custom"` 紧凑形态，品牌弹窗只负责内容编排 | 保留。遮罩、语义、Esc、焦点陷阱、滚动锁定与焦点归还统一由 Core Dialog 提供。 |
| `mobile/AppPromptDialog.tsx` | 基于 `PromptOverlay` 的品牌 TIPS 弹窗，使用品牌插画与 Com Design 语义 Token | 保留为品牌件。按钮、关闭操作、面板及反馈状态均复用 Core 组件/Token。 |
