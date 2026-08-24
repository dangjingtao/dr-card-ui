# T010｜地址与订单

## 状态与类型

- 状态：`Accepted`（owner 于 2026-08-24 确认通过；B-027–B-030 继续作为真实业务接入前的待决规则，不阻塞本轮 UI 验收）
- 类型：UI / Flow
- 优先级：P1

## 当前事实与差距

- 四个节点均已落地为真实页面：`/address`、`/address/new`、`/orders`、`/orders/:id`，不再是 `NodeStub`。
- 地址数据由模块级共享状态 `src/app/state/addresses.ts` 提供，订单与地址夹具集中在 `src/app/fixtures/index.ts`，全链路确定性、无 `Math.random`。
- 剩余差距全部是业务规则缺口而非实现缺口：行政区划数据源（B-027）、粘贴识别解析规则（B-028）、订单状态全集（B-029）、运费与优惠规则（B-030）。

## 目标

完成商城的收货地址维护和订单查询闭环，为兑换/商城流程提供真实承接页面。

## 原型范围

- #55 地址管理（商城）
- #56 订单管理（商城）
- #60 添加新地址
- #72 订单详情

## 不在范围

- 真实物流、支付、退款、发票和后端 API。
- 商品选购和购物车进入 T008。

## 依赖与阻塞决策

- 依赖 T003/T004、T008 商品模型。
- 本卡决策记录：[T010 地址与订单｜决策记录](../decisions/T010-address-orders.md)（D-043–D-050）。
- 新增阻塞项 B-027（地址编辑页与行政区划）、B-028（粘贴识别解析）、B-029（订单状态全集）、B-030（金额与运费规则），均已隔离在夹具 `ADDRESS_ORDER_RULE_STATUS`，页面不硬编码。
- 已确认约束：入口沿用 `/profile` 九宫格，**不**新增卡包「使用记录」入口（用户已定案 B-016 / D-014，施工中的越界改动已完整回滚，见决策记录 §3.4）。

## 实施要求

- 地址支持列表、默认标识、新增、编辑入口、校验和保存/取消。
- 订单列表按原型状态展示商品、金额/泡泡值、时间和主操作。
- 订单详情保持订单号、收货信息、商品、状态和操作一致。
- 使用 fixture 覆盖空列表、有数据、长地址和多商品。

## 状态与交互矩阵

| 节点 | 状态 | 可达 URL |
| --- | --- | --- |
| #55 | 地址列表（默认置顶） | `/address` |
| #55 | 无收货地址空态 | `/address?state=empty` |
| #60 | 空表单（新增） | `/address/new` |
| #60 | 必填校验未通过 | `/address/new?state=invalid` |
| #60 | 回填编辑 | `/address/new?id=a2` |
| #56 | 全部订单（默认态） | `/orders` |
| #56 | 已完成 / 进行中 / 售后中 | `/orders?state=completed` / `?state=ongoing` / `?state=aftersale` |
| #56 | 暂无订单 | `/orders?state=empty` |
| #72 | 已完成 / 多商品 / 售后中 | `/orders/o1` / `/orders/o3` / `/orders/o4` |
| #72 | 订单不存在兜底 | `/orders/none` |

交互：默认地址切换即置顶 + Toast；保存成功 Toast 后回流 `/address` 且新增项可见；取消/返回不写入数据；订单卡进入对应详情并可返回；粘贴识别仅提示能力待接入。

## 验收标准

- 4 个节点逐一可定位。
- 地址新增后返回列表并可见；取消不污染数据。
- 订单列表进入正确详情并可返回原筛选/滚动位置。
- 长文本和多商品在 375 宽度下不溢出。

## 必交证据

- 决策记录：[decisions/T010-address-orders.md](../decisions/T010-address-orders.md)。
- 证据脚本：[scripts/capture-t010.mjs](../../../scripts/capture-t010.mjs)，用法 `BASE_URL=http://127.0.0.1:5173 node scripts/capture-t010.mjs`。
- 21 张 375×812 截图（`docs/workbench/evidence/screenshots/`）：
  - #55：`t010-55-address-list.png`、`t010-55-address-empty.png`、`t010-55-address-default-toast.png`、`t010-55-address-after-add.png`
  - #60：`t010-60-form-empty.png`、`t010-60-form-invalid.png`、`t010-60-form-paste-hint.png`、`t010-60-form-edit.png`、`t010-60-form-saved-toast.png`
  - #56：`t010-56-orders-all.png`、`t010-56-orders-completed.png`、`t010-56-orders-ongoing.png`、`t010-56-orders-aftersale.png`、`t010-56-orders-empty.png`
  - #72：`t010-72-detail-completed.png`、`t010-72-detail-multi-goods.png`、`t010-72-detail-aftersale.png`、`t010-72-detail-fallback.png`
  - 入口：`t010-entry-profile-grid.png`、`t010-entry-profile-to-orders.png`、`t010-entry-profile-to-address.png`
- 交互断言实测：`默认地址置顶: 张小鹿 -> 李思棠`（切换后置顶项确实变化）、`新增地址回流列表可见: true`（保存后 `/address` 出现新增收件人）。
- 控制台：`控制台/断言问题 38 条`，逐条为 React Router v7 future-flag 警告，无 `[error]` / `[pageerror]` / `[assert]`。
- 原型差异：#60 一页两用、四 Tab 同页筛选、五段式详情与四项未决规则的取舍见决策记录 §2/§7；卡包「使用记录」入口按 B-016 不实现。
- 工程结果：`npm run typecheck` 退出码 0；`npm run build` 通过（`✓ built in 1.87s`，CSS 51.71 kB / gzip 10.48 kB，JS 407.00 kB / gzip 119.62 kB）。

## 产出

- 地址/订单页面、fixture、表单与验收证据。
