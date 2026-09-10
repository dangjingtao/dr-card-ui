# 卡博士主任务卡

## 当前结论

T001–T015 基于 2026-08-21 的仓库与 Mockplus 实际盘点建立，并已形成一轮完整验收基线。T016–T020 已在 T014 范围关闭决策中预留给未来候选业务。

用户于 2026-08-27 明确要求：新需求变更必须新建任务卡，不复用或重开既有 `Accepted` 卡。因此新增 T021–T024 作为 2026-08-27 独立变更批次，旧卡状态保持不变。

2026-08-31 新增 T025–T032：基于《卡博士APP缺失及新增功能》Excel 盘点与会议决策，覆盖积分商城与泡泡值统一、注册登录与个人信息、消息通知、客服退款、充值、设备扫码、积分卡券，以及本期不做项范围关闭。旧卡状态保持不变。

2026-09-03 新增 T033–T035：卡博士APP核心页面补全。诗得丽专栏是卡博士APP的子功能，卡博士APP应有独立的首页、服务页和个人中心。T033/T034/T035 分别覆盖卡博士APP首页、设备服务页和个人中心，构成卡博士APP的三项底部导航骨架；诗得丽品牌专栏通过首页卡片入口进入 `/dearseed`。

2026-09-03 新增 T036：四大设备功能页面（淋浴/洗烘/饮水/吹风）施工，包含设备列表页、设备详情页（金额选择、启动流程、结算、紧急停止、保修悬浮球），与 T033 首页四金刚区入口打通。

2026-09-07 新增 T037：登录页补全。用户上传紫色渐变登录页原型，明确 5 项改动（密码可见切换、二次确认密码、5 次错误显示图形验证码、保留微信登录、登录后引导绑定学校/专业/学号；「我的」同步展示）。

2026-09-07 新增 T038：刮刮充值卡补全。用户上传小程序原版截图并要求保持卡博士淡金色风格，包含 10 位充值码输入、扫码、金渐变充值按钮、充值记录入口、温馨提示卡与空态文案。

2026-09-07 新增 T039：设置消费密码。学生在卡博士 APP 内设置/修改自己的 6 位消费密码。入口位置 2026-09-07 决定：「我的」页宫格新增"消费密码"，紧跟常用设备/收藏设备之后。

2026-09-07 新增 T040：设备列表按钮回滚「扫码启动」+ 设备详情余额栏加快速充值入口。设备列表右侧按钮点击弹本地扫码面板（含模拟扫码完成），完成后进设备详情；余额栏右侧新增「+ 充值」胶囊按钮，点击弹本地快速充值弹窗（4 档金额 + 微信支付 + 充值成功反馈），不跳既有页面。

2026-09-08 新增 T041：设备列表页广告位插入策略调整。原方案「<3 不展示」改为「<3 末尾展示」；淋浴扩到 4 个设备用于中间插入；常用/收藏设备区域同步接入。

