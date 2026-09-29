# 泡泡值（积分）页面接口接入方案

> 契约来源：客户端《泡泡值（积分）页面接口接入文档》（2026-09-28），本文与之逐字段对齐
> 通用约定（响应体结构、code 判断、登录态请求头、分页与排序写法）见 [docs/api-index.md §0](../api-index.md#0-通用约定)；本文只覆盖本页特有内容。
> 关联工程基线：`docs/engineering/http-client.md`（HTTP 出口）、`docs/engineering/network-mocking.md`（MSW Mock）、`docs/engineering/data-contracts.md`（契约层）、`docs/engineering/coding-standards.md`（分层边界）。

## 1. 范围与目标

泡泡值相关 UI 当前拆成两个正式 H5 路由：

| 路由 | 页面 | 本文涉及内容 |
| --- | --- | --- |
| `/points` | `src/pages/Points.tsx` | 顶部「可用 / 累计收入 / 累计消耗」三块数字 |
| `/points/detail` | `src/pages/PointsDetail.tsx` | 明细列表（全部 / 收入 / 消费 Tab + 分页） |

本页共 3 个接口，均需登录，可三者并发拉取：

| # | 模块 | 接口 | 登录 | 分页 | 归属页面 |
| --- | --- | --- | --- | --- | --- |
| 1 | 泡泡值统计（可用 / 累计收入 / 累计消耗） | `GET /api/userpoints/stat` | 是 | 否 | `/points` |
| 2 | 泡泡值明细列表（全部 / 收入 / 消费） | `GET /api/userpoints/index` | 是 | 是 | `/points/detail` |
| 3 | 活动列表（最大签到天数 / 已签到天数） | `GET /api/signactivity/list` | 是 | 否 | 签到相关（`/checkin` 等），见 §7 |

三个接口都只返回当前登录用户自身数据，**不传也不接受 `user_id`**，传了也会被登录用户覆盖。

> ⚠️ **范围边界**：本页「泡泡任务」区（每日打卡 / 连续签到 / 观看视频 / 邀请好友）的接口归属如下：
> - **每日打卡 / 连续签到**：由本页第 3 个接口 `GET /api/signactivity/list` 承载 —— 任务卡的 `title` 取活动标题，进度 `current / target` 取 `signed_days / max_days`。
> - **观看视频 / 邀请好友**：本页 3 个接口**均无对应端点**，仍需后端补齐任务契约。
> 因此本页并非「无任务相关接口」，但也**不是一个完整任务体系接口**：只有签到类任务有数据源，视频/邀请类任务没有。

> ⚠️ 关键口径（前端务必遵守）：**「可用」只能用 `points`，禁止用 `income - expense` 反推**。`points` 来自用户表余额，`income` / `expense` 来自流水求和，两者是独立口径；后台直接改过余额、或早期无流水的用户会出现 `income - expense ≠ points`。

### 本方案的性质

本文是**接入方案（contract + 施工边界）**，不是定稿 UI 变更。所有落地改动都必须满足：

- 视觉与交互保持 `preview` 已验收结论不漂移（AGENTS.md §5.1、§10）；
- Mock 与真实 API 使用**同一套 service 调用**，页面不做 `mock | api` 分支（`network-mocking.md` §3）；
- 页面不直接 `fetch` / `axios` / `window.xxx`，一律经 service 层（`http-client.md`「调用边界」）。

## 2. 现有代码事实（接入前）

### 2.1 通用基础设施（已具备，直接复用）

- HTTP 出口：`src/services/http/httpClient.ts`，单例 `httpClient.request<T>()` 直接返回响应 `data`；认证头由全局 `authHeadersProvider` 注入；401 由 httpClient 的重试 + 页面 AuthGate 统一处理，业务 service 不写页面级分支。
- 信封解析：`src/services/contracts/apiEnvelope.ts` 的 `parseApiEnvelope(payload, schema, { contract, fallbackMessage })`，只看 `code === 0` 判成功，失败抛 `AppError(kind='business')`。
- 契约校验：`zod`，页面未消费的字段用 `.passthrough()` 放行，不把未确认结构写死（参考 `signrecords.ts`）。
- Mock 基础设施：MSW，`src/mocks/handlers/` + `src/mocks/fixtures/`，由 `runtimePolicy.dataMode` 决定是否启用，启动于 React render 之前。

### 2.2 泡泡值页现状（仍是 fixture，非接口）

- `/points`：余额 `BUBBLE_BALANCE`、收入 `sumBubbleRecords('income')`、消耗 `sumBubbleRecords('expense')` 全部读 `src/app/fixtures/membership.ts`。区块注释已标注 `B-002 未决`，明确「定稿时只改夹具，不改页面」。
- `/points/detail`：`filterBubbleRecords(filter)` 读同一份 `BUBBLE_RECORDS`，无分页，一次性渲染 15 条；Tab 切换只在前端过滤。
- 现有 fixture 名称与接口字段的差异（接入时必须做映射，不能改接口迎合 fixture）：
  - fixture `kind: 'income' | 'expense'` ↔ 接口 `type: 10 | 20`；
  - fixture `title` ↔ 接口 `object_type`（`task` / `order`）派生出的展示文案；
  - fixture `time` ↔ 接口 `create_time`（接口带秒，现有 fixture 不带秒）；
  - fixture `amount` ↔ 接口 `points`（恒正，正负由 `type` 决定）。

### 2.3 同类先例（照此风格落地）

- `src/services/signrecords.ts`：单接口 + zod 契约 + `parseApiEnvelope`，是最贴近本页 `stat` 的样板。
- `src/services/coupons.ts` + `src/mocks/handlers/home.ts`：mock handler 与真实 service 共用同一 `*_PATH` 常量、同一信封。

## 3. Service 层设计

新增一个领域 service 文件：`src/services/userpoints.ts`（明细与统计同域，放在一起，避免拆成两个小文件）。

### 3.1 常量（供 mock handler 复用）

```ts
export const USER_POINTS_STAT_PATH = '/api/userpoints/stat'
export const USER_POINTS_INDEX_PATH = '/api/userpoints/index'
```

### 3.2 统计接口

```ts
const userPointsStatSchema = z
  .object({
    points: z.number(),
    income: z.number(),
    expense: z.number(),
  })
  .passthrough()

export type UserPointsStat = z.infer<typeof userPointsStatSchema>

export async function fetchUserPointsStat(): Promise<UserPointsStat> {
  const payload = await httpClient.request<unknown>({
    method: 'GET',
    url: USER_POINTS_STAT_PATH,
  })
  return parseApiEnvelope(payload, userPointsStatSchema, {
    contract: 'points.stat',
    fallbackMessage: '泡泡值统计获取失败',
  })
}
```

约定：

- 无入参；`points` / `income` / `expense` 接口保证不为 `null` / `undefined`，**前端不写判空兜底**（文档明确要求）。
- 三值均可能为 `0`，`0` 是合法值，不能用 `||` 折叠成空。

### 3.3 明细列表接口

请求参数映射（表驱动，避免页面散落魔法值）：

| 参数 | 类型 | 页面来源 | 默认 |
| --- | --- | --- | --- |
| `type` | number | Tab：全部=不传；收入=`10`；消费=`20` | 不传（全部） |
| `page` | number | 分页当前页 | `1` |
| `pageSize` | number | 固定每页条数 | `15`（上限 100） |
| `orderBy[create_time]` | string | 默认不传 | 不传（后端按 `id DESC`，即最新在前） |

> 排序默认不传，即最新在前，页面无需暴露排序控件（文档原话「一般不用传」）。如未来确需正序，再按 `orderBy%5Bcreate_time%5D=DESC|ASC` 编码传参，届时由 service 统一处理 URL 编码。

类型与函数：

```ts
export const USER_POINTS_TYPE_INCOME = 10
export const USER_POINTS_TYPE_EXPENSE = 20

const userPointsRecordSchema = z
  .object({
    id: z.number(),
    create_time: z.string(),
    update_time: z.string(),
    delete_time: z.null().optional(),
    user_id: z.number(),
    points: z.number(),
    before_points: z.number(),
    after_points: z.number(),
    type: z.number(),
    object: z.number(),
    object_type: z.string(),
    operator: z.string(),
  })
  .passthrough()

export type UserPointsRecord = z.infer<typeof userPointsRecordSchema>

const userPointsPageSchema = z
  .object({
    data: z.array(userPointsRecordSchema),
    current_page: z.number(),
    per_page: z.number(),
    total: z.number(),
    last_page: z.number(),
  })
  .passthrough()

export type UserPointsPage = z.infer<typeof userPointsPageSchema>

export interface UserPointsListParams {
  /** 不传=全部；10=收入；20=消费 */
  type?: number
  page?: number
  pageSize?: number
}

export async function fetchUserPointsList(
  params: UserPointsListParams = {},
): Promise<UserPointsPage> {
  const payload = await httpClient.request<unknown>({
    method: 'GET',
    url: USER_POINTS_INDEX_PATH,
    params: {
      type: params.type,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 15,
    },
  })
  return parseApiEnvelope(payload, userPointsPageSchema, {
    contract: 'points.list',
    fallbackMessage: '泡泡值明细获取失败',
  })
}
```

约定：

- `type` 为 `undefined` 时 axios 不序列化该参数，等价「不传」。
- `delete_time` 恒定 `null`，字段保留在 schema 内但不参与任何展示。
- `operator`（`sign` / 未来 `exchange`）**前端不展示**，只做类型占位。
- `object_type` 与 `object`：`task` 时 `object` 是签到活动 ID；`order` 待兑换功能上线后才会出现。展示文案映射见 §4。

字段级说明（与客户端文档逐字段对齐）：

| 字段 | 类型 | 说明 | 前端处理 |
| --- | --- | --- | --- |
| `id` | `number` | 流水 ID | 列表 `key` |
| `create_time` | `string` | 变动时间，`"YYYY-MM-DD HH:mm:ss"`（北京时间） | 列表展示用这个 |
| `update_time` | `string` | 更新时间，同上格式 | 不展示 |
| `delete_time` | `null` | 恒定 `null` | 忽略 |
| `user_id` | `number` | 恒等于当前登录用户 | 不展示 |
| `points` | `number` | **本次变动金额，恒为正数**，正负由 `type` 决定 | 按 `type` 拼 `+` / `-`，**不要用它的正负判断收支** |
| `before_points` | `number` | 变动前余额 | 可选 |
| `after_points` | `number` | 变动后余额 | 需要「余额 128」类副标题时用它 |
| `type` | `number` | `10`=收入，`20`=消费 | 决定符号与颜色 |
| `object` | `number` | 关联对象 ID，配合 `object_type`；`task` 时是签到活动 ID | 不展示 |
| `object_type` | `string` | `task`=签到任务，`order`=兑换订单（待上线） | 派生来源文案 |
| `operator` | `string` | `sign`=签到（`exchange` 未实现） | **不要渲染给用户** |

> ⚠️ 两个易错点（客户端文档明确警告）：
> 1. **`points` 是这笔变动的金额，不是余额。** 要显示余额用 `after_points`，或直接用统计接口的 `points`。
> 2. **`object_type` 可用于来源文案（`task`→「签到」/`order`→「兑换」），但 `operator` 是可扩展英文标识，不要当文案直接渲染。**

> 说明：本接口另有 `orderBy[create_time]` 排序参数（`DESC` / `ASC`，不传默认 `id DESC`，最新在前，一般不用传）。如未来确需正序，再按 `orderBy%5Bcreate_time%5D=DESC|ASC` 编码传参，由 service 统一处理 URL 编码；当前页面不暴露排序控件。

### 3.4 契约 schema 的取舍原则

- 只对页面真正消费的字段做强约束（`points` / `type` / `points` / `create_time` / `before_points` / `after_points`）。
- 未确认或暂不消费的字段（`operator`、`delete_time`、`object`）保留但放宽，整体 `.passthrough()`，避免后端加字段就触发契约失败。
- 数字字段用 `z.number()` 严格校验：接口文档明确这些字段是 `number`，字符串化会掩盖后端 bug。

## 4. 页面层改造方案

### 4.1 `/points`（统计）

- 数据获取：新增一个页面级 hook（或直接在页面内用 `useEffect` + 局部 state，与 `Home` 对 `fetchSignStatus` 的既有方式保持一致），调用 `fetchUserPointsStat()`。
- 渲染：
  - 余额 → `stat.points`（**不再读 `BUBBLE_BALANCE`**）；
  - 累计收入 → `stat.income`；
  - 累计消耗 → `stat.expense`。
- 数值格式：沿用现有 `toLocaleString()` 展示习惯；`0` 正常显示为 `0`。
- 加载 / 失败：保持 `preview` 已验收视觉，仅在三块数字位置做加载（骨架/占位数字）与失败（可重试或降级）处理，不新增营销区块，不改变卡片布局与 Token。
- 三个接口并发：本页需要 `stat`；`signactivity` 视签到入口是否在本页展示而定（当前 `/points` 的「每日签到」入口是跳转按钮，不展示天数，故 `/points` 不拉 `signactivity`，见 §7）。

### 4.2 `/points/detail`（明细 + 分页）

- Tab → `type` 映射：`all` → `undefined`，`income` → `10`，`expense` → `20`。切换 Tab 时重置到第 1 页并重新请求。
- 分页：每页 15 条。采用「加载更多」追加模式（与移动端惯性一致），或按原型既有滚动行为决定；**最终交互形态以 `preview` 已验收结论为准**，本方案只固定数据契约。
- 列表项渲染：
  - 时间 → `create_time`（直接展示，含秒）；
  - 金额 → `points`（恒正），正负由 `type` 决定：`10` 显示 `+`，`20` 显示 `-`；
  - 图标/颜色 → `type === 10` 用现有 income 色（`success-*`），`type === 20` 用现有 expense 色（`danger-*`），复用当前类名；
  - 标题：由 `object_type` 派生（当前仅 `task=签到`；`order` 待兑换上线后再补），需要一个 `object_type → 文案` 的映射函数，未知值给通用兜底文案，不硬编码业务不可知项。
- 空态：`data.length === 0` 时沿用现有 `EmptyState variant="no-data"` 与 `BUBBLE_LIST_END` 文案（原型 §3 只给了这一句）。
- 加载 / 失败 / 末页：loading 态、错误重试、`current_page < last_page` 判定「还有更多」，`last_page` 触底后展示结束文案。

### 4.3 fixture 的处置

- 接入完成后，`/points` 与 `/points/detail` 不再读 `BUBBLE_RECORDS` / `BUBBLE_BALANCE` / `sumBubbleRecords` / `filterBubbleRecords`（这些仅服务于 Mock 网络层，改由 §5 的 mock fixture 承担）。
- 首页/会员页等其它引用了 `sumBubbleRecords`、`BUBBLE_BALANCE` 的位置（如 `Profile`、`Membership`、`DearseedColumn`），**本方案不强行一并改造**，按各页自身 API 接入任务单独处理；此处只登记它们的引用存在，避免误删共享 fixture 造成连带破坏。

## 5. Mock 层方案（MSW）

新增：

```text
src/services/userpoints.ts                 # 真实 service（§3）
src/mocks/handlers/userpoints.ts           # 网络层 mock handler
src/mocks/fixtures/userpoints.ts           # 确定性 mock 数据
```

handler 要点：

- 与真实 service 共用 `USER_POINTS_STAT_PATH` / `USER_POINTS_INDEX_PATH` 常量，同一信封（`{ code:0, msg:'success', status:'succ', data }`）。
- `index` handler 需**真实处理 `type` / `page` / `pageSize`** 三个 query 参数（过滤 + 切片 + 返回 `current_page` / `per_page` / `total` / `last_page`），这样页面切换 Tab、触底分页在 Mock 与真实 API 下走完全相同的代码路径。
- mock 数据必须可识别为 Mock（AGENTS.md §8、`network-mocking.md`），并显式覆盖：全部 / 仅收入 / 仅消费、首页满页、末页、空列表。
- 在 `src/mocks/handlers/index.ts` 注册 `userpointsHandlers`。

`/points` 与 `/points/detail` 的 `?state=` 调试能力（`preview` fixture 查询）与 MSW 是两条正交机制：前者仅 dev/preview 生效用于视觉验收，后者决定数据来源。两者都不得让页面产生 `mock | api` 分支。

## 6. 错误、登录与并发

- **登录**：三接口均需登录。请求头由全局 auth provider 注入（`Authorization: Bearer <accessToken>`）；未登录返回 401 时按现有 `httpClient` 401 重试 + 页面 AuthGate 逻辑处理，service 与页面不各自发明登录跳转。**2026-09-28 对 7002 实测修正**：旧文档记载的「只接受 `token` 请求头」已失效；现在 `Authorization: Bearer <token>` 可用，`token` 头返回 401。因此本页 service 只依赖全局 provider，不单独附 `token` 头。
- **并发**：`/points` 一次并发拉 `stat`（+ 如需 `signactivity`）；`/points/detail` 拉 `index`。页面用 `Promise.all`（或分别独立请求）保证首屏并发，详见 §7 的并发拓扑。
- **错误边界**：统一 `AppError`；`kind='business'` 的失败信息优先用后端 `message` / `msg`，无则用 service 传入的 `fallbackMessage`。UI 层按现有错误态样式渲染，不吞错、不把失败伪装成空数据。

## 7. 三个接口的并发拓扑

文档明确「三者可并发」。落地时按页面归属拆分，避免无谓请求：

```text
/points            → fetchUserPointsStat()                          [必须]
/points/detail     → fetchUserPointsIndex()                         [必须，分页按需再拉]
签到相关（/checkin 等）→ fetchSignActivityList()                     [按需，见下]
```

- `GET /api/signactivity/list` 返回「最大签到天数 / 已签到天数」，属于签到模块进度语义，不是泡泡值余额语义。
- 当前 `/points` 的「每日签到」入口只是跳转按钮、不展示天数，因此 `/points` **不**为它额外拉 `signactivity`。
- 凡是需要展示「已签到 / 最大天数」的签到视图（如 `/checkin` 或首页签到状态），应在各自页面并发拉取该接口；`signactivity` 的 service + schema 可一并放进本方案落地（见下），但**页面消费方式由签到模块的接入任务确定**，不在本方案擅自改动签到 UI。

`signactivity` service（建议与 `userpoints.ts` 同批落地或并入签到 service）：

```ts
export const SIGN_ACTIVITY_LIST_PATH = '/api/signactivity/list'

const signActivitySchema = z
  .object({
    id: z.number(),
    title: z.string(),
    type: z.number(),
    image: z.string().nullable(),
    is_makeup: z.number(),
    status: z.number(),
    sort_number: z.number(),
    max_days: z.number(),
    signed_days: z.number(),
  })
  .passthrough()
```

完整字段契约（以客户端文档为准）：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `number` | 活动 ID |
| `title` | `string` | 活动标题 |
| `type` | `number` | 活动类型：`10`=日常签到，`20`=节日签到，`30`=限时签到 |
| `image` | `string \| null` | 活动封面图完整 URL，**可能为 `null`**（前端用本地兜底图） |
| `is_makeup` | `number` | 是否允许补签：`0`=否，`1`=是（为 `1` 时才展示补签入口） |
| `status` | `number` | 状态：`10`=待使用，`20`=使用中，`40`=已关闭 |
| `sort_number` | `number` | 后台排序值，接口已排好序 |
| `max_days` | `number` | 最大签到天数（进度条总长度） |
| `signed_days` | `number` | 当前登录用户已签到天数（进度条当前值） |

口径说明：

- `max_days` = 该活动奖励配置里最大的「需连续签到天数」档位（不分奖励类型，泡泡值与优惠券档位一起取最大值）；没有配任何奖励档位时为 `0`。
- `signed_days` = 当前用户已经签到的连续天数：今天签过就取今天的连续天数，今天没签就取昨天累计的连续天数，从没签过为 `0`。
- 进度展示建议 `signed_days / max_days`，并用 `Math.min` 兜底避免超过 100%（当月天数不足时后端有封顶逻辑，见 [api-index.md §0](../api-index.md#0-通用约定)）。

响应示例（`data` 是**裸数组**，不在 `data.data` 里）：

```json
{
  "code": 0,
  "msg": "success",
  "status": "succ",
  "data": [
    {
      "id": 1,
      "title": "每日签到",
      "type": 10,
      "image": "http://127.0.0.1:7002/storage/20260718/aabc2be2-a1bf-4bbf-98e4-0cb4a539370b.jpg",
      "is_makeup": 1,
      "status": 10,
      "sort_number": 1,
      "max_days": 31,
      "signed_days": 2
    }
  ]
}
```

前端处理与易错点：

- **不分页**（活动数量很少，一次全返回），已按 `sort_number` 升序、再按 `id` 升序排好，按数组顺序渲染即可。
- 接口返回**全部状态**的活动（不只「使用中」），前端按 `status` 自行处理：`20` 正常展示可签到，`10` / `40` 建议置灰或过滤 —— 是否过滤由产品定，后端不做假设。
- `signed_days` 对所有活动都是同一个值：签到记录表没有活动维度（`smile_sign_records` 只有 `user_id` / `points` / `consecutive_days` / `status`），用户连续签到天数是**账号级**的，不区分活动。只展示一个活动时用哪个都一样；展示多个活动时进度会完全相同。
- ⚠️ **不要拿首页 `GET /api/signrecords/status` 的 `consecutive_days` 来画这个进度条。** 那个字段在「今天未签到」时返回的是签到**之后**会达到的天数（比实际多 1），而本接口的 `signed_days` 是**已经签到**的天数；两者在未签到场景下差 1 天。
- 需要「今天是否已签到」来判断按钮状态，仍用 `GET /api/signrecords/status`；本接口只给进度数字，**不返回今日签到状态**。

> 落地状态：**已落地**（2026-09-28，见 §11.3）。本接口即「泡泡任务」区中签到类任务
> （每日打卡 / 连续签到）的数据源：任务卡 `title` 取活动 `title`，进度 `current / target`
> 取 `signed_days / max_days`。
> 「观看视频」「邀请好友」两张卡在本接口（及本页其余接口）中**无对应数据**，继续读 fixtures 占位，需后端另行补齐。
> 按产品口径，评审期「接口返回什么状态就展示什么」，前端暂不过滤 `status`。

## 8. 施工顺序（建议）

1. 新增 `src/services/userpoints.ts`（`stat` + `index` 两个函数与 schema）。
2. 新增 `src/mocks/fixtures/userpoints.ts` + `src/mocks/handlers/userpoints.ts`，并在 `handlers/index.ts` 注册。
3. 改造 `/points`：接入 `fetchUserPointsStat`，三块数字改读接口，保留既有视觉与加载/错误态。
4. 改造 `/points/detail`：接入 `fetchUserPointsList`，`filter → type` 映射、分页、文案映射、空态。
5. 验证（`mock` 模式即可覆盖绝大多数逻辑）：
   - `npm run typecheck`
   - `npm run build`
   - 页面级：全部/收入/消费三态、首页满页、末页、空列表、加载、失败重试。
6. 真实环境验证（`test`，App WebView + 真接口）：三接口并发、401 表现、`income - expense ≠ points` 的用户自查「可用」取自 `points`。

## 9. 验收清单

- [ ] 三个数字（可用/累计收入/累计消耗）均来自接口；**可用严格取 `points`**，无 `income - expense` 反推。
- [ ] `0` 值正常显示，未被 `||` 折叠。
- [ ] 明细 Tab 切换命中同一接口、仅改 `type`，且重置到第 1 页。
- [ ] 分页参数正确（默认 `page=1`、`pageSize=15`、上限 100），末页判定用 `last_page`。
- [ ] 未展示 `operator`；`delete_time` 不参与渲染。
- [ ] 空列表展示既有 `BUBBLE_LIST_END` 空态。
- [ ] `points` 未被当作余额展示（要余额用 `after_points` 或统计接口 `points`）。
- [ ] `object_type` 用于来源文案；`operator` 未渲染给用户。
- [ ] Mock 与真实 API 走同一套 service，页面无 `dataMode` 分支。
- [ ] `npm run typecheck` / `npm run build` 通过。
- [ ] `preview` 视觉未因接入发生漂移（对照既有验收截图）。
- [ ] 「泡泡任务」区签到类任务（每日打卡 / 连续签到）进度取自 `signactivity/list` 的 `signed_days / max_days`；观看视频 / 邀请好友无数据源，保持占位。

## 10. 明确不做

- 不改动 `preview` 已验收的视觉与布局，不新增营销/任务区块。
- 不定义本页契约未给出的字段（尤其 `signactivity` 字段名），不臆造宿主能力。
- 不修改 Native 参考 / legacy 路由（`AGENTS.md` §3.4）。
- 不就本任务顺带改造其它引用泡泡值 fixture 的页面（首页/会员等），按各页自身任务处理。
- 不在 `prod` 以 Mock 作为业务兜底（`AGENTS.md` §3.2、§8）。

## 11. 落地记录（2026-09-28）

### 11.1 文档同步（2026-09-28）

按客户端《泡泡值（积分）页面接口接入文档》逐字段校订本文，并补齐通用约定载体：

| 文件 | 状态 | 说明 |
| --- | --- | --- |
| [docs/api-index.md](../api-index.md) | 新增 | 建立「通用约定 §0」（响应体信封 / `code` 判断 / 登录态请求头 / 分页 / 排序 / 时间格式）+ 已实测业务端点索引；修复原先指向不存在文件的悬空引用 |
| 本文 | 修改 | 逐字段对齐；补 `after_points` 易错点与 `operator` 不渲染约束；补全 `signactivity/list` 完整契约并明确其为任务区签到类任务的数据源；登记视频/邀请类任务无数据源 |

### 11.2 代码落地

本文所述方案已实施，实际改动如下：

| 文件 | 状态 | 说明 |
| --- | --- | --- |
| [src/services/userpoints.ts](../../src/services/userpoints.ts) | 新增 | `fetchUserPointsStat` / `fetchUserPointsList`，含 zod 契约、路径与 `type` 常量 |
| [src/services/userpoints.test.ts](../../src/services/userpoints.test.ts) | 新增 | 6 条契约单测：stat 口径、0 值、业务错误、type/page/pageSize 透传、默认值 |
| [src/pages/points/usePointsFeed.ts](../../src/pages/points/usePointsFeed.ts) | 新增 | `useUserPointsStat` / `useUserPointsList`，与 `useHomeFeed` 同构，含 `reload` |
| [src/pages/Points.tsx](../../src/pages/Points.tsx) | 修改 | 三块数字改读接口；可用严格取 `points`；加载/失败显示 `--` 占位 |
| [src/pages/PointsDetail.tsx](../../src/pages/PointsDetail.tsx) | 修改 | Tab→`type`、加载更多分页、加载/错误重试/空态；列表改读接口 |
| [src/mocks/fixtures/userpoints.ts](../../src/mocks/fixtures/userpoints.ts) | 新增 | 23 条确定性流水 + stat mock |
| [src/mocks/handlers/userpoints.ts](../../src/mocks/handlers/userpoints.ts) | 新增 | 真实处理 `type/page/pageSize` 的 MSW handler |
| [src/mocks/handlers/index.ts](../../src/mocks/handlers/index.ts) | 修改 | 注册 `userpointsHandlers` |

实施过程中的两点决策（与上文方案的收敛）：

1. **分页交互**：方案未固定交互形态，实施采用「加载更多」按钮追加模式（`current_page < last_page` 时展示），符合移动端惯性且不破坏既有列表视觉。
2. **加载 / 失败占位**：`/points` 的余额与累计数字在加载/失败时显示 `--`，**不回退旧夹具值**，避免把旧数据冒充成真实余额；`/points/detail` 复用 `LoadingIndicator` 与 `EmptyState variant="recoverable-error"` + `Button` 重试。

未纳入本次改动（按 §10 边界）：`filterBubbleRecords` / `BUBBLE_RECORDS` / `BUBBLE_BALANCE` / `sumBubbleRecords` 作为共享 fixture 保留原样，其它引用它们的页面（`Profile` / `Membership` / `DearseedColumn` / `Exchange` / `exchange.ts`）不改造。

验证结果：

- `npm run typecheck` ✅
- `npm run build` ✅
- `npm run lint` ✅（H5 hygiene / fixture-query debt 均通过）
- `npx vitest run src/services/userpoints.test.ts` ✅（6/6）
- 全量 `npm run test` 中 `nativeBridge.test.ts` / `BuddyScanLanding.test.tsx` 存在**既有失败**，与本次改动无关（前者为 `VITE_BRIDGE_MODE` 运行配置、后者为 `ROUTES` mock），本次未触碰相关文件。

### 真实接口联调（2026-09-28，7002）

用 `VITE_DATA_MODE=api` + `VITE_API_BASE_URL=http://192.168.1.81:7002` 起真实 dev server，注入 `POST /api/oauth/login {}` 拿到的 accessToken，在浏览器实测：

| 用例 | 结果 |
| --- | --- |
| `GET /api/userpoints/stat`（无 token） | HTTP 401 `{code:401,message:"请先登录"}` ✅ |
| `GET /api/userpoints/stat`（过期 token） | HTTP 401 `{code:401,message:"获取用户信息异常，请重新登录！"}` ✅ |
| `GET /api/userpoints/stat`（有效 token，`Authorization: Bearer`） | HTTP 200 `{code:0,data:{points:0,income:0,expense:0}}` ✅ |
| `GET /api/userpoints/stat`（有效 token，`token` 头） | HTTP 401 —— **`token` 头口径已失效** ⚠️ |
| `/points` 页面（真实接口） | 余额 / 累计收入 / 累计消耗显示 `0 / +0 / -0`，非 `--`，说明真实数据已接入且 0 值处理正确 ✅ |
| `GET /api/userpoints/index`（全部 / type=10） | HTTP 200 `{code:0,data:{data:[],current_page:1,per_page:15,total:0,last_page:1}}` ✅ |
| `/points/detail` 页面（真实接口） | 正确渲染**空态**（`暂时没有更多记录啦`），非错误态，与 `total:0/last_page:1` 一致 ✅ |
| `GET /api/signactivity/list` | HTTP 200，`data` 为数组，含 `max_days:31` / `signed_days:0`（字段名已确认，见 §7）✅ |

**结论与修正**：

1. **认证头以 `Authorization: Bearer <accessToken>` 为准**，`token` 头已失效 —— 已据实测修正代码（`userpoints.ts` 只依赖全局 provider，不附 `token` 头）与本文 §6。
2. 真实 token 对应的用户暂无流水，故列表为空态；`stat` 与 `index` 均已跑通真实链路，错误态与空态表现正确。
3. `VITE_API_BASE_URL` 若配成绝对地址（如 tunnel），请求直达该主机而不走 dev 代理；`tunnel-dev.3cgroup.cn` 上 `/api/userpoints/stat` 实测 **404**（该实例未部署此接口），应以部署了该接口的实例为准。
4. App WebView（H036）+ Native `getLoginToken()` 的完整登录态联调与业务验收仍待执行。

### 11.3 任务区接入 `signactivity/list`（2026-09-28）

在 11.1 / 11.2 基础上，把「泡泡任务」区的签到类任务接入真实接口：

| 文件 | 状态 | 说明 |
| --- | --- | --- |
| [src/services/signrecords.ts](../../src/services/signrecords.ts) | 修改 | `signActivitySchema` 补齐文档全字段（`image` / `status` / `sort_number`，`image` 允许 `null`）；新增 `SIGN_ACTIVITY_TYPE_DAILY` / `SIGN_ACTIVITY_STATUS_PENDING|ACTIVE|CLOSED` 常量 |
| [src/services/signrecords.test.ts](../../src/services/signrecords.test.ts) | 修改 | 新增 `sign activity list contract`：裸数组解析、全字段、`image: null` 容错、`max_days: 0` 保留 |
| [src/pages/points/usePointsFeed.ts](../../src/pages/points/usePointsFeed.ts) | 修改 | 新增 `useSignActivityList`，复用 `useRemoteData`，与签到页共用同一 service |
| [src/pages/Points.tsx](../../src/pages/Points.tsx) | 修改 | 任务卡抽出视图模型（占位 / 接口共用同一张卡皮肤）；签到类任务读接口，`title` 取 `title`、进度取 `signed_days / max_days`；观看视频 / 邀请好友继续读 fixtures |

映射与口径：

- 进度 = `signed_days / max_days`，`Math.min` 兜底避免超过 100%（对齐文档「当月天数不足时后端有封顶逻辑」）。
- 展示状态由 `status` 派生：`20`（使用中）→进行中，其余→未开始，进度打满→已完成；**仅展示派生，不参与任何真实结算**。
- 图标按标题关键词软匹配（连续→Flame，签到/打卡→CalendarCheck，其余→通用），不依赖后端 `id` 与文案的稳定对应。
- 按产品口径，**接口返回什么状态就展示什么**，前端暂不过滤 `status=10/40`。

验证结果：

- `npm run typecheck` ✅
- `npm run build` ✅
- `npm run lint` ✅
- `npx vitest run src/services/signrecords.test.ts` ✅（13/13，含新增 2 条）
- 全量 `npm run test`：仅剩 `nativeBridge.test.ts` / `BuddyScanLanding.test.tsx` 的**既有失败**（本次未触碰相关文件）。

> ⚠️ 尚未完成：真实接口下 `/points` 任务区的端到端联调（App WebView + 真 token 下的活动进度展示与多活动渲染）仍待执行。
