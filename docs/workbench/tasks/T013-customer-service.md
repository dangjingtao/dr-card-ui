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
