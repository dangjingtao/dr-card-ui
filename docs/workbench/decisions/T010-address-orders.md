# T010 地址与订单｜决策记录

> 决策日期：2026-08-24
> 决策卡：[T010｜地址与订单](../tasks/T010-address-orders.md)
> 决策类型：UI / Flow
> 决策范围：Mockplus 节点 #55 地址管理（商城）、#56 订单管理（商城）、#60 添加新地址、#72 订单详情
> 决策人：owner 授权「可以整卡施工」，实施期决策由智能体按 `AGENTS.md` 优先级链作出并在此登记
> 状态：Accepted（工程实现已落地，业务规则缺口挂 B-027–B-030）

## 1. 决策目的

T010 施工前四个节点均为 `Missing`：无路由、无页面、无地址/订单状态模型。摹客 `prototype/04` §12–§15 给出了四页的结构与字段，但**没有**给出行政区划数据源、粘贴解析规则、订单状态全集与金额/运费规则。本记录固定「哪些按原型落地、哪些隔离为未决」的边界，避免用推断补齐业务规则。

## 2. 决策结论

| 编号 | 决策 | 依据 | 关联节点 |
| --- | --- | --- | --- |
| D-043 | #60 同页承载「新增」与「编辑」两种用途，由 `?id=<addressId>` 触发回填，不新建编辑页路由 | 原型 §12 只画出「编辑」入口、未画编辑页；两者字段完全一致（B-027） | #55 #60 |
| D-044 | 地址数据由模块级共享状态 `src/app/state/addresses.ts` 提供（订阅广播、不持久化），保证「新增后返回列表可见」是真实数据流而非页面内假象 | 沿用 D-013 通知已读状态的既有模式 | #55 #60 |
| D-045 | 默认地址为全局单选：切换后该项立即置顶并触发反馈 Toast；已是默认的项不可重复点按 | 原型 §12 有「默认」标签与默认地址概念 | #55 |
| D-046 | 「粘贴识别收件信息」只保留入口与能力提示 Toast，不实现剪贴板读取与地址解析 | 原型 §13 只画按钮，未给解析规则、失败提示与权限降级（B-028） | #60 |
| D-047 | #56 的 全部订单/已完成/进行中/售后中 是同一列表的四种筛选态而非四个页面：`/orders` + `?state=completed/ongoing/aftersale`，「全部订单」为默认态（清空 `state`），另有 `?state=empty` 空态 | 原型 §14 四 Tab 同页；沿用 D-033 排序态同页的既有做法 | #56 |
| D-048 | #72 固定为 订单状态 / 收货地址 / 商品信息 / 价格信息 / 订单信息 五段式；实付款只做「商品总价 + 运费」算术求和，不引入优惠与泡泡值抵扣 | 原型 §15 只列出这三个金额字段（B-030） | #72 |
| D-049 | 四项未决业务规则集中在夹具 `ADDRESS_ORDER_RULE_STATUS`（`confirmed`/`blocker`/`note`），页面不硬编码，也不得把夹具当已确认规则 | 沿用 D-017 / D-037 的未决规则隔离模式 | #55 #56 #60 #72 |
| D-050 | T010 入口沿用 `/profile` 九宫格既有的「订单管理」→`/orders`、「地址管理」→`/address`；**不**新增卡包右上角「使用记录」入口 | 用户已定案 B-016 / D-014：卡包以 `reference/卡包.html` 为准，不加「使用记录」 | #55 #56 |

## 3. 决策细节

### 3.1 #55 地址管理：默认地址与列表数据流（D-044、D-045）

- 列表来源 `useAddresses()`；`?state=empty` 时渲染空态，不改动共享状态本体。
- 夹具三条覆盖三种版式风险：`a1 张小鹿`（默认）、`a2 李思棠`、`a3 王一诺`（超长地址，验证 375 宽不溢出）。
- 手机号统一经 `maskPhone` 脱敏展示。
- 默认切换按钮的可访问名随状态变化（`将 X 设为默认` / `X 已是默认地址`）并带 `aria-pressed`，使「置顶行为」可被脚本断言而不依赖像素比对。

### 3.2 #60 一页两用与校验（D-043、D-046）

- `?id=` 命中夹具或新增记录时回填并走 `updateAddress`，未命中走 `addAddress`；新增 ID 由 `a-new-${seq}` 递增产生，**不使用 `Math.random`**。
- `?state=invalid` 直接注入越过校验的脏表单，用于稳定复现必填错误态。
- 保存链路：校验 → 写入共享状态 → 成功 Toast → 900ms 后 `navigate('/address')`。取消/返回不写入任何数据（验收项「取消不污染数据」）。
- 粘贴入口的提示 Toast 与页面所有定时器统一走 `useRef<number[]>` + 卸载清理，避免离开页面后回调仍然 setState。

### 3.3 #56/#72 订单状态与金额口径（D-047、D-048）

- Tab 与配送状态解耦：Tab 是订单归类（`completed/ongoing/aftersale`），配送状态是 `ORDER_DELIVERY_LABEL` 里原型出现过的 `received/shipped/pending/aftersale`；**原型未出现的待付款、已取消、退款完成等状态不自行补全**（B-029）。
- 金额一律由函数派生：`orderGoodsTotal`（Σ 单价×数量）、`orderPayable`（总价+运费）、`orderQuantity`（Σ 数量），页面不做字符串拼算。
- `/orders/:id` 未命中订单时渲染 `PackageSearch` 兜底空态，不白屏、不抛错。

