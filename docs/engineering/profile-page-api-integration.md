# 我的（个人中心）页面接口接入方案

> 契约来源：客户端《我的（个人中心）页面接口接入文档》（2026-09-28），本文与之逐字段对齐。
> 通用约定（响应体结构、`code` 判断、登录态请求头、分页与排序写法）见 [docs/api-index.md §0](../api-index.md#0-通用约定)；本文只覆盖本页特有内容。
> 关联工程基线：`docs/engineering/http-client.md`（HTTP 出口）、`docs/engineering/network-mocking.md`（MSW Mock）、`docs/engineering/data-contracts.md`（契约层）、`docs/engineering/coding-standards.md`（分层边界）。
> 同批参考：[points-page-api-integration.md](./points-page-api-integration.md)（泡泡值页，本文与其保持同一分层与 mock 口径）。

## 1. 范围与目标

本页共 3 个接口，**全部需要登录**：

| # | 模块 | 接口 | 登录 | 分页 | 归属 |
| --- | --- | --- | --- | --- | --- |
| 1 | 个人资料（头像 / 昵称 / 等级 / 券数量） | `GET /api/user/profile` | ✅ 是 | 否 | `/profile` 会员卡区 + 资产区 |
| 2 | 修改个人资料 | `POST /api/user/update` | ✅ 是 | 否 | service + mock 落地，页面编辑入口仍走资料设置 |
| 3 | 优惠券列表（券模板，可兑换的券） | `GET /api/coupons/index` | ✅ 是 | 是 | `/profile` **「热门体验券」横滑区** |

两个用户接口都只操作当前登录用户，**不接受传 `user_id` / `id`** —— 传了也会被登录用户覆盖。

> 📌 **口径确认**：文档中的「优惠券列表（券模板，可兑换的券）」**就是「我的」页的「热门体验券」横滑区**（体验券 = 券模板）。该区接入前是写死的品牌演示数据，现改读 `GET /api/coupons/index`。

> ⚠️ **范围边界**：本页 UI 的「快捷服务」7 个入口、App 引导弹层保持静态，本文不为其新增接口：
> - 「快捷服务」为纯跳转入口，无接口；
> - 头像上传 / 昵称编辑的**写操作**在资料设置页（`/settings`），本页第 2 个接口只做 service + mock 落地（见 §7）。

### 本方案的性质

本文是**接入方案（contract + 施工边界）**，不是定稿 UI 变更。所有落地改动都必须满足：

- 视觉与交互保持 `preview` 已验收结论不漂移（AGENTS.md §5.1、§10）；
- Mock 与真实 API 使用**同一套 service 调用**，页面不做 `mock | api` 分支（`network-mocking.md` §3）；
- 页面不直接 `fetch` / `axios` / `window.xxx`，一律经 service 层（`http-client.md`「调用边界」）。

## 2. 现有代码事实（接入前）

### 2.1 页面现状：纯静态

`src/pages/Profile.tsx`（路由 `/profile`，底部 Tab「会员中心」）接入前是**纯静态页**，无任何 service 调用：

| 区块 | 接入前数据源 | 说明 |
| --- | --- | --- |
| 昵称 | 字面量 `昵称 12345678910` | 写死 |
| VIP 徽标 | 字面量 `VIP 泡泡新生` | 写死 |
| ID | 字面量 `ID 80012345` | 写死 |
| 头像 | 静态资源 `home-avatar.webp` | 无接口头像兜底 |
| 等级进度 | `当前 Lv.1 泡泡新生` / `距 Lv.2 泡泡萌芽 还差 720 泡泡值` / 进度条 `30%` | 全部写死 |
| 资产区「卡包」 | `1` | 写死 |
| 资产区「泡泡值」 | `1,280` | 写死 |

### 2.2 通用基础设施（已具备，直接复用）

- HTTP 出口：`src/services/http/httpClient.ts`，单例 `httpClient.request<T>()`；认证头由全局 `authHeadersProvider` 注入；401 由 httpClient 重试 + 页面 AuthGate 统一处理。
- 信封解析：`src/services/contracts/apiEnvelope.ts` 的 `parseApiEnvelope`，只看 `code === 0` 判成功，失败抛 `AppError(kind='business')`。
- 契约校验：`zod`，页面未消费字段用 `.passthrough()` 放行（参考 `userpoints.ts`）。
- Mock：MSW，`src/mocks/handlers/` + `src/mocks/fixtures/`，由 `runtimePolicy.dataMode` 决定启用。

### 2.3 与既有端点/页面的关系（务必不混淆）

| 端点 | 消费方 | 是否本次改动 |
| --- | --- | --- |
| `GET /api/user/detail` | 资料设置页（`/settings`，`fetchUserProfileDetail`） | **不改动**，保留历史 `token` 头兼容口径 |
| `GET /api/user/profile` | 我的页（本页） | 本次新增 |
| `POST /api/user/update` | 我的资料写操作 | 本次新增 service + mock，页面编辑仍走 `/settings` |
| `GET /api/coupons/index` | 首页、卡券页（`fetchCouponList`，返回原始信封） | 本次为我的页新增 `fetchCouponIndex`（`parseApiEnvelope` 契约版），**共用同一路径常量**，不重复注册 handler |

> ⚠️ `userProfile.ts` 中 `detail` 端点保留 `token` 请求头（2026-09-24 实测），而 `userpoints.ts` / 本次新增的 `profile`、`update` 只依赖全局 `Authorization: Bearer`（2026-09-28 实测修正）。**这是两个时间点的实测差异**，不是笔误；`detail` 待后端确认 Bearer 口径后再收口。

## 3. Service 层设计

改动集中在 `src/services/userProfile.ts`（资料读 + 写同域）与 `src/services/coupons.ts`（券分页契约版）。

### 3.1 路径常量（供 mock handler 复用）

```ts
// src/services/userProfile.ts
export const USER_PROFILE_DETAIL_PATH = '/api/user/detail'   // 既有，设置页用
export const USER_PROFILE_PATH = '/api/user/profile'         // 新增
export const USER_UPDATE_PATH = '/api/user/update'           // 新增

// src/services/coupons.ts
export const COUPON_LIST_PATH = '/api/coupons/index'         // 既有，两条消费方式共用
```

### 3.2 `GET /api/user/profile`

无入参。关键设计点：

```ts
/** nextGrade 没有下一等级时是空字符串 ""，不是 null / {}，用 union 显式建模。 */
const nextGradeSchema = z
  .object({ id: z.number(), name: z.string(), min_exp_number: z.number() })
  .passthrough()

const userProfileSchema = z
  .object({
    couponsCount: z.number(),
    grade: z.string(),
    grade_id: z.number(),
    nextGrade: z.union([nextGradeSchema, z.literal('')]),
    nick_name: z.string(),
    avatar_img: z.string().nullish(),
    country: z.string().nullish(),
    province: z.string().nullish(),
    city: z.string().nullish(),
    mobile: z.string().nullish(),
    real_name: z.string().nullish(),
    points: z.number(),
    kbs_id: z.string().nullish(),
  })
  .passthrough()
```

解析后收敛成页面视图模型，把后端「空串即未设置」统一收敛为 `undefined`，避免页面散落判空：

| 接口字段 | 视图模型字段 | 收敛规则 |
| --- | --- | --- |
| `couponsCount` | `couponsCount` | 恒为数字，**0 是合法值**，不用 `||` 折叠 |
| `grade` / `grade_id` | `grade` / `gradeId` | 同生共死 |
| `nextGrade` object | `nextGrade` | 原样透传 |
| `nextGrade` `""` | `nextGrade: undefined` | 后端「已是最高等级」的表达 |
| `nick_name` | `nickname` | 原样 |
| `avatar_img` | `avatar` | 空串 / `null` → `undefined` |
| `country` / `province` / `city` | 同名 | 空串 → `undefined` |
| `mobile` | `mobile` | 可能为脱敏形态 `151****2709`，原样展示 |
| `real_name` | `realName` | 空串 → `undefined` |
| `points` | `points` | **登录快照**，见 §6 ⚠️ |
| `kbs_id` | `kbsId` | 空串 → `undefined` |

### 3.3 `POST /api/user/update`

```ts
export type UserGender = '0' | '1' | '2'   // 必须传字符串

export interface UserUpdatePayload {
  nick_name?: string
  gender?: UserGender
  avatar_img?: string
  country?: string
  province?: string
  city?: string
  real_name?: string
  student_grade?: string
}
```

约定：

- **只传要改的字段**，不传的保持原值；`httpClient` 的 `data` 直接序列化为 JSON 请求体（`application/json`）。
- `gender` 必须是**字符串** `"0"`=保密 / `"1"`=男 / `"2"`=女，不能传数字。
- 字符串长度上限（后端校验，前端不自行截断）：`nick_name` 50 / `avatar_img` 255 / `country` 150 / `province` 150 / `city` 150 / `real_name` 80 / `student_grade` 20。
- 响应是**完整用户实体**（含 `balance` / `last_login_ip` / `platform` / `status` …）。前端只声明可能消费的字段并整体放行，**不持久化该响应**（无本地用户实体缓存边界）；需要最新资料时重新拉 `profile`。

### 3.4 `GET /api/coupons/index`（券模板分页）

`fetchCouponList`（首页/卡券页）与 `fetchCouponIndex`（我的页）**同路径并存**：

| | `fetchCouponList` | `fetchCouponIndex` |
| --- | --- | --- |
| 返回 | 原始信封 `CouponListEnvelope` | 分页对象 `CouponListPage` |
| 校验 | 无（容忍后端字段漂移） | `zod` + `parseApiEnvelope`，失败抛 `AppError` |
| 默认分页 | `page=1` / `pageSize=50` | `page=1` / `pageSize=15`（文档默认，上限 100） |
| `status` | 缺省补 `10`（上架） | 不传（由后端返回全部） |

分页结构走 [api-index.md §0.4](../api-index.md#04-分页写法)：列表在 `data.data`（嵌套两层），`last_page = max(ceil(total / per_page), 1)`，空结果为 `1`。

## 4. 页面层改造方案（`/profile`）

### 4.1 数据获取

新增页面级 hook `src/pages/profile/useProfileFeed.ts`，内含共用 `useRemoteData`（`loading | success | error` + `reload`，与 `usePointsFeed` 同构），对外暴露两个数据源：

```ts
// GET /api/user/profile —— 会员卡区 + 资产区
const { remote: profileRemote } = useProfileFeed()
const profile = profileRemote.state === 'success' ? profileRemote.data : null

// GET /api/coupons/index —— 「热门体验券」横滑区（首屏第 1 页）
const { remote: couponsRemote } = useProfileCoupons()
```

两个请求互相独立：任一失败只落在对应区块，不阻塞另一块。

### 4.2 渲染映射

| UI 位置 | 接入后数据源 | 加载 / 失败表现 |
| --- | --- | --- |
| 头像 | `profile.avatar`，未设置回退本地 `home-avatar.webp` | 回退本地图（不留空白） |
| 昵称 | `profile.nickname` | `--` |
| VIP 徽标 | `VIP {profile.grade}` | `VIP --` |
| ID | `profile.kbsId`，为空时**整行不渲染** | 不渲染 |
| 等级进度文案 | `当前等级 {grade}`；`nextGrade` 存在时 `距 {name} 还差 {min_exp_number} 经验值`，为空串时 `已是最高等级` | `--` |
| 资产区「卡包」 | 改名「**优惠券**」，值取 `couponsCount` | `--` |
| 资产区「泡泡值」 | `profile.points` 快照 | `--` |
| 「热门体验券」卡片 | `name` → 标题；`short_desc` → 副标题；`image` → 封面 | 加载「加载中…」；空/失败「暂时没有可兑换的体验券」 |

「热门体验券」字段映射（接口 → UI）：

| 接口字段 | UI | 兜底 |
| --- | --- | --- |
| `id` | 列表 `key` | — |
| `name` | 卡片标题 | 无（接口必填） |
| `short_desc` | 卡片副标题 | 空 → `单次体验 · 到店核销` |
| `image` | 卡片封面 | `null` / 空串 → 本地 `profile-hot-berry.webp` |

> 分页：本页首屏只取第 1 页（`pageSize=15`），不做滚动加载；「查看更多」跳券页承接完整分页与筛选。这与券页 `Card.tsx` 的分工一致。


关键口径：

- **加载 / 失败显示 `--`，不回退旧夹具值**，避免把假值冒充成真实资料（与 `/points` 同一原则）。
- `couponsCount` / `points` 为 `0` 时正常显示 `0`，不用 `||` 折叠。
- 等级进度条**保持既有视觉宽度**：文档只给了 `nextGrade.min_exp_number`（下一等级所需经验），**未提供当前经验值 / 当前等级所需经验**，无法计算真实完成度，因此不做百分比反推，也不臆造公式。

### 4.3 与既有 fixture 的关系

接入后 `/profile` 不再读任何硬编码昵称 / ID / 等级 / 泡泡值常量。`src/app/fixtures/membership.ts` 的 `BUBBLE_BALANCE` / `sumBubbleRecords` 等**共享 fixture 不在本次删除**：其它页面（`Membership` / `DearseedColumn` / `Exchange`）仍引用它们，按各页自身任务处理。

## 5. Mock 层方案（MSW）

新增 / 修改：

```text
src/mocks/fixtures/userProfile.ts      # 修改：新增 USER_PROFILE_MOCK / USER_PROFILE_MOCK_NO_NEXT_GRADE / USER_UPDATE_MOCK
src/mocks/handlers/userProfile.ts      # 修改：注册 profile + update 两条 handler
src/mocks/handlers/home.ts             # 不改动：已注册 /api/coupons/index，避免路径重复注册
```

要点：

- 与真实 service 共用路径常量（`USER_PROFILE_PATH` / `USER_UPDATE_PATH`）与同一信封（`{ code:0, msg:'success', status:'succ', data }`）。
- `USER_PROFILE_MOCK` 逐字段对齐客户端文档响应示例；`avatar_img` / `real_name` 刻意留空串，用于验证「未设置」兜底。
- `USER_PROFILE_MOCK_NO_NEXT_GRADE` 覆盖 `nextGrade: ""` 边界，保证页面不因该形态崩溃。
- `POST /api/user/update` handler 只回显文档示例成功响应，**不做真实持久化**（Mock 无状态）。
- **不新增 `/api/coupons/index` handler**：该路径已由 `homeHandlers` 注册（见 `handlers/home.ts`），重复注册会让两个 handler 争抢同一路径（`handlers/home.ts` 顶部注释已明确此约定）。本页与券页共用该 handler 与 `COUPON_LIST_MOCK`，不改动已有 mock 数据契约。

`?state=` / `?overlay=` 调试能力（`preview` fixture 查询）与 MSW 是两条正交机制，页面均不产生 `mock | api` 分支。

## 6. 错误、登录与并发

- **登录**：三接口均需登录。请求头由全局 auth provider 注入（`Authorization: Bearer <accessToken>`）；401 由现有 `httpClient` 重试 + 页面 AuthGate 逻辑处理，service 与页面不各自发明登录跳转。
- **并发**：本页首屏并发两个请求 —— `GET /api/user/profile`（资料/资产区）与 `GET /api/coupons/index`（体验券横滑区）。两者互相独立，任一失败只落在对应区块，不阻塞另一块。
- **错误边界**：统一 `AppError`；`kind='business'` 的失败信息优先用后端 `message` / `msg`，无则用 service 传入的 `fallbackMessage`。

> ⚠️ **`points` 是登录时的快照**：文档明确它来自登录时的取值，**不是实时余额**。若需要展示实时可用泡泡值，应改用 `GET /api/userpoints/stat` 的 `points`（见 [points-page-api-integration.md](./points-page-api-integration.md) §3.2）。本页资产区当前按文档口径展示资料快照，**不引入第二个接口**；若产品要求与泡泡值页数字严格一致，应另立决策改为复用 `stat`。

## 7. 施工范围与取舍

| 项 | 处理 |
| --- | --- |
| `GET /api/user/profile` | ✅ 已接入页面（会员卡区 + 资产区） |
| `POST /api/user/update` | ✅ service + mock 已落地；**页面编辑入口仍跳 `/settings`**，未改造 Settings 提交逻辑，避免扩大改动范围 |
| `GET /api/coupons/index` | ✅ 已接入页面（「热门体验券」横滑区，`fetchCouponIndex` 契约版） |
| 「快捷服务」7 个入口 | 保持既有静态实现，纯跳转入口无接口 |
| `GET /api/user/detail`（Settings 页） | 不改动，避免与设置页既有登录态口径冲突 |

## 8. 施工顺序（已执行）

1. 扩展 `src/services/userProfile.ts`：`fetchUserProfile` / `parseUserProfile` / `updateUserProfile` + 路径常量与性别常量。
2. `src/services/coupons.ts` 新增 `fetchCouponIndex` + zod 契约（共用 `COUPON_LIST_PATH`）。
3. `src/mocks/fixtures/userProfile.ts` 补 3 份 mock；`src/mocks/handlers/userProfile.ts` 注册 profile / update。
4. 新增 `src/pages/profile/useProfileFeed.ts`（`useProfileFeed` + `useProfileCoupons`）。
5. 改造 `src/pages/Profile.tsx`：资料区 / 资产区 / 体验券横滑区改读接口，加载失败显示兜底。
6. 验证：`npm run typecheck` / `npm run build` / `npm run lint` / `npx vitest run src/services`。

## 9. 验收清单

- [ ] 昵称 / 头像 / 等级 / ID 全部来自 `GET /api/user/profile`，页面无硬编码资料常量。
- [ ] `nextGrade` 为 `""` 时不崩溃，正确显示「已是最高等级」。
- [ ] `couponsCount` / `points` 为 `0` 时正常显示 `0`，未被 `||` 折叠。
- [ ] 加载 / 失败显示 `--`，未回退旧夹具值。
- [ ] 头像为空时回退本地默认图；`kbs_id` 为空时不渲染 ID 行。
- [ ] 「热门体验券」横滑区数据来自 `GET /api/coupons/index`，页面无硬编码券数组。
- [ ] 券卡片 `image` 为空时回退本地兜底图；`short_desc` 为空时有默认副标题。
- [ ] 券列表加载 / 空 / 失败均有明确表现，不显示空白横滑区。
- [ ] `POST /api/user/update` 只传变更字段；`gender` 传字符串。
- [ ] 未新增重复的 `/api/coupons/index` MSW handler。
- [ ] Mock 与真实 API 走同一套 service，页面无 `dataMode` 分支。
- [ ] `npm run typecheck` / `npm run build` / `npm run lint` 通过。
- [ ] `preview` 视觉未因接入发生漂移（卡片渐变 / 布局 / Token 未改）。

## 10. 明确不做

- 不改动本页已验收的卡片渐变、布局、Token 与图标体系。
- 不改造资料设置页（`/settings`）的保存链路，不替换 `GET /api/user/detail`。
- 不为等级进度臆造百分比公式，不臆造文档未给出的字段（如当前经验值）。
- 不把 `points` 快照当实时余额，不在本页擅自引入 `userpoints/stat`。
- 不修改 Native 参考 / legacy 路由（`AGENTS.md` §3.4）。
- 不在 `prod` 以 Mock 作为业务兜底（`AGENTS.md` §3.2、§8）。

## 11. 落地记录（2026-09-28）

| 文件 | 状态 | 说明 |
| --- | --- | --- |
| [src/services/userProfile.ts](../../src/services/userProfile.ts) | 修改 | 新增 `USER_PROFILE_PATH` / `USER_UPDATE_PATH`、`fetchUserProfile` / `parseUserProfile`（`nextGrade` 空串建模 + 空串收敛）、`updateUserProfile` 与性别常量；保留 `detail` 端点与 `token` 头兼容口径 |
| [src/services/userProfile.test.ts](../../src/services/userProfile.test.ts) | 重写 | 6 条契约单测：视图模型映射、`nextGrade: ""`、`0` 值保留、业务错误、update 只传变更字段、update 校验失败文案 |
| [src/services/coupons.ts](../../src/services/coupons.ts) | 修改 | 新增 `fetchCouponIndex` + `CouponIndexParams` + zod 契约（共用 `COUPON_LIST_PATH`；`points_number` / `category_id` 容错 `number | string`） |
| [src/services/coupons.test.ts](../../src/services/coupons.test.ts) | 新增 | 4 条契约单测：默认分页参数、字符串数值容错、空结果 `last_page: 1`、业务错误 |
| [src/mocks/fixtures/userProfile.ts](../../src/mocks/fixtures/userProfile.ts) | 修改 | 新增 `USER_PROFILE_MOCK` / `USER_PROFILE_MOCK_NO_NEXT_GRADE` / `USER_UPDATE_MOCK` |
| [src/mocks/handlers/userProfile.ts](../../src/mocks/handlers/userProfile.ts) | 修改 | 注册 `GET /api/user/profile` 与 `POST /api/user/update` |
| [src/pages/profile/useProfileFeed.ts](../../src/pages/profile/useProfileFeed.ts) | 新增 | `useProfileFeed` + `useProfileCoupons`，共用内部 `useRemoteData` |
| [src/pages/Profile.tsx](../../src/pages/Profile.tsx) | 修改 | 资料区 / 资产区 / 「热门体验券」横滑区改读接口；加载失败显示兜底；券数量替代写死「卡包」 |

验证结果：

- `npm run typecheck` ✅（本次改动文件无 TS 错误）
- `npm run build` ⚠️ 被**无关文件**阻塞：`src/pages/checkin/components/CheckinBoard.tsx` / `src/pages/Home.tsx` 存在他人并行改动引入的 TS 错误，不在本任务范围
- `npm run lint` ⚠️ 同上：`CheckinBoard.tsx` 未使用变量（`isSuccess`）属既有/并行债务，本任务未触碰该文件
- `npx vitest run src/services/coupons.test.ts src/services/userProfile.test.ts` ✅（10/10）
- `npx vitest run src/pages/Settings.test.tsx` ✅（6/6，未受 `userProfile.ts` 改动影响）

### 尚未完成 / 待联调

- **真实接口联调**：三个接口均尚未在 7002 实测（本次以文档契约 + mock 落地）。需按 [points-page-api-integration.md](./points-page-api-integration.md) §11 的方式，用 `VITE_DATA_MODE=api` + 真实 token 验证：
  - 无 token / 过期 token 的 401 表现；
  - `GET /api/user/profile` 的 `nextGrade` 空串形态真实返回；
  - `GET /api/coupons/index` 的真实券模板数据与 `image` 字段形态（当前 mock 为 `null`，需确认线上是完整 URL 还是相对路径）；
  - `POST /api/user/update` 的 `application/json` 请求体与字段校验错误文案。
- **App WebView（H036）+ Native `getLoginToken()`** 的完整登录态与业务验收仍待执行。
- **等级进度条**：待后端补充「当前经验值 / 当前等级所需经验」字段后，再计算真实完成度（当前保持既有视觉条）。
- **`points` 口径**：本页按文档展示登录快照，与泡泡值页的实时 `stat.points` 可能不一致，待产品确认是否统一。
