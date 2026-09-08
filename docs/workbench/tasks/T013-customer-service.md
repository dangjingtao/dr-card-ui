# T013｜福利官、智能/人工客服

## 状态与类型

- 状态：`Accepted`（owner 于 2026-08-24 确认通过；剩余 6 条未定稿规则继续登记在 `CHAT_RULE_STATUS`，福利官旧证据截图作为非阻塞后续修正项）
- 类型：UI / Flow / Integration
- 优先级：P1

## 当前事实与差距

- `/service/welfare-officer`（品牌福利官 #57）已按原型 §8 施工完成：企微二维码占位 + 吴哥人员卡 + **3 类服务列表（人工客服 / 活动咨询 / 福利抽奖）**。历史稿 T08 的 4 项服务（每日签到提醒 / 会员专享福利 / 新品体验优先购 / 节日活动预告）已按用户确认废弃，B-012 关闭。
- 服务项文案与徽标来自 `WELFARE_OFFICER_SERVICES`；原型未给出副标题与跳转目标，已在 `WELFARE_OFFICER_RULE_STATUS` 登记隔离，故渲染为说明列表而非可点按钮。
- `/service/chat`（#58 + #71）已完成：欢迎态单条欢迎语、发送 `sending` → 确定性成败、失败提示 + 重试、页内「企微客服」与「人工」两个入口均可打开 #71 企微引导弹层（D-039/D-040）。
- `/service/chat/human`（#70）已完成：仅 `?state=queuing` / `?state=connected` 两态，排队文案恒定、输入区禁用；已接入态保留智能客服历史并追加一条坐席开场语，历史消息头像保持「诗」、坐席用「哥」（D-041/D-042）。
- 发送成败由 `CHAT_FAIL_KEYWORDS` 关键词确定性映射，无随机；`CHAT_FAILED_MESSAGES` 的用户消息刻意不含失败关键词，使「失败 → 重试 → 成功」可被证据脚本走通。
- 仍缺原型依据、已登记未实现：热门问题清单、问答库、企微真实跳转、队列动态、#71 → #70 的前进入口（原型只给「取消」，未确认故不实现）、坐席后续问答（见 `CHAT_RULE_STATUS` 6 条）。
- #71 弹层内**只有「取消」**，不含任何原型之外的业务动作；#70 本轮暂通过直达路由 `/service/chat/human?state=queuing|connected` 与 `?debug=1` 调试面板验收。

## 目标

完成品牌福利官入口、智能客服会话、转人工请求和排队/接入状态的前端闭环。

## 原型范围

- #57 品牌福利官
- #58 智能客服
- #70 人工客服排队
- #71 请求人工客服

## 不在范围

- 真实 AI、企微、客服坐席和队列后端。
- 不模拟看似真实但没有依据的队列人数动态。

## 依赖与阻塞决策

- 依赖 T002–T004、T011 入口。
- 确认福利官服务项数量、聊天快捷问题、转人工入口和排队状态变化。

## 实施要求

- 福利官页面按确认服务项展示并进入对应路径。
- 智能客服覆盖欢迎态、用户/系统消息、输入、发送中、失败和转人工。
- 人工客服覆盖请求确认、排队中、已接入、取消；状态由 fixture 驱动。
- 明确外部企微能力的跳转/占位边界。

## 状态与交互矩阵

- 福利官默认/外部能力提示。
- 聊天空/有消息/发送中/发送失败/重试。
- 请求人工确认/取消。
- 排队中/已接入/取消排队；仅在有依据时展示人数。

## 验收标准

- 4 个节点逐一可定位：#57 / #58 / #71（`?overlay=request-human`）走页内入口，#70 走直达路由 `?state=queuing|connected`（前进入口未确认，不伪造）。
- 输入区在键盘/小屏场景不被底部安全区遮挡。
- 不出现未经确认的 4 个热门问题、队列递减或额外服务项。

## 迭代（T013R1｜2026-09-08 智能客服「人工」入口改为 APP 内排队/对话）

