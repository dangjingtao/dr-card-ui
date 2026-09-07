# T038｜刮刮充值卡补全

## 状态与类型

- 状态：`Doing`

- 类型：Feature / UI

- 优先级：P2

## 当前事实与差距

- 用户 2026-09-07 上传刮刮充值卡截图（小程序原版），要求补全"刮刮充值卡"页面，并保持卡博士 APP 淡金色风格。
- 当前 `ProfileHome` 宫格中「刮刮充值卡」点击后只 `alert("刮刮充值卡 施工中")`，没有真实页面与流程。
- `cardStore` 已有 `topupCard / recordsActions / TopupRecord` 等 mock 能力，可直接复用。
- 项目已支持 5 项业务能力：`topupCard` 累加余额 + 写流水；`getCardTopupRecords` 按卡筛流水；我们要把"刮刮充值卡"作为独立充值入口（按卡号识别卡，再走 topupCard）。

## 目标

1. 新建独立 `/legacy-profile/scratch-card` 页面，承载刮刮充值卡的输入、扫码、充值、记录与提示。
2. 接入 `ProfileHome` 「刮刮充值卡」宫格跳转，移除占位 alert。
3. 视觉风格与卡博士 APP 保持一致：淡金色渐变标题栏、白底圆角输入、金渐变主按钮、金色胶囊记录入口、浅金提示卡。

## 原型范围

- 视觉源：用户上传的刮刮充值卡截图（小程序原版）。
- 用户后续决定：保持卡博士 APP 淡金色品牌色，所以顶部栏、按钮、提示卡统一淡金色系，提示胶囊（小程序原图中的「该小程序近期评价不佳」黄底提示）替换为卡博士风格的「温馨提示」卡。

## 不在范围

- 不做真实卡号/刮刮码校验（mock）。
- 不做真实支付（仅落 mock 充值流水 + 余额）。
- 不做充值码与卡号的真实关联（mock 默认绑定当前第一张卡；无卡时引导去"我的卡"页绑定）。

## 依赖与阻塞决策

| 编号 | 阻塞项 | 风险 | 说明 |
| --- | --- | --- | --- |
| B-044 | 充值码绑定策略 | 中 | 输入的 10 位充值码 mock 校验规则：必须是 10 位数字；按码后 4 位匹配 `card-001` 作为演示；不匹配时弹错误提示。 |
| B-045 | 无卡场景 | 低 | 当前 `useCards` 为空时（演示态切到未绑卡），充值按钮禁用并提示「请先绑定校园卡」。 |

## 实施要求

#### ScratchCardRechargePage（新建，`/legacy-profile/scratch-card`）

- **顶部栏**：金色渐变背景 `linear-gradient(135deg, #D4A853 0%, #E8C97A 50%, #F0D68E 100%)`，返回箭头 + 居中标题「刮刮充值卡」。
- **输入区（白底圆角胶囊）**：
  - 左侧：「请输入 10 位刮刮充值卡充值码」placeholder，限制输入 0-9 + 最大 10 位。
  - 右侧：扫码按钮（lucide `ScanLine` 图标，淡金边框白底）。
- **主操作**：「充值」按钮，金渐变 `from-[#D4A853] to-[#E8C97A]`，撑满，提交中显示 loading。
- **充值记录入口**：白底圆角横条，左侧「充值记录」+ 灰色「最近 0 笔」+ 右侧 chevron；点击跳 `/legacy-profile/my-cards/card-001/topup-records`（复用既有列表）。
- **温馨提示卡**：浅金背景 `#FFF8E8`，3 行说明（卡号只用于充值、不保存密码、不与他人分享）。
- **空态文案**：「没有更多数据了」（在记录入口下方居中灰字）。
- **交互校验**：
  - 输入非 10 位数字 → 红字"请输入 10 位充值码"。
  - 卡号末尾 4 位不匹配演示卡 → 提交时弹错误「充值码无效，请检查后重新输入」。
  - 未勾选协议 → 「请先勾选并同意《用户协议》和《隐私政策》」。
  - 充值成功 → `topupCard('card-001', amount=100, channel='wechat')`（mock 100 元固定金额）；跳 `CardTopupSuccessPage`；返回栈回退到本页时记录已更新。
- **错误状态**：扫码按钮只占位（alert「扫一扫施工中」），不进入主流程。
- **底部固定「已阅读并同意《用户协议》和《隐私政策》」**：与 LoginPage 同款金色协议勾选。

#### ProfileHome 宫格调整

- 「刮刮充值卡」点击：去掉 `alert` 占位，改为 `navigate('/legacy-profile/scratch-card')`。
- 其它宫格行为不变。

#### 路由与状态

- `routes.ts`：新增 `/legacy-profile/scratch-card`，owner 写清与 T038 的关联。
- `router/index.tsx`：import `ScratchCardRechargePage` 并加入 `customPages`。
- `cardStore` 复用既有 `topupCard / getCardTopupRecords`，不新增字段。

## 状态与交互矩阵

- **ScratchCardRechargePage**：默认态 / 输入校验失败 / 加载中 / 充值成功跳转 / 无卡禁用 / 扫码按钮占位 / 协议未勾选提示。
- **ProfileHome**：「刮刮充值卡」宫格点击正确跳转（去 alert）。

## 验收标准

- 入口可达：`/legacy-profile/scratch-card` 在 dev server 返回 200。
- 刮刮充值卡页面所有元素齐：顶部栏、输入框、扫码按钮、充值按钮、充值记录入口、温馨提示、底部协议、空态文案。
- 10 位数字校验 + 后 4 位匹配演示卡的 mock 校验正常工作。
- 协议未勾选时点击充值给出明确错误。
- 充值成功后跳成功页并更新记录条数（再回本页可见"最近 N 笔"变化）。
- 视觉与卡博士 APP 淡金色风格一致（顶部渐变、按钮金渐变、提示浅金底）。
- `npm run typecheck` 与 `npm run build` 通过。

## 必交证据

- 路由与覆盖节点清单。
- ScratchCardRechargePage 375 × 812 截图（默认 / 输入错误 / 充值成功）。
- 状态/交互检查结果。
- 已知差异与未决项。
- 对应提交号。

## 产出

- 新增 `ScratchCardRechargePage.tsx`（`src/pages/legacy/`）。
- `routes.ts` + `router/index.tsx` 注册新路由。
- `ProfileHome.tsx` 调整「刮刮充值卡」入口跳转。
- 本卡文档与证据截图。