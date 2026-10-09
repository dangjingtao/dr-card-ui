# H038｜卡包 MyCoupons 接入设计依据

> 本文件是 H038 的设计依据，不是实现结果。
> H038 只负责 H5 前端接住老伙伴已经提供的 `POST /api/coupons/MyCoupons` 契约，不审查、不规定老伙伴后端如何代 call 上上游。

## 1. 证据基线

### 1.1 用户 / 产品确认

2026-09-30 当前联调确认：

- H5 团队的职责是接住老伙伴提供的卡包接口，不替后端审查或设计代 call 内部实现；
- 当前先接“卡包列表读链路”，不因为已知上上游接口而越过老伙伴直连转赠、领取、核销等接口；
- UI 维持现有 `/card` 三态结构，不在本卡重新设计卡包。

### 1.2 老伙伴 H5 接口契约

当前正式输入为：

```http
POST /api/coupons/MyCoupons
Authorization: Bearer <accessToken>
Content-Type: application/json
```

请求：

```json
{
  "type": "unused",
  "page": 1,
  "pageSize": 15
}
```

已确认：

- `type` 仅允许 `unused | used | out_of_date`；
- `page` 默认 1；
- `pageSize` 默认 15、最大 100；
- 响应列表位于 `data.data`；
- 分页元数据为 `current_page / per_page / total / last_page`；
- 空列表返回 `data.data = []`，分页信息仍保留。

用户持券字段：

- `id`：优惠卡记录 ID；未来转赠时作为 `log_id`；
- `active_name`：活动名称；
- `get_amount`：优惠卡金额；
- `used_amount`：已使用金额；
- `enable_amount`：当前可用金额；
- `valid_date_range`：完整有效期范围；
- `dc_type`：优惠卡使用类型，具体枚举不由 H5 猜测；
- `dc_type_format`：后端已格式化的类型文案。

### 1.3 上上游语义交叉证据

用户提供的上上游“我的卡”接口文档确认：

- 用户持有优惠卡列表原能力为 `POST api/users/activity/myDiscountcardlogsList`；
- 同样使用 `unused / used / out_of_date` 三种分类；
- 原始列表为 `discountcardlogs_list`，总数为 `total_rows`；
- `id` 同样明确为用户优惠卡记录 ID，转赠时作为 `log_id`；
- 上述八个业务字段与老伙伴 H5 契约语义一致。

该证据只用于确认“字段语义和状态分类能对上”；H038 不消费上上游 URL、签名、salt、secstr、token、dialog 或错误码协议。

### 1.4 当前 H5 事实

基线：`dev@7da69a013275c5b424c1bafb93b171cedfc2c837`。

当前 `src/pages/Card.tsx`：

- 三个 UI Tab 为 `available / used / expired`；
- 正式列表数据却读取 `GET /api/coupons/index` 的券模板；
- 因券模板没有用户持券金额与有效期，当前 view-model 只能隐藏这些字段；
- `used / expired` 当前没有真实数据源，列表固定为空；
- 页面同时保留 development-only 的上上游直连 probe；该 probe 是历史联调证据，不是正式生产数据链。

当前 `src/services/coupons.ts`：

- `/api/coupons/index` 描述的是券模板 / 可兑换券；
- 其字段 `name / points_number / total_number / exchanged_nuuur / status` 与“用户已持有哪张券”不是同一实体；
- 该 service 仍被兑换相关页面消费，不能因为 H038 而改造成 MyCoupons。

当前运行策略：

- preview/dev 可使用 MSW mock；
- test/prod 固定使用真实 API，禁止 mock 业务兜底；
- 因此 MyCoupons 必须通过统一 service 暴露，页面不能写 `mock | api` 两套调用逻辑。

## 2. 设计结论

### D-H038-01｜/card 的正式数据源是 MyCoupons，不是 coupons/index

`/card` 表达“当前用户已经持有的优惠卡”，其正式数据源切换为：

```text
Card page
  -> MyCoupons service
  -> POST /api/coupons/MyCoupons
```

`GET /api/coupons/index` 继续属于券模板 / 兑换场景，不在 H038 中删除或改义。

### D-H038-02｜三态映射固定且不新增第四种状态

现有 UI 状态与接口参数映射：

```text
available -> unused
used      -> used
expired   -> out_of_date
```

不新增“全部”Tab，不自行合并状态，不用 `dc_type` 推导卡券生命周期状态。

### D-H038-03｜用户持券 ID 与券模板 ID 必须保持实体边界

`MyCoupons.data.data[].id` 是“用户优惠卡记录 ID”。

H5 必须把该 ID 保留到用户持券领域模型中，不得与 `coupons/index.id` 的券模板 ID 混用。

H038 不实现转赠，但不得破坏未来 `log_id = MyCoupons record id` 的接线条件。

### D-H038-04｜金额与有效期保留原始业务精度

- `get_amount / used_amount / enable_amount` 按契约接受 `string | number`；
- transport / domain 边界不因 UI 展示需要提前丢失两位小数或做浮点重算；
- `valid_date_range` 是完整业务字段，不在 service/adapter 层擅自截断成单个“到期日”；
- UI view-model 可以决定展示格式，但不能让转换丢失源数据。

