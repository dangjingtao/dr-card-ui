# 数据模型驱动 API 契约基线

本规范用于后台业务接口尚未完全定稿、但数据模型已经确认的阶段。

目标不是让前端替后台“拍脑袋定 API”，而是把事实、提案和 UI 映射拆开，使页面可以通过真实 HTTP/MSW 边界继续施工，同时保证后续正式接口到位时只替换 transport/adapter。

## 1. 三层边界

```text
confirmed backend model / transport facts
                  ↓
       service transport contract
                  ↓
          adapter / view-model
                  ↓
                 page
```

### Model / transport contract

- 使用后台已确认的字段名。
- snake_case 不为了前端习惯改成 camelCase。
- 外部 payload 先按 `unknown` 处理，再由 Zod 校验。
- 已确认 endpoint / method / envelope / pagination 可直接记录。
- 尚未确认的行为必须标为 **frontend proposal**，不得写成 backend fact。

### Adapter / view-model

- 可以转换字段命名与展示结构。
- 可以把后端枚举映射成 UI 语义。
- 可以补 UI fallback copy，但必须明确这不是后端业务文案。
- 不允许在 adapter 中发明权限、结算、审核、幂等、复杂状态机。

### Page

- 只消费 service / view-model。
- 不读取 `VITE_DATA_MODE`、`runtimePolicy` 或 Mock scenario。
- 不直接 import MSW fixture。
- 不用 `setTimeout` / 页面 resolver 冒充网络。

## 2. 事实与提案标记

每个新 contract 至少回答下面这些问题：

| 项目 | 状态 | 示例 |
| --- | --- | --- |
| Model fields | backend confirmed | `user_id / points / before_points / after_points / type` |
| Endpoint | confirmed / frontend proposal | `GET /api/userpoints/index` 已存在于 OpenAPI |
| Request params | confirmed / frontend proposal | `page / pageSize` 已确认 |
| Response envelope | confirmed / frontend proposal | 通用 CRUD `{ code, msg, data }` 已确认 |
| Pagination | confirmed / frontend proposal | `current_page / per_page / total / last_page` 已确认 |
| Auth | confirmed / unknown | 当前 DearSeed auth 方式仍 unknown |
| UI mapping | frontend-only | `type=10 → income` |
| Mock values | mock-only | 本地确定性记录，不代表生产数据 |

## 3. 推荐目录

一个需要真实网络边界的 domain 优先使用：

```text
src/services/<domain>/
  contracts.ts       # backend transport truth, Zod schema
  adapter.ts         # transport → view-model
  index.ts           # HTTP service

src/mocks/
  fixtures/<domain>.ts
  handlers/<domain>.ts
```

不要建立一个“所有 DTO 都塞进去”的超大 contracts 文件。

## 4. MSW 规则

MSW 模拟的是 transport contract，而不是页面状态机。

Handler 应：

- 返回与真实 transport 相同的字段名；
- 使用相同 envelope / pagination；
- 通过真实 HTTP 请求被 service 调用；
- 不要求页面知道数据来自 Mock；
- Mock-only 场景控制不能污染未来真实 API 参数。

## 5. H024 代表链路：UserPoints

### Backend confirmed

来源：`docs/api/dearseed-openapi.json` 与 `docs/api/dearseed-api.md`。

- Endpoint：`GET /api/userpoints/index`
- Params：`page`、`pageSize`
- UserPoints fields：
  - `user_id`
  - `points`
  - `before_points`
  - `after_points`
  - `type: 10 | 20`
  - `object`
  - `object_type: task | order`
  - `operator`
- CRUD pagination：
  - `data.data`
  - `current_page`
  - `per_page`
  - `total`
  - `last_page`
- Generic envelope：`{ code, msg, data }`

### Frontend decision / temporary usage

- `/points/detail` 暂时直接消费该 read-only model index。
- 这不代表 raw CRUD 是最终 H5 业务 API。
- `type/object_type` 到列表 `kind/title` 的映射属于 adapter。
- 页面仍保留已有 UI fixture state 用于视觉验收，但它不改变 service/HTTP/MSW 调用方式。

### Still unknown

- DearSeed 正式认证方式。
- 是否会提供专用 H5 泡泡值业务 endpoint。
- 最终业务流水 title/copy 与对象详情关联方式。
- 后端真实联调 base URL / 环境治理。

这些未知项不得由 H024 伪造。H008 的真实 API 垂直链路因此仍保持其原有约束。

## 6. 后端正式接口到位后的迁移方式

若未来得到：

```text
GET /api/h5/user-points
```

且响应与 CRUD 不同：

1. 修改 `contracts.ts`；
2. 修改 `index.ts` 的 endpoint / params；
3. 修改 `adapter.ts`；
4. 更新 MSW handler；
5. 页面原则上不改。

这就是本规范存在的理由。
