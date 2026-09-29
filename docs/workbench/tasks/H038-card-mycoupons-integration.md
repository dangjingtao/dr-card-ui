# H038｜MyCoupons 用户卡包列表接入

**Status:** Planned  
**Phase:** API Integration / Card Package  
**Depends on:** H007, H009, H013, H035

## 设计依据

本卡的设计与施工依据集中记录在：

- [H038｜卡包 MyCoupons 接入设计依据](../evidence/h038-card-mycoupons-integration.md)

本卡只负责 H5 前端接住老伙伴已经提供的 `POST /api/coupons/MyCoupons` 契约，不审查、不规定老伙伴后端如何代 call 上上游，也不因为知道上上游接口而越过老伙伴直连动作接口。

## 背景

当前 `/card` 表达“当前登录用户已经持有的优惠卡”，但 `dev` 仍读取 `GET /api/coupons/index` 券模板列表。

这导致：

- 可用券使用了错误实体；
- 已使用 / 已过期没有真实数据源；
- 用户持券金额、剩余金额和有效期无法按真实数据展示；
- 券模板 ID 与用户持券记录 ID 存在混用风险。

老伙伴当前已提供正式 H5 契约：

```http
POST /api/coupons/MyCoupons
Authorization: Bearer <accessToken>
Content-Type: application/json
```

请求参数：

- `type = unused | used | out_of_date`
- `page` 默认 1
- `pageSize` 默认 15，最大 100

返回用户持券字段：

- `id`
- `active_name`
- `get_amount`
- `used_amount`
- `enable_amount`
- `valid_date_range`
- `dc_type`
- `dc_type_format`

## 目标

让 `/card` 的正式列表读链路切换到 MyCoupons，并保持现有三态 UI 不漂移：

```text
available -> unused
used      -> used
expired   -> out_of_date
```

同时保持：

- 用户持券记录 ID 与券模板 ID 的实体边界；
- mock / api 走同一业务 service；
- test/prod 不使用 fixture 兜底真实业务失败；
- `coupons/index` 继续承担券模板 / 兑换职责；
- 上上游直连 probe 不进入正式生产链路。

## 范围

允许修改：

- MyCoupons 专用 service / contract；
- service contract tests；
- MyCoupons MSW fixture / handler；
- `Card.tsx` 的数据源、状态映射与 view-model；
- 与本卡直接相关的 Card 页面测试；
- 必要的接口接入说明。

## 不做

- 不接优惠卡转赠；
- 不接优惠卡领取；
- 不新增消费密码核销 API；
- 不改 Native / JSBridge；
- 不修改老伙伴后端；
- 不让 H5 正式链路直连 `api/users/activity/myDiscountcardlogsList`；
- 不重做 `coupons.ts`；
- 不删除 `cardPackage.ts / cardPackageProbe.ts`；
- 不新增“全部”Tab；
- 不新增分页 UI；
- 不借本卡清理其它卡券或 Bridge 代码。

## 关键约束

### 1. 三态映射固定

```text
available -> unused
used      -> used
expired   -> out_of_date
```

不得自行新增或推导其它状态。

### 2. 用户持券 ID 是独立实体

`MyCoupons.data.data[].id` 是用户持券记录 ID。

不得与 `coupons/index.id` 的券模板 ID 混用；未来转赠的 `log_id` 必须能够继续使用该记录 ID。

### 3. 不丢金额和有效期语义

- 金额字段按契约接受 `string | number`；
- 不在 service 层自行浮点重算；
- `valid_date_range` 保留完整范围，不提前截成单个到期日；
- UI 可做展示转换，但不得破坏源字段语义。

### 4. 分页数据必须真实

- Tab 数量使用对应分类的 `total`；
- 不允许用当前页 `data.length` 冒充总数；
- 页面不新增分页 UI；
- 是否按需加载 / 缓存由实现决定，但结果必须保持准确。

### 5. Mock / API 同一 service

preview/dev 的 MSW 与 test/prod 的真实 API 必须通过同一个 MyCoupons service 消费。

test/prod API 失败或记录 ID 未命中时，不得静默展示 fixture 券。

## 验收标准

- [ ] `/card` 正式列表不再依赖 `GET /api/coupons/index`。
- [ ] 三个现有 Tab 分别请求 `unused / used / out_of_date`。
- [ ] MyCoupons contract 正确解析文档定义的字段和分页结构。
- [ ] `string | number` 金额与 `number | string` 的 `dc_type` 均可正常解析。
- [ ] 用户持券记录 ID 与券模板 ID 不混用。
- [ ] 卡面可消费 `active_name / enable_amount / valid_date_range / dc_type_format`。
- [ ] Tab count 使用接口 `total`。
- [ ] 空列表正确保留分页语义并渲染现有空态。
- [ ] preview/dev MSW 与 test/prod API 使用同一 service。
- [ ] API 模式不存在 fixture 静默兜底。
- [ ] `coupons/index` 的兑换职责与相关回归不受影响。
- [ ] 未获得老伙伴正式 H5 动作契约前，不把上上游转赠 / 领取 / 核销接口直接写入 H5。
- [ ] `npm run typecheck`、`npm run lint`、H038 相关 Vitest、`npm run build` 通过。

## 工作量

**中等，单卡可独立验收。**

预计改动面：

- 生产代码：3–5 个文件；
- Mock / fixture：2–3 个文件；
- 测试：2–3 个文件；
- 文档：1–2 个文件。

主要风险是实体边界、分页 total、fixture/API 隔离，不是 UI 重构。

## 停止条件

遇到以下情况不自行扩协议：

- MyCoupons 实际响应与当前文档 materially 不一致；
- 动作流程需要新的转赠 / 核销 H5 契约；
- 产品要求改变卡包三态结构或新增分页交互；
- 真实 API 要求文档未给出的额外参数或鉴权行为。

## 当前施工基线

- H5：`dev@7da69a013275c5b424c1bafb93b171cedfc2c837`
- 施工分支：`feat/card-mycoupons-integration`

## 产出

- H038 任务卡；
- H038 设计依据；
- MyCoupons service / contract；
- MSW；
- `/card` 正式读链路接线；
- 自动化回归证据。
