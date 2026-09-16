# T029｜APP 充值功能

## 状态与类型

- 状态：`User Review`（2026-09-07 完成核心闭环施工 + 充值/退款记录页 + 卡详情入口；阻塞项 B-043/B-044 等运营决策）
- 类型：Feature / Payment
- 优先级：P2（会议补充）

## 当前事实与差距

- 当前 APP 未实现充值功能。
- 会议讨论决定：APP 支持充值，交互参见小程序。

## 目标

实现 APP 内充值功能，交互和流程参照小程序充值逻辑。

## 原型范围

- 需求来源：2026-08-31 会议笔记 + 小程序充值交互参考。
- 参照文件：`卡博士APP缺失及新增功能.xlsx` Sheet2「APP充值功能」#19。

## 不在范围

- 不做充值后的分账、结算逻辑（仅前端充值流程）。
- 不接入第三方支付 SDK（V1 可用 H5 收银台或 WebView 支付页）。

## 依赖与阻塞决策

| 编号 | 阻塞项 | 风险 | 说明 |
| --- | --- | --- | --- |
| B-043 | 充值支付通道 | 高 | 需确认微信支付/支付宝等支付接入方式 |
| B-044 | 充值金额档位 | 中 | 需确认充值档位及赠送规则 |

## 实施要求

- 充值入口放在「我的」页面或账户余额区域。
- 充值流程：选择金额 → 确认支付 → 支付成功/失败反馈。
- 交互参照小程序，保持一致性。
- 充值成功后余额实时更新。

## 状态与交互矩阵

- 充值入口默认态。
- 充值金额选择页。
- 支付中状态。
- 支付成功/失败反馈页。
- 充值后余额更新。

## 验收标准

- 充值流程完整可用，交互与小程序一致。
- 支付成功/失败有正确反馈。
- 充值后余额正确更新展示。

## 实施与证据（2026-09-07 闭环施工，状态 → User Review）

### 落地文件

| 文件 | 作用 |
| --- | --- |
| `src/pages/legacy/cardStore.ts` | `CardInfo.balance` + `TopupRecord` 流水 store + `topupCard` / `refundCard` / `recordTopupFailure` / `getCardTopupRecords` / `getCardRefundRecords` |
| `src/pages/legacy/CardTopupPage.tsx` | 充值页：金额选择 + 微信/支付宝 + 支付中遮罩 + mock 失败触发器 + 退款按钮接 prompt 输入金额 |
| `src/pages/legacy/CardTopupSuccessPage.tsx` | 新建：充值成功反馈页（绿勾 + 金额 + 支付方式 + 查看充值记录/完成） |
| `src/pages/legacy/CardTopupFailPage.tsx` | 新建：充值失败反馈页（红叉 + 失败原因 + 重新充值/返回卡详情） |
| `src/pages/legacy/CardTopupRecordsPage.tsx` | 新建：充值记录列表页（顶部余额卡 + 流水列表） |
| `src/pages/legacy/CardRefundRecordsPage.tsx` | 新建：退款记录列表页（顶部余额卡 + 红色 -¥ 流水） |
| `src/pages/legacy/CardDetailPage.tsx` | 底部加余额行 + 「> 去购买」链接 + 充值/退款记录入口卡（图标 + chevron） |
| `src/pages/legacy/MyCardsPage.tsx` | 顶部渐变 + 多张卡列表 + 绑定卡按钮始终保留 |
| `src/app/router/routes.ts` / `index.tsx` | 登记 5 条子路由：topup / success / fail / topup-records / refund-records |

### PRD 检查（2026-09-07）

| 验收项 | 状态 |
| --- | --- |
| 充值入口：卡详情底部「去购买」+ 设置消费卡 | ✅ PASS |
| 多张卡支持：cardStore 数组化 | ✅ PASS |
| 金额选择：6 个快捷档位 + 自定义输入 | ✅ PASS |
| 支付方式：微信 + 支付宝二选一 | ✅ PASS |
| 支付中状态：全屏 loading 遮罩 | ✅ PASS |
| 支付成功反馈页：绿勾 + 金额 + 支付方式 + 查看记录/完成 | ✅ PASS |
| 支付失败反馈页：红叉 + 失败原因 + 重新充值 | ✅ PASS |
| 支付失败模拟：左下角开发工具开关 | ✅ PASS |
| 充值后余额实时更新：topupCard 写 store，卡详情/列表同步 | ✅ PASS |
| 充值记录列表页：余额卡 + 流水（成功/失败/进行中） | ✅ PASS |
| 退款记录列表页：余额卡 + 流水（红色 -¥） | ✅ PASS |
| 退款流程：prompt 输入金额 + 校验 + 扣余额 + 写流水 | ✅ PASS |
| 工程门：typecheck 通过 / 5 条路由全登记 | ✅ PASS |

### 阻塞项更新

| 编号 | 状态 | 说明 |
| --- | --- | --- |
| B-043 | 保留 | 真实支付通道未集成，现在用 mock setTimeout 1.2s，等运营/后端确认微信/支付宝接入方式 |
| B-044 | 保留 | 充值金额档位 + 赠送规则待运营确认，6 个快捷金额是临时拍的 |

### 后续待施工

- 真实支付 SDK 接入（替换 mock 倒计时）
- 充值档位 + 赠送规则真实化
- 退款流程改用内嵌弹层（替代 window.prompt，UX 更优）
- 充值页顶部红色「卡」logo 视觉优化
- 失败/成功页视觉精修（如加上卡信息摘要）