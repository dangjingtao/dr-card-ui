# H023｜正式 H5 公共组件抽取与精修证据

## 结论

本卡只处理 **active formal H5** 中已经稳定、跨页面重复的 UI / 交互模式。商城、Native reference / legacy、一次性品牌艺术画面不纳入抽象。

本轮实际收敛两项：

1. 复用并补强既有 `ui/SearchField`，迁移 3 个真实页面；
2. 抽出 `mobile/EmptyStateIcon`，迁移 2 个真实数据页空态视觉。

没有为了“组件化率”继续拆分订单卡、通知卡、品牌成功页等语义差异明显的结构。

## 候选盘点

| 候选 | 处理 | 理由 |
| --- | --- | --- |
| 搜索输入框（Exchange / CardShare / BuddyPhoneInvite） | **抽取/复用** | 三处均为“搜索图标 + 输入 + 清除/加载”的稳定职责，原先各页维护重复 JSX |
| 地址 / 订单空态大圆图标 | **抽取** | 两页尺寸、色调、图标容器完全一致，仅 Icon 不同 |
| Orders / Notifications 可点击卡片 | 不抽 | 内容层级、状态颜色、标签、读状态与交互语义不同；只因都是“卡片”不足以合并 |
| Address 默认选择 / CardShare 搭子选择 | 不抽 | 一个是全局默认地址 action，一个是表单式单选目标；视觉相近但语义不同 |
| ClaimSuccess / ExchangeResult / Buddy 成功反馈 | 暂不继续抽 | 已共用 PromptOverlay，但业务视觉、按钮结构与返回语义仍有差异；继续抽会引入过多 variant |
| SegmentedControl / EmptyState / Button / Dialog | 已有 Core，继续直接复用 | 当前已有多个消费点，本卡不重复包装 |

## 1. SearchField

### 抽取前

- `Exchange.tsx`：手写 pill 搜索框，独立 Search icon / input。
- `CardShare.tsx`：手写 subtle 搜索框。
- `BuddyPhoneInvite.tsx`：手写手机号搜索框，并另外维护 searching 状态。

### 抽取后

三页统一消费 `ui/SearchField`。

H023 对既有 Core 组件补齐：

- `variant: subtle | pill`
- `size: compact | regular`
- compact 40px / regular 44px，清除按钮 40px
- placeholder 自动作为缺省 accessible name
- loading → `aria-busy`，左侧图标切换 spinner
- 只有传入 `onClear` 时才渲染清除按钮，避免“看得见但点了没反应”的死按钮
- 保留 `type` / `inputMode`，手机号搜索可继续使用 `type="tel"`

消费点：

- `src/pages/Exchange.tsx`
- `src/pages/CardShare.tsx`
- `src/pages/BuddyPhoneInvite.tsx`

## 2. EmptyStateIcon

### 抽取前

`Address.tsx` 与 `Orders.tsx` 各自维护完全相同的：

- 96×96 圆形容器
- `bg-background`
- 48×48 `text-reward` Lucide icon
- `strokeWidth=1.6`

### 抽取后

统一使用 `src/components/mobile/EmptyStateIcon.tsx`，组件只负责视觉，不携带：

- 空态是否成立的业务判断
- 空态文案
- action
- fixture state

消费点：

- `src/pages/Address.tsx`
- `src/pages/Orders.tsx`

## 验证

### Component test

`src/components/ui/SearchField.test.tsx`

覆盖：

- accessible name
- clear action
- pill / compact variant
- tel input
- loading `aria-busy`
- 未传 `onClear` 时不生成死清除按钮

### Static convergence gate

`npm run verify:h023`

校验：

- 3 个页面必须消费 `SearchField`
- 这些页面不再保留 page-local `<Search />` 实现
- Exchange / BuddyPhone 的 variant / loading 契约存在
- Address / Orders 必须消费 `EmptyStateIcon`
- 两页不再复制原来的 96px 空态视觉 JSX

### Formal H5 E2E

- Exchange：compact pill SearchField 可输入、可清除
- CardShare：regular subtle SearchField 可输入、可清除
- BuddyPhoneInvite：tel SearchField 保留手机号输入语义
- Address / Orders：fixture empty 状态均渲染唯一 96×96 `EmptyStateIcon`

## 边界

- 不改业务规则、fixture 语义、API 或 JSBridge。
- 不改商城。
- 不把相似但职责不同的卡片 / 选择器 / 成功反馈强行做成“大而全”组件。
- H023 抽象只服务已经发生的真实重复，后续扩展仍应满足“至少两个消费点或明确稳定扩展点”。
