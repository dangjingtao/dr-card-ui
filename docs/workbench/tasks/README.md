# 卡博士主任务卡

## 当前结论

T001–T015 基于 2026-08-21 的仓库与 Mockplus 实际盘点建立，并已形成一轮完整验收基线。T016–T020 已在 T014 范围关闭决策中预留给未来候选业务。用户于 2026-08-27 明确要求：新需求变更必须新建任务卡，不复用或重开既有 `Accepted` 卡。因此本轮新增 T021–T024 作为独立变更批次，旧卡状态保持不变。

## 卡片索引

| 卡片 | 名称 | 当前状态 |
| --- | --- | --- |
| [T001](./T001-evidence-baseline.md) | 事实基线与验收矩阵 | Accepted |
| [T002](./T002-brand-tokens-assets.md) | 品牌 Token 与素材治理 | Accepted |
| [T003](./T003-ui-components.md) | Com Design 移动组件验真 | Accepted |
| [T004](./T004-shell-routing-state.md) | 应用骨架、路由与状态夹具 | Accepted |
| [T005](./T005-entry-home-onboarding.md) | 专栏首页与新人流程 | Accepted |
| [T006](./T006-membership-checkin-luck.md) | 会员、泡泡值、打卡与澡运 | Accepted |
| [T007](./T007-partner-invite.md) | 搭子与邀请闭环 | Accepted |
| [T008](./T008-mall-exchange.md) | 洗护兑换与商城链路 | Accepted |
| [T009](./T009-wallet-redemption.md) | 卡包、核销、转赠与兑换码 | Accepted |
| [T010](./T010-address-orders.md) | 地址与订单 | Accepted |
| [T011](./T011-profile-settings.md) | 我的、设置与 APP 引导 | Accepted |
| [T012](./T012-notifications.md) | 通知与消息详情 | Accepted |
| [T013](./T013-customer-service.md) | 福利官、智能/人工客服 | Accepted |
| [T014](./T014-deferred-scope.md) | 暂缓、旧稿与试验范围关闭 | Accepted |
| [T015](./T015-e2e-acceptance.md) | 全链路视觉、交互与回归验收 | Accepted |
| [T021](./T021-column-home-newcomer-coupon.md) | 品牌专栏首页与新人体验券 | Agent Review |
| [T022](./T022-points-tasks-luck-entry.md) | 泡泡值任务页与独立明细 | Accepted |
| [T023](./T023-coupon-mall-membership-change.md) | 体验券核销与 H5 商城入口调整 | Accepted |
| [T024](./T024-2026-08-27-ui-change-acceptance.md) | 2026-08-27 UI 变更验收 | User Review |

## 依赖顺序

```text
T001 事实矩阵
 ├─ T002 品牌 Token / 素材
 ├─ T003 基础组件
 └─ T004 路由 / 状态夹具
       ↓
T005–T013 业务页面与流程
       ↓
T015 全链路验收

T014 范围关闭与业务页面并行，但任何转入实现的节点必须先更新 T001 和对应页面卡。

T021–T023 为 2026-08-27 新需求施工卡，完成后统一进入 T024 变更验收。T001–T015 继续作为变更前历史基线，不回写其 `Accepted` 状态；T016–T020 的预留含义保持不变。
```

## 全局验收契约

每张业务页面卡必须同时满足：

1. **原型覆盖**：卡内节点逐一映射到路由或可复现状态，不用一句“已覆盖”代替清单。
2. **视觉证据**：提供原型定位信息、375 × 812 实现截图和差异说明。
3. **状态证据**：默认、空、加载、错误、禁用、成功等状态按卡片矩阵逐项验证。
4. **交互证据**：记录触发器、动作、目标、返回路径与实际结果。
5. **工程证据**：类型检查、构建、直达刷新、控制台检查通过。
6. **用户验收**：智能体最多将卡片推进到 `User Review`；只有用户可以标记 `Accepted`。

若原型、历史稿和现实现冲突，先记录决策，不得以“视觉优化”名义自行选版本。
