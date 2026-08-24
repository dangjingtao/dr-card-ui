# T006 决策记录｜会员、泡泡值、打卡与澡运

- 决策日期：2026-08-22
- 决策卡：T006（节点 #4 #5 #6 #7 #8 #21 #22 #26 #41）
- 决策类型：还原口径 / 未决规则隔离 / 工程约定
- 决策范围：`/membership`、`/membership/levels`、`/points`、`/checkin`、`/luck`、`/luck/result`
- 决策人：施工方（未获用户当轮确认的部分一律不定稿，仅登记隔离）
- 状态：本轮实现完成，`#5 #7 #26 #41` 的产品规则仍待用户决策

## 1. 决策目的

任务要求「完成会员等级、泡泡值、打卡/补签状态；随机澡运和重抽规则先隔离」，同时不得自行补写尚未确认的产品规则。
因此本轮把 T006 拆成两类：

- **摹客已确认的表达**：按 `docs/prototype/02-membership-and-checkin.md` 逐字还原并落成可达状态。
- **原型未给出的规则**：不在页面里猜实现，集中登记到夹具的规则开关（`LUCK_RULE_STATUS` / `CHECKIN_RULE_STATUS` / `MEMBER_RULE_STATUS`），页面只读开关，不写判定逻辑。

## 2. 决策结论

| 编号 | 决策 | 依据 | 关联节点 |
| --- | --- | --- | --- |
| D-022 | #6 会员中心四入口文案按摹客 §1 逐字还原为 **今日澡运 / 是日任务 / 优惠卡包 / 洗头搭子**，不沿用历史稿的「今日幸运 / 每日任务」写法；入口去向 `/luck`、`/checkin`、`/card`、`/buddy` | `prototype/02` §1；AGENTS §7「不随意改原型文案」 | #6 |
| D-023 | #21 打卡日历按摹客 §6 实现为**单月月历**（周期 `2026.06.01 - 2026.06.30`，30 天、首日周一、夹具「今天」= 12 日），四态为 已签到 / 今日已签到 / 可补签 / 未到；**不提供月份切换**（原型只画当前周期，切换范围与越界表现未给出） | `prototype/02` §6 | #21 #8 |
| D-024 | #4 打卡提示、#22 补打卡成功统一走 `?overlay=` 弹层承载（`reminder` / `make-up-success`），不做独立页面；补签点击后跳 `/checkin?overlay=make-up-success` 形成可连续操作的链路 | `prototype/02` §4 §7；沿用项目 `useOverlay()` 约定 | #4 #22 |
| D-025 | #41 抽取成功**默认态只呈现摹客已确认的奖励表达**（「恭喜你获得 50🫧」+ 关闭返回会员中心）；历史稿的大吉/中吉/小吉三档与「再抽一次」仅在显式 `?state=great\|good\|minor` 夹具下出现，且必须带**未定稿隔离标识**；`nextLuck()` 为确定性推进（great→good→minor→great），验收期间无随机漂移 | 任务指令「随机澡运和重抽规则先隔离」；B-003 未决 | #41 #7 |
| D-026 | #5 泡泡值流水金额以 `{ amount: 绝对值, kind: 'income' \| 'expense' }` 建模，符号与配色由 `kind` 决定，页面不解析字符串；筛选 全部/收入/消耗 为确定性过滤，不做排序扰动 | `prototype/02` §3 的三 Tab | #5 |
| D-027 | #5 流水时间锚点统一到 `CHECKIN_CYCLE_LABEL` 的 2026-06 周期（最新一条落在夹具「今天」2026-06-12）。原型未画流水日期，**此项只统一展示口径**，条目、金额、增减类型、条数一律不动，B-002 仍未决 | 消除 T006 自身夹具内的时间自相矛盾（原为 2026-08） | #5 |
| D-028 | #26 会员等级页在页面上明示原型备注「本页为会员等级分级，仅开会时作展示。」，**不展示权益矩阵、升级进度与未解锁判定**（原型均未画）；LV.1–LV.4 与四款限定卡面沿用历史稿并挂 B-022/B-023 | `prototype/02` §2；AGENTS §5 | #26 |
| D-029 | LV.4 命名此前同页出现「深鲨传说 / 溱蜜传说」两种写法，统一取会员等级页在用的**溱蜜传说**，收敛到夹具 `MEMBER_PROFILE` 单一来源；整体等级命名仍待确认 | 同页自相矛盾属实现缺陷，不属产品差异 | #6 #26 |
| D-030 | `/points` 底部主操作改用项目既有的**滚动列表页 sticky 约定**（`sticky bottom-0` + `pb-[calc(1rem+env(safe-area-inset-bottom))]`，见 `NotificationDetail.tsx`），不再用 `fixed` + TabBar 高度偏移——`/points` 是二级页，`MobileLayout` 只在 Tab 路由渲染 `BottomNav`，按 TabBar 高度抬升会导致按钮下方漏出内容并压住末条流水 | `MobileLayout.tsx` `showNav = isTabPath(...)`；house 约定 | #5 |