- 背景：用户 2026-09-08 验收时反馈，智能客服页底部「人工」按钮目前弹的是企业微信二维码引导 BottomSheet（#71），期望行为是：点击「人工」直接进入人工客服**排队状态**，接入后在 APP 内与人工客服对话，不再让用户跳企微。
- 改动（`src/pages/ServiceChat.tsx`）：
  - 删除页内右上角「企微客服」入口（`data-chat-wecom-entry` 按钮 + `MessageSquare` 图标 + `CHAT_BOT.wecomEntry` 文案）。
  - 删除 #71 企微二维码 `BottomSheet`（`<WecomQrPlaceholder />` + `CHAT_HUMAN_PROMPT` 文案 + 「取消」操作），不再消费 `useOverlay()` 与 `overlay === 'request-human'` 渲染。
  - 底部「人工」按钮（`data-chat-human-entry`）`onClick` 由 `open('request-human')` 改为 `navigate('/service/chat/human')`，统一走排队页。
  - 输入框发送触发 `isChatHumanRequest(text)`（输入「人工 / 真人 / 客服人员 / 人工服务 / 转人工」）时，行为同步由 `open('request-human')` 改为 `navigate('/service/chat/human')`，与底部按钮行为一致。
  - 移除不再使用的 import：`MessageSquare`、`WecomQrPlaceholder`、`BottomSheet` / `Button`、`useOverlay`、`CHAT_HUMAN_PROMPT`、`WELFARE_OFFICER`。
- 不动的部分：
  - `/service/chat/human` 页面（`ServiceHuman.tsx`）：`?state=queuing` 排队态 + `?state=connected` 接入态 + APP 内对话输入区均不动，本次仅消费现有页面作为跳转目标。
  - 路由表 `routes.ts`：`overlays: [{ key: 'request-human', ... }]` 路由项保留（`useOverlay` fixture 与回归脚本会引用），但页面不再渲染对应弹层。
  - `verify-t015.mjs` / `verify-reference-pages.mjs` / `evidence-matrix.md` / `route-table.md` 中 `?overlay=request-human` 引用保留以兼容证据脚本。
- 工程门：`npm run typecheck` ✅ 通过；`npm run build` ✅ 通过（1.50s）。
- 任务编号：**T013R1**（T013 的 1 号增量任务卡）。
- 状态影响：T013 原 `Accepted` 状态不变；本次把 #71 入口行为从「企微引导」改为「APP 内排队/对话」，#71 在新行为下不再被页面渲染（`request-human` 路由项保留兼容）；#70 排队/对话态继续作为新增入口落点。

## 迭代（T013R2｜2026-09-08 智能客服顶部区重组 + 「人工」跳转稳定化）

- 背景：用户 2026-09-08 反馈两项：
  1. 点击底部「人工」按钮没有反应 —— 实际上是 `useOverlay + open('request-human')` 走 BottomSheet 弹层，视觉反馈与预期跳转不符。
  2. 顶部展示形态需要重构：原本 "诗字 + AI 客服 · 小诗" 标签占整行且文案偏泛化；用户要求把右上角「企微客服」pill 移到顶部「智能客服」标题右边（同一行），并把原标签改成一行小字「AI 客服 小诗 为您服务」。
- 改动（`src/pages/ServiceChat.tsx`）：
  - **「人工」跳转稳定化**：底部 `data-chat-human-entry` 按钮与「人工客服」等关键词触发的 `send()` 均改为 `navigate('/service/chat/human')`，统一走排队 → 接入对话页，与 R1 一致且不再依赖 overlay URL 状态。
  - **顶部区重组**：
    - 第一行：`诗字` 圆形头像 + 「智能客服」`<h2>` 标题 + 「企微客服」pill（`data-chat-wecom-entry`，仍在右侧）。
    - 第二行小字：`AI 客服 小诗 为您服务`（`text-xs text-text-tertiary`）。
    - 顶部 `data-chat-wecom-entry` pill 的 `onClick` 同步改为 `gotoHuman`，与底部「人工」行为一致。
  - 删除原「诗字 + AI 客服 · 小诗」一行整宽的 `<div>` 容器（用户选中的那个 div 就是这行）。
  - `useOverlay` / `<WecomQrPlaceholder />` / `BottomSheet` 等依赖全部从 import 移除；页面不再消费 `overlay === 'request-human'`。
