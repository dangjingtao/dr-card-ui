# T008｜洗护兑换与商城链路

## 状态与类型

- 状态：`Accepted`（用户于 2026-08-24 验收确认通过；B-024 / B-025 / B-026 继续作为真实业务接入前的待决规则，不阻塞本轮 UI 验收）
- 类型：UI / Flow / Integration
- 优先级：P0

## 当前事实与差距

- `/exchange` 语义已纠正为**洗护兑换专区**（原兑换码页在 `/redeem`，归 T009）：余额条 + 搜索 + 综合/兑换量/泡泡值三维排序 + 商品卡网格（D-032、D-033）。
- #18/#37/#38 是同一列表的三种排序状态而非三个页面：`/exchange` 默认为「综合」，`?state=sort-exchange` / `?state=sort-points` 切换排行；搜索与排序正交，切排序不清关键词。
- 搜索检索范围为「商品名 + 商品说明」（夹具 `exchangeSearch`），商品卡只渲染名称/泡泡值/兑换量，商品说明只出现在 #39 弹窗（D-034）。
- #39 兑换确认为弹层 `?overlay=redeem&product=<id>`；余额不足（e5 需 1500🫧 > 余额 1,280🫧）与售罄（e4）由夹具数据推导，弹窗主按钮 `disabled` 且文案换为「泡泡值不足」/「已售罄」，列表卡同步 Tag / 蒙层（D-035）。
- #40 存入卡包沿用专区作背景层 + `PromptOverlay`，双 CTA →`/card`、`/exchange`；提交中固定 700ms，不引入随机（D-036）。
- #17/#48/#49 走 WebView 边界页：由 `routes.ts` 的 `boundary: 'webview'` 声明，`WebViewBoundary.tsx` 渲染外壳占位 + 加载/已加载/失败三态，不做原生还原、不接真实 H5（D-031）。
- 历史 T11 的深绿金 KV 与私有配色**未被引入**，视觉只消费已注册的 `exchange-*` / `bubble-*` / `coupon-*` 语义 Token；未新增页面私有色值或 CSS 变量。
- 未决业务规则集中在夹具 `EXCHANGE_RULE_STATUS`（`confirmed` / `blocker` / `note`），页面不硬编码（D-037）。
- T008 全部有状态页面挂载 `DebugPanel`，仅在 `?debug=1` 下渲染（D-021）；`WebViewBoundary.tsx` 原自带的常显状态胶囊已删除并改挂共享面板。

## 目标

完成泡泡值兑换商品到存入卡包的核心链路，并明确 H5 商城页在 UI 工程中的承载方式。

## 原型范围

- #17 卡博士商城（H5 嵌入）
- #18 洗护兑换专区
- #37 兑换量排行
- #38 泡泡值排行
- #39 商品兑换弹窗
- #40 存入卡包
- #48 商品详情页
- #49 购物车

## 不在范围

- 卡券中心、核销、转赠和兑换码进入 T009。
- 地址/订单进入 T010。
- 不连接真实商品、库存或支付接口，除非另有授权。

## 依赖与阻塞决策

- 依赖 T002–T004、T009 卡包承接接口。
- ~~确认 H5 嵌入是本地高保真模拟、WebView 边界页还是外链占位。~~ **已关闭（B-007）**：用户当轮定案「H5 商城、商品详情、购物车继续使用明确的 WebView 边界」，对应 D-031。
- ~~确认 #18/#37/#38 的搜索、排序和主视觉，历史 T11 不自动生效。~~ **已关闭（B-008）**：用户当轮定案兑换专区本地实现，且禁止照搬历史稿深绿金 KV 与私有配色，对应 D-032、D-033。
- 新增未决（不阻塞本轮交付，接真实服务前必须确认）：`B-024` 泡泡值排序方向、`B-025` SKU 清单与售罄判定、`B-026` 兑换结算与卡包写入。

## 实施要求

- 商品模型包含图片、名称、所需泡泡值、兑换量、库存/状态。
- 排行切换真实改变列表顺序和 active 状态。
- 兑换确认显示商品、消耗、余额和不足/不可兑换状态。
- 成功后能进入卡包承接状态，购物车和详情的边界与 H5 一致。

