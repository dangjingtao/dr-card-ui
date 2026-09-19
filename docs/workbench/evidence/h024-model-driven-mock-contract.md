# H024｜数据模型驱动的 Mock API 契约基线证据

## Representative flow

```text
PointsDetail
  → listUserPointRecords()
  → GET /__h024/user-points        # frontend proposal
  → httpClient
  → MSW userPointsHandlers（Mock mode）
    / real HTTP（API mode）
  → userPointsIndexResponseSchema
  → toUserPointRecordViewModel()
  → page
```

## Confirmed backend facts

来源：

- `docs/api/dearseed-openapi.json`
- `docs/api/dearseed-api.md`

DearSeed OpenAPI 已确认存在 raw CRUD `GET /api/userpoints/index`，但它要求全局 authorization，而具体 auth 机制仍未知；同时模型 CRUD 不等于最终 H5 业务 API。

因此 H024 **不让正式页面直接调用 raw CRUD**。页面 service 暂用 `GET /__h024/user-points` 作为显式 frontend-proposed seam，只用于验证未来业务 API 的分层/网络边界。正式 endpoint/auth 到位后替换 service transport mapping。

Transport contract 保留 backend 字段：

- `user_id`
- `points`
- `before_points`
- `after_points`
- `type`
- `object`
- `object_type`
- `operator`
- `create_time`（CRUD entity timestamp，contract 中允许缺省）

分页与 envelope 使用通用 CRUD 约定：

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "data": [],
    "current_page": 1,
    "per_page": 15,
    "total": 0,
    "last_page": 1
  }
}
```

## Frontend-only mapping

`src/services/userPoints/adapter.ts` 才把 transport 转为 UI 结构：

- `type=10 → kind=income`
- `type=20 → kind=expense`
- `before_points → beforePoints`
- `after_points → afterPoints`
- `object_type` 仅用于通用 fallback title

这些 camelCase / title 都不是 backend DTO。

## Mock boundary

- Proposed endpoint：`GET /__h024/user-points?page&pageSize`；它不是 backend confirmed endpoint。
- Raw Mock rows 位于 `src/mocks/fixtures/h024UserPoints.ts`。
- 字段使用 backend snake_case。
- Handler 位于 `src/mocks/handlers/userPoints.ts`。
- Handler 实现已确认 CRUD pagination 行为。
- 第二页自然返回空数组，用于验证 empty pagination；没有增加 Mock-only API 参数。
- 页面不读取 data mode / scenario。

## Page migration

`src/pages/PointsDetail.tsx`：

- 删除 `filterBubbleRecords()` 数据来源；
- mount 后调用 `listUserPointRecords()`；
- loading / recoverable error / empty / success 均由真实 Promise 生命周期驱动；
- 收入/消耗 Tab 只筛 adapter view-model；
- `?state=empty` 仍只是 UI 验收状态，不跳过 HTTP 请求。

## Auth boundary

DearSeed OpenAPI 只声明 authorization security，但未给出 header/cookie/token 细节。

H024：

- 不注入 Authorization；
- 不伪造登录 token；
- 不让页面直连要求未知 authorization 的 `/api/userpoints/index`；
- 不宣布 proposed `/__h024/user-points` 已被后台实现；
- 不宣布真实 API 已打通；
- H008 的真实联调阻塞不因 MSW 成功而被视为解除。

## Verification

`npm run verify:h024` 验证：

- page 1：service → HTTP → MSW 返回 15 条；
- page 2：同一 service 返回合法空分页；
- handler 被临时替换为 camelCase `userId` 时，Zod contract 必须以 `CONTRACT_VALIDATION_FAILED` 失败；
- contract 源码保留 backend snake_case；
- page 不再读取旧流水 fixture 数据；
- service 不读取 Mock/API runtime 开关，也不自行注入 auth。

Formal H5 E2E 另验证：

- `/points/detail` 实际发出 `/__h024/user-points` 请求并渲染 adapter 结果；
- Tab 仍可筛收入/消耗；
- empty fixture UI 仍可复现。
