# T024｜2026-08-27 UI 变更验收报告

> 验收日期：2026-08-27
> 运行环境：Node.js 22.23.2、Chromium（Playwright 1.49.1）、Vite production preview（首轮服务于 `http://127.0.0.1:4174`，复跑改用 `--strictPort 4399`，见下方端口注意事项）
> 基准视口：375 × 812（`deviceScaleFactor: 1`）；窄屏抽查：320 × 480
> 验收范围：[`2026-08-27-ui-change-requirements.md`](../requirements/2026-08-27-ui-change-requirements.md) 全部条目 + T021 / T022 / T023 的页面、状态、入口与返回路径
> 当前结论：`User Review`（智能体侧验收全部通过，等待用户确认；按工作台契约智能体不写入 `Accepted`）

## 1. 总结

| 检查项 | 结果 |
| --- | --- |
| 本轮变更验收项 | **37/37 PASS** |
| 需求 §7 十一条 UI 验收要点 | **11/11 有截图或交互证据** |
| 三条跨卡主链路 | **3/3 PASS** |
| T021 / T022 / T023 取证脚本回归 | **3/3 全部断言通过** |
| 60 节点历史台账（`verify-t015`） | **58/60（等于既有基线，无回归）** |
| 死链 / 假按钮 | **0** |
| 重复页面壳（状态栏 / 标题栏 / 底部导航 / 滚动容器） | **0** |
| 横向溢出（375 与 320 双视口） | **0** |
| 阻塞性控制台错误 / `pageerror` | **0** |
| `npm run typecheck` / `npm run build` / production preview smoke | **PASS** |

机器可读逐条结果见 [`evidence/t024-results.json`](./evidence/t024-results.json)，验收脚本为 [`verify-t024.mjs`](../../scripts/verify-t024.mjs)。

复跑命令：

```bash
npm run build
npm run preview -- --port 4399 --strictPort
BASE_URL=http://127.0.0.1:4399 npm run verify:t024
```

**端口注意事项（复跑必读）**：本机 4173 / 4174 常被其他项目的服务占用。`vite preview` 在端口被占时会静默改用其他端口，而 `BASE_URL` 仍指向原端口，脚本就会连到**别的项目**上——本轮复跑首次即因此在 `4174` 上取到了另一个项目的「经营总览」后台页，报 `locator('[role="dialog"]') Timeout`。这不是本项目回归。因此复跑务必带 `--strictPort`（端口冲突直接失败而非偷偷换端口），或先 `curl -s http://127.0.0.1:<port>/ | grep -o '<title>[^<]*</title>'` 确认服务归属。改用空闲端口 4399 后同一脚本 37/37 通过、退出码 0。

## 2. 需求 §7 UI 验收要点覆盖矩阵

