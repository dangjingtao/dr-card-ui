# T021｜品牌专栏首页与新人体验券

## 状态与类型

- 状态：`Agent Review`（需求确认于 2026-08-27，施工与取证已完成，等待评审；智能体不写入 `User Review` / `Accepted`）
- 类型：UI / Flow / Change Request
- 优先级：P0

## 当前事实与差距

- 当前 `/` 是卡博士 APP 首页，`/dearseed` 是独立的诗得丽品牌专栏；本轮需求要求原首页改为新的「诗得丽品牌专栏」。
- 当前首页仍包含金刚区，且没有完整嵌入 `/checkin` 内容。
- 当前新人弹窗不是“随机 1/2 张体验券”的领取流程。
- 本卡是对已验收 T005 的新增需求，不修改 T005 的历史验收结论。

## 目标

完成新版诗得丽品牌专栏首页，并建立新用户随机 1/2 张体验券的领取与关闭路径。

## 原型范围

- 需求文档：[`2026-08-27-ui-change-requirements.md`](../../requirements/2026-08-27-ui-change-requirements.md) §2–§3。
- 复用现有首页、`/dearseed`、`/checkin` 与 `/dearseed?overlay=reminder` 的已确认视觉和组件。

## 不在范围

- 不实现真实新用户识别、随机发券、库存或服务端领取接口。
- 不改造 `/checkin` 内部业务规则。
- 不使用历史设计补齐新的品牌视觉。

## 依赖与阻塞决策

- 依赖现有移动端壳层、Com Design Token、Banner、搜索栏和打卡组件。
- 最终名称按「诗得丽品牌专栏」执行。
- 用户已确认打卡内容暂时全部迁入，但不重复页面标题、返回栏和底部导航。

## 实施要求

- `/` 首屏保留标题、搜索栏、头像和现有 Banner。
- 删除现有金刚区。
- Banner 下完整承载打卡业务内容，之后依次展示公益板块与卡博士品牌故事。
- 公益板块和品牌故事随页面正常滚动；底部导航保持固定。
- 新用户弹窗随机展示 1 张或 2 张体验券及对应商品内容。
- 确定后显示领取成功并进入体验券页面；关闭后停留 `/`。

## 状态与交互矩阵

- 首页默认态。
- 新用户弹窗 1 张体验券态。
- 新用户弹窗 2 张体验券态。
- 领取成功态与跳转体验券页面。
- 关闭弹窗并停留首页。
- 打卡默认、已签到及已有可复现状态嵌入首页后的表现。

## 验收标准

- 375 × 812 下首屏结构、长页滚动与底部导航无重叠。
- 金刚区已移除，搜索栏、头像和 Banner 保留。
- 打卡内容完整且不存在重复页面壳。
- 公益板块与品牌故事顺序正确。
- 1 张和 2 张体验券状态均可确定性复现用于验收。
- 确定与关闭路径均可通过真实点击完成。

## 必交证据

- 新首页首屏与长页截图。
- 1 张/2 张体验券弹窗及领取成功截图。
- 关闭、领取、体验券跳转和打卡交互记录。
- `npm run typecheck`、`npm run build` 与控制台检查结果。

## 产出

- 新版专栏首页、打卡组合方式、新人体验券弹窗及前端演示状态。

### 代码改动

