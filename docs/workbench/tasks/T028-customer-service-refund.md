# T028｜客服中心与退款

## 状态与类型

- 状态：`User Review`（PR 检查：本地工程门通过，等待用户签字；按规则智能体不得自填 `Accepted`。`后续待施工` 段落仍保留，B-041/B-042 待产品/接口补齐后再迭代）

- 类型：Feature / Flow

- 优先级：P0（客服中心）

## 当前事实与差距

- 当前 APP 已有客服中心入口（跳转到客服中心），但未实现 AI 客服。

- 会议讨论：

  - 客服：尽量走 AI 客服，减少人工成本。

  - 退款：APP 未实现退款功能。目前采用分账模式，通过关注公众号工单推款。

  - 建议保留当前退款方式，但可以做 UI 展示。

## 目标

1. 客服中心接入 AI 智能客服（复用/扩展现有智能客服能力）。
2. 退款功能：保留现有的公众号工单推款方式，增加退款 UI 展示（小票页面增加退款入口和状态展示）。

## 原型范围

- 需求来源：`卡博士APP缺失及新增功能.xlsx` Sheet1「客服中心」「我的小票」+ 2026-08-31 会议笔记。

- 复用现有智能客服 `/service/chat` 聊天组件和 `T013` 客服链路。

## 不在范围

- 不做 APP 内原生退款流程（仍走公众号工单推款）。

- 不修改退款后端逻辑。

## 依赖与阻塞决策

| 编号    | 阻塞项        | 风险 | 说明                       |
| ----- | ---------- | -- | ------------------------ |
| B-041 | 退款 UI 展示字段 | 中  | 需要确认小票详情页退款入口样式和退款状态说明文案 |
| B-042 | AI 客服知识库范围 | 中  | 需要确认 AI 客服覆盖的常见问题范围      |

## 实施要求

- 客服中心入口优先引导至 AI 智能客服。

- 我的小票页增加退款入口，点击后展示退款引导说明（引导至公众号工单推款）。

- 退款状态在小票详情页展示（可退款金额、退款进度等）。

## 状态与交互矩阵

- 客服中心入口默认态 → 进入 AI 客服。

- 我的小票列表页（退款状态标签）。

- 退款引导页（公众号工单推款说明）。

- 小票详情页（退款金额、状态展示）。

## 验收标准

- 客服中心优先进入 AI 客服对话页。

- 小票详情页展示退款信息与引导文案。

- 退款流程清晰：用户可明确知道通过公众号进行退款操作。

## 落地（2026-09-04 首轮）

- 新建 `CustomerServicePage.tsx`（`/legacy-profile/customer-service`）：对齐原客服中心原型。

  - 上半部分：6 条热门问题，点击展开答案（金色背景框）；

  - 下半部分：AI 对话区（带头像气泡，user 紫底 + ai 渐变金底），输入文字根据关键词触发预设回复；

  - 输入栏右侧"转人工"按钮 + 关键词命中（含"人工/真人/转人工"等）→ 跳 `/service/chat/human` 排队页。

- **退款流程（APP 内原生闭环）**（按用户 2026-09-05 最新口径：APP 内直接完成退款动作，不再走公众号工单推款）：

  - 新建 `RefundApplyPage.tsx`（`/legacy-profile/refund-apply`）：小票信息卡 + 全额退款 / 指定金额切换（金额 ≤ 实付金额，带校验）+ 5 个退款原因 chip（设备故障 / 误操作 / 服务质量 / 不想使用 / 其他）+ 退款到账方式说明 + 提交后累加 `userInfoStore.balance` + 写 `localStorage('kbs_refund_records')` + 跳成功页。

  - 新建 `RefundSuccessPage.tsx`（`/legacy-profile/refund-success`）：渐变金勾 + 本次退款金额 + 退款后账户余额（实时读 store）+ 双按钮（返回个人中心 / 查看退款记录）。

  - 重写 `RefundRecordsPage.tsx`：从 `localStorage('kbs_refund_records')` 读取记录，倒序展示（退款单号 / 原小票 / 金额 / 原因 / 时间 / 状态），无记录时显示空态。

  - 删除 `RefundGuidePage.tsx`（公众号引导版已废弃）。

  - `ReceiptDetailPage.tsx`：底部"申请退款"按钮跳 `/legacy-profile/refund-apply?receipt=${id}`。

  - `userInfoStore.ts`：UserInfo 增加 `balance: number`（默认 100 元），退款提交时累加。

- `SettingsPage.tsx`：移除「在线客服」入口（用户口径：客服中心主入口在服务页）；移除「退款」入口（任务卡反转：退款从我的小票发起）；保留「退款记录」入口。

