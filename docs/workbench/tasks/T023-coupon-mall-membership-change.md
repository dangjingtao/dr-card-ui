# T023｜体验券核销与 H5 商城入口调整

## 状态与类型

- 状态：`Accepted`（owner 于 2026-08-27 确认通过；评审 P3「商品信息区点击范围未铺满」已增加 `w-full` 整改并复验通过）
- 类型：UI / Flow / Change Request
- 优先级：P0

## 当前事实与差距

- 当前体验券使用弹窗在「扫码核销」下仍显示待删除的辅助文案。
- 当前体验券商品信息区域没有统一进入 H5 商城。
- 当前会员中心仍展示原会员页面，而本轮要求会员中心直接进入 H5 商城。
- 现有 `/mall` 已具备 WebView 边界占位能力，可作为统一占位目标。
- 本卡是对已验收 T008、T009 相关链路的新增需求，不修改旧卡历史验收结论。

## 目标

统一体验券商品信息和会员中心的商城去向，并完成核销弹窗的指定文案调整。

## 原型范围

- 需求文档：[`2026-08-27-ui-change-requirements.md`](../../requirements/2026-08-27-ui-change-requirements.md) §5–§6。
- 复用当前体验券使用弹窗及 `/mall` WebView 边界页。

## 不在范围

- 不接真实 H5 地址、商品详情、购物车或支付。
- 不修改核销业务规则、消费密码规则或服务端状态。
- 不重做原会员中心内容；`src/pages/Membership.tsx` 源码与变更前截图保留为证据，但不再作为公开路由挂载（见「代码改动」）。

## 依赖与阻塞决策

- 会员中心入口和体验券商品信息统一指向同一个商城占位页。
- 商城占位页必须有清晰状态和返回能力。
- 核销方式和单选按钮不能因商品区可点击而误触商城跳转。

## 实施要求

- 删除扫码核销辅助文字「出示二维码，由门店扫码完成核销」。
- 删除后重新校正扫码核销与消费密码核销的垂直间距。
- 体验券弹窗顶部商品信息区域整体可点击，并进入统一 H5 商城占位页。
- 原会员中心入口直接进入同一商城占位页。
- 关闭按钮、扫码核销、消费密码核销和各自单选控件维持独立交互。

## 状态与交互矩阵

- 体验券使用弹窗默认态。
- 扫码核销选中态。
- 消费密码核销选中态。
- 商品信息进入商城及返回。
- 会员中心入口进入商城及返回。
- 商城默认、加载和失败占位态沿用现有边界能力。

## 验收标准

- 指定辅助文案不再出现在 UI 或可访问文本中。
- 删除文案后弹窗排版均衡，无异常空白、错位或点击区域覆盖。
- 只有商品信息区域触发商城跳转，核销控件不会误跳。
- 两个入口进入同一商城占位目标，返回路径成立；`/membership` 直达同样落在该商城占位页，不再渲染原会员中心内容。
- 375 × 812 下弹窗和商城占位页无溢出。

## 必交证据

- 调整后的弹窗默认与两种核销选择截图。
- 商品区、会员中心入口的商城跳转及返回记录。
- 商城占位默认/加载/失败状态截图。
- `npm run typecheck`、`npm run build` 与控制台检查结果。

## 产出

- 更新后的体验券使用弹窗、统一商城入口与会员中心跳转。

### 代码改动

- `src/app/router/routes.ts`：`RouteMeta` 新增 `redirectTo?: string` 字段（该路径不再承载自身页面，直接 `replace` 重定向）；底部 Tab「服务」由 `/membership` 迁至 `/mall`；`/membership` 移除 `tab/tabOrder/label/icon/titleBarAction`，标题改为「卡博士商城」并标记 `redirectTo: '/mall'`；`/membership/levels` 的 `entry/returnTo` 改为「诗得丽专栏-会员卡『查看等级』/ 诗得丽专栏首页」（原会员中心已不可达）；补 T023 决策注释与 `isTabPath` 注释示例。
- `src/app/router/index.tsx`：`ROUTES.map` 优先处理 `redirectTo`，渲染 `<Navigate to={route.redirectTo} replace />`，优先级高于 `customPages` 与 `boundary: 'webview'`；从 `customPages` 移除 `'/membership': <Membership />` 并删掉对应 import（`/membership/levels` 仍正常挂载）。
- `src/pages/Membership.tsx`：不再被挂载，仅保留为变更前证据。文件头补注说明「T023 起不再作为公开路由」、依据的需求条款、`redirectTo` 位置与对应历史截图，避免后续误读为仍可访问。
- `src/pages/Card.tsx`：删除辅助文案「出示二维码，由门店扫码完成核销」，扫码核销改为单行；重排弹窗垂直间距（核销列表 `space-y-1`、标题 `mb-2 mt-5`、提示条 `mt-3`）；商品信息区改为独立同级 `<button aria-label="查看商城体验券商品">`，点击进入 `/mall`，用 `-m-2.5 / p-2.5` 保留点按反馈且不改变视觉排版。
- `src/pages/Home.tsx`、`src/pages/Profile.tsx`、`src/pages/DearseedColumn.tsx`：首页头像、我的-「专属权益」、专栏-「会员空间」/ 会员卡片统一改指 `/mall`（专栏「查看等级」仍指 `/membership/levels`，未变）。
- `src/pages/DrawSuccess.tsx`：按用户确认，主按钮由「返回会员中心」改为「返回首页」并跳 `/`。
- `scripts/verify-t001.mjs`、`capture-t001.mjs`、`capture-t011.mjs`：同步「服务」Tab 与入口语义变更的既有断言。
- 历史脚本适配 `/membership` 重定向（否则原有断言会因页面下线而失败）：
  - `scripts/capture-t006.mjs`：#6 块重写为只断言「`/membership` 落点为 `/mall` 且不再出现『会员中心』」，原等级 / 泡泡值余额 / 四入口 / 本期活动断言随页面下线；#26 改由 `/dearseed` 的「查看等级」进入；不再产出 `t006-06-membership.png`（该文件冻结为变更前证据）。
  - `scripts/verify-t004.mjs`：`/membership` 用例标记词由「会员中心」改为「WebView 边界」，并新增一条 `/membership → /mall` 重定向断言（对齐既有 `/draw-success → /luck/result` 写法）。
  - `scripts/verify-t015.mjs`：节点 #6 标记词由「会员中心」改为「WebView 边界」；用例保持 60 个唯一节点，不触发脚本自带的节点数不变量。
  - `scripts/verify-std-pages.mjs`、`scripts/verify-reference-pages.mjs`：`std-membership`、`ref-membership` 用例下线并留注释指向对应历史 PNG（`ref-levels` 仍有效）。
  - `scripts/capture-t004.mjs`：`membership-stub` 截图下线（重定向后与 `mall-webview` 完全重复）。