- 新增 `src/components/mobile/CheckinBoard.tsx`：按需求 §2.3「完整迁入但不重复页面外壳」把打卡业务内容抽为共享组件，四段 `section` 的 `aria-label` 为「今日签到状态 / 当月签到日历 / 是日任务 / 为你精选」；只搬内容、状态与主要操作，不带页面标题、返回栏与底部导航。各段自管 `mx-4`，因此宿主必须使用 `inset={false}` 的 `PageContainer`（D-073）。
- `src/pages/Checkin.tsx`：改为消费 `CheckinBoard` 与 `CheckinMakeupSuccessOverlay`，从约 400 行收敛到约 55 行；二级页外壳（返回标题栏、无底部 Tab）与内部业务规则均未改，避免首页迁入造成打卡页退化。
- 新增 `src/components/mobile/CheckinMakeupSuccessOverlay.tsx`：补打卡成功弹窗抽出共用，使补签这一主要操作在首页也能自持反馈（需求 §2.3），节点沿用 `/checkin` 的 #22、不新增节点（D-076）。
- 新增 `src/components/mobile/NewcomerCouponDialog.tsx`：需求 §3.1 的新人体验券弹窗，视觉交互参照 `/dearseed?overlay=reminder` 的 `PromptOverlay`；弹窗内直接展示体验券商品图文与数量（`本次共 N 张体验券` + `ul[aria-label="本次赠送的体验券"]`），并内置 §3.2 的领取成功层。关闭按钮为 `button[aria-label="关闭新人体验券"]`。
- `src/pages/Home.tsx`：按需求 §2.1–§2.2 重写为「诗得丽品牌专栏」首页——保留搜索栏与头像入口、保留既有 `BannerCarousel`，**整块删除金刚区**（淋浴 / 洗烘 / 饮水 / 吹风），Banner 下接 `CheckinBoard`，再依次接公益板块与卡博士品牌故事；两个附加区随页面正常滚动、不吸底不悬浮，底部导航保持既有固定方式。新人券 variant 取值优先读 `?state=`，仅在无参数时按 1:1 抽取一次性默认落点（D-074/D-079）。文件头注释逐条引用需求条款与三项未决阻塞。
- `src/pages/Home.tsx`（用户 2026-08-27 追加口径）：**默认全是新用户**——不带参数进入 `/` 即自动弹出新人体验券。由于 `useOverlay()` 完全由 URL `?overlay=` 驱动、无内部 state，「默认弹出」不能写成 `overlay === null → 弹`（`close()` 删参后会立刻复弹形成死循环），故引入独立的 `autoNewcomer` state 挂载时惰性求值一次，关闭与确定时置 `false`（D-077）。**公益板块暂不实现跳转**——该板块渲染为 `div` 静态承载，不给 `button` 语义、不带入口文案与 `ChevronRight`，「卡博士品牌故事」保留跳 `/brand-culture`（D-079）。
- `src/app/router/routes.ts`：`/` 的 `title` / `titleBarTitle` 改为「诗得丽品牌专栏」，登记 `task: 'T021'`、`states: coupon-1 / coupon-2`、`overlays: newcomer-coupon / coupon-success / make-up-success`。T021 为需求变更新增内容、摹客无对应 artboard，故 `nodes: []`，新人券相关 `node` 记 0 占位，补签弹层 `node: 22`（D-072/D-076）。取证专用参数 `?newcomer=off` 既不是 fixture 状态也不是弹层，因此不进 `states` / `overlays`，`RouteMeta` 也不为它新增字段（现有字段集无「取证参数」语义位），改为就近块注释 + `owner` 文案登记（D-078）。
- `src/app/fixtures/index.ts`：新增 T021 区段——`NewcomerCoupon` 类型、`NEWCOMER_COUPON_VARIANTS`（`coupon-1` 1 张 / `coupon-2` 2 张两组固定券面）、`NEWCOMER_COUPON_DIALOG`、`NEWCOMER_COUPON_SUCCESS`（`actionTo: '/exchange'`）、`COLUMN_HOME_SECTIONS`（公益板块 `action`/`to` 均为 `null` 不跳转、卡博士品牌故事 → `/brand-culture`），以及 `NEWCOMER_COUPON_RULE_STATUS` 按 D-017/D-037/D-049/D-065 的规则隔离模式登记 B-031 / B-032 / B-033，不在页面内自行补写判定逻辑。用户 2026-08-27 定案后三条 `note` 已按新口径收窄（新用户识别 `confirmed: true`）。
- 新增 `scripts/capture-t021.mjs`：本卡专用取证脚本，在真实 375 × 812 视口校验首屏结构、金刚区已移除、打卡内容完整且无重复外壳、附加区顺序与公益板块不可点击、长页滚动与底部导航不重叠、默认自动弹窗与关闭后不复现、`?newcomer=off` 抑制、1/2 张券两态、领取与关闭两条出口、首页补签反馈，并回归 `/checkin`。
- 取证/回归脚本兼容首页默认弹窗（D-078）：`capture-t001.mjs`、`capture-t004.mjs`、`capture-t023.mjs`、`verify-t001.mjs`、`verify-t004.mjs`、`verify-reference-pages.mjs` 中触碰 `/` 的访问一律改为 `/?newcomer=off`；`console-check-t004.mjs` 同时保留 `/` 与 `/?newcomer=off`，因为弹窗态本身也必须无 console error。`capture-t023.mjs` 的 `membershipEntries` 由 3 元组扩为 4 元组，把「访问地址」与「返回后预期 `pathname`」分列，避免 `pathOf()` 只比 pathname 导致断言必然失败。
- `scripts/capture-t005.mjs`（金刚区删除的连带修正，D-080）：该脚本原先点击首页「诗得丽品牌专栏」卡片进入 `/dearseed?overlay=reminder`，而该卡片正是金刚区的一部分，已随 D-072 一并删除（经 `git show HEAD:src/pages/Home.tsx` 核实旧版存在），属真实脚本失效而非弹窗遮挡，加参数无效。改为直连该 overlay，只继续验证专栏侧提示层与关闭出口；首页与专栏的新入口关系由本卡取证覆盖，**T005 历史验收结论不回改**。