## 3. 决策细节

### 3.1 澡运隔离方式（对应任务指令）

隔离没有采用「删掉三档」的做法，而是**降级为显式夹具**，保证既不丢历史素材、也不让未定稿规则成为默认行为：

- `LUCK_RULE_STATUS = { confirmed: false, blocker: 'B-003', isolatedNote: '签运档位、重抽与结果持久化规则未确认…' }`
- `/luck` 默认态只有摹客确认的「抽取今日澡运」按钮；`?state=drawn` 才出现结果入口，并标注未定稿。
- `/luck/result` 默认态：奖励文案可见、**隔离标识 0、档位名 0**；`?state=great|good|minor` 三档各自出现档位名并**同时出现隔离标识**。
- 结果由 `resolveLuck()` 从 URL 取值，非法值回退首档；`nextLuck()` 环形推进，全链路无 `Math.random()`。

### 3.2 打卡状态推导

`CHECKIN_CALENDAR` 由 `CHECKIN_TODAY` + `CHECKIN_DONE_DAYS` 推导，不硬编码 30 个状态；`CHECKIN_STREAK` 由「自今天向前连续计数」得出（当前 5），避免文案与日历打架。6、7 日留空作为「漏签可补签」演示。

### 3.3 未确认规则的登记位置

| 规则 | 开关 | 阻塞 | 页面表现 |
| --- | --- | --- | --- |
| 月份切换 | `CHECKIN_RULE_STATUS.monthSwitch` | B-019 | 不提供切换控件 |
| 补签消耗 / 次数上限 / 不可补签判定 | `CHECKIN_RULE_STATUS.makeup` | B-020 | 仅演示「漏签→补签成功」，不做扣减与拦截 |
| #22 广告位与关闭倒计时 | `CHECKIN_RULE_STATUS.makeupAd` | B-021 | 不实现广告位 |
| 「为你精选」商品清单 | `CHECKIN_PICKS` 注释 | B-018 | 只复用项目内已有商品文案与 §3 已确认的 200🫧 消耗 |
| 连续 10 天奖励值 | `CHECKIN_REWARDS[1].bubble` 留空 | — | 页面显示待确认标记，不补数字 |
| 等级数量/命名/卡面清单 | `MEMBER_RULE_STATUS.levelNaming` | B-022 | 沿用四级，页面标注展示稿 |
| 等级权益/升级门槛/未解锁 | `MEMBER_RULE_STATUS.levelProgress` | B-023 | 不展示权益矩阵与升级进度 |
| 泡泡值配色改造与 mock 沿用 | `BUBBLE_RECORDS` 注释 | B-002 | 沿用已有条目，不增不删 |
| 澡运档位/重抽/持久化 | `LUCK_RULE_STATUS` | B-003 | 见 §3.1 |

## 4. 实现映射

| 关注点 | 文件 |
| --- | --- |
| T006 夹具与规则隔离区（仅本任务区段） | [fixtures/index.ts](../../../src/app/fixtures/index.ts) |
| 路由状态/弹层登记（仅 T006 区段） | [routes.ts](../../../src/app/router/routes.ts) |
| #6 会员中心 | [Membership.tsx](../../../src/pages/Membership.tsx) |
| #26 会员等级 | [MembershipLevels.tsx](../../../src/pages/MembershipLevels.tsx) |
| #5 泡泡值明细 | [Points.tsx](../../../src/pages/Points.tsx) |
| #21 #8 #4 #22 打卡日历与弹层 | [Checkin.tsx](../../../src/pages/Checkin.tsx) |
| #7 今日澡运 | [Luck.tsx](../../../src/pages/Luck.tsx) |
| #41 抽取成功 | [DrawSuccess.tsx](../../../src/pages/DrawSuccess.tsx) |
| 截图与断言脚本 | [capture-t006.mjs](../../../scripts/capture-t006.mjs) |

未改动：`Header` / `TitleBar` / `BottomNav` / `PageContainer` / Com Design 组件 / 全局 Token。

## 5. 状态与夹具矩阵

| 节点 | 可达 URL |
| --- | --- |
| #6 会员中心 | `/membership` |
| #26 会员等级 | `/membership/levels` |
| #5 泡泡值明细-全部 | `/points` |
| #5 仅收入 / 仅消耗 / 无记录 | `/points?state=income` · `?state=expense` · `?state=empty` |
| #21 打卡日历 | `/checkin` |
| #8 打卡成功 | `/checkin?state=success` |
| #4 打卡提示弹窗 | `/checkin?overlay=reminder` |
| #22 补打卡成功弹窗 | `/checkin?overlay=make-up-success`（也由日历补签点击进入） |
| #7 今日澡运-默认 / 当天已抽过 | `/luck` · `/luck?state=drawn` |
| #41 抽取成功-默认 | `/luck/result` |
| #41 三档（隔离演示） | `/luck/result?state=great` · `?state=good` · `?state=minor` |
| 状态面板（D-020/D-021） | 任一上述 URL 追加 `&debug=1` |

