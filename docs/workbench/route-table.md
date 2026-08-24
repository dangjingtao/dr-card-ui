# 卡博士 路由 / 状态表（T004 产出）

> 单一事实源：`src/app/router/routes.ts`（路由注册表）。本表由该注册表导出。
> 生成日期：2026-08-21
> 覆盖口径：60 个实施节点全部可定位；12 个暂缓节点（#1、#3、#9、#10、#31、#45–#47、#50–#53）不注册业务路由。

## 1. 已确认决策（用户 2026-08-21 在当前任务中确认，优先级最高）

| # | 决策点 | 结论 |
| --- | --- | --- |
| D1 | 主 Tab 数量与主导航形态 | 当前实现以注册表为准：保留五项底部 Tab：首页 / 泡泡 / 扫码 / 服务 / 我的。旧的“首页 / 卡包 / 兑换 / 我的”四项快照已被替代；`/card` 与 `/exchange` 保留为二级可达路径。 |
| D2 | 诗得丽专栏入口形态 | **已被 D-054 覆盖**：根路由 `/` 仅承载卡博士 APP 首页；独立路由 `/dearseed` 承载诗得丽专栏，首页卡片进入、专栏左上返回首页。 |
| D3 | H5/APP 边界 | H5 商城（#17/#48/#49）承载为 **WebView 边界页**（`src/pages/WebViewBoundary.tsx`），提供加载/已加载/失败三态 fixture。 |

## 2. 一级 Tab（5 项）

| 路径 | 标签 | 图标 | 承载节点 | 任务卡 | 说明 |
| --- | --- | --- | --- | --- | --- |
| `/` | 首页 | Home | — | T005 | 卡博士 APP 首页；「诗得丽品牌专栏」卡片进入 `/dearseed?overlay=reminder` |
| `/points` | 泡泡 | CircleDot | #5 | T006 | 泡泡值余额、收入/消耗筛选与流水明细；用户于 2026-08-24 明确纠正原 `/checkin` 映射 |
| `/card/verify` | 扫码 | QrCode（中间凸起） | #67 | T009 | 扫码核销，点击扫描框进入确认核销 |
| `/membership` | 服务 | Headset | #6 | T006 | 会员中心 |
| `/profile` | 我的 | UserRound | #19、#20 | T011 | `?overlay=app-prompt` |

## 3. 二级页路由

### T005 专栏首页与新人流程

| 路径 | 节点 | 入口 | 返回目标 | 状态参数 |
| --- | --- | --- | --- | --- |
| `/dearseed` | #2、#23 | APP 首页-「诗得丽品牌专栏」 | APP 首页 | `?state=claimed`；`?overlay=reminder/newcomer/app-guide` |
| `/onboarding` | #14、#24 | 专栏-新人弹窗「去完善信息」 | 诗得丽专栏 | `?state=student` |
| `/onboarding/success` | #25 | 完善信息提交成功 | 诗得丽专栏 | — |
| `/claim/success` | #15 | 专栏-本期活动领取 | 诗得丽专栏（已领取态） | — |
| `/brand-culture` | #16 | 专栏-服务区「品牌文化」 | 诗得丽专栏 | — |

### T006 会员、泡泡值、打卡与澡运

| 路径 | 节点 | 入口 | 返回目标 | 状态参数 |
| --- | --- | --- | --- | --- |
| `/membership` | #6 | 首页-「会员空间」 | 首页 | — |
| `/membership/levels` | #26 | 会员中心-等级 | 会员中心 | — |
| `/checkin` | #4、#8、#21、#22 | 首页-今日签到 | 首页 / 会员中心 | `?state=success`；`?overlay=reminder/make-up-success` |
| `/luck` | #7 | 首页-今日澡运 | 首页 / 会员中心 | — |
| `/luck/result` | #41 | 今日澡运-抽取 | 今日澡运 / 首页 | `?result=great/good/minor`（确定性 fixture，去随机化） |

### T007 搭子与邀请闭环