### 证据

375 × 812 截图（`docs/workbench/evidence/screenshots/`）：

| 文件 | 覆盖项 |
| --- | --- |
| `t021-01-home-first-screen.png` | 新首页首屏（标题「诗得丽品牌专栏」+ 搜索栏 + 头像 + Banner + 打卡首块，无金刚区） |
| `t021-02-home-bottom.png` | 长页滚到底：公益板块与卡博士品牌故事顺序、与固定底部导航不重叠 |
| `t021-03-newcomer-coupon-1.png` | 新人弹窗 1 张体验券态（`?state=coupon-1`） |
| `t021-03-newcomer-coupon-2.png` | 新人弹窗 2 张体验券态（`?state=coupon-2`） |
| `t021-04-coupon-success.png` | 领取成功态（`?overlay=coupon-success`） |
| `t021-05-home-auto-newcomer.png` | 「默认全是新用户」：不带参数进入 `/` 自动弹出的新人体验券（D-077） |

交互记录（真实点击，`node scripts/capture-t021.mjs` 退出码 0，「T021 汇总：全部检查通过」）：

- 默认弹出：不带参数进入 `/` → 弹窗 = 1、券数 ∈ {1, 2}（1:1 随机呈现），符合「默认全是新用户」（D-077）。
- 关闭后不复现：点 `关闭新人体验券` → 弹窗 = 0 且 `pathname` 仍为 `/`，未出现「删参后立刻复弹」的死循环。
- 取证抑制：`/?newcomer=off` → 弹窗 = 0，脚本可确定性拿到首页无遮挡形态（D-078）。
- 关闭路径：点 `关闭新人体验券` 后 `pathname` = `/`、`overlay` = none、弹窗计数 = 0，未领取且停留首页（需求 §3.2）。
- 领取路径：点「确定」后 `overlay` → `coupon-success`，「领取成功」可见 = true；再点「查看体验券」URL → `/exchange`（用户确认目标页）。
- 券数复现：`?state=coupon-1` 命中「本次共 1 张体验券」，`?state=coupon-2` 命中「本次共 2 张体验券」，两态均可确定性复现用于验收。
- 公益板块无跳转：公益板块与品牌故事区内可点击入口有且仅有「卡博士品牌故事」（D-079）。
- 首页补签：在迁入的打卡内容中触发补签后 `overlay` → `make-up-success`，反馈在首页自持。
- `/checkin` 回归：返回标题栏 = 1、底部 Tab = 0、四段内容各 1，抽取组件后无退化。

375 × 812 首屏结构与长页/安全区检查（同次脚本，退出码 0）：

- 首屏顺序与不重叠：搜索区底 124 < Banner 顶 140，Banner 底 254.33 < 打卡首块顶 270.33。
- 金刚区已移除：淋浴 / 洗烘 / 饮水 / 吹风四词命中 = 0。
- 打卡内容完整且无重复外壳：四段各 1；页面内 `[data-title-bar="back"]` = 0、`[data-title-bar]` = 1、底部导航 = 1（不存在两套页面壳）。
- 附加区顺序正确：打卡末块底 1513.83 < 附加区顶 1541.83，读取顺序为「公益板块 / 卡博士品牌故事」。
- 长页可完整浏览且不被导航遮挡：滚动容器 `scrollHeight` 1734 > 视口 683；滚到底后附加区顶 490.83、末卡底 654.83 < 底部导航顶 751。