| # | 需求要点 | 检查项 | 结果 | 关键实测值 / 证据 |
| ---: | --- | --- | --- | --- |
| 1 | 以 375 × 812 为主要移动端验收尺寸 | `R7-01` | PASS | 全部截图与断言均在 375×812 采集 |
| 2 | 首页保留搜索栏、头像、Banner，金刚区完整移除 | `R7-02a` `R7-02b` | PASS | 搜索栏/输入框/头像/Banner 各 1；「淋浴/洗烘/饮水/吹风」残留词=无；`t024-01-home-baseline.png` |
| 3 | `/checkin` 内容完整嵌入首页且无重复壳 | `R7-03a` `R7-03b` | PASS | 今日签到状态/当月签到日历/是日任务/为你精选 各 1；statusBars=1、titleBars=1、backBars=0、navs=1、scrolls=1 |
| 4 | 公益板块与品牌故事排列在打卡内容下方 | `R7-04` | PASS | 几何判据 `boardTop=270.33` < `causeTop=1541.83`，公益板块与品牌故事文案均命中；`t024-02-home-bottom-cause-story.png` |
| 5 | 新人弹窗 1 张 / 2 张体验券、领取成功、关闭三路径 | `R7-05a-coupon-1` `R7-05a-coupon-2` `R7-05b` `R7-05c` | PASS | `?state=coupon-1` → li=1；`?state=coupon-2` → li=2，均满足 `^本次共 N 张体验券$`；「确定」后首行=「体验券领取成功」；「关闭」后弹窗数=0 且停留 `/`；`t024-03-newcomer-coupon-1.png`、`t024-03-newcomer-coupon-2.png`、`t024-04-newcomer-success.png` |
| 6 | 泡泡值明细页三 Tab 筛选与空态 | `R7-06a` `R7-06b` `R7-06c` | PASS | Tab=全部/收入/消耗；行数 全部 15 / 收入 13 / 消耗 2（与 `BUBBLE_RECORDS` 夹具一致）；空态行数=0 且空文案命中；`t024-06-points-detail-expense.png`、`t024-07-points-detail-empty.png` |
| 7 | 原泡泡值页面改为任务占位卡片，「看明细」进入新明细页 | `R7-07a` `R7-07b` | PASS | 四张占位卡标题命中 4/4，带「占位」标记，可交互控件数=0（不是假按钮）；「看明细」落地 `/points/detail`；`t024-08-points-benefits-tasks.png` |
| 8 | 泡泡福利入口按「每日签到 / 澡运 / 体验券兑换」排列且澡运可达 | `R7-08a` `R7-08b` | PASS | DOM 顺序=每日签到/澡运/体验券兑换；澡运落地 `/luck` 且占位文案命中 |
| 9 | 主按钮显示「泡泡值兑换」并进入体验券兑换页 | `R7-09` `R7-09b` | PASS | 该文案按钮唯一（数量=1），`position: sticky` 且可见；点击落地 `/exchange` |
| 10 | 删除扫码核销辅助文案，且删除后排版无空洞错位 | `R7-10a` `R7-10b` | PASS | 「出示二维码，由门店扫码完成核销」残留=false；同容器两行几何 `rows=2, gap=4px, scanHeight=60, passwordHeight=60, scanLines=1`——扫码行虽降为单行仍与密码行等高、行间距 4px 无空洞；`t024-09-use-sheet-verify-rows.png` |
| 11 | 会员中心与体验券商品信息进入同一 H5 商城占位页 | `R7-11a` `R7-11b` | PASS | 两个入口均落地 `/mall` 且命中 WebView 边界标记；`t024-10-mall-from-coupon-goods.png`、`t024-11-mall-from-membership.png` |

第 10 条是本轮唯一「删除后需重新校正视觉」的要求，因此没有只做文案断言，而是把它转成可复算的几何判据：取 `选择核销方式` 下同一 `space-y-1` 容器内两个按钮的 `getBoundingClientRect()`，同时校验行数（扫码行 `innerText` 只剩 1 行）、行高（60px = 60px，未因少一行文案塌陷）与行间距（4px，未留下多余空隙）。

## 3. 三条跨卡主链路

| # | 链路 | 检查项 | 结果 | 操作记录 |
| ---: | --- | --- | --- | --- |
| 1 | 首页领券 → 体验券 | `L1-01` | PASS | `/` 自动弹出新人体验券 → 点「查看体验券」→ 落地 `/exchange`；`t024-05-link-home-to-exchange.png` |
| 2 | 泡泡值 → 明细 | `L2-01` | PASS | `/points` 资产卡「看明细」→ 落地 `/points/detail`，页面为二级页壳层（`navs=0`、`backBars=1`，见 `R2-03`） |
| 3 | 体验券 / 会员中心 → 商城并可返回 | `L3-01` `R7-11a` `R7-11b` | PASS | `/card?state=available&overlay=use&coupon=c1` 弹层内点商品信息区 → `/mall`；浏览器返回落地 `/card`，未丢失壳层；会员中心入口同样落地 `/mall` |

## 4. 视觉与壳层抽查