## 6. 工程证据

- `npm run typecheck`（`tsc --noEmit`）：通过，退出码 0。
- `npm run build`：通过，退出码 0。1636 modules transformed；`dist/assets/index-*.css` 48.37 kB（gzip 9.96 kB）、`dist/assets/index-*.js` 361.67 kB（gzip 108.03 kB）。构建耗时随缓存冷热波动（实测 4.35s–8.27s），不作为验收指标。
- 截图：`BASE_URL=http://127.0.0.1:5174 node scripts/capture-t006.mjs`，17 张 375×812 截图见 `../evidence/screenshots/t006-*.png`。
- 控制台：**无 error / warning，断言全部通过**；已知框架噪音（React Router v7 future flag）38 条，与 T006 无关，按 `capture-t009.mjs` 既有约定归入 `known[]` 不计入问题。

### 6.1 逐条运行时断言

```text
#6 四入口: 今日澡运 / 是日任务 / 优惠卡包 / 洗头搭子
#6 泡泡值余额入口=true 本期活动区块=true ; → /points ; → /membership/levels
#26 原型备注=true 等级数=4 当前等级=LV.4
#5 余额=1,280 全部记录=15 条 ; income 符号=+ ; expense 符号=- ; empty 文案=true
#21 周期=2026.06.01 - 2026.06.30 已签到=9 今天=1 可补签=2 未到=18
#8 打卡成功态=true ; #4 提示弹窗=true TIPS=true ; #22 URL=/checkin?overlay=make-up-success
#7 默认态抽取按钮=true ; ?state=drawn 结果入口=true 未定稿标注=true
#41 默认: 奖励文案=true 隔离标识=0 档位名=0 ; great=大吉 / good=中吉 / minor=小吉 各带隔离标识 ; → /membership
D-020 /checkin 默认态调试面板=0 ; /checkin?debug=1 states=2（含默认） overlays=3（含关闭）
```

日历四态合计 9 + 1 + 2 + 18 = 30，与 `CHECKIN_MONTH_DAYS` 一致。

### 6.2 交互记录

脚本实测的**点击**交互（`click()` + `waitForURL()` 或弹层断言）：

| 操作 | 起点 | 实测结果 |
| --- | --- | --- |
| 点「泡泡值余额 1280」 | `/membership` | → `/points` |
| 点「查看等级」 | `/membership` | → `/membership/levels` |
| 点日历漏签日「6 日补签」 | `/checkin` | 弹窗出现，URL → `/checkin?overlay=make-up-success` |
| 点「返回会员中心」 | `/luck/result` | → `/membership` |
| 点调试面板状态/弹层胶囊 | `/checkin?debug=1` | states=2（含默认）、overlays=3（含关闭）均可切换 |

以 `?state=` / `?overlay=` 夹具直达并断言的状态（不经点击）：`/points` 的 income/expense/empty、`/checkin?state=success`、`/checkin?overlay=reminder`、`/luck?state=drawn`、`/luck/result?state=great|good|minor`。

### 6.3 脚本约定

沿用 `capture-t009.mjs`：chromium、375×812、`isKnownNoise()` 只放行 React Router future flag 警告，其余 console error/warning 一律计为失败；断言失败时脚本非零退出。

## 7. 本轮关闭的实现缺陷

| 项 | 处理 |
| --- | --- |
| #6 四入口沿用历史稿「今日幸运 / 每日任务」，与摹客文案不一致 | D-022 逐字还原 |
| #41 三档 + 随机重抽为默认行为 | D-025 降级为显式夹具 + 隔离标识，全链路去随机 |
| LV.4 同页两种命名 | D-029 收敛到 `MEMBER_PROFILE` |
| T006 夹具内部时间锚点自相矛盾（流水 2026-08 vs 周期 2026-06） | D-027 统一到 06 周期，不改条目与金额 |
| `/points` 固定 CTA 按 TabBar 高度偏移、压住末条流水 | D-030 改用 house 的 `sticky bottom-0` |

## 8. 未决与风险

- **B-002**（泡泡值配色改造与 mock 沿用）、**B-003**（澡运档位/重抽/持久化）仍开放，是 #5 / #41 能否验收的前提。
- 新登记：**B-018**「为你精选」无视觉稿、**B-019** 月份切换、**B-020** 补签消耗与不可补签判定、**B-021** #22 广告位与倒计时、**B-022** 等级数量/命名/卡面清单、**B-023** 等级权益/升级门槛/未解锁判定。
- 因此 T006 九节点本轮判 `Implemented`，**不自判 Verified**；带阻塞的 #5 #7 #26 #41 需用户就上述 B 项定案后才能定稿。
- `CHECKIN_REWARDS` 中「连续 10 天」奖励值故意留空，若后续产品给值，只需补夹具，无需改页面。
