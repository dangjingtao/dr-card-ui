# 签到页面接口接入记录

> 契约来源：客户端《签到页面接口文档》（最新版，共 5 个接口），本文与之逐字段对齐。
> 通用约定（响应体结构、`code` 判断、登录态请求头、分页与排序写法）见 [docs/api-index.md §0](../api-index.md#0-通用约定)；本文只覆盖本页特有内容。
> 关联工程基线：`docs/engineering/http-client.md`（HTTP 出口）、`docs/engineering/network-mocking.md`（MSW Mock）、`docs/engineering/data-contracts.md`（契约层）、`docs/engineering/coding-standards.md`（分层边界）。
> 同批参考：[points-page-api-integration.md](./points-page-api-integration.md)（泡泡值页，本文与其保持同一分层与 mock 口径）。

- 分支：`preview → dev → test → prod`（正常晋级只走相邻方向）
- 文档对齐日期：2026-09-29
- 事实源：客户端《签到页面接口文档》（最新版）+ 7002 实测探针（2026-09-28）+ `status` 真实响应（2026-09-29 校准 `day/month/year` 口径）；不一致处见 §6

## 1. 范围与目标

本页文档共 5 个接口，面向 App / H5 / 小程序：

| # | 功能 | 接口 | 登录 | 分页 | 归属 |
| --- | --- | --- | --- | --- | --- |
| 1 | 今天签到状态及可得泡泡值 | `GET /api/signrecords/status` | ✅ 是 | 否 | `/checkin` 金色 Hero + 首页 7 日入口今日状态 |
| 2 | 今天签到 | `POST /api/signrecords/add` | ✅ 是 | 否 | `/checkin` / 首页「立即签到」 |
| 3 | 本月签到记录 | `GET /api/signrecords/index?range=month` | ✅ 是 | 否（裸数组） | `/checkin` 当月日历 + 首页 7 日轨道 |
| 4 | 体验券列表 | `GET /api/coupons/index` | ❌ 否 | 是 | 签到页「为你精选 / 体验券兑换」；券模板通用 |
| 5 | 补签 | `POST /api/signrecords/makeup` | ✅ 是 | 否 | `/checkin` 漏签日期补签 |

三个 `signrecords` 接口都需登录，认证头为 `Authorization: Bearer <accessToken>`；`coupons/index` **当前接口不读取登录用户身份，不要求 Authorization 请求头**（与 `profile-page-api-integration.md` 里「券模板」的口径不同，见 §5）。

> 📌 口径确认：文档第 4 项的「体验券列表」是 **`GET /api/coupons/index`**，即券模板分页列表；`/checkin` 的「为你精选 / 体验券兑换」入口与之同源。

> 补签已纳入本页正式契约；前端仍要求先通过 Native 激励广告闸门，只有广告完成才发起请求。

### 本方案的性质

本文是**接入方案（contract + 施工边界）**，不是定稿 UI 变更。所有落地改动都必须满足：

- 视觉与交互保持 `preview` 已验收结论不漂移（AGENTS.md §5.1、§10）；
- Mock 与真实 API 使用**同一套 service 调用**，页面不做 `mock | api` 分支（`network-mocking.md` §3）；
- 页面不直接 `fetch` / `axios` / `window.xxx`，一律经 service 层（`http-client.md`「调用边界」）。

## 2. 接口契约（逐字段对齐）

### 2.1 今天签到状态及可得泡泡值

`GET /api/signrecords/status`（Authorization: Bearer <accessToken>）无请求参数、无请求体。

已签到：

```json
{
  "code": 0,
  "msg": "success",
  "status": "succ",
  "data": {
    "signed": true,
    "consecutive_days": 1,
    "points": 10,
    "reward_desc": "",
    "day": "29",
    "month": "09",
    "year": "2026"
  }
}
```

未签到：

```json
{
  "code": 0,
  "msg": "success",
  "status": "succ",
  "data": {
    "signed": false,
    "consecutive_days": 5,
    "points": 10,
    "reward_desc": "连续签到 5 天奖励 10 泡泡值",
    "day": "29",
    "month": "09",
    "year": "2026"
  }
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `signed` | `boolean` | 今天是否已签到。`true` 时按钮应置为已签到状态。 |
| `consecutive_days` | `number` | 连续签到天数。未签到时表示**完成今天签到后将达到的天数**。 |
| `points` | `number` | 今天签到可获得的泡泡值；已签到时为今天实际获得的泡泡值。 |
| `reward_desc` | `string` | 奖励说明；已签到时为空字符串。 |
| `day` | `string` | 当前业务日，格式 `DD`，例如 `"29"`。 |
| `month` | `string` | 当前业务月，格式 `MM`。 |
| `year` | `string` | 当前业务年，格式 `YYYY`。 |

> `day` / `month` / `year` 是**当前业务日历日**，**已签到与未签到都会返回**（2026-09-29 以真实响应校准），时间按**北京时间**处理。

### 2.2 今天签到

`POST /api/signrecords/add`（Authorization: Bearer <accessToken>，Content-Type: application/json）无请求参数、无请求体；签到日期由服务端按北京时间确定。

```json
{
  "code": 0,
  "msg": "success",
  "status": "succ",
  "data": {
    "id": 52,
    "user_id": 3,
    "points": 10,
    "consecutive_days": 1,
    "status": 10,
    "reward_desc": "111",
    "delete_time": null,
    "is_delete": 0
  }
}
```

返回字段与 §2.3 的签到记录同族，另加 `reward_desc`（本次签到命中的奖励说明；没有奖励时为空字符串）。

> ⚠️ 2026-09-29 实测修正：`POST /api/signrecords/add` 的**成功响应不含** `create_time` / `update_time`（审计字段可缺省），前端契约已按可缺省处理。此前把 `create_time` 当必填，会把这次成功误判为 `外部数据不符合 checkin.sign-in.data 契约`。

**重复签到**（同一用户同一天只能签到一次）：

```json
{ "code": 400, "message": "今日已签到", "data": [] }
```

### 2.3 本月签到记录

`GET /api/signrecords/index?range=month`（Authorization: Bearer <accessToken>）

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `range` | `string` | 否 | 时间范围。`month`=本月，`week`=本周；不传时默认 `month`。 |

> 签到页面固定请求本月数据时，**建议显式传 `range=month`**。

`data` 是**数组，不是分页对象**，返回**该月全部**记录，按 `create_time` 倒序：

```json
{
  "code": 0,
  "msg": "success",
  "status": "succ",
  "data": [
    {
      "id": 50,
      "user_id": 3,
      "points": 10,
      "consecutive_days": 1,
      "status": 10,
      "create_time": "2026-09-29 15:57:18",
      "update_time": "2026-09-29 15:57:18",
      "delete_time": null,
      "day": "29",
      "month": "09",
      "year": "2026"
    },
    {
      "id": 17,
      "user_id": 3,
      "points": 0,
      "consecutive_days": 0,
      "status": 20,
      "create_time": "2026-09-20 00:00:00",
      "update_time": "2026-09-20 00:00:00",
      "delete_time": null,
      "day": "20",
      "month": "09",
      "year": "2026"
    }
  ]
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `number` | 签到记录 ID。 |
| `user_id` | `number` | 当前登录用户 ID。 |
| `points` | `number` | 本次签到获得的泡泡值；补签固定为 `0`。 |
| `consecutive_days` | `number` | 本次记录对应的连续签到天数；补签固定为 `0`。 |
| `status` | `number` | `10`=正常签到，`20`=补签。 |
| `create_time` | `string` | **记录时间戳**，格式 `YYYY-MM-DD HH:mm:ss`；它是**操作时刻**，补签时可不等于被补日期（例如今天补签 9-20，这里仍是今天）。 |
| `update_time` | `string` | 更新时间，格式 `YYYY-MM-DD HH:mm:ss`。 |
| `delete_time` | `number \| null` | 删除时间；未删除时为 `null`（历史文档写作 `0`，实测为 `null`，前端两者都容错）。 |
| `day` / `month` / `year` | `string` | 记录所属**业务日历日**，格式 `DD` / `MM` / `YYYY`。**日历归属以此为准**，缺字段时才回退 `create_time` 前 10 位。 |

> 同一用户同一天只能有一条签到记录。
>
> ⚠️ 日期归属：`day`/`month`/`year` 与 `create_time` **不是同一个概念**。前者是该记录所属的业务日历日；后者是记录/操作时间戳，两者在补签时可能不同（实测补签 `create_time` 为操作时刻）。前端 `buildSignRecordDayMap` 因此优先用业务日期字段，`create_time` 仅作兜底。

### 2.4 体验券列表

`GET /api/coupons/index?page=1&pageSize=15`

> 当前接口**不读取登录用户身份，不要求 Authorization 请求头**。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `page` | `number` | 否 | 页码，默认 `1`。 |
| `pageSize` | `number` | 否 | 每页条数，默认 `15`，**最大 `100`**。 |

```json
{
  "code": 0,
  "msg": "success",
  "status": "succ",
  "data": {
    "data": [
      {
        "id": 7,
        "name": "体验券",
        "short_desc": "新用户专享",
        "image": "https://cdn.example.com/coupon/7.png",
        "category_id": "2",
        "points_number": "100",
        "total_number": 500,
        "exchanged_nuuur": 37,
        "extra_data": null,
        "status": 10,
        "create_time": "2026-09-01 12:00:00",
        "update_time": "2026-09-01 12:00:00",
        "delete_time": 0
      }
    ],
    "current_page": 1,
    "per_page": 15,
    "total": 1,
    "last_page": 1
  }
}
```

> 列表在 `data.data`（嵌套两层），分页信息与它同级，见 [api-index.md §0.4](../api-index.md#04-分页写法)。
> `exchanged_nuuur` 是后端既有字段名（拼写如此），前端不改名。
> `category_id` / `points_number` 后端可能返回字符串，契约按 `number | string` 容错。

## 3. 补签

> 补签是签到页正式接口，日期规则和错误结构以客户端接口文档为准。

`POST /api/signrecords/makeup`（Authorization: Bearer <accessToken>，Content-Type: application/json）

```json
{ "day": "2026-09-20" }
```

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `day` | `string` | 是 | 被补签日期，格式 `YYYY-MM-DD`。仅允许**今天之前**的日期。 |

返回为一条 `status=20` 的签到记录（字段同 §2.3，`points` / `consecutive_days` 固定 `0`）。

重复补签或目标日期已有签到记录时：

```json
{ "code": 400, "message": "该日期已有签到记录", "data": [] }
```

**前端约束（务必遵守）：**

1. **必须先进广告闸门**：补签前先调用 Native 激励广告
   `showRewardAd({ scene: 'h5CheckinResign' })`，**只有 `status === 'completed'` 才发起本请求**；
   `closed` / `failed` / `no_fill` / 宿主不支持 / 用户取消 / 权限拒绝 一律**不落库、不亮格**。
2. **本地先校验 `day` 格式**：`^\d{4}-\d{2}-\d{2}$`，避免把格式错误打成后端 500。
3. **边界错误**：非今天之前的日期返回 `400「只能补签今天之前的日期」`。
4. **会话内乐观点亮**：接口刷新返回前，对本次补签的 `day` 做即时点亮（`optimisticMakeupDays`），
   与文档口径下按 `create_time` 归属的持久记录互补。

## 4. Service 层设计

### 4.1 路径常量（供 mock handler 复用）

```ts
// src/services/signrecords.ts
export const SIGN_RECORDS_STATUS_PATH = '/api/signrecords/status'
export const SIGN_RECORDS_INDEX_PATH = '/api/signrecords/index'
export const SIGN_RECORDS_ADD_PATH = '/api/signrecords/add'
export const SIGN_RECORDS_MAKEUP_PATH = '/api/signrecords/makeup'
export const SIGN_ACTIVITY_LIST_PATH = '/api/signactivity/list'  // 泡泡任务区签到进度，属 points 页文档

// src/services/coupons.ts
export const COUPON_LIST_PATH = '/api/coupons/index'
```

### 4.2 契约校验

- 统一走 `parseApiEnvelope(payload, schema, { contract, fallbackMessage })`，只看 `code === 0`。
- 页面未消费字段用 `zod` 的 `.passthrough()` 放行，避免后端新增字段即触发契约失败。
- 记录列表 `data` 既可能是裸数组，也可能被后端改成分页信封；`signrecords.ts` 对两种形态都做解析（当前文档口径是裸数组）。

### 4.3 记录列表请求参数

签到页固定请求本月：

```ts
fetchSignRecords({ range: 'month' })   // → GET /api/signrecords/index?range=month
```

不传 `range` 时由后端默认 `month`；`week` 供未来周视图使用，本页暂不使用。

## 5. 改动清单

| 文件 | 状态 | 说明 |
| --- | --- | --- |
| [src/services/signrecords.ts](../../src/services/signrecords.ts) | 修改 | 五个签到接口契约；`status` 的 `day`/`month`/`year`（已签到/未签到都返回）；记录契约补 `reward_desc` / 业务日期字段；`fetchSignRecords` 显式传 `range=month` |
| [src/services/signrecords.test.ts](../../src/services/signrecords.test.ts) | 修改 | 对齐新契约：已签到/未签到都返回的 `day/month/year`、`range=month` 入参；`buildSignRecordDayMap` 按记录业务日期 `year/month/day` 归属；保留补签用例 |
| [src/mocks/handlers/checkin.ts](../../src/mocks/handlers/checkin.ts) | 修改 | `index` 读取 `range`；`status` 的 `day/month/year` 已签到/未签到都返回；`makeup` 校验日期并拒绝重复记录 |
| [src/mocks/fixtures/checkin.ts](../../src/mocks/fixtures/checkin.ts) | 修改 | 记录与 `status` 同形携带业务日期 `day/month/year` |
| [src/mocks/fixtures/home.ts](../../src/mocks/fixtures/home.ts) | 修改 | `COUPON_LIST_MOCK` 补齐文档字段（`extra_data` 等），`per_page` 对齐 15 |
| [src/pages/Checkin.tsx](../../src/pages/Checkin.tsx) | 修改 | 对齐文档口径（`range=month` / `day·month·year`）；**保留**激励广告闸门 + 补签接口调用 |
| [src/pages/checkin/components/CheckinBoard.tsx](../../src/pages/checkin/components/CheckinBoard.tsx) | 修改 | 补签格**可点击**（先过广告闸门）；保留 `optimisticMakeupDays` 会话内乐观点亮；`status=20` 按 `create_time` 归属 |
| [src/pages/checkin/useCheckinFeed.ts](../../src/pages/checkin/useCheckinFeed.ts) | 修改 | `useCheckinActions` 同时提供 `signIn` / `makeup` / `lastMakeupDay` |
| [src/pages/Checkin.test.tsx](../../src/pages/Checkin.test.tsx) | 修改 | 签到接口用例 + 广告闸门 / 补签用例（fail-closed、失败分级） |
| [src/pages/checkin/CheckinCalendar.test.ts](../../src/pages/checkin/CheckinCalendar.test.ts) | 修改 | 补签按被补日期归属 + `optimisticMakeupDays` 乐观点亮用例 |

### 5.1 关键设计决定

1. **`status` 的 `day/month/year` 是当前业务日历日，已签到/未签到都返回**：契约按 `.nullish()` 容错，页面不从这三个字段反推月份（月历仍以本地系统时间为准，见 5.1.3）；它们用于校核后端北京时间与本地时间是否一致。
2. **`index` 显式传 `range=month`**：文档建议固定请求本月时显式传参，前端不再全量拉取后本地过滤。
3. **月份与「今天」继续按本地系统时间渲染**：2026-09-28 用户约定「今日暂用本地时间」；`status` 的 `day/month/year` 是校核字段，不替代本地日历。
4. **补签必须先过广告闸门**：
   - 前端在过往漏签格提供「补签」入口，点击后**先看 Native 激励广告**，`status=completed` 才调用 `POST /api/signrecords/makeup`；
   - `closed` / `failed` / `no_fill` / 宿主不支持 / 用户取消 / 权限拒绝一律**不落库、不亮格**（fail-closed）；
   - **日历归属按记录的业务日期字段**：`index` 每条记录带 `year`/`month`/`day`，`buildSignRecordDayMap` 优先按它们拼出的 `YYYY-MM-DD` 归属，`create_time` 仅作兜底；因此无论补签的 `create_time` 是操作时刻还是被补日期，补签格都能正确点亮；会话内另做 `optimisticMakeupDays` 即时点亮；
   - 补签消耗 / 次数上限 / 资格判定（原 B-020）仍未确认。

## 6. 与历史 7002 实测的差异（重要）

本仓库 2026-09-28 曾以对 7002 的实测探针接入签到/补签，最新文档修正了 `status=20` 的日期语义与 `index` 过滤方式：

| 项 | 2026-09-28 实测 | 最新文档 | 处理 |
| --- | --- | --- | --- |
| `POST /api/signrecords/makeup` | 实测可用（`{ day: 'YYYY-MM-DD' }` → `status=20`） | 正式文档已收录 | 按正式契约调用，先过广告闸门 |
| `status=20` 记录的 `create_time` | 实测为**补签操作时刻**，不回显被补日期 | 文档写作**被补签日期的北京时间** | **不再依赖 `create_time` 判定归属**：`index` 记录本身带 `year`/`month`/`day`，按业务日期字段归属，`create_time` 仅兜底（两处不一致也因此被消除） |
| `index` 按月份过滤 | 实测不接受任何月份过滤入参 | 文档给出 `range=month|week` | 采用文档口径：显式传 `range=month` |
| `index` 分页 | 接受 `page`/`pageSize` | 文档未列分页参数 | 不再传 `page`/`pageSize`，按裸数组消费 |

> 2026-09-29 补充：`GET /api/signrecords/status` 的真实响应在**已签到时也返回** `day` / `month` / `year`（当前业务日历日），与最初文档「仅未签到返回」的口径不同；已按真实响应校准契约、Mock 与本文，契约保留 `.nullish()` 容错。

> 若后续在 `test` 环境（真实 WebView + 真接口）实测发现文档与后端实现仍不一致，按 AGENTS.md §13 决策优先级记录冲突，不自行选边。

## 7. 验证结果

## 7.1 当前项目对照结论

| 契约项 | 当前实现 | 结论 |
| --- | --- | --- |
| `status` 无参 GET，已签到/未签到都返回 `day/month/year` | `fetchSignStatus` + service schema + Mock handler | ✅ 符合 |
| `add` 空 JSON body，重复签到返回 `400 今日已签到` | `submitSignIn` + Mock handler | ✅ 符合 |
| `add` 成功响应可缺 `create_time` / `update_time`，不被判为契约失败 | `signRecordSchema`（`create_time` 可缺省）+ 回归用例 | ✅ 符合 |
| `makeup` body `{ day }`，仅允许今天之前，重复日期返回 `400` | `submitMakeup` + Mock handler | ✅ 符合 |
| `index` 固定传 `range=month`，消费裸数组 | `fetchSignRecords` + `useSignRecords` | ✅ 符合 |
| `coupons/index` 不要求登录，分页结构 `data.data` | `fetchCouponIndex` / `fetchCouponList` | ✅ 符合 |
| Authorization Bearer 由全局 HTTP client 注入 | `src/services/http/httpClient.ts` | ✅ 符合 |

尚未完成的不是接口接入，而是环境验收：`test` WebView + 真 API + 真登录态尚未在本轮执行；本地 `build` 若未配置 `VITE_API_BASE_URL` 仍会提示真实后端地址缺失。

- `npm run typecheck` ✅
- `npm run build` ✅（含 `VITE_DATA_MODE=api` 模式构建）
- `npm run lint` ✅（H5 hygiene 0 violation）
- `npx vitest run src/services/signrecords.test.ts` ✅
- `npx vitest run src/pages/checkin/CheckinCalendar.test.ts` ✅
- `npx vitest run src/pages/Checkin.test.tsx` ✅

> 尚未执行：App WebView（H036）+ Native `getLoginToken()` 的完整登录态业务验收。

## 8. 仍然未决（未自行定稿）

- **B-019 月份切换范围**：原型 §6 只画了单月，本页仍不提供月份切换。
- **B-020 补签**：补签消耗 / 次数上限 / 资格判定仍未确认（见 §3 / §5.1.4）。
- **`status.day/month/year` 的时区校核**：待 `test` 环境真接口验证北京时间与本地时间在跨日边界是否一致。

## 9. 明确不做

- 未改动 `preview` 的视觉结论；未新增营销区块。
- 未修改 Native 参考 / legacy 路由。
- 未在 `prod` 以 Mock 兜底。
- 未把补签的「消耗 / 次数上限」当作已确认规则实现。