| 抽查维度 | 检查项 | 结果 | 实测值 |
| --- | --- | --- | --- |
| 长页滚动后底部导航固定 | `R2-01` | PASS | 首页滚到底后 `navTop=751`、`innerHeight=812`，导航仍可见 |
| 横向溢出（375） | `R2-02` | PASS | `scrollWidth - innerWidth = 0` |
| 二级页壳层去重 | `R2-03` | PASS | `/points/detail`：底部导航 0、返回栏 1 |
| 弹窗遮罩与语义 | `R3-01` | PASS | 遮罩铺满视口，`rgba(0, 0, 0, 0.52)`，`aria-modal="true"`，对话框宽 327px（375 − 2×24 边距） |
| 底部面板安全区 | `R3-02` | PASS | 面板底边 `bottom=812` 贴合视口底，`padding-bottom` 走 `env(safe-area-inset-bottom)`，headless 环境该值为 `0px`（无刘海设备，属预期） |
| 商城边界三态 + 重试 | `R6-loading` `R6-loaded` `R6-error` `R6-retry` | PASS | 「H5 加载中」/「WebView 边界页」/「H5 加载失败」均命中；失败态重试回到已加载态；`t024-12-mall-error-retry.png` |
| 关键路径直达刷新 | `R4-01` | PASS | `/`、`/points`、`/points/detail`、`/card?state=available&overlay=use&coupon=c1`、`/mall?state=error`、`/luck` 共 6 条均不白屏、不 404、路由落位正确 |
| 窄屏 320 × 480 | `R5-01` | PASS | `/?newcomer=off`、`/points`、`/points/detail`、`/mall?state=loaded` 溢出均为 0，Tab 页导航保留、二级页不出现导航；`t024-13-home-narrow-320.png` |

## 5. 截图索引

共 14 张，位于 [`evidence/screenshots/`](./evidence/screenshots/)：

| 文件 | 对应证据 |
| --- | --- |
| `t024-01-home-baseline.png` | 新首页基线（搜索栏 + 头像 + Banner，无金刚区） |
| `t024-02-home-bottom-cause-story.png` | 打卡内容下方的公益板块与品牌故事 |
| `t024-03-newcomer-coupon-1.png` | 新人弹窗 1 张体验券 |
| `t024-03-newcomer-coupon-2.png` | 新人弹窗 2 张体验券 |
| `t024-04-newcomer-success.png` | 体验券领取成功态 |
| `t024-05-link-home-to-exchange.png` | 链路 1 落地 `/exchange` |
| `t024-06-points-detail-expense.png` | 明细页「消耗」筛选态 |
| `t024-07-points-detail-empty.png` | 明细页空态 |
| `t024-08-points-benefits-tasks.png` | 三福利入口顺序 + 四张任务占位卡 |
| `t024-09-use-sheet-verify-rows.png` | 删除文案后的核销两行排版 |
| `t024-10-mall-from-coupon-goods.png` | 体验券商品信息 → 商城 |
| `t024-11-mall-from-membership.png` | 会员中心 → 商城 |
| `t024-12-mall-error-retry.png` | 商城失败态与重试 |
| `t024-13-home-narrow-320.png` | 320 × 480 窄屏首页 |

## 6. 工程命令与回归结果

```bash
npm run build                                                 # typecheck + verify:images + vite build，exit 0
BASE_URL=http://127.0.0.1:4174 node scripts/verify-t024.mjs    # 首轮 37/37 PASS
BASE_URL=http://127.0.0.1:4399 npm run verify:t024             # 复跑（npm 入口）37/37 PASS，exit 0
BASE_URL=http://127.0.0.1:4174 node scripts/capture-t021.mjs   # 断言全过
BASE_URL=http://127.0.0.1:4174 node scripts/capture-t022.mjs   # 断言全过
BASE_URL=http://127.0.0.1:4174 node scripts/capture-t023.mjs   # 断言全过
BASE_URL=http://127.0.0.1:4174 node scripts/verify-t015.mjs    # 58/60，等于既有基线
```

- `npm run build`：`✓ built in 3.36s`，`index-D20TxVjU.js 474.32 kB (gzip 144.05 kB)`、`index-BliPivIb.css 72.23 kB`；`typecheck` 与 `verify:images` 同步通过。
- 本轮已把验收脚本注册为 npm 命令 `verify:t024`（`package.json`），与既有 `verify:t015` 口径一致，复跑无需记脚本路径。
- 控制台：本轮全部脚本均无 `console error` 与 `pageerror`。唯一输出为 React Router 6.28.1 的两类 v7 future flag 升级提示（`v7_startTransition`、`v7_relativeSplatPath`），已在脚本中单列为已知框架噪音，不计入问题项。
- `capture-t022.mjs` 复跑确认澡运入口文案仍为「澡运 玩法待定」，与 T022 整改结论一致。