2026-09-09 新增 T043–T051：诗得丽品牌专栏施工批次。覆盖卡券弹窗用户区分（T043）、体验券核销说明文案（T044）、签到补签看广告（T045）、专栏头像跳转会员中心（T046）、首张轮播图品牌名替换为"卡博士.极地种子"（T047）、累计打卡天数决策盯死卡（T048，`Needs Decision`）、洗头搭子双方泡泡值决策盯死卡（T049，`Needs Decision`）、生日字段 3 个月修改限制（T050）、「我的」改名「会员中心」（T051）。其中 T043 用户身份识别来源（关爱机 vs 存量）依赖 B-043；T048/T049 等丁总确认后回填并联动实施；T046 与 T051 强联动，统一使用 `/dearseed/membership` 路由。

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
| [T025](./T025-mall-bubble-points-integration.md) | 积分商城与泡泡值体系统一 | User Review |
| [T026](./T026-login-profile-school.md) | 注册登录与个人信息 | Done |
| [T027](./T027-notifications-balance-activity.md) | 消息通知：余额不足与校内外活动 | User Review |
| [T028](./T028-customer-service-refund.md) | 客服中心与退款 | User Review |
| [T029](./T029-recharge.md) | APP 充值功能 | User Review |
| [T030](./T030-device-scan-launch.md) | 设备扫码启动优化 | User Review |
| [T031](./T031-card-coupon.md) | 积分卡券与优惠券 | Needs Decision |
| [T032](./T032-scope-closure-phase2.md) | 范围关闭：本期不做项 | Accepted |
| [T033](./T033-card-doctor-homepage.md) | 卡博士APP首页 | Done |
| [T034](./T034-device-service-page.md) | 设备服务页 | Done |
| [T035](./T035-card-doctor-profile.md) | 卡博士个人中心 | Done |
| [T036](./T036-four-device-features.md) | 四大设备功能页面（淋浴/洗烘/饮水/吹风） | Done |
| [T037](./T037-login-page-completion.md) | 登录页补全（卡博士淡金色风格 + 学校/专业/学号绑定） | PASS |
| [T038](./T038-scratch-card-recharge.md) | 刮刮充值卡补全（卡博士淡金色风格） | PASS |
| [T039](./T039-machine-pin-consume.md) | 设置消费密码（双状态 + 修改/删除） | PASS |
| [T040](./T040-device-quick-recharge.md) | 设备列表扫码启动 + 设备详情快速充值 | PASS |
| [T043](./T043-dearseed-column-coupon-popup.md) | 诗得丽专栏入口：身份选择 Demo + 新人礼包占位 | Agent Review |
| [T044](./T044-shampoo-coupon-verification-copy.md) | 洗发水体验券核销方式说明文案调整（使用指引 + 去 radio） | User Review |
| [T045](./T045-dearseed-checkin-miss-remedy.md) | 诗得丽专栏签到：未签 X 标记 + 补签看广告 | User Review |
| [T046](./T046-dearseed-home-avatar-to-membership.md) | 诗得丽专栏首页右上角头像：跳转专栏「我的」 | User Review |
| [T047](./T047-dearseed-banner-rebrand-to-polarseed.md) | 诗得丽专栏首张轮播图品牌名替换：卡博士.极地种子 | Agent Review |
| [T048](./T048-dearseed-checkin-streak-duration-decision.md) | 累计打卡活动天数：决策待定盯死卡 | Needs Decision |
| [T049](./T049-dearseed-buddy-invite-bubble-points-decision.md) | 邀请成为洗头搭子：双方泡泡值奖励决策 | Needs Decision |
| [T050](./T050-dearseed-membership-birthday-3-month.md) | 诗得丽专栏会员中心：生日字段 3 个月修改限制 | Ready |
| [T051](./T051-dearseed-my-page-rename-membership-center.md) | 诗得丽专栏「我的」页改名「会员中心」 | Agent Review |
| [T052](./T052-coupon-movie-ticket-style.md) | 卡包卡券列表：电影票样式 | Done |

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

T036 为四大设备功能页面施工：
- 淋浴/洗烘/饮水/吹风 四套设备共用列表页+详情页组件，通过主题色区分
- T033 首页四金刚区 → T036 设备列表页 → T036 设备详情页 的动线已打通
- 与 T034 (设备服务页) 的关系：T034 为"服务"Tab 聚合入口，T036 为各设备独立功能页

T037 为登录页补全：
- 基于 T026 已实现的微信登录框架，补齐手机验证码登录与学号登录
- 视觉复用 T026 金色渐变风格，验证码 6 格输入参考消费密码核销样式
- 与 T026 (注册登录/个人信息) 共享 userInfoStore 与登录后状态

T043–T051 为诗得丽品牌专栏施工批次（2026-09-09）：
- T043 (专栏卡券弹窗用户区分) 与 B-043（关爱机用户身份识别来源）耦合，需先确认后端字段
- T046 (专栏首页头像跳转) 与 T051 (「我的」改名「会员中心」) 强联动，统一路由 `/dearseed/membership`；建议 T051 先落地、T046 再指向新路由
- T048 (累计打卡天数) 与 T049 (洗头搭子泡泡值) 为 `Needs Decision` 盯死卡，等丁总确认后回填，并联动 T045 / T007 等相关施工卡
- T050 (生日 3 个月限制) 复用 T026 已落地的 userInfoStore，需在 store 中扩展 `lastModifiedAt`
- 旧卡 T041 / T042 不在本批索引范围
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