- 新增 `scripts/capture-t023.mjs` 作为本卡截图与交互断言脚本。

### 证据

375 × 812 截图（`docs/workbench/evidence/screenshots/`）：

| 文件 | 覆盖项 |
| --- | --- |
| `t023-54-use-sheet-default.png` | 弹窗默认态（辅助文案已删除、间距重排后） |
| `t023-54-verify-scan-selected.png` | 扫码核销选中态 |
| `t023-54-verify-password-selected.png` | 消费密码核销选中态 |
| `t023-54-goods-to-mall.png` | 商品信息区 → 商城占位页 |
| `t023-54-goods-back-to-sheet.png` | 商城返回 → `/card?state=available&overlay=use&coupon=c1` |
| `t023-17-mall-from-tab.png` | 底部 Tab「服务」进入商城，高亮=服务 |
| `t023-17-mall-loading.png` | 商城加载态 |
| `t023-17-mall-loaded.png` | 商城已加载态 |
| `t023-17-mall-error.png` | 商城失败态 |
| `t023-17-mall-error-retry.png` | 失败态重试 → `state=loaded` |
| `t023-17-mall-from-membership.png` | `/membership` 直达 → 重定向落在商城占位页（需求 §6） |

交互与工程检查：

- `node scripts/capture-t023.mjs`（`BASE_URL=http://127.0.0.1:4173`）退出码 0，断言全部通过：
  - 删除文案在 `innerText` 与 `aria-label/title/alt` 可访问文本中均为 0 处；
  - 仅商品信息区跳 `/mall`；扫码核销 → `/card/verify`，消费密码核销 → `/card/verify/password`，关闭 → 弹层残留 0 且停留 `/card`；
  - 四个入口（Tab 服务、首页头像、专栏-会员空间、我的-专属权益）均落在 `/mall`，返回路径成立；
  - 弹窗与 `/mall` 三态在 375 × 812 下横向溢出均为 0px；
  - `/membership` 直达重定向到 `/mall`：落点 `pathname === '/mall'`，命中商城占位页标识「WebView 边界」，且页面文本中「会员中心」残留 0 处（需求 §6）。
- `npm run typecheck` 通过（退出码 0）。
- `npm run build` 通过（退出码 0，`✓ built in 1.54s`）。
- 控制台检查：无 error / warning；仅 26 条 React Router future flag 框架噪音，已归入已知项，与本卡无关。

### 回归

- `node scripts/verify-t001.mjs` 全绿（6/6 PASS），含 `/mall → 服务（标题=卡博士商城，高亮=服务）`。
- `node scripts/capture-t006.mjs` 退出码 0：`#6 /membership 落点=/mall`、`#26 专栏「查看等级」 → /membership/levels`、`#41 → 返回首页: /` 均通过。
- `node scripts/verify-t004.mjs`：`PASS /membership → 期望「WebView 边界」`、`PASS /membership 重定向至 /mall（落点 /mall）` 均通过。
- `node scripts/verify-t015.mjs`：58/60 通过，关闭节点偷渡=0，节点数不变量（60 个唯一节点）未被破坏。
- `node scripts/verify-std-pages.mjs`、`node scripts/verify-reference-pages.mjs`：`std-membership`、`ref-membership` 用例下线后不再报缺失，`ref-levels`（`/membership/levels`）仍 OK。
- `node scripts/capture-t001.mjs`、`capture-t004.mjs`、`capture-t011.mjs` 退出码 0；`capture-t001` 产出「服务」Tab 截图为 `t001-seed-mall.png`。

### 已知差异与未决项

- `capture-t006.mjs` 的 `#6` 块随原会员中心页面下线改为只断言重定向，原「入口应为原型口径」一条断言随之移除；`#26 会员等级` 改由 `/dearseed` 的「查看等级」进入。
- `src/pages/Membership.tsx` 源码未删除，但已从 `customPages` 摘除、不再挂载为公开路由，仅作为变更前证据保留（文件头已注明）。`/membership/levels` 未下线，仍可通过诗得丽专栏-会员卡「查看等级」访问。
- `scripts/console-check-t004.mjs` 的路由清单仍含 `/membership`，重定向后只检查控制台输出、不检查内容，故未改动。

## 最终验收结论（2026-08-27）

owner 明确确认：修复评审 P3 后，T023 标记通过。商品信息按钮已铺满内容行，商品区、两种核销、关闭按钮、会员中心重定向与商城三态交互均按本卡证据复验，T023 正式标记为 `Accepted`。