## 状态与交互矩阵

- 列表加载/有数据/空/错误。
- 兑换量排行 / 泡泡值排行。
- 商品可兑换 / 余额不足 / 售罄。
- 确认弹窗打开/取消/提交中/失败/成功。
- H5 进入、返回、加载和失败占位。

## 验收标准

- 8 个节点逐一可定位。
- 从专区选商品到存入卡包可连续完成。
- 排行、余额不足、售罄不是静态文案。
- `/exchange` 路由语义被纠正，不再把兑换码页误当兑换商城。

## 必交证据

- 8 节点路由/状态清单：见 [decisions/T008-mall-exchange.md](../decisions/T008-mall-exchange.md) §5 与 [evidence-matrix.md](../evidence-matrix.md) T008 段。`/exchange`（#18，综合默认）、`?state=sort-exchange`（#37）、`?state=sort-points`（#38）、`?overlay=redeem&product=e1|e5|e4`（#39 可兑换/余额不足/售罄）、`/exchange/result?product=e1`（#40）、`/mall`＋`?state=loading|error`（#17）、`/mall/goods/1001`（#48）、`/mall/cart`（#49）。
- 排行切换、兑换成功与失败流程截图：20 张落 `docs/workbench/evidence/screenshots/t008-*.png`（375×812）——`t008-18-exchange-default` / `-list-badges` / `-search-hit` / `-search-empty`（#18）、`t008-37-exchange-sort-redeemed`（#37）、`t008-38-exchange-sort-points`（#38）、`t008-39-redeem-sheet` / `-insufficient` / `-sold-out` / `-submitting`（#39）、`t008-40-exchange-result`（#40）、`t008-17-mall-webview` / `-loading` / `-error`（#17）、`t008-48-goods-webview`（#48）、`t008-49-cart-webview`（#49）、`t008-debug-panel-exchange` / `-exchange-sort` / `-exchange-overlay` / `-mall`（调试面板门控）。
- 采集脚本与交互断言：`scripts/capture-t008.mjs`（Playwright，375×812，含点击交互、URL 断言与控制台采集）。用法 `BASE_URL=http://127.0.0.1:5173 node scripts/capture-t008.mjs`，退出码 0，断言全部通过，逐条输出见决策记录 §6。要点：三维度排序实测顺序互不相同且点「综合」完全回归；搜索「洗发」命中 4 件、搜索「不存在的商品」渲染空态「没有找到相关商品」、清空恢复 5 件；e5 弹窗按钮 `disabled=true` 文案「泡泡值不足」，e4 为「已售罄」；#40 双 CTA 分别到 `/card` 与 `/exchange`。
- 调试面板门控记录：`/exchange` 不带 `debug=1` 时 `[data-debug-panel]` count=0；`?debug=1` 下点「兑换量排行」→ `/exchange?debug=1&state=sort-exchange`（`debug=1` 原样保留）且选中 Tab 同步；`/mall?debug=1` 按 `routes.ts` 登记项渲染（D-021）。
- H5 边界决策记录：[decisions/T008-mall-exchange.md](../decisions/T008-mall-exchange.md) §2 D-031 与 §3.1（含修改 `WebViewBoundary.tsx` 的范围论证）。
- 原型对照、类型检查和构建结果：原型依据 [prototype/04-mall-card-order.md](../../prototype/04-mall-card-order.md) §1–§7；`npm run typecheck`（`tsc --noEmit`）退出码 0；`npm run build` 通过（CSS 48.71 kB / gzip 10.02 kB，JS 371.34 kB / gzip 110.81 kB，1639 modules）；采集过程中控制台**无 error；存在既有 Router warning**（32 条 React Router v7 future flag，项目全局既有、非本轮引入，脚本用 `isKnownNoise` 单列计数）。
- 未决规则配置：夹具 `EXCHANGE_RULE_STATUS`（`pointsSortDirection` / `catalog` / `settlement`，各带 `blocker` 与 `note`），对应 B-024 / B-025 / B-026。

## 产出

- 商城/兑换页面、商品夹具、H5 边界和验收证据。