- `LegacyService.tsx`：将原"客服欢迎语"卡片（耳机图标 + Hi\~欢迎来到卡博士气泡）升级为可点击入口，整卡片 onClick 跳 `/legacy-profile/customer-service`；气泡内追加金色「点击进入在线客服」提示 + 右侧 ChevronRight 引导（后续修正：箭头移入气泡内、文案去掉 "AI"）。

- 客服中心唯一入口：服务 → 顶部欢迎卡片（主入口）。

- 退款入口：我的小票详情页 → "申请退款"（主入口）；设置 → 退款记录。

- 路由注册：`src/app/router/index.tsx`（imports + `customPages`）与 `src/app/router/routes.ts`（ROUTES 数组）同步添加 `customer-service / refund-apply / refund-success / refund-records` 四条新路径。

- `npm run typecheck` 通过。

## PR Check（2026-09-07）

- 提交（最近一次 → 最早一次，便于回看）：

  - `0645f31 T028 客服中心移除『转人工』按钮：仅靠输入框关键词『人工客服』触发转人工，减少人工客服压力`
  - `ed47e00 T028 卡博士与诗得丽客服打通：LegacyService / SettingsPage 的客服入口改跳 /service/chat；保留 /legacy-profile/customer-service 路由作为过渡`
  - `8084161 T028 退款按钮改黑色 #1F2937：项目卡 + 退款详情页确认按钮`
  - `7e3cf5d T028 卡博士风格统一：双按钮+头像改淡金；购买/退款详情页加微信+支付宝两条途径`
  - `1af91c9 T028 我的小票按账户/项目分离：账号+总余额只显示一次(淡金)，下方列各项目余额细分+购买/退款；删除 SchoolAccountDetailPage`
  - `1468c26 T028 我的小票改项目列表：每个项目卡片含头部蓝色区+账号+总余额+购买/退款按钮，点进来直接用`
  - `1ef5e89 T028 学校账户概览按图1严格重建：顶部两枚圆形按钮 + 总余额大字 + 玻璃拟态小票记录 + 学校卡片刺入蓝色区域`
  - `576bfe3 T028 按学校维度重构退款：学校账户列表/概览/充值/退款页 + 删除按小票退款的三个旧页`
  - `7a8297f T028 落地记录补充：APP 内原生退款闭环 + 设置页移除在线客服`
  - `4b544ff T028 APP 内原生退款闭环：申请页（金额+原因）→成功页（扣余额）→记录页（localStorage）+ 设置页移除在线客服`
  - `c0c338a T028 服务页：ChevronRight 移入欢迎气泡内 + 文案 AI在线客服 → 在线客服`
  - `27d8ce4 T028 服务页：欢迎语卡片升级为可点击客服中心入口`
  - `f85517c T028 客服中心与退款：新建 3 页 + 小票详情加退款按钮 + 设置入口接通`

- 落地（代码侧）：

  - 客服中心：`src/pages/legacy/CustomerServicePage.tsx`（FAQ 6 条 + AI 对话气泡 + 关键词命中 + 转人工排队入口）。
  - 退款链路：`RefundApplyPage` / `RefundSuccessPage` / `RefundRecordsPage`（`localStorage('kbs_refund_records')`）+ `ReceiptDetailPage` 入口按钮。
  - 学校账户维度：`SchoolAccount*` 系列页（按 2026-09-04 口径重构）。
  - `userInfoStore.balance` 默认 100 元，退款成功累加。
  - `LegacyService / SettingsPage` 客服入口跳 `/service/chat`；`SettingsPage` 移除在线客服与退款入口，保留退款记录。

- 阻塞保留：

  - B-041 退款 UI 展示字段：可退金额 / 退款进度 / 退款时间等字段待产品确认后接入。
  - B-042 AI 客服知识库范围：当前为预设 FAQ + 关键词回复，未接入真实大模型。
  - 退款记录目前为前端 `localStorage`，待真实接口接入后迁移。

- 工程门：

  - `npm run typecheck`：✅ 通过（exit 0）。
  - `npm run build`：✅ 通过（1.42s，产物正常）。
  - 工作树干净（`preview` 分支已对齐 `origin/preview`）。

- 视觉证据：暂无 375×812 实现截图入库 `docs/workbench/evidence/t028-*.png`；待你验收时按需补图。

- 结论：**PR 检查本地工程门 PASS**。本卡停在 `User Review`，等你签字。`## 后续待施工` 段落继续保留，等真实接口/字段确认后再迭代。

## 后续待施工

- 客服：B-042（AI 客服知识库范围）确定后接入真实大模型 API；

- 退款：B-041（退款 UI 展示字段）确定后在小票详情页加退款状态字段（可退金额 / 退款进度 / 退款时间）；

- 退款记录：真实数据接口。

