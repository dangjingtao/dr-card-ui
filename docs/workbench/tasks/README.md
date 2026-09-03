# 卡博士主任务卡

## 当前结论

T001–T015 基于 2026-08-21 的仓库与 Mockplus 实际盘点建立，并已形成一轮完整验收基线。T016–T020 已在 T014 范围关闭决策中预留给未来候选业务。

用户于 2026-08-27 明确要求：新需求变更必须新建任务卡，不复用或重开既有 `Accepted` 卡。因此新增 T021–T024 作为 2026-08-27 独立变更批次，旧卡状态保持不变。

2026-08-31 新增 T025–T032：基于《卡博士APP缺失及新增功能》Excel 盘点与会议决策，覆盖积分商城与泡泡值统一、注册登录与个人信息、消息通知、客服退款、充值、设备扫码、积分卡券，以及本期不做项范围关闭。旧卡状态保持不变。

2026-09-03 新增 T033–T035：卡博士APP核心页面补全。诗得丽专栏是卡博士APP的子功能，卡博士APP应有独立的首页、服务页和个人中心。T033/T034/T035 分别覆盖卡博士APP首页、设备服务页和个人中心，构成卡博士APP的三项底部导航骨架；诗得丽品牌专栏通过首页卡片入口进入 `/dearseed`。

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
| [T025](./T025-mall-bubble-points-integration.md) | 积分商城与泡泡值体系统一 | Draft |
| [T026](./T026-login-profile-school.md) | 注册登录与个人信息 | Draft |
| [T027](./T027-notifications-balance-activity.md) | 消息通知：余额不足与校内外活动 | Draft |
| [T028](./T028-customer-service-refund.md) | 客服中心与退款 | Draft |
| [T029](./T029-recharge.md) | APP 充值功能 | Draft |
| [T030](./T030-device-scan-launch.md) | 设备扫码启动优化 | Draft |
| [T031](./T031-card-coupon.md) | 积分卡券与优惠券 | Draft |
| [T032](./T032-scope-closure-phase2.md) | 范围关闭：本期不做项 | Draft |
| [T033](./T033-card-doctor-homepage.md) | 卡博士APP首页 | Draft |
| [T034](./T034-device-service-page.md) | 设备服务页 | Draft |
| [T035](./T035-card-doctor-profile.md) | 卡博士个人中心 | Draft |

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

T025–T032 为 2026-08-31 一期需求补全施工卡：
- T025 (积分商城/泡泡值) 为 P0 核心链路，依赖 T031 (积分卡券) 产出实物卡券定义
- T027 (消息通知) 与 T028 (客服退款) 为 P0 体验基础，无页面间强依赖
- T026 (注册登录/个人信息)、T029 (充值)、T030 (扫码启动) 为 P2 独立功能，可并行推进
- T032 (范围关闭) 作为本期不做的验收收口卡，与各卡并行但需各卡确认后方可关闭

T033–T035 为卡博士APP核心页面骨架：
- T033 (卡博士APP首页) / T034 (设备服务页) / T035 (卡博士个人中心) 构成三项底部导航，是卡博士APP的主壳
- 诗得丽品牌专栏 (`/dearseed`) 作为子功能，通过 T033 首页卡片入口进入
- T025–T031 的功能入口整合进 T033/T035 对应区块
- T030 (设备扫码启动) 与 T034 (设备服务页) 衔接
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
