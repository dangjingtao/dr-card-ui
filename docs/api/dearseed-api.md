# DearSeed 后台接口文档（整理版）

> 数据源：`http://192.168.1.81:7002/swagger-ui/index.json`（FastAdmin 自动生成）
> 原始快照：`docs/api/dearseed-openapi.json`
> 抓取时间：2026-09-16
> 更新记录：2026-09-28 后端统一响应协议 —— 成功码由 `200` 改为 `0`（兼容原生，含 `GET /api/user/detail`），失败结构字段名为 `message`；来源为后台首页联调文档与后端确认，§3 及相关示例已同步。

## 1. 总体说明

- **接口前缀**：所有接口均在 `/api` 下，基础 URL 由 `VITE_API_BASE_URL` 提供。
- **接口规模**：20 个 tag / 108 个接口 / 82 个 schema。
- **重要甄别**：绝大多数接口是 FastAdmin 基于数据表自动生成的 **原始数据模型 CRUD**（每个实体 `index/add/detail/update/delete/select` 六件套），属管理后台性质，**不是产品最终定稿的业务接口**。
- **响应 envelope**：2026-09-28 后端已统一信封（见「3. 通用 CRUD 接口契约」）：成功 `code: 0`（`{ code, msg, data, status }`），失败为非 0 code 且字段名是 `message`（不是 `msg`）。本 OpenAPI 本身未定义响应结构（仅 `description: OK`）。
- **字段级契约**：CRUD 入参/出参由「3. 通用 CRUD 接口契约」+ 各实体的 Save/Index schema 组成；`oauth/login` 等业务接口的请求参数 schema 在 OpenAPI 中为空 `{"type":"object"}`，字段仍需后端确认或实测。
- **认证**：文档声明 `security: [{authorization: []}]`，具体鉴权方式未在文档中描述（cookie / header / token 均未知）。

## 2. 接口分类

| 分类 | 判定 | 典型 tag |
|---|---|---|
| 业务接口 | 登录注册、会员、系统配置、上传、以及各实体供展示/查询用的 `index/select/detail` | 用户注册登录、系统配置、会员列表、文件上传接口、轮播图、签到、兑换商品等 |
| 原始数据模型 CRUD | 各实体的 `add/update/delete` 及全部管理性质操作 | 卡券模板管理、兑换码管理、文件上传分组等 |

> 注：`select` 通常用于下拉/展示数据（H5 首屏、签到活动、兑换商品列表等场景可能用到）；`add/update/delete` 属于后台管理，H5 原则上不直接调用。

---

## 3. 通用 CRUD 接口契约

> 来源：后端包装器契约文档（后端提供），是六个 CRUD 方法共用的统一约定。

### 3.1 方法语义

| 方法 | 路由后缀 | HTTP | 入参 DTO | 成功 `data` | 语义 |
| --- | --- | --- | --- | --- | --- |
| index | `/index` | GET | `XxxIndex` | 分页列表对象 | 分页查询 |
| add | `/add` | POST | `XxxSave` | 保存后的实体 | 新增 |
| detail | `/detail` | GET | `XxxDetail` | 单个实体 / `null` | 详情 |
| update | `/update` | POST | `XxxUpdate` | 更新后的实体 / `null` | 修改 |
| delete | `/delete` | POST | `XxxDelete` | 删除条件对象 | 删除(含关联) |
| select | `/select` | GET | `XxxIndex` | 下拉选项分页对象 | 下拉选择 |

### 3.2 通用响应体

所有六个方法共用同一层信封；**2026-09-28 起成功码统一为 `0`**（兼容原生），成功与失败走两套结构（失败见 3.5）。

成功：