- 不动的部分：
  - `/service/chat/human`（`ServiceHuman.tsx`）：`?state=queuing` / `?state=connected` 两态保持原样，作为跳转目标。
  - 路由表 `?overlay=request-human` 路由项保留以兼容回归脚本与证据矩阵。
- 工程门：`npm run typecheck` ✅ 通过；`npm run build` ✅ 通过（1.53s）。
- 任务编号：**T013R2**（T013 的 2 号增量任务卡）。
- 状态影响：T013 原 `Accepted` 状态不变；T013R1 中关于「人工」入口的描述被本次 R2 强化（明确 `navigate` 跳转、行为与 R1 一致），R1 文档保留为历史描述。

## 迭代（T013R3｜2026-09-08 智能客服顶部壳层接管 + 居中小字）

- 背景：用户 2026-09-08 反馈三项微调：
  1. `data-chat-wecom-entry` 「企微客服」pill 移到**壳层 TitleBar 右侧**，与「返回 + 智能客服」同一行（不是页内单独一行）。
  2. 删除页内顶部 `<div class="flex min-w-0 items-center gap-2">`（诗字头像 + 「智能客服」`<h2>` + 企微客服 pill 的整块容器）。
  3. `AI 客服 小诗 为您服务` 小字改为 `text-center` 居中显示。
- 改动：
  - `src/app/router/routes.ts`：给 `/service/chat` 显式设 `titleBar: 'back'`，让壳层 TitleBar 接管「返回 + 智能客服」标题（之前虽然默认 `back`，显式声明避免后续误改）。
  - `src/layouts/MobileLayout.tsx`：
    - import 新增 `MessageSquare`。
    - `titleAction` 增加分支：`location.pathname === '/service/chat'` 时返回「企微客服」pill（`MessageSquare` 图标 + `bg-surface` + `text-text-brand`），点击 `navigate('/service/chat/human')`，与 R1/R2 一致。
    - `TitleBar actionWide` 增加 `|| location.pathname === '/service/chat'`，让该 pill 占 72px 宽槽位，标题仍居中。
  - `src/pages/ServiceChat.tsx`：
    - 删除页内顶部 `<div>` 诗字 + 标题 + pill 整块容器；移除 `MessageSquare` import。
    - 顶部区只保留一行居中小字 `<p class="text-center text-xs text-text-tertiary">AI 客服 小诗 为您服务</p>`。
    - 「人工」按钮 + 「人工客服」关键词跳转逻辑保持不变（沿用 R1+R2 的 `gotoHuman`）。
- 不动的部分：
  - `/service/chat/human`（`ServiceHuman.tsx`）两态保持原样。
  - `routes.ts` 中 `?overlay=request-human` 路由项保留以兼容回归脚本。
- 工程门：`npm run typecheck` ✅ 通过；`npm run build` ✅ 通过（1.54s）。
- 任务编号：**T013R3**（T013 的 3 号增量任务卡）。
- 状态影响：T013 原 `Accepted` 状态不变；本次为顶部布局微调与壳层接管，与 R1+R2 一脉相承。

## 迭代（T013R4｜2026-09-08 智能客服真对话逻辑：企微入口回到弹窗 + 人工客服页内状态机）