### 3.4 已回滚：卡包「使用记录」入口（D-050）

施工中途曾依据 `prototype/04` §8 为 `/card` 增加右上角「使用记录」→ `/orders` 文本入口，涉及 `TitleBar.tsx` 栅格放宽、`routes.ts` 的 `titleBarAction` 联合类型扩展与 `MobileLayout.tsx` 分支。

复核 [decisions/README.md](README.md) 后发现该改动**违反用户已确认的 B-016 / D-014**（卡包以 `reference/卡包.html` 为准，不加「全部」Tab 与「使用记录」入口）。按 `AGENTS.md` 优先级链「用户确认 > 原型文档」，已完整回滚：

- `MobileLayout.tsx` 删除 `usage-records` 分支，恢复 `settings` / `notifications` 两支；
- `routes.ts` 联合类型恢复为 `'settings' | 'notifications'`，`/card` 移除 `titleBarAction`；
- `TitleBar.tsx` 恢复原 `grid-cols-[36px_minmax(0,1fr)_36px]` 与 36×36 右槽；
- `/orders` 的 `entry` 由「我的-订单管理；卡包-使用记录」改回「我的-订单管理」；
- 删除已失效证据 `t010-entry-card-usage-records.png`、`t010-entry-card-to-orders.png`。

结论：**T010 未修改任何共享外壳组件**，对 T009 `/card` 及其他页面零影响。入口需求由 `Profile.tsx` 九宫格既有的两块瓦片满足，无需新增代码。

## 4. 实现映射

| 关注点 | 文件 |
| --- | --- |
| 地址列表 #55 | [Address.tsx](../../../src/pages/Address.tsx) |
| 新增/编辑地址 #60 | [AddressNew.tsx](../../../src/pages/AddressNew.tsx) |
| 订单列表 #56 | [Orders.tsx](../../../src/pages/Orders.tsx) |
| 订单详情 #72 | [OrderDetail.tsx](../../../src/pages/OrderDetail.tsx) |
| 地址共享状态 | [state/addresses.ts](../../../src/app/state/addresses.ts) |
| 地址/订单夹具与未决规则 | [fixtures/index.ts](../../../src/app/fixtures/index.ts) |
| 路由与状态登记 | [routes.ts](../../../src/app/router/routes.ts)、[router/index.tsx](../../../src/app/router/index.tsx) |
| 入口（未改动，仅复用） | [Profile.tsx](../../../src/pages/Profile.tsx) |
| 证据脚本 | [capture-t010.mjs](../../../scripts/capture-t010.mjs) |

## 5. 状态与夹具矩阵

| 节点 | 可达 URL |
| --- | --- |
| #55 地址管理 | `/address` |
| #55 无收货地址 | `/address?state=empty` |
| #60 添加新地址 | `/address/new` |
| #60 必填校验未通过 | `/address/new?state=invalid` |
| #60 回填编辑 | `/address/new?id=a2` |
| #56 全部订单 | `/orders` |
| #56 已完成 / 进行中 / 售后中 | `/orders?state=completed` / `?state=ongoing` / `?state=aftersale` |
| #56 暂无订单 | `/orders?state=empty` |
| #72 订单详情（已完成 / 多商品 / 售后） | `/orders/o1` / `/orders/o3` / `/orders/o4` |
| #72 订单不存在兜底 | `/orders/none` |

上表状态均已登记进 `routes.ts` 的 `states`，可经 `?debug=1` 的调试面板直达（D-020、D-021）。

## 6. 工程证据

- 截图：`BASE_URL=http://127.0.0.1:5173 node scripts/capture-t010.mjs`，21 张 375×812 截图见 `../evidence/screenshots/t010-*.png`。
- 交互断言（脚本内实测）：`默认地址置顶: 张小鹿 -> 李思棠`、`新增地址回流列表可见: true`。
- 控制台：`控制台/断言问题 38 条`，逐条核验均为 React Router v7 future-flag 警告，无 `[error]` / `[pageerror]` / `[assert]`。
- `npm run typecheck` 退出码 0。
- `npm run build` 通过：`✓ built in 1.87s`，CSS 51.71 kB / gzip 10.48 kB，JS 407.00 kB / gzip 119.62 kB。

## 7. 未决与风险

| 编号 | 阻塞项 | 当前处置 |
| --- | --- | --- |
| B-027 | 地址编辑页形态与省市区县-乡镇行政区划数据源（原型 §12 有编辑入口、§13 未给数据源） | #60 复用同一表单做回填编辑（D-043），候选项取自地址夹具，待产品确认后再决定是否拆页/接行政区划库 |
| B-028 | 「粘贴识别收件信息」的解析规则、失败提示与剪贴板权限降级 | 保留入口，点按仅提示能力待接入（D-046），不做假解析 |
| B-029 | 订单状态全集与流转（待付款、已取消、退款完成等及其迁移条件） | 夹具只覆盖原型出现过的状态，不自行补全（D-047） |
| B-030 | 运费计算、优惠抵扣与泡泡值抵扣规则 | 运费按订单夹具声明，实付款只做「总价 + 运费」求和（D-048） |

另：真实物流、支付、退款、发票与后端 API 明确不在 T010 范围；商品选购与购物车归 T008（WebView 边界页，D-031）。