| 路径 | 节点 | 入口 | 返回目标 | 状态参数 |
| --- | --- | --- | --- | --- |
| `/buddy` | #27、#28 | 首页/我的-绑定搭子 | 首页 / 我的 | `?state=empty/list` |
| `/buddy/invite` | #29、#30 | 搭子-邀请 | 搭子 | `?state=no-app` |
| `/buddy/invite/phone` | #32、#33 | 邀请-手机号搜索 | 邀请 | `?state=success` |
| `/buddy/invite/qrcode` | #34、#35 | 邀请-二维码 | 邀请 | `?state=saved/link-copied` |
| `/buddy/accept` | #36 | 被邀请人（深链） | 搭子（已绑定） | — |

### T008 洗护兑换与商城链路

| 路径 | 节点 | 入口 | 返回目标 | 状态参数 |
| --- | --- | --- | --- | --- |
| `/exchange` | #18、#37、#38、#39 | 底部 Tab「兑换」 | 底部 Tab | `?state=sort-exchange/sort-points`（默认＝综合）；`?overlay=redeem&product=` |
| `/exchange/result` | #40 | 兑换确认成功 | 洗护兑换专区 | `?product=` |
| `/mall` | #17 | 首页-核心商城 | 首页 | WebView：`?state=loading/loaded/error` |
| `/mall/goods/:id` | #48 | H5 商城-商品 | H5 商城 | WebView 边界页 |
| `/mall/cart` | #49 | H5 商城-购物车 | H5 商城 | WebView 边界页 |

### T009 卡包、核销、转赠与兑换码

| 路径 | 节点 | 入口 | 返回目标 | 状态参数 |
| --- | --- | --- | --- | --- |
| `/card` | #54、#62–#64 | 底部 Tab「卡包」 | 底部 Tab | `?state=available/used/expired`；`?overlay=use&coupon=` |
| `/card/share` | #65、#66 | 卡包-转赠 | 卡包 | `?coupon=`；`?state=success` |
| `/card/verify` | #67 | 卡包-使用 | 卡包 | — |
| `/card/verify/confirm` | #67 | 扫码页 / 使用弹层 | 卡包 | `?state=done/repeat`；确认后回 `/card?state=used` |
| `/redeem` | #68、#69 | 我的-卡券兑换 | 我的 / 卡包 | `?state=success/format/invalid/used/network`（12 位规则按 reference 标准页确认，B-009 已关闭） |

### T010 地址与订单

| 路径 | 节点 | 入口 | 返回目标 | 状态参数 |
| --- | --- | --- | --- | --- |
| `/address` | #55 | 我的-地址管理；H5 商城地址 | 我的 / H5 商城 | `?state=empty`（无收货地址） |
| `/address/new` | #60 | 地址管理-添加新地址 / 编辑（`?id=`） | 地址管理 | `?state=invalid`（必填校验未通过）；`?id=<addressId>` 回填编辑（D-043） |
| `/orders` | #56 | 我的-订单管理 | 我的 | `?state=completed/ongoing/aftersale/empty`（默认＝全部订单，D-047） |
| `/orders/:id` | #72 | 订单管理-订单项 | 订单管理 | 无 `state`；`:id` 未命中渲染兜底空态 |

### T011 我的、设置与 APP 引导

| 路径 | 节点 | 入口 | 返回目标 | 状态参数 |
| --- | --- | --- | --- | --- |
| `/profile` | #19、#20 | 底部 Tab「我的」 | 底部 Tab | `?overlay=app-prompt` |
| `/settings` | #59、#61 | 我的-资料区（头像/铅笔）；会员-顶栏齿轮 | 我的 | `?overlay=discard` |

### T012 通知与消息详情

| 路径 | 节点 | 入口 | 返回目标 | 状态参数 |
| --- | --- | --- | --- | --- |
| `/notifications` | #11、#42、#43 | 首页/我的-通知 | 首页 / 我的 | `?state=unread`；`?overlay=clear` |
| `/notifications/:id` | #44 | 通知-消息项 | 通知列表 | — |