### D-H038-05｜H5 不接触上上游签名协议

正式 H5 不调用：

```text
api/users/activity/myDiscountcardlogsList
```

也不处理：

- `startIndex`；
- 上游 token / salt；
- `timesp / secstr`；
- 上游 form-urlencoded 签名；
- 上游 `502/505/405+dialog` 等遗留协议。

现有 `cardPackage.ts / cardPackageProbe.ts` 在 H038 中不删除、不推广为生产依赖；它们保留为历史联调 / probe 证据。

### D-H038-06｜Mock 与 API 使用同一业务 service

新增 MyCoupons 的 MSW handler / fixture 时：

```text
Card.tsx
  -> same MyCoupons service
      -> MSW (preview/dev mock)
      -> real API (test/prod)
```

页面不得根据环境直接切换数据结构或调用方式。

test/prod 不允许 API 失败后静默回退 fixture。

### D-H038-07｜分页是数据能力，不新增页面分页设计

H038 必须完整保存接口分页元数据，尤其：

- Tab 数量应依据对应分类的 `total`，不能用当前页 `data.length` 冒充总数；
- 页面现有设计没有分页控件，本卡不新增分页 UI；
- 若实现需要读取多页，采用 service/page-state 层的增量或聚合策略，不把分页协议散落进票券组件。

具体采用“预取三个分类”还是“按需加载 + 缓存”，属于实现选择；前提是：
1. 不伪造未加载分类数量；
2. 不把 `pageSize=15` 的当前页长度当总数；
3. 不改变现有三态视觉结构。

### D-H038-08｜真实 API 模式不得用 fixture 冒充真实持券

当前 `Card.tsx` 对 `?coupon=` 未命中时会回退 `resolveCardCoupon()`。

H038 接入后：

- mock/dev 仍可保留确定性 fixture 深链用于视觉回归；
- test/prod 的真实持券流程不得在 ID 未命中时静默显示另一张 fixture 券；
- 真实 API 列表项打开使用弹层时必须展示该条 MyCoupons 记录映射出的内容。

### D-H038-09｜动作接口不属于本卡

H038 不因为已知上上游能力而自行接入：

- 优惠卡转赠；
- 领取优惠卡；
- 消费密码核销；
- 其它卡操作。

转赠按钮、扫码/密码入口涉及的后续行为只能沿用已确认的现有边界；不得把上上游接口直接写入 H5。

## 3. 预期实现面

预计涉及的最小代码面：

1. 新 MyCoupons service + Zod contract；
2. service contract tests；
3. MSW fixture + handler + handler registry；
4. `Card.tsx` 数据源和 view-model 映射；
5. Card 页面回归测试（状态映射、真实字段展示、空态/错误态、fixture/API 边界）；
6. 必要的接口接入文档同步。

明确不需要：

- 新路由；
- 新页面；
- 新 JSBridge capability；
- 后端修改；
- Native 修改；
- 数据库/schema 迁移；
- 重做 `coupons.ts`；
- 删除上上游 probe。

## 4. 工作量评估

**规模：中等，单卡可独立验收。**

原因：

- UI 结构已经存在，不需要重新设计页面；
- 接口字段和三态状态已明确，不存在业务模型探索；
- 项目已有统一 HTTP、Zod contract、MSW、错误模型可复用；
- 主要工作是纠正实体边界和数据源，并补足 mock/API 一致性与回归。

预计改动面：

- 生产代码约 3–5 个文件；
- Mock / fixture 约 2–3 个文件；
- 测试约 2–3 个文件；
- 文档 1–2 个文件。

主要风险不在代码量，而在：

1. 不能把券模板 ID 与用户持券记录 ID 混用；
2. 三个 Tab 的 `total` 与分页不能用当前页长度替代；
3. test/prod 不得因 `?coupon=` 未命中而回退 fixture；
4. 不得顺手把尚无老伙伴 H5 契约的转赠/核销动作“接上上游”。

## 5. 验证门槛

自动化至少证明：

- `unused / used / out_of_date` 三种请求映射正确；
- MyCoupons 成功信封与字段类型可解析；
- 空列表 + 分页元数据可解析；
- 非 0 业务响应进入统一 AppError；
- 页面三个 Tab 能渲染各自真实数据；
- `enable_amount / valid_date_range / dc_type_format` 不因旧券模板 view-model 丢失；
- Tab count 使用 `total` 语义；
- API 模式不存在 fixture 静默兜底；
- 现有 `coupons/index` 兑换链不因 H038 回归。

工程检查至少：

```bash
npm run typecheck
npm run lint
npx vitest run <H038相关测试>
npm run build
```

真实后端可用时，再补 test 环境 smoke；没有真实响应证据时不得宣称真接口已验收。

## 6. H038 停止条件

遇到以下情况停止扩展并回报，而不是自行补协议：

- 老伙伴 `MyCoupons` 实际返回与当前文档字段/类型 materially 不一致；
- 页面动作需要新的转赠 / 核销 H5 契约才能继续；
- 产品要求改变卡包三态结构或新增分页交互；
- 真实 API 需要文档未给出的额外参数或鉴权行为。