## 7. 已知差异与失败项清单

本轮**没有**需要退回 T021–T023 的阻塞问题。以下为如实记录的范围外差异与过程事件：

| 编号 | 类型 | 内容 | 处置 |
| --- | --- | --- | --- |
| `verify-t015 #18` | 范围外历史差异 | `/exchange` 缺少台账标志文案「洗护兑换专区」 | 属 2026-08-24 旧基线台账与当前页面文案的差异，不由本轮变更引入；本卡不修改页面文案（不在范围），留待后续文案对齐卡处理 |
| `verify-t015 #19` | 范围外历史差异 | `/profile` 缺少台账标志文案「热门兑换」 | 同上 |
| `verify-t015 #62` | 一次性抖动，已排除 | 首跑出现 `/card?state=available` 失败（`statusBars=0`、`titleBars=0`、一条 `404 Failed to load resource`），使总数由 58/60 降为 57/60 | 判定为整壳未渲染而非业务回归：另写探针对同一路径连跑 5 次，5/5 均为 `statusBars=1, titleBars=1, hasMarker=true`，无控制台错误、无 HTTP 异常；整体重跑 `verify-t015` 回到 `58/60；关闭节点偷渡=0`。确认为预览服务一次性加载抖动，探针脚本已清理未入库 |
| `B-031` | open 阻塞（非本轮） | 新人弹窗跨会话频次与「已领取后再次进入首页」的服务端口径未定 | 已定案部分（D-077「默认全是新用户」）已实现并验收；剩余部分等接口阶段，不影响本轮 UI 判定 |
| `B-032` | open 阻塞（非本轮） | 新人体验券券种池、库存与单人发放上限未定 | 1:1 概率已定案（D-079）；验收统一用 `?state=coupon-1` / `coupon-2` 确定性入口复现，不做服务端发券 |
| `B-033` | open 阻塞（非本轮） | 公益板块实际内容与数据来源未定 | 已定案「暂不实现跳转」（D-079），现为标题 + 一句说明的静态承载；不自造公益数据 |
| 复跑端口串味 | 过程事件，已排除 | 用 npm 入口复跑 `BASE_URL=http://127.0.0.1:4174 npm run verify:t024` 时脚本在券数量断言处抛 `locator('[role="dialog"]') Timeout 30000ms` | 探针确认 4174 返回的是**另一个项目**的「经营总览」后台页（`bodyLen=385`、`dialogs=0`、无控制台错误、无本项目首页文案），`lsof` 证实 4173/4174 已被其他 node 进程占用且 `vite preview` 静默改用了别的端口；改用 `npm run preview -- --port 4399 --strictPort` 后同一脚本 37/37 PASS、`EXIT=0`。判定为本机端口占用导致的取证目标错误，非本项目回归；防复发办法已写入 §1「端口注意事项（复跑必读）」 |
| 非阻塞 | 框架噪音 | React Router v7 future flag 两类警告 | 依赖升级时统一处理 |
| 非阻塞 | 环境限制 | `R3-02` 中 `env(safe-area-inset-bottom)` 在 headless Chromium 解析为 `0px` | 真机刘海设备需人工确认一次底部面板留白 |

## 8. 验收边界

本报告只证明 2026-08-27 UI 变更批次在确定性夹具、路由与交互闭环下达到 T024 验收要求，并确认旧有 60 节点台账未因本轮变更下降。不代表真实接口、发券服务、H5 商城宿主、公益板块数据源已经接入；上表 `B-031` / `B-032` / `B-033` 仍需在接口阶段收口。

按工作台契约，智能体最多将本卡推进到 `User Review`；`Accepted` 需由用户在确认截图与链路后标记。建议用户重点人工复核两处：需求 §7 第 10 条删除文案后的核销行视觉（`t024-09-use-sheet-verify-rows.png`），以及真机刘海设备上使用体验券面板的底部安全区留白。