- 背景：用户 2026-09-08 反馈三项修订（语义与 R1+R2+R3 部分反转）：
  1. 「企微客服」`button` 在壳层 TitleBar 内的横向 pill 形态看起来"很奇怪"——改为页内独立的横向 pill（居中小字之下、自成一行）；点击行为回归 R1 之前的"弹二维码 BottomSheet"，**不再跳人工页**。
  2. 「人工客服」点击**不跳转路由**，改为在当前消息列表下方插入：
     - 系统提示「正在为您接入人工客服...」
     - 排队位次「前面还有 2 位」
     - mock 1.2s 后追加坐席开场语「人工客服 小霜 为您服务」（同步启用底部输入框进入 APP 内对话）。
  3. 演示坐席名由 fixture 中的「诗得丽-吴哥 / 吴哥」调整为「小霜」（用户验收指定的演示坐席）。
- 改动：
  - `src/app/fixtures/index.ts`：
    - `CHAT_QUEUE.connected`：`agentName: '小霜'`、`title: '人工客服 小霜 为您服务'`。
    - `CHAT_AGENT_GREETING`：`text` 文案使用「小霜」，`glyph: '霜'`。
    - 注释行注明 T013R4 调整理由（替换 fixture 原文案的演示值）。
  - `src/layouts/MobileLayout.tsx`：撤回 T013R3 中"企微客服" pill 作为 TitleBar `action` 的分支；`import MessageSquare` 移除；`actionWide` 不再叠加 `/service/chat` 路径。TitleBar 恢复为「< 智能客服」纯净态。
  - `src/pages/ServiceChat.tsx`：
    - 删除 `useNavigate`（不再跳路由）；新增 `useState<HumanStage>`（`idle` / `queuing` / `connected`）与 `useState<boolean>` 控制企微弹层。
    - 顶部区结构：居中小字 `AI 客服 小诗 为您服务`（沿用 R3）+ 居中独立 pill「企微客服」（`data-chat-wecom-entry`，`inline-flex items-center gap-1.5 rounded-pill bg-surface px-4 py-1.5`，居中放置在第二行）。
    - 「企微客服」pill `onClick={openWecom}` → 渲染 `<BottomSheet>`（`<WecomQrPlaceholder />` + `WELFARE_OFFICER` 文案 + 「取消」），与 T013 原型 §10 行为一致。
    - 「人工」按钮（`data-chat-human-entry`）`onClick={requestHuman}`：状态机 `idle → queuing → connected`，已接入后按钮 `disabled`。
    - `requestHuman` 在当前消息列表下方插入两条 `role: 'bot'` 提示（系统提示 + 排队位次），mock 1.2s 后追加 `CHAT_AGENT_GREETING` 开场语。
    - 输入框 `placeholder` 三态联动：`idle` → CHAT_BOT.inputPlaceholder；`queuing` → 「正在为您接入人工客服...」；`connected` → 「与小霜对话中…」。
    - 输入框 `disabled={!humanActive}`：仅坐席接入后允许发送；坐席消息走 `send()` 普通逻辑，不再单独模拟坐席回复（保持 mock 阶段确定性）。
    - 输入「人工客服 / 转人工 / 真人…」等关键词触发 `requestHuman()`，与按钮行为一致。
- 不动的部分：
  - `ServiceHuman.tsx`（`/service/chat/human`）：作为 `?state=queuing|connected` 直达路由保留，验证脚本/证据脚本/调试面板仍可访问；本次「人工」入口从 UI 路径上解耦，但路由项不删除。
  - `routes.ts`：`?overlay=request-human` 路由项保留以兼容回归脚本。
  - `verify-t015.mjs` / `verify-reference-pages.mjs` / `evidence-matrix.md` / `route-table.md` 中 `?overlay=request-human` 引用保留不动。
- 与 R1+R2+R3 的语义边界：
  - **T013R1**：人工入口改为 APP 内（已跳 `/service/chat/human`）。
  - **T013R2**：人工跳转稳定化为 `navigate('/service/chat/human')`。
  - **T013R3**：壳层 TitleBar 接管 + 居中小字。
  - **T013R4（本次）**：将"人工跳转"语义**回退**为页内状态机（吸收 `ServiceHuman` 的排队接入流程）；同时把 R3 的壳层 pill 撤回页内；企微入口**回归** R1 之前的弹二维码行为。这是用户在三次迭代后的最终业务决策。