工程检查：

- `npm run typecheck` 通过（退出码 0）。
- `npm run build` 通过（退出码 0，`✓ built in 1.54s`，JS 474.32 kB / gzip 144.05 kB，CSS 72.23 kB / gzip 13.53 kB）。
- 控制台检查：`/` 与 `/checkin` 无 error / warning；仅 React Router v7 future flag 框架噪音（capture-t021 记 18 条），归入已知项。`node scripts/console-check-t004.mjs` 对 `/` 与 `/?newcomer=off` 两态均报 `NO_BLOCKING_ERRORS`。
- 调试面板门控保持 D-020：默认 0，`?debug=1` 下 states = 2 / overlays = 3。
- 回归（口径变更后全部重跑）：`capture-t021.mjs`、`capture-t023.mjs`、`capture-t005.mjs`、`capture-t001.mjs`、`capture-t004.mjs` 退出码均为 0；`verify-t001.mjs` 全 PASS（含 `/?newcomer=off` → 首页）；`verify-t004.mjs` 首页 PASS，`/exchange`、`/profile`、`/card/verify 高亮「」` 3 条 FAIL 为既有偏差；`verify-reference-pages.mjs` 仅 `/profile MISSING:热门兑换`、`console errors: NONE`。

### 施工边界与遗留

- 未改 Header / BottomNav / PageContainer / PromptOverlay / ComDesign / 全局 Token；`routes.ts` 与 `fixtures/index.ts` 仅改 `/` 一行登记并新增 T021 区段。
- 未实现真实新用户识别、随机发券、库存与服务端领取接口，领取仅为 UI 演示（本卡「不在范围」）。
- 未改 `/checkin` 内部业务规则，B-018 / B-019 / B-020 / B-021 仍未决；`/dearseed` 与 T005 的历史验收结论未回改。
- 本卡新增的三条阻塞已由用户 2026-08-27 追加口径部分关闭，风险由「高」降为「中」，仍以 `NEWCOMER_COUPON_RULE_STATUS` 隔离，未自行补写规则：
  - B-031：新用户判定已定案「默认全是新用户」（D-077），本阶段不做真实识别与持久化；**剩余未决**为跨会话弹窗频次与「已领取后再次进入首页」的服务端口径，等接口阶段确认。
  - B-032：1 张 / 2 张概率已定案 1:1（D-079）；**剩余未决**为券种池、库存与单人发放上限，故只沉淀 `coupon-1` / `coupon-2` 两组确定性夹具，不做服务端发券。
  - B-033：公益板块已定案「暂不实现跳转」（D-079），原指向 `/checkin` 的占位入口已移除，现为标题 + 一句说明的静态承载；**剩余未决**为实际内容与数据来源（`docs/prototype` 全库无「公益」命中），不自造公益项目列表与捐赠进度。
- 随机性边界：`Math.random()` 仅按 1:1（D-079）决定无 `?state=` 时的默认落点，且惰性求值一次、生命周期内不变；验收状态一律走夹具与 URL 参数（D-074），不把随机数作为验收状态来源。
- 取证参数边界：`?newcomer=off` 只用于让脚本确定性拿到首页无遮挡形态，不改变产品行为，不进 `states` / `overlays`，`RouteMeta` 也未为它新增字段（D-078）。
- **归属纠正**：T022 卡「施工边界与遗留」把 `verify-t015.mjs` `FAIL #18 /exchange`、`FAIL #19 /profile` 与 `verify-reference-pages.mjs` `/profile MISSING:热门兑换` 记为「T021 / T023 在建」，经核实与 T021 无关，本卡不认领——`Exchange.tsx` 本轮未改动且 `HEAD` 即渲染「体验券兑换专区」，而脚本期望「洗护兑换专区」；`Profile.tsx` 的 `HEAD` 即渲染「热门体验券」，而脚本期望「热门兑换」，本轮对该文件的唯一改动是 T023 侧的 `to: '/membership' → '/mall'`。三条均为既有脚本期望值与页面文案的历史偏差，需由文案定稿方单独收口。