```json
{ "code": 0, "msg": "success", "data": [], "status": "succ" }
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `code` | `number` | 恒为 `0` |
| `msg` | `string` | 恒为 `"success"` |
| `data` | `any` | 业务数据，默认 `[]`，**不是 `null`** |
| `status` | `string` | 恒为 `"succ"` |

### 3.3 通用入参字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `page` | `number` | 页码，默认 `1`，小于 1 会被夹到 `1` |
| `pageSize` | `number` | 每页条数，默认 `15`，**上限 100**（`select` 为 100/500） |
| `id` | `number \| number[]` | 主键；数组时按 `IN` 处理 |
| `ids` | `number[]` | 批量主键 |
| `create_time` / `update_time` | `string \| number \| Date` | 区间查询时传两元素数组 |
| `orderBy[字段]` | `'ASC' \| 'DESC'` | 自定义排序；不传默认 `id DESC` |

### 3.4 各方法的成功输出

#### index — 分页列表

```json
{
  "code": 0,
  "msg": "success",
  "status": "succ",
  "data": {
    "data": [ { "id": 1, "title": "首页banner", "status": 10 } ],
    "current_page": 1,
    "per_page": 15,
    "total": 1,
    "last_page": 1
  }
}
```

- 列表数组在 `data.data`，**嵌套两层**；分页信息与它同级。
- `last_page = max(ceil(total / per_page), 1)`，空结果时是 `1` 不是 `0`。
- 实体字段 = 模型全部列 + `join` 声明的关联；`select: false` 的列（如 `is_delete`）不返回。
- 默认只返回 `is_delete = 0` 的记录；要查已删除的需显式传 `is_delete`。

#### add — 新增

```json
{ "code": 0, "msg": "success", "status": "succ", "data": { "id": 3, "title": "新banner", "create_time": "2026-09-16 10:00:00" } }
```

返回**保存后的实体**，含自增 `id`。多对多关联字段传 `[1,2]` 会被转成 `[{id:1},{id:2}]` 写入中间表。整个过程在 `READ COMMITTED` 事务内。

#### update — 修改

```json
{ "code": 0, "msg": "success", "status": "succ", "data": { "id": 3, "title": "改过的标题" } }
```

- **`id` 不存在时返回 `null`**，不是报错 —— 即 `code: 0` + `data: null`，前端需自行判空。
- 只更新传入的字段（`Object.assign`），未传的保持原值。
- 入参为空对象会抛错 → 走失败分支。

#### detail — 详情

```json
{ "code": 0, "msg": "success", "status": "succ", "data": { "id": 3, "title": "首页banner" } }
```

**记录不存在时 `data` 为 `null`**（`getOne()` 无结果），同样不是报错。

#### delete — 删除

```json
{ "code": 0, "msg": "success", "status": "succ", "data": { "id": { "_type": "in", "_value": [3] }, "is_delete": { "_type": "equal", "_value": 0 } } }
```

#### select — 下拉选项

```json
{
  "code": 0,
  "msg": "success",
  "status": "succ",
  "data": {
    "data": [ { "value": 3, "label": "首页banner" } ],
    "current_page": 1,
    "per_page": 100,
    "total": 1,
    "last_page": 1
  }
}
```

### 3.5 失败输出

失败结构与成功不同：字段名是 `message`（不是 `msg`），且**没有 `status` 字段**：

```json
{ "code": 500, "message": "\"配置标题\" is required", "data": [] }
```

- 未登录 / token 过期：HTTP 401 + `{"code":401,"message":"请先登录","data":[]}`；
- 业务校验失败（如重复签到）：HTTP 400 + `{"code":400,"message":"今日已签到","data":[]}`；
- 参数缺失 / 格式错误：HTTP 200 + `{"code":500,"message":"…","data":[]}` —— HTTP 状态码不参与成败判断，必须判 `code`。

---

## api/轮播图管理（6）

### banners_index

- **方法**：`GET`
- **路径**：`/api/banners/index`
- **operationId**：`banners_index`
- **参数**：
  - `page`（query）: 页码
  - `pageSize`（query）: 分页大小
- **响应**：文档未定义字段结构（仅 200 OK）

### banners_add

- **方法**：`POST`
- **路径**：`/api/banners/add`
- **operationId**：`banners_add`
- **请求体**：`application/json`【必填】 schema：`{"$ref":"#/components/schemas/BannersSave"}`
- **响应**：文档未定义字段结构（仅 200 OK）

### banners_detail

- **方法**：`GET`
- **路径**：`/api/banners/detail`
- **operationId**：`banners_detail`
- **参数**：
  - `id`（query）: ID
- **响应**：文档未定义字段结构（仅 200 OK）

### banners_update

- **方法**：`POST`
- **路径**：`/api/banners/update`
- **operationId**：`banners_update`
- **请求体**：`application/json`【必填】 schema：`{"$ref":"#/components/schemas/BannersUpdate"}`
- **响应**：文档未定义字段结构（仅 200 OK）

### banners_delete

- **方法**：`POST`
- **路径**：`/api/banners/delete`
- **operationId**：`banners_delete`
- **请求体**：`application/json`【必填】 schema：`{"$ref":"#/components/schemas/BannersDelete"}`
- **响应**：文档未定义字段结构（仅 200 OK）

### banners_select

- **方法**：`GET`
- **路径**：`/api/banners/select`
- **operationId**：`banners_select`
- **参数**：
  - `page`（query）: 页码
  - `pageSize`（query）: 分页大小
- **响应**：文档未定义字段结构（仅 200 OK）

---

## api/卡券模板管理（6）

### card_index

- **方法**：`GET`
- **路径**：`/api/card/index`
- **operationId**：`card_index`
- **参数**：
  - ``（query）【必填】
  - `page`（query）: 页码
  - `pageSize`（query）: 分页大小
- **响应**：文档未定义字段结构（仅 200 OK）

### card_add

- **方法**：`POST`
- **路径**：`/api/card/add`
- **operationId**：`card_add`
- **请求体**：`application/json`【必填】 schema：`{"$ref":"#/components/schemas/CardSave"}`
- **响应**：文档未定义字段结构（仅 200 OK）

### card_detail

- **方法**：`GET`
- **路径**：`/api/card/detail`
- **operationId**：`card_detail`
- **参数**：
  - ``（query）【必填】
  - `id`（query）: ID
- **响应**：文档未定义字段结构（仅 200 OK）

### card_update

- **方法**：`POST`
- **路径**：`/api/card/update`
- **operationId**：`card_update`
- **请求体**：`application/json`【必填】 schema：`{"$ref":"#/components/schemas/CardUpdate"}`
- **响应**：文档未定义字段结构（仅 200 OK）

### card_delete

- **方法**：`POST`
- **路径**：`/api/card/delete`
- **operationId**：`card_delete`
- **请求体**：`application/json`【必填】 schema：`{"$ref":"#/components/schemas/CardDelete"}`
- **响应**：文档未定义字段结构（仅 200 OK）

### card_select

- **方法**：`GET`
- **路径**：`/api/card/select`
- **operationId**：`card_select`
- **参数**：
  - ``（query）【必填】
  - `page`（query）: 页码
  - `pageSize`（query）: 分页大小
- **响应**：文档未定义字段结构（仅 200 OK）

---

## api/兑换码管理（6）

### cardredemptioncodes_index

- **方法**：`GET`
- **路径**：`/api/cardredemptioncodes/index`
- **operationId**：`cardredemptioncodes_index`
- **参数**：
  - ``（query）【必填】
  - `page`（query）: 页码
  - `pageSize`（query）: 分页大小
- **响应**：文档未定义字段结构（仅 200 OK）

### cardredemptioncodes_add

- **方法**：`POST`
- **路径**：`/api/cardredemptioncodes/add`
- **operationId**：`cardredemptioncodes_add`
- **请求体**：`application/json`【必填】 schema：`{"$ref":"#/components/schemas/CardRedemptionCodesSave"}`
- **响应**：文档未定义字段结构（仅 200 OK）

### cardredemptioncodes_detail

- **方法**：`GET`
- **路径**：`/api/cardredemptioncodes/detail`
- **operationId**：`cardredemptioncodes_detail`
- **参数**：
  - ``（query）【必填】
  - `id`（query）: ID
- **响应**：文档未定义字段结构（仅 200 OK）

### cardredemptioncodes_update

- **方法**：`POST`
- **路径**：`/api/cardredemptioncodes/update`
- **operationId**：`cardredemptioncodes_update`
- **请求体**：`application/json`【必填】 schema：`{"$ref":"#/components/schemas/CardRedemptionCodesUpdate"}`
- **响应**：文档未定义字段结构（仅 200 OK）

### cardredemptioncodes_delete

- **方法**：`POST`
- **路径**：`/api/cardredemptioncodes/delete`
- **operationId**：`cardredemptioncodes_delete`
- **请求体**：`application/json`【必填】 schema：`{"$ref":"#/components/schemas/CardRedemptionCodesDelete"}`
- **响应**：文档未定义字段结构（仅 200 OK）

### cardredemptioncodes_select

- **方法**：`GET`
- **路径**：`/api/cardredemptioncodes/select`
- **operationId**：`cardredemptioncodes_select`
- **参数**：
  - ``（query）【必填】
  - `page`（query）: 页码
  - `pageSize`（query）: 分页大小
- **响应**：文档未定义字段结构（仅 200 OK）

---

## api/消息记录（6）

### chatmessages_index

- **方法**：`GET`
- **路径**：`/api/chatmessages/index`
- **operationId**：`chatmessages_index`
- **参数**：
  - `page`（query）: 页码
  - `pageSize`（query）: 分页大小
- **响应**：文档未定义字段结构（仅 200 OK）

### chatmessages_add

- **方法**：`POST`
- **路径**：`/api/chatmessages/add`
- **operationId**：`chatmessages_add`
- **请求体**：`application/json`【必填】 schema：`{"$ref":"#/components/schemas/ChatMessagesSave"}`
- **响应**：文档未定义字段结构（仅 200 OK）

### chatmessages_detail

- **方法**：`GET`
- **路径**：`/api/chatmessages/detail`
- **operationId**：`chatmessages_detail`
- **参数**：
  - `id`（query）: ID
- **响应**：文档未定义字段结构（仅 200 OK）

### chatmessages_update

- **方法**：`POST`
- **路径**：`/api/chatmessages/update`
- **operationId**：`chatmessages_update`
- **请求体**：`application/json`【必填】 schema：`{"$ref":"#/components/schemas/ChatMessagesUpdate"}`
- **响应**：文档未定义字段结构（仅 200 OK）

### chatmessages_delete

- **方法**：`POST`
- **路径**：`/api/chatmessages/delete`
- **operationId**：`chatmessages_delete`
- **请求体**：`application/json`【必填】 schema：`{"$ref":"#/components/schemas/ChatMessagesDelete"}`
- **响应**：文档未定义字段结构（仅 200 OK）

### chatmessages_select

- **方法**：`GET`
- **路径**：`/api/chatmessages/select`
- **operationId**：`chatmessages_select`
- **参数**：
  - `page`（query）: 页码
  - `pageSize`（query）: 分页大小
- **响应**：文档未定义字段结构（仅 200 OK）

---

## api/用户好友关系管理（6）

### friends_index

- **方法**：`GET`
- **路径**：`/api/friends/index`
- **operationId**：`friends_index`
- **参数**：
  - ``（query）【必填】
  - `page`（query）: 页码
  - `pageSize`（query）: 分页大小
- **响应**：文档未定义字段结构（仅 200 OK）

### friends_add

- **方法**：`POST`
- **路径**：`/api/friends/add`
- **operationId**：`friends_add`
- **请求体**：`application/json`【必填】 schema：`{"$ref":"#/components/schemas/FriendsSave"}`
- **响应**：文档未定义字段结构（仅 200 OK）

### friends_detail

- **方法**：`GET`
- **路径**：`/api/friends/detail`
- **operationId**：`friends_detail`
- **参数**：
  - ``（query）【必填】
  - `id`（query）: ID
- **响应**：文档未定义字段结构（仅 200 OK）

### friends_update

- **方法**：`POST`
- **路径**：`/api/friends/update`
- **operationId**：`friends_update`
- **请求体**：`application/json`【必填】 schema：`{"$ref":"#/components/schemas/FriendsUpdate"}`
- **响应**：文档未定义字段结构（仅 200 OK）

### friends_delete

- **方法**：`POST`
- **路径**：`/api/friends/delete`
- **operationId**：`friends_delete`
- **请求体**：`application/json`【必填】 schema：`{"$ref":"#/components/schemas/FriendsDelete"}`
- **响应**：文档未定义字段结构（仅 200 OK）

### friends_select

- **方法**：`GET`
- **路径**：`/api/friends/select`
- **operationId**：`friends_select`
- **参数**：
  - ``（query）【必填】
  - `page`（query）: 页码
  - `pageSize`（query）: 分页大小
- **响应**：文档未定义字段结构（仅 200 OK）

---

## api/系统通知管理（6）

### notices_index

- **方法**：`GET`
- **路径**：`/api/notices/index`
- **operationId**：`notices_index`
- **参数**：
  - ``（query）【必填】
  - `page`（query）: 页码
  - `pageSize`（query）: 分页大小
- **响应**：文档未定义字段结构（仅 200 OK）

### notices_add

- **方法**：`POST`
- **路径**：`/api/notices/add`
- **operationId**：`notices_add`
- **请求体**：`application/json`【必填】 schema：`{"$ref":"#/components/schemas/NoticesSave"}`
- **响应**：文档未定义字段结构（仅 200 OK）

### notices_detail

- **方法**：`GET`
- **路径**：`/api/notices/detail`
- **operationId**：`notices_detail`
- **参数**：
  - ``（query）【必填】
  - `id`（query）: ID
- **响应**：文档未定义字段结构（仅 200 OK）

### notices_update

- **方法**：`POST`
- **路径**：`/api/notices/update`
- **operationId**：`notices_update`
- **请求体**：`application/json`【必填】 schema：`{"$ref":"#/components/schemas/NoticesUpdate"}`
- **响应**：文档未定义字段结构（仅 200 OK）

### notices_delete

- **方法**：`POST`
- **路径**：`/api/notices/delete`
- **operationId**：`notices_delete`
- **请求体**：`application/json`【必填】 schema：`{"$ref":"#/components/schemas/NoticesDelete"}`
- **响应**：文档未定义字段结构（仅 200 OK）

### notices_select

- **方法**：`GET`
- **路径**：`/api/notices/select`
- **operationId**：`notices_select`
- **参数**：
  - ``（query）【必填】
  - `page`（query）: 页码
  - `pageSize`（query）: 分页大小
- **响应**：文档未定义字段结构（仅 200 OK）

---

## api/用户通知阅读记录管理（6）

### noticeusers_index

- **方法**：`GET`
- **路径**：`/api/noticeusers/index`
- **operationId**：`noticeusers_index`
- **参数**：
  - ``（query）【必填】
  - `page`（query）: 页码
  - `pageSize`（query）: 分页大小
- **响应**：文档未定义字段结构（仅 200 OK）

### noticeusers_add

- **方法**：`POST`
- **路径**：`/api/noticeusers/add`
- **operationId**：`noticeusers_add`
- **请求体**：`application/json`【必填】 schema：`{"$ref":"#/components/schemas/NoticeUsersSave"}`
- **响应**：文档未定义字段结构（仅 200 OK）

### noticeusers_detail

- **方法**：`GET`
- **路径**：`/api/noticeusers/detail`
- **operationId**：`noticeusers_detail`
- **参数**：
  - ``（query）【必填】
  - `id`（query）: ID
- **响应**：文档未定义字段结构（仅 200 OK）

### noticeusers_update

- **方法**：`POST`
- **路径**：`/api/noticeusers/update`
- **operationId**：`noticeusers_update`
- **请求体**：`application/json`【必填】 schema：`{"$ref":"#/components/schemas/NoticeUsersUpdate"}`
- **响应**：文档未定义字段结构（仅 200 OK）

### noticeusers_delete

- **方法**：`POST`
- **路径**：`/api/noticeusers/delete`
- **operationId**：`noticeusers_delete`
- **请求体**：`application/json`【必填】 schema：`{"$ref":"#/components/schemas/NoticeUsersDelete"}`
- **响应**：文档未定义字段结构（仅 200 OK）

### noticeusers_select

- **方法**：`GET`
- **路径**：`/api/noticeusers/select`
- **operationId**：`noticeusers_select`
- **参数**：
  - ``（query）【必填】
  - `page`（query）: 页码
  - `pageSize`（query）: 分页大小
- **响应**：文档未定义字段结构（仅 200 OK）

---

## api/用户注册登录（4）

### oauth_login

- **方法**：`POST`
- **路径**：`/api/oauth/login`
- **operationId**：`oauth_login`
- **请求体**：`text/plain`【必填】 schema：`{"type":"object"}`
- **响应**：文档未定义字段结构（仅 200 OK）

### oauth_logout

- **方法**：`GET`
- **路径**：`/api/oauth/logout`
- **operationId**：`oauth_logout`
- **响应**：文档未定义字段结构（仅 200 OK）

### oauth_captcha

- **方法**：`POST`
- **路径**：`/api/oauth/captcha`
- **operationId**：`oauth_captcha`
- **请求体**：`text/plain`【必填】 schema：`{"type":"object"}`
- **响应**：文档未定义字段结构（仅 200 OK）

### oauth_agreement

- **方法**：`GET`
- **路径**：`/api/oauth/agreement`
- **operationId**：`oauth_agreement`
- **响应**：文档未定义字段结构（仅 200 OK）

---

## api/兑换商品管理（6）

### pointsgoods_index

- **方法**：`GET`
- **路径**：`/api/pointsgoods/index`
- **operationId**：`pointsgoods_index`
- **参数**：
  - ``（query）【必填】
  - `page`（query）: 页码
  - `pageSize`（query）: 分页大小
- **响应**：文档未定义字段结构（仅 200 OK）

### pointsgoods_add

- **方法**：`POST`
- **路径**：`/api/pointsgoods/add`
- **operationId**：`pointsgoods_add`
- **请求体**：`application/json`【必填】 schema：`{"$ref":"#/components/schemas/PointsGoodsSave"}`
- **响应**：文档未定义字段结构（仅 200 OK）

### pointsgoods_detail

- **方法**：`GET`
- **路径**：`/api/pointsgoods/detail`
- **operationId**：`pointsgoods_detail`
- **参数**：
  - ``（query）【必填】
  - `id`（query）: ID
- **响应**：文档未定义字段结构（仅 200 OK）

### pointsgoods_update

- **方法**：`POST`
- **路径**：`/api/pointsgoods/update`
- **operationId**：`pointsgoods_update`
- **请求体**：`application/json`【必填】 schema：`{"$ref":"#/components/schemas/PointsGoodsUpdate"}`
- **响应**：文档未定义字段结构（仅 200 OK）

### pointsgoods_delete

- **方法**：`POST`
- **路径**：`/api/pointsgoods/delete`
- **operationId**：`pointsgoods_delete`
- **请求体**：`application/json`【必填】 schema：`{"$ref":"#/components/schemas/PointsGoodsDelete"}`
- **响应**：文档未定义字段结构（仅 200 OK）

### pointsgoods_select

- **方法**：`GET`
- **路径**：`/api/pointsgoods/select`
- **operationId**：`pointsgoods_select`
- **参数**：
  - ``（query）【必填】
  - `page`（query）: 页码
  - `pageSize`（query）: 分页大小
- **响应**：文档未定义字段结构（仅 200 OK）

---

## api/系统配置（1）

### settings_detail

- **方法**：`GET`
- **路径**：`/api/settings/detail`
- **operationId**：`settings_detail`
- **参数**：
  - `id`（query）: ID
- **响应**：文档未定义字段结构（仅 200 OK）

---

## api/签到活动管理（6）

### signactivity_index

- **方法**：`GET`
- **路径**：`/api/signactivity/index`
- **operationId**：`signactivity_index`
- **参数**：
  - `page`（query）: 页码
  - `pageSize`（query）: 分页大小
- **响应**：文档未定义字段结构（仅 200 OK）

### signactivity_add

- **方法**：`POST`
- **路径**：`/api/signactivity/add`
- **operationId**：`signactivity_add`
- **请求体**：`application/json`【必填】 schema：`{"$ref":"#/components/schemas/SignActivitySave"}`
- **响应**：文档未定义字段结构（仅 200 OK）

### signactivity_detail

- **方法**：`GET`
- **路径**：`/api/signactivity/detail`
- **operationId**：`signactivity_detail`
- **参数**：
  - `id`（query）: ID
- **响应**：文档未定义字段结构（仅 200 OK）

### signactivity_update

- **方法**：`POST`
- **路径**：`/api/signactivity/update`
- **operationId**：`signactivity_update`
- **请求体**：`application/json`【必填】 schema：`{"$ref":"#/components/schemas/SignActivityUpdate"}`
- **响应**：文档未定义字段结构（仅 200 OK）

### signactivity_delete

- **方法**：`POST`
- **路径**：`/api/signactivity/delete`
- **operationId**：`signactivity_delete`
- **请求体**：`application/json`【必填】 schema：`{"$ref":"#/components/schemas/SignActivityDelete"}`
- **响应**：文档未定义字段结构（仅 200 OK）

### signactivity_select

- **方法**：`GET`
- **路径**：`/api/signactivity/select`
- **operationId**：`signactivity_select`
- **参数**：
  - `page`（query）: 页码
  - `pageSize`（query）: 分页大小
- **响应**：文档未定义字段结构（仅 200 OK）

---

## api/签到记录（6）

### signrecords_index

- **方法**：`GET`
- **路径**：`/api/signrecords/index`
- **operationId**：`signrecords_index`
- **参数**：
  - ``（query）【必填】
  - `page`（query）: 页码
  - `pageSize`（query）: 分页大小
- **响应**：文档未定义字段结构（仅 200 OK）

### signrecords_add

- **方法**：`POST`
- **路径**：`/api/signrecords/add`
- **operationId**：`signrecords_add`
- **请求体**：`application/json`【必填】 schema：`{"$ref":"#/components/schemas/SignRecordsSave"}`
- **响应**：文档未定义字段结构（仅 200 OK）

### signrecords_detail

- **方法**：`GET`
- **路径**：`/api/signrecords/detail`
- **operationId**：`signrecords_detail`
- **参数**：
  - ``（query）【必填】
  - `id`（query）: ID
- **响应**：文档未定义字段结构（仅 200 OK）

### signrecords_update

- **方法**：`POST`
- **路径**：`/api/signrecords/update`
- **operationId**：`signrecords_update`
- **请求体**：`application/json`【必填】 schema：`{"$ref":"#/components/schemas/SignRecordsUpdate"}`
- **响应**：文档未定义字段结构（仅 200 OK）

### signrecords_delete

- **方法**：`POST`
- **路径**：`/api/signrecords/delete`
- **operationId**：`signrecords_delete`
- **请求体**：`application/json`【必填】 schema：`{"$ref":"#/components/schemas/SignRecordsDelete"}`
- **响应**：文档未定义字段结构（仅 200 OK）

### signrecords_select

- **方法**：`GET`
- **路径**：`/api/signrecords/select`
- **operationId**：`signrecords_select`
- **参数**：
  - ``（query）【必填】
  - `page`（query）: 页码
  - `pageSize`（query）: 分页大小
- **响应**：文档未定义字段结构（仅 200 OK）

---

## api/奖励领取记录（6）

### signrewardlogs_index

- **方法**：`GET`
- **路径**：`/api/signrewardlogs/index`
- **operationId**：`signrewardlogs_index`
- **参数**：
  - `page`（query）: 页码
  - `pageSize`（query）: 分页大小
- **响应**：文档未定义字段结构（仅 200 OK）

### signrewardlogs_add

- **方法**：`POST`
- **路径**：`/api/signrewardlogs/add`
- **operationId**：`signrewardlogs_add`
- **请求体**：`application/json`【必填】 schema：`{"$ref":"#/components/schemas/SignRewardLogsSave"}`
- **响应**：文档未定义字段结构（仅 200 OK）

### signrewardlogs_detail

- **方法**：`GET`
- **路径**：`/api/signrewardlogs/detail`
- **operationId**：`signrewardlogs_detail`
- **参数**：
  - `id`（query）: ID
- **响应**：文档未定义字段结构（仅 200 OK）

### signrewardlogs_update

- **方法**：`POST`
- **路径**：`/api/signrewardlogs/update`
- **operationId**：`signrewardlogs_update`
- **请求体**：`application/json`【必填】 schema：`{"$ref":"#/components/schemas/SignRewardLogsUpdate"}`
- **响应**：文档未定义字段结构（仅 200 OK）

### signrewardlogs_delete

- **方法**：`POST`
- **路径**：`/api/signrewardlogs/delete`
- **operationId**：`signrewardlogs_delete`
- **请求体**：`application/json`【必填】 schema：`{"$ref":"#/components/schemas/SignRewardLogsDelete"}`
- **响应**：文档未定义字段结构（仅 200 OK）

### signrewardlogs_select

- **方法**：`GET`
- **路径**：`/api/signrewardlogs/select`
- **operationId**：`signrewardlogs_select`
- **参数**：
  - `page`（query）: 页码
  - `pageSize`（query）: 分页大小
- **响应**：文档未定义字段结构（仅 200 OK）

---

## api/签到奖励配置（6）

### signrewards_index

- **方法**：`GET`
- **路径**：`/api/signrewards/index`
- **operationId**：`signrewards_index`
- **参数**：
  - `page`（query）: 页码
  - `pageSize`（query）: 分页大小
- **响应**：文档未定义字段结构（仅 200 OK）

### signrewards_add

- **方法**：`POST`
- **路径**：`/api/signrewards/add`
- **operationId**：`signrewards_add`
- **请求体**：`application/json`【必填】 schema：`{"$ref":"#/components/schemas/SignRewardsSave"}`
- **响应**：文档未定义字段结构（仅 200 OK）

### signrewards_detail

- **方法**：`GET`
- **路径**：`/api/signrewards/detail`
- **operationId**：`signrewards_detail`
- **参数**：
  - `id`（query）: ID
- **响应**：文档未定义字段结构（仅 200 OK）

### signrewards_update

- **方法**：`POST`
- **路径**：`/api/signrewards/update`
- **operationId**：`signrewards_update`
- **请求体**：`application/json`【必填】 schema：`{"$ref":"#/components/schemas/SignRewardsUpdate"}`
- **响应**：文档未定义字段结构（仅 200 OK）

### signrewards_delete

- **方法**：`POST`
- **路径**：`/api/signrewards/delete`
- **operationId**：`signrewards_delete`
- **请求体**：`application/json`【必填】 schema：`{"$ref":"#/components/schemas/SignRewardsDelete"}`
- **响应**：文档未定义字段结构（仅 200 OK）

### signrewards_select

- **方法**：`GET`
- **路径**：`/api/signrewards/select`
- **operationId**：`signrewards_select`
- **参数**：
  - `page`（query）: 页码
  - `pageSize`（query）: 分页大小
- **响应**：文档未定义字段结构（仅 200 OK）

---

## api/文件上传接口（4）

### 上传图片

- **方法**：`POST`
- **路径**：`/api/upload/image`
- **operationId**：`upload_image`
- **请求体**：`text/plain`【必填】 schema：`{"type":"object"}`
- **响应**：文档未定义字段结构（仅 200 OK）

### 获取上传配置

- **方法**：`GET`
- **路径**：`/api/upload/get_config`
- **operationId**：`upload_get_config`
- **响应**：文档未定义字段结构（仅 200 OK）

### 获取上传配置参数

- **方法**：`GET`
- **路径**：`/api/upload/params`
- **operationId**：`upload_params`
- **响应**：文档未定义字段结构（仅 200 OK）

### 上传回调

- **方法**：`POST`
- **路径**：`/api/upload/callback`
- **operationId**：`upload_callback`
- **请求体**：`text/plain`【必填】 schema：`{"type":"object"}`
- **响应**：文档未定义字段结构（仅 200 OK）

---

## api/文件上传（6）

### uploads_index

- **方法**：`GET`
- **路径**：`/api/uploads/index`
- **operationId**：`uploads_index`
- **参数**：
  - `page`（query）: 页码
  - `pageSize`（query）: 分页大小
- **响应**：文档未定义字段结构（仅 200 OK）

### uploads_save

- **方法**：`POST`
- **路径**：`/api/uploads/save`
- **operationId**：`uploads_save`
- **请求体**：`application/json`【必填】 schema：`{"$ref":"#/components/schemas/UploadsSave"}`
- **响应**：文档未定义字段结构（仅 200 OK）

### uploads_detail

- **方法**：`GET`
- **路径**：`/api/uploads/detail`
- **operationId**：`uploads_detail`
- **参数**：
  - `id`（query）: ID
- **响应**：文档未定义字段结构（仅 200 OK）

### uploads_update

- **方法**：`POST`
- **路径**：`/api/uploads/update`
- **operationId**：`uploads_update`
- **请求体**：`application/json`【必填】 schema：`{"$ref":"#/components/schemas/UploadsUpdate"}`
- **响应**：文档未定义字段结构（仅 200 OK）

### uploads_delete

- **方法**：`POST`
- **路径**：`/api/uploads/delete`
- **operationId**：`uploads_delete`
- **请求体**：`application/json`【必填】 schema：`{"$ref":"#/components/schemas/UploadsDelete"}`
- **响应**：文档未定义字段结构（仅 200 OK）

### uploads_select

- **方法**：`GET`
- **路径**：`/api/uploads/select`
- **operationId**：`uploads_select`
- **参数**：
  - `page`（query）: 页码
  - `pageSize`（query）: 分页大小
- **响应**：文档未定义字段结构（仅 200 OK）

---

## api/文件上传分组（6）

### uploadsgroup_index

- **方法**：`GET`
- **路径**：`/api/uploadsgroup/index`
- **operationId**：`uploadsgroup_index`
- **参数**：
  - `page`（query）: 页码
  - `pageSize`（query）: 分页大小
- **响应**：文档未定义字段结构（仅 200 OK）

### uploadsgroup_save

- **方法**：`POST`
- **路径**：`/api/uploadsgroup/save`
- **operationId**：`uploadsgroup_save`
- **请求体**：`application/json`【必填】 schema：`{"$ref":"#/components/schemas/UploadsGroupSave"}`
- **响应**：文档未定义字段结构（仅 200 OK）

### uploadsgroup_detail

- **方法**：`GET`
- **路径**：`/api/uploadsgroup/detail`
- **operationId**：`uploadsgroup_detail`
- **参数**：
  - `id`（query）: ID
- **响应**：文档未定义字段结构（仅 200 OK）

### uploadsgroup_update

- **方法**：`POST`
- **路径**：`/api/uploadsgroup/update`
- **operationId**：`uploadsgroup_update`
- **请求体**：`application/json`【必填】 schema：`{"$ref":"#/components/schemas/UploadsGroupUpdate"}`
- **响应**：文档未定义字段结构（仅 200 OK）

### uploadsgroup_delete

- **方法**：`POST`
- **路径**：`/api/uploadsgroup/delete`
- **operationId**：`uploadsgroup_delete`
- **请求体**：`application/json`【必填】 schema：`{"$ref":"#/components/schemas/UploadsGroupDelete"}`
- **响应**：文档未定义字段结构（仅 200 OK）

### uploadsgroup_select

- **方法**：`GET`
- **路径**：`/api/uploadsgroup/select`
- **operationId**：`uploadsgroup_select`
- **参数**：
  - `page`（query）: 页码
  - `pageSize`（query）: 分页大小
- **响应**：文档未定义字段结构（仅 200 OK）

---

## api/会员列表（3）

### user_detail

- **方法**：`GET`
- **路径**：`/api/user/detail`
- **operationId**：`user_detail`
- **响应**：文档未定义字段结构（仅 200 OK）

### user_update

- **方法**：`POST`
- **路径**：`/api/user/update`
- **operationId**：`user_update`
- **请求体**：`text/plain`【必填】 schema：`{"type":"object"}`
- **响应**：文档未定义字段结构（仅 200 OK）

### user_select

- **方法**：`GET`
- **路径**：`/api/user/select`
- **operationId**：`user_select`
- **参数**：
  - `page`（query）: 页码
  - `pageSize`（query）: 分页大小
- **响应**：文档未定义字段结构（仅 200 OK）

---

## api/用户卡包管理（6）

### usercards_index

- **方法**：`GET`
- **路径**：`/api/usercards/index`
- **operationId**：`usercards_index`
- **参数**：
  - ``（query）【必填】
  - `page`（query）: 页码
  - `pageSize`（query）: 分页大小
- **响应**：文档未定义字段结构（仅 200 OK）

### usercards_add

- **方法**：`POST`
- **路径**：`/api/usercards/add`
- **operationId**：`usercards_add`
- **请求体**：`application/json`【必填】 schema：`{"$ref":"#/components/schemas/UserCardsSave"}`
- **响应**：文档未定义字段结构（仅 200 OK）

### usercards_detail

- **方法**：`GET`
- **路径**：`/api/usercards/detail`
- **operationId**：`usercards_detail`
- **参数**：
  - ``（query）【必填】
  - `id`（query）: ID
- **响应**：文档未定义字段结构（仅 200 OK）

### usercards_update

- **方法**：`POST`
- **路径**：`/api/usercards/update`
- **operationId**：`usercards_update`
- **请求体**：`application/json`【必填】 schema：`{"$ref":"#/components/schemas/UserCardsUpdate"}`
- **响应**：文档未定义字段结构（仅 200 OK）

### usercards_delete

- **方法**：`POST`
- **路径**：`/api/usercards/delete`
- **operationId**：`usercards_delete`
- **请求体**：`application/json`【必填】 schema：`{"$ref":"#/components/schemas/UserCardsDelete"}`
- **响应**：文档未定义字段结构（仅 200 OK）

### usercards_select

- **方法**：`GET`
- **路径**：`/api/usercards/select`
- **operationId**：`usercards_select`
- **参数**：
  - ``（query）【必填】
  - `page`（query）: 页码
  - `pageSize`（query）: 分页大小
- **响应**：文档未定义字段结构（仅 200 OK）

---

## api/用户泡泡值明细（6）

### userpoints_index

- **方法**：`GET`
- **路径**：`/api/userpoints/index`
- **operationId**：`userpoints_index`
- **参数**：
  - ``（query）【必填】
  - `page`（query）: 页码
  - `pageSize`（query）: 分页大小
- **响应**：文档未定义字段结构（仅 200 OK）

### userpoints_add

- **方法**：`POST`
- **路径**：`/api/userpoints/add`
- **operationId**：`userpoints_add`
- **请求体**：`application/json`【必填】 schema：`{"$ref":"#/components/schemas/UserPointsSave"}`
- **响应**：文档未定义字段结构（仅 200 OK）

### userpoints_detail

- **方法**：`GET`
- **路径**：`/api/userpoints/detail`
- **operationId**：`userpoints_detail`
- **参数**：
  - ``（query）【必填】
  - `id`（query）: ID
- **响应**：文档未定义字段结构（仅 200 OK）

### userpoints_update

- **方法**：`POST`
- **路径**：`/api/userpoints/update`
- **operationId**：`userpoints_update`
- **请求体**：`application/json`【必填】 schema：`{"$ref":"#/components/schemas/UserPointsUpdate"}`
- **响应**：文档未定义字段结构（仅 200 OK）

### userpoints_delete

- **方法**：`POST`
- **路径**：`/api/userpoints/delete`
- **operationId**：`userpoints_delete`
- **请求体**：`application/json`【必填】 schema：`{"$ref":"#/components/schemas/UserPointsDelete"}`
- **响应**：文档未定义字段结构（仅 200 OK）

### userpoints_select

- **方法**：`GET`
- **路径**：`/api/userpoints/select`
- **operationId**：`userpoints_select`
- **参数**：
  - ``（query）【必填】
  - `page`（query）: 页码
  - `pageSize`（query）: 分页大小
- **响应**：文档未定义字段结构（仅 200 OK）