- 工程门：`npm run typecheck` ✅ 通过；`npm run build` ✅ 通过（1.36s）。
- 任务编号：**T013R4**（T013 的 4 号增量任务卡）。
- 状态影响：T013 原 `Accepted` 状态不变；本次为入口语义的关键回归修正，与 R1+R2+R3 形成完整演进链。

## 迭代（T013R5｜2026-09-08 「企微客服」pill 移回 TitleBar 右侧 + 取消按钮居中）

- 背景：用户 2026-09-08 反馈三项视觉调整：
  1. 弹层 `span`（"取消"）：**居中显示**。
  2. 页内 `button`（"企微客服" pill）：**删除**。
  3. 另一个 `button`（"企微客服"）：**移到右上角，与返回按钮同一行**——即壳层 TitleBar 右侧。
- 改动：
  - `src/pages/ServiceChat.tsx`：
    - 删除页内顶部"企微客服" pill（`<button data-chat-wecom-entry>` 整体移除）；`MessageSquare` import 同步移除。
    - `BottomSheet` 的 actions 由 `<Button variant="ghost">` 改为包一层 `<div className="flex justify-center">`，让"取消"按钮视觉居中。
    - 增加 `useLocation()` 监听 `location.hash`：`#wecom` 触发 `setWecomOpen(true)`；`closeWecom` 关闭时同步 `history.replaceState` 清掉 hash，避免下次进页时旧 hash 触发重弹。
  - `src/layouts/MobileLayout.tsx`：
    - `titleAction` 增加 `pathname === '/service/chat'` 分支：渲染 `data-chat-wecom-entry` pill（MessageSquare + "企微客服"），点击 `navigate('/service/chat#wecom')`（不再跳 `/service/chat/human`）。
    - `TitleBar actionWide` 增加 `|| location.pathname === '/service/chat'`，pill 占 72px 宽槽位，标题仍居中。
    - import 同步加回 `MessageSquare`。
- 通讯机制：
  - 壳层 `MobileLayout` 的 pill 与页面 `ServiceChat` 的 BottomSheet 之间通过 **URL hash 联动**：`/service/chat#wecom` → `ServiceChat` 监听 `location.hash` → 弹二维码。这样不需要新增全局 store，组件解耦，且 URL 可直达演示（与既有 `?state=` 模式一致）。
- 与前序 R 的演进：
  - **T013R1**：人工入口改 APP 内。
  - **T013R2**：人工跳转稳定化。
  - **T013R3**：壳层 TitleBar 接管 + 居中小字。
  - **T013R4**：人工页内状态机 + 企微弹窗回归 + 企微 pill 移到页内第二行。
  - **T013R5（本次）**：企微 pill 改回壳层 TitleBar 右侧（R3 位置），通过 hash 与 ServiceChat 弹层联动；取消按钮居中。
- 工程门：`npm run typecheck` ✅ 通过；`npm run build` ✅ 通过（1.49s）。
- 任务编号：**T013R5**（T013 的 5 号增量任务卡）。
- 状态影响：T013 原 `Accepted` 状态不变；本次为 TitleBar 与 BottomSheet 的视觉微调，与 R3+R4 的演进路径一致。

## 迭代（T013R6｜2026-09-08 TitleBar actionWide 槽位自适应 + pill 不限宽）

- 背景：用户 2026-09-08 反馈——壳层 TitleBar 右侧「企微客服」pill文字"不能是横向的吗"，即文字不应被 TitleBar `actionWide` 写死的 72px 槽位挤压、裁剪或换行；期望 pill 自然横向铺开。
- 改动：
  - `src/components/mobile/TitleBar.tsx`：
    - `actionWide` 槽位 grid 由 `grid-cols-[72px_minmax(0,1fr)_72px]` 改为 `grid-cols-[72px_minmax(0,1fr)_minmax(96px,auto)]`。
    - 第三列 `minmax(96px, auto)`：最小 96px 容纳"图标 + 4 字文本"（如「企微客服」pill），内容可自动增长；仍由 action 容器 `flex justify-end` 控制贴右对齐，标题保持居中。
    - `actionWide = false` 路径（图标按钮）保持 `36px_minmax(0,1fr)_36px` 不变。
  - `src/layouts/MobileLayout.tsx`：
    - 「企微客服」pill className 追加 `whitespace-nowrap`，避免窄屏或标题变长时被自动换行；不限制 pill 宽度，让 TitleBar 槽位自适应包裹。
