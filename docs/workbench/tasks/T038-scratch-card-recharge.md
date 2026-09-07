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
  - 右侧：扫码按钮（lucide `ScanLine` 图标，淡金边框白底），点击 `navigate('/legacy-home/scan')` 进入扫一扫。
- **主操作**：「充值」按钮，金渐变 `from-[#D4A853] to-[#E8C97A]`，撑满，提交中显示 loading。
- **扫码回弹逻辑**：点击扫码按钮时设置 `pendingReturnRef = true`，跳转扫一扫；通过监听 `location.key` 递增判定用户从扫一扫返回，回到本页 2s 后自动弹「充值成功」弹窗。
- **充值成功弹窗**：金色对勾 + 「充值成功」+ 灰色文案「刮刮充值卡已到账，可在『我的卡』查看最新余额」；底部「返回我的」/「继续充值」两个按钮。
- **去除冗余区块**（2026-09-07 用户决定）：去掉「充值记录」横条、「温馨提示」卡、「底部协议勾选」三个区块，页面只保留顶部栏、输入 + 扫码、充值按钮、弹窗。
- **交互校验**：输入非 10 位数字 → 红字「请输入 10 位数字充值码」；点击充值 → loading → 600ms 后弹「充值成功」。

#### ProfileHome 宫格调整

- 「刮刮充值卡」点击：去掉 `alert` 占位，改为 `navigate('/legacy-profile/scratch-card')`。
- 其它宫格行为不变。

#### 路由与状态

- `routes.ts`：新增 `/legacy-profile/scratch-card`，owner 写清与 T038 的关联。
- `router/index.tsx`：import `ScratchCardRechargePage` 并加入 `customPages`。
- `cardStore` 复用既有 `topupCard / getCardTopupRecords`，不新增字段。

## 状态与交互矩阵

- **ScratchCardRechargePage**：默认态 / 输入校验失败 / 加载中 / 充值成功弹窗 / 扫码进入扫一扫 → 2s 后回弹充值成功弹窗。
- **ProfileHome**：「刮刮充值卡」宫格点击正确跳转（去 alert）。

## 验收标准

- 入口可达：`/legacy-profile/scratch-card` 在 dev server 返回 200。
- 页面元素精简到：顶部栏、输入框、扫码按钮、充值按钮、充值成功弹窗。
- 10 位数字校验正常工作。
- 点击扫码按钮跳转 `/legacy-home/scan`（卡博士通用扫一扫页），从扫一扫返回 2s 后自动弹出「充值成功」弹窗。
- 充值按钮直接走「loading → 充值成功弹窗」（不再额外校验协议 / 卡号匹配）。
- 视觉与卡博士 APP 淡金色风格一致（顶部渐变、按钮金渐变、弹窗金色对勾 + 浅金底圆形图标）。
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