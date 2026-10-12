# 兑换卡券｜H5 ↔ 后台正式协议对照

> 来源：2026-10-12 后台同事交接的「兑换码核兑接口」，由用户在本线程提供。此文档记录**已确认的对接合同**，不宣称已部署、已完成数据库联调或真机验收。H5 修改仅在 GitHub `dr-card-ui` 进行，本地 API 项目只读。

## 1. 用户兑换码核兑

```http
POST /api/cardredemptioncodes/redeem
Authorization: Bearer <accessToken>
Content-Type: application/json
```

```json
{ "code": "ABC123456789" }
```

- 仅提交 `code`；`user_id`、`card_id`、`status` 都由服务端确定。
- **不少于 10 位**；不额外限制输入字符类型、大小写或前端最大长度，也不自动删除空格、转换大写。
- 后端当前数据库表中 `code` 字段长度为 64；这是存储约束，不是 H5 要主动增加的校验规则。
- 服务端核对状态 10 未兑换、20 已兑换、30 已过期、40 已禁用，验证有效期和卡模板，采用事务核兑发券。
- 客户端用标准 `code === 0` 判断业务成功，HTTP 200 + `code:500` 是失败，展示 `message`；HTTP 401 交给现有登录态处理。

### 成功响应

```json
{
  "code": 0,
  "msg": "success",
  "status": "succ",
  "data": {
    "user_card_id": 21,
    "card_id": 4,
    "card_name": "洗护体验卡",
    "card_sn": "RC00000000000014"
  }
}
```

H5 校验四个回执字段后显示成功页；任一关键字段缺失视为协议错误，不把未确认的发券结果当作成功。

### 失败响应示例

```json
{ "code": 500, "message": "该兑换码已被使用", "data": [] }
```

包括格式不足、兑换码无效／已使用／已过期／已禁用／尚未生效、模板不可用等；错误文本由后台提供。

## 2. 兑换成功后的卡包展示

**必须同时区分两种券来源，不混淆券 ID：**

| 来源 | 读取接口 | 用途 |
|---|---|---|
| 本地用户卡包 | `GET /api/usercards/index` | 兑换码核兑券，`source=60`，`source_id` 对应兑换码 ID |
| 第三方优惠卡 | `POST /api/coupons/MyCoupons` | 既有第三方优惠卡列表；不会包含本地兑换码券 |

- 本地列表读取当前登录用户的分页数据，**完整分页后**筛选 `source===60`，防止在单页过滤遗漏后续兑换券。
- 本地卡券依据已返回的 `status=10/20/30` 对应「可用／已使用／已过期」；不将第三方记录的字段硬套成本地券。
- 后端没有在此协议里提供本地券使用／转赠业务入口，因此 H5 **不把本地 ID 当作第三方 MyCoupons 的核销或转赠 ID**，相应按钮不可用。
- 本地卡包与第三方列表各自加载与报错，不能因为一个来源失败就伪造另一个来源的数据。

## 3. 后端归属与验收边界

- 后端管理接口 `/admin/cardredemptioncodes/*` 不由 H5 调用；用户端旧 CRUD `/api/cardredemptioncodes/{index,add,update,delete,detail,select}` 已关闭。
- H5 只调用 `redeem` 与已确认的本地卡包读取接口，不修改后台实现。
- 真实 API 的环境部署、DB 联通、授权、发券到账和 App WebView 仍需在 test 环境验证；Mock 成功不是业务验收。