- 兼容性：
  - 通知页 `isNotificationsPage` 的"一键已读 / 全部已读"按钮继续使用 `actionWide` —— 因为它是单行 ghost 按钮，仍由容器 `flex justify-end` 贴右，文字长度可控；本次槽位由 72px 变为 `minmax(96px, auto)`，通知按钮会更紧凑（96px 起、不被压扁）。
  - 图标动作路径（如「设置」「通知」按钮，36px 槽位）未受影响。
- 与前序 R 的演进：
  - **T013R3**：壳层 TitleBar 接管 pill（actionWide 启用、72px 槽位）。
  - **T013R4**：pill 撤回到页内。
  - **T013R5**：pill 重新加回 TitleBar 右侧（仍用 72px 槽位）。
  - **T013R6（本次）**：放宽槽位至 `minmax(96px, auto)`，pill 文字自然横向。
- 工程门：`npm run typecheck` ✅ 通过；`npm run build` ✅ 通过（1.52s）。
- 任务编号：**T013R6**（T013 的 6 号增量任务卡）。
- 状态影响：T013 原 `Accepted` 状态不变；本次为 TitleBar 槽位微调，对所有使用 `actionWide` 的页面生效，但仅放宽（不会引入回归）。

## 迭代（T013R7｜2026-09-08 TitleBar actionWide 槽位改为 96px 对称，pill 不溢出右侧）

- 背景：用户 2026-09-08 反馈 T013R6 方案中「企微客服」pill 右侧超出页面（截图显示 TitleBar 被 pill 撑出容器）。根因：`grid-cols-[72px_minmax(0,1fr)_minmax(96px,auto)]` 第三列 `auto` 允许列宽随内容自由增长，在窄屏下会撑破 grid 容器，导致 pill 溢出页面右侧。
- 改动：
  - `src/components/mobile/TitleBar.tsx`：
    - `actionWide` 三列由 `grid-cols-[72px_minmax(0,1fr)_minmax(96px,auto)]` 改为 `grid-cols-[96px_minmax(0,1fr)_96px]`。
    - 左右槽位**统一 96px**：刚好容纳"图标 + 4 字文本"（如「企微客服」pill），文字自然横向、不被换行或裁剪；左右对称保证标题**严格居中**；固定宽度彻底避免列内容撑破 grid。
    - 返回按钮由直接 `button` 改为包一层 `flex justify-start`，在 96px 左列中靠左对齐，视觉不漂移。
    - action 容器由 `min-w-0 max-w-full overflow-hidden` 简化回 `flex h-9 items-center justify-end`（因为列宽固定 96px，不再需要 overflow 兜底）。
  - `src/layouts/MobileLayout.tsx`：
    - StatusBar + TitleBar 外层 `shrink-0` 追加 `min-w-0`（防御性，避免被内部撑大）。
- 对通知页的影响：
  - 通知页 `isNotificationsPage` 也使用 `actionWide`，"一键已读 / 全部已读"按钮在 96px 槽位中靠右对齐，文字足够放（72px 时也能放）。
  - 左列由 72px 变为 96px，返回按钮（通知页是"返回"还是"一键已读"在右）—— 通知页 back=true 且 actionWide=true，所以左列是返回按钮 96px、右列是"一键已读"96px，标题在中间严格居中。
- 与前序 R 的演进：
  - **T013R3**：壳层 TitleBar 接管 pill（actionWide 72px 槽位，文字被挤）。
  - **T013R4**：pill 撤回到页内。
  - **T013R5**：pill 重新加回 TitleBar 右侧（仍 72px 槽位）。
  - **T013R6**：放宽槽位至 `minmax(96px, auto)`，pill 可横向，但 auto 导致溢出。
  - **T013R7（本次）**：槽位固定 96px 对称，pill 文字横向 + 不溢出 + 标题居中。
- 工程门：`npm run typecheck` ✅ 通过；`npm run build` ✅ 通过（1.48s）。
- 任务编号：**T013R7**（T013 的 7 号增量任务卡）。
- 状态影响：T013 原 `Accepted` 状态不变；本次修复 T013R6 引入的溢出问题，最终形态为 96px 对称槽位。
- 外部能力失败有明确回退。

## 必交证据

- 服务内容与排队行为决策记录。
- 4 节点截图、发送失败/重试、排队/接入操作记录。
- 小屏/键盘布局证据。
- 类型检查、构建和控制台结果。

### 交付情况（2026-08-22）

| 必交项 | 已交付 |
| --- | --- |
| 决策记录 | [decisions/T013-customer-service.md](../decisions/T013-customer-service.md)（D-038–D-042；关闭 B-012、B-014，B-013 口径部分关闭） |
| 4 节点截图 | 卡二 16 张 `docs/workbench/evidence/screenshots/t013-{58,70,71}-*.png`（欢迎/发送中/对话/失败/重试成功/关键词失败/调试面板/小屏、#71 三种弹层进出、#70 排队中/已接入/接入后发送）；卡一 #57 与四页参考态由 `verify-reference-pages.mjs` 产出 `ref-officer.png`、`ref-chat*.png`、`ref-human-*.png` |
| 交互断言 | `node scripts/capture-t013.mjs` exit 0：欢迎态消息数 1（无热门问题）、发送中气泡 1 / 往返 3、重试后失败气泡 0、关键词失败气泡 1、#71 弹层按钮清单 `["取消"]` 且未确认的「已添加，进入人工客服」按钮数 0（负向断言）、取消后弹层残留 0 且 URL 无 query、#70 排队态直达 `/service/chat/human?state=queuing`、排队 4 秒文案不变、排队中输入禁用、坐席头像「哥」与历史头像「诗」并存 |
| 小屏/安全区 | 同脚本 320×480 视口实测主按钮底边 468/480，未被安全区裁切；截图 `t013-58-small-screen.png` |
| 参考页文案回归 | `node scripts/verify-reference-pages.mjs`：T013 7 条全 OK，`console errors: NONE` |
| 类型检查与构建 | `npm run build`（含 `tsc --noEmit`）exit 0；仅有项目既有的 React Router v7 future flag warning，无 error/pageerror |

## 产出

- 福利官、聊天、人工客服页面、fixture 和适配边界。

### 实际产出文件

- 页面：`src/pages/WelfareOfficer.tsx`、`src/pages/ServiceChat.tsx`（#58 + #71）、`src/pages/ServiceHuman.tsx`（#70）
- 组件：`src/components/mobile/ChatMessageList.tsx`（消息级 `glyph` 承载说话人）、`src/components/mobile/WecomQrPlaceholder.tsx`（#57/#71 共用占位码）
- 夹具：`src/app/fixtures/index.ts` T013 区段（`CHAT_BOT`、`CHAT_WELCOME_MESSAGES`、`CHAT_CONVERSATION_MESSAGES`、`CHAT_FAILED_MESSAGES`、`CHAT_FAIL_KEYWORDS`、`CHAT_HUMAN_KEYWORDS`、`resolveChatSendStatus`、`CHAT_QUEUE`、`CHAT_AGENT_GREETING`、`CHAT_RULE_STATUS`）
- 路由：`src/app/router/routes.ts` T013 区段 + `src/app/router/index.tsx` 注册 `/service/chat`、`/service/chat/human`
- 脚本：`scripts/capture-t013.mjs`；`scripts/verify-reference-pages.mjs` 增补 T013 用例