### T013 福利官、智能/人工客服

| 路径 | 节点 | 入口 | 返回目标 | 状态参数 |
| --- | --- | --- | --- | --- |
| `/service/welfare-officer` | #57 | 我的-品牌福利官 | 我的 | — |
| `/service/chat` | #58、#71 | 我的-客服中心 | 我的 | `?state=conversation`、`?state=failed`；`?overlay=request-human` |
| `/service/chat/human` | #70 | 暂无业务入口（原型未给 #71 → #70 的前进动作，未确认故不实现）；本轮由直达路由与 `?debug=1` 验收 | 智能客服 | `?state=queuing`、`?state=connected` |

### 系统路由

| 路径 | 说明 |
| --- | --- |
| `*` | 404（`src/pages/NotFound.tsx`），提供回首页入口 |
| `/draw-success` | 已移除；原语义（随机签运）迁移至 `/luck/result` 并去随机化 |

## 4. 60 节点覆盖核算

```text
T005: 2,12,13,23,14,24,25,15,16                 = 9
T006: 5,6,26,21,8,4,22,7,41                      = 9
T007: 27,28,29,30,32,33,34,35,36                 = 9
T008: 18,37,38,39,40,17,48,49                    = 8
T009: 54,62,63,64,68,69,65,66,67                 = 9
T010: 55,60,56,72                                = 4
T011: 19,20,59,61                                = 4
T012: 11,42,43,44                                = 4
T013: 57,58,71,70                                = 4
合计: 60                                         = 60（实施节点）
```

- 节点唯一性：上述 60 个节点互不重复，且与 12 个暂缓节点（#1、#3、#9、#10、#31、#45–#47、#50–#53）不重叠。
- 校验脚本：`scripts/verify-t004.mjs`（运行断言）；覆盖计数由注册表人工核算并记录。

## 5. 确定性状态夹具约定

- 状态来源：URL 参数 `?state=` / `?result=`（页面状态）与 `?overlay=`（弹层），全部静态 fixture，**禁止 Math.random**。
- fixture 注册表：`src/app/fixtures/index.ts`（今日澡运签运序列为确定性推进 great→good→minor→great）。
- URL 控制器：`src/app/fixtures/useFixture.ts`（`useFixtureState` / `useOverlay`）。
- 弹层夹具渲染：`src/components/mobile/FixtureOverlay.tsx`（dialog / bottom-sheet 由 `?overlay=` 打开，可直达截图，无需改源码）。
- 施工占位：`src/pages/NodeStub.tsx` 明确标记「TXXX 施工中」，不伪装完成。

## 6. 壳层处理（T004）

- 安全区：顶部 `env(safe-area-inset-top)`，底部 `env(safe-area-inset-bottom)`（`index.html` 已 `viewport-fit=cover`）。
- 底部导航遮挡：一级 Tab 页内容底部预留 `4rem + 底部安全区`；二级页不显示底部导航（`src/layouts/MobileLayout.tsx`）。
- Tab 高亮：子路径（如 `/card/verify`）仍高亮所属 Tab（`src/components/mobile/BottomNav.tsx`）。
- 深链刷新：BrowserRouter + 顶层 `*` 404 兜底；直达 `/checkin` 等可正常刷新（验证脚本覆盖）。
- 404：`/no-such-page` 渲染「页面不存在」并回首页（验证脚本覆盖）。

## 7. 自检证据

- T001 当前五项 Tab 的 375 × 812 种籽页截图命名：`docs/workbench/evidence/screenshots/t001-seed-{home,points,scan,membership,profile}.png`。`t001-seed-checkin.png` 与 `t004-*.png` 保留为历史证据。
- 运行断言：`BASE_URL=http://127.0.0.1:<port> node scripts/verify-t004.mjs`（12 项全部 PASS）。
- 工程检查：`npm run typecheck`、`npm run build` 通过。
- 已知差异与未决：`/draw-success` 旧路由移除；三档签运规则仍待 T006；兑换码位数仍待 T009。
