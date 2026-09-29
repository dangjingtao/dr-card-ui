# 每日打卡（签到 / 补签）接口接入记录

- 分支：`feat/0928`
- 日期：2026-09-28
- 联调后端：`http://192.168.1.81:7002`
- 事实源：2026-09-28 对 7002 的实测探针（本文记录的就是实测结果，不是设计推演）

## 1. 背景与结论

用户要求：把「每日打卡」页的**签到 / 补签完整接入真实接口**，「今日」暂用本地时间。

原始障碍：`docs/api/dearseed-api.md` 里 `signrecords` 只有 6 个 FastAdmin 自动生成的 CRUD 端点，
**全部标注「文档未定义字段结构（仅 200 OK）」**，无法据此判断签到 / 补签该调什么、返回什么。
经过对 7002 的实际请求探针，补齐了真实契约，并完成了页面接入。

一句话结论：**签到 / 补签 / 今日状态 / 打卡记录接口全部真实可用；接口本身也在，只是没写进文档。**

## 2. 实测得到的真实契约

所有端点均需登录，认证头为 `Authorization: Bearer <accessToken>`
（旧的 `token` 头口径已失效，与 `userpoints` 的结论一致）。

| 能力 | 方法 / 路径 | 关键入参 | 关键返回 |
| --- | --- | --- | --- |
| 今日签到状态 | `GET /api/signrecords/status` | 无 | `{signed, consecutive_days, points, reward_desc}` |
| 打卡日历数据源 | `GET /api/signrecords/index` | `page` / `pageSize` | **记录数组**（非分页对象），含 `create_time` / `status` |
| 执行签到 | `POST /api/signrecords/add` | 空 body `{}` | 记录对象，`status=10` |
| 执行补签 | `POST /api/signrecords/makeup` | `{ day: 'YYYY-MM-DD' }` | 记录对象，`status=20` |
| 签到活动 | `GET /api/signactivity/list` | 无 | **数组**，含 `max_days` / `signed_days` / `is_makeup` |

记录 `status` 枚举：`10=正常签到`，`20=补签`。

### 2.1 实测到的真实行为（含边界）

| 用例 | 实测结果 |
| --- | --- |
| `POST /add` 空 body | `code:0`，`signed` 由 false → true，`signed_days` +1 ✅ |
| 重复 `POST /add` | `{code:400, message:"今日已签到"}` ✅ 幂等 |
| `POST /makeup {"day":"2026-09-20"}` | `code:0`，`status:20` ✅ |
| `POST /makeup` 传今天 / 未来日期 | `{code:400, message:"只能补签今天之前的日期"}` ✅ |
| `POST /makeup {"day":"2026/09/19"}` | `{code:500, ...fails to match /^\d{4}-\d{2}-\d{2}$/}` |
| 参数名用 `date` / `makeup_date` / `sign_date` | `500 "\"补签日期\" is required"` —— **只有 `day` 有效** |

> 探针过程中还确认：`signrecords/select` 在 7002 **未部署**（404），`signrecords/calendar`、
> `list`、`month`、`today`、`signrecords/sign`、`signactivity/status` 等均为 404。
> 因此文档里的 CRUD 清单与实际部署并不完全一致。

## 3. ⚠️ 未决问题：补签记录不回显「被补的日期」

**这是本次接入唯一无法闭环的点，必须由后端确认。**

`signrecords/index` 的记录里没有独立的「签到日期」字段，只有 `create_time`；而补签记录的
`create_time` 是**补签操作的时刻**，不是被补的那一天。实测证据（补签 `2026-09-15` 后）：

```text
补签 {"day":"2026-09-15"} → {"id":11,"status":20,...}
随后 GET /index → 记录数 7，唯一日期: ['2026-09-28']
```

传进去的 `2026-09-15` **在响应里没有任何字段回显**，所有补签记录都落在操作当天 09-28。

同时，`index` 实测**不接受任何按月份过滤的入参**（`month` / `date` / `day` / `start_date` /
`sign_date` 等 9 个候选名均无效，返回全量列表）。

**待后端确认：**

1. `signrecords/index` 是否应返回「被补日期」字段（如 `sign_date`），或补签时记录该日期；
2. `index` 是否应支持按月过滤（避免前端全量拉取后在本地过滤）。

**前端当前处理（不伪装成已持久化）：** `status=20` 的补签记录不会按 `create_time`
写入日历，因为该日期只代表操作时刻。补签成功后仅对请求中的 `day` 做**会话内乐观点亮**，
并以 `makeupApplied` 标记；刷新/重进后若后端仍未提供目标日期字段，该补签格不会被伪造为
“接口已持久化日期”。

## 4. 改动清单

| 文件 | 状态 | 说明 |
| --- | --- | --- |
| [src/services/signrecords.ts](../../src/services/signrecords.ts) | 修改 | 在既有 `fetchSignStatus` 基础上，新增 `fetchSignRecords` / `submitSignIn` / `submitMakeup` / `fetchSignActivities` / `buildSignRecordDayMap` 与路径常量 |
| [src/services/signrecords.test.ts](../../src/services/signrecords.test.ts) | 修改 | 3 → 11 条契约单测（记录列表两种形态、签到、补签格式前置校验、后端业务错误、日期归约） |
| [src/pages/checkin/useCheckinFeed.ts](../../src/pages/checkin/useCheckinFeed.ts) | 新增 | `useSignStatus` / `useSignRecords` / `useSignActivities` / `useCheckinActions` |
| [src/pages/checkin/components/CheckinBoard.tsx](../../src/pages/checkin/components/CheckinBoard.tsx) | 修改 | **月历改为本地时间 + 接口记录驱动**；新增 `buildCheckinCalendar`；Hero 增加签到入口；补签回调改为按日期 |
| [src/pages/checkin/CheckinCalendar.test.ts](../../src/pages/checkin/CheckinCalendar.test.ts) | 新增 | 7 条日历构建单测（本地月份、闰年、状态推导、今天已签、乐观点亮） |
| [src/pages/Checkin.tsx](../../src/pages/Checkin.tsx) | 修改 | 接入 status + records + 签到/补签动作；补签为「激励广告通过后再调接口」 |
| [src/pages/Checkin.test.tsx](../../src/pages/Checkin.test.tsx) | 修改 | 覆盖广告闸门（未完成不落库、失败/不支持 fail-closed、防重复唤起）+ 接口补签 |
| [src/pages/Home.tsx](../../src/pages/Home.tsx) | 修改 | 首页 7 日轨道改读接口记录；移除废弃的 `onMakeup` |
| [src/app/fixtures/membership.ts](../../src/app/fixtures/membership.ts) | 修改 | **删除固定月份夹具**（`CHECKIN_CALENDAR` / `CHECKIN_TODAY` 等） |
| [src/mocks/handlers/checkin.ts](../../src/mocks/handlers/checkin.ts) | 新增 | 复刻 7002 真实行为（幂等、日期校验、状态联动）的 MSW handler |
| [src/mocks/fixtures/checkin.ts](../../src/mocks/fixtures/checkin.ts) | 新增 | 以运行时本地当月为基准生成的可辨识 Mock 记录 |
| [src/mocks/handlers/home.ts](../../src/mocks/handlers/home.ts) | 修改 | 移出 `signrecords/status`，避免与 checkin handler 争抢路径 |

### 4.1 关键设计决定

1. **月份改为本地时间**：删除 `CHECKIN_CYCLE_LABEL`（固定 `2026.06`）、`CHECKIN_TODAY`（固定 12 日）、
   `CHECKIN_CALENDAR`、`CHECKIN_STREAK` 等夹具，改由 `new Date()` 推导当月天数 / 首日星期 / 今天。
2. **日历状态读接口记录**：`done`（已签）/ `makeup`（补签）由记录的 `status` 决定，
   日期归属取 `create_time` 前 10 位（本地口径，不做 UTC 转换，避免跨日漂移）。
3. **补签保持「先看广告再落库」**：2026-09-28 用户确认，补签必须**先看完 Native 激励广告**
   （`showRewardAd({scene:'h5CheckinResign'})` → `status=completed`）**再发起** `POST /api/signrecords/makeup`。
   因此 H033 的广告闸门被**保留**，只把广告通过后的「演示奖励信号」替换为真实补签接口：
   `closed` / `failed` / `no_fill` / 宿主不支持均不发起请求、不落库、不亮格。

   状态文案（`no_fill` 于 2026-09-28 由用户确认为「下次再来吧」；当日真机联调实测广告平台
   全线无填充 —— 腾讯/UBiMAX/百度/快手均返回无填充，属正常 `no_fill` 场景）：

   | `status` | 文案 |
   | --- | --- |
   | `closed` | 广告未完整观看，补签未完成 |
   | `failed` | 广告播放失败，请重试 |
   | `no_fill` | 下次再来吧 |

   广告失败按 [native-bridge-v2-contract.md §1.1](native-bridge-v2-contract.md) 的通用失败 envelope **分级**，
   不把用户侧状态与系统故障混为一谈：

   | `NativeBridgeError.code` | 文案 |
   | --- | --- |
   | `bridge-disabled` / `bridge-unsupported` / `capability-unsupported` | 当前 App 版本暂不支持激励广告补签 |
   | `native-cancelled`（Native `cancel`） | 广告未完整观看，补签未完成 |
   | `native-permission-denied`（Native `permission_denied`） | 需要广告权限，请检查系统设置后重试 |
   | 其它（`native-failed` / `invocation-*`） | 广告调用失败，请重试 |

   > 已用真实边界验证（`nativeBridge.rewardAd.contract.test.ts`）：`{"error":"cancel"}` /
   > `{"error":"permission_denied"}` 经 callback → `parseConfirmedNativeResult` → `errors.ts`
   > 确实产出 `native-cancelled` / `native-permission-denied`，分级分支会真实命中。
   >
   > ⚠️ 关键前提：Native 回传的必须是 **JSON 字符串**（`parseJsonStringPayload` 要求 `typeof === 'string'`）。
   > 若 Native 直接回传 JS 对象而非字符串，会先被判 `payload-invalid`，最终降级成 `invocation-failed`，
   > 导致「用户取消」被误报为「调用失败」。该约束已由契约测试锁定。

4. **`signed` 与 `state` 解耦**：`state==='today'` 表示「今天未签」的视觉态，
   因此今天已签时 `state` 仍是 `today`，是否已签改由独立的 `signed` 标志承载
   （该缺陷由单测发现并修正）。

## 5. 验证结果

- `npm run typecheck` ✅
- `npm run build` ✅（含 `VITE_DATA_MODE=api` 模式构建）
- `npm run lint` ✅（H5 hygiene 0 violation；fixture-query debt 未超基线）
- `npx vitest run src/services/signrecords.test.ts` ✅ 11/11
- `npx vitest run src/pages/checkin/CheckinCalendar.test.ts` ✅ 7/7
- `npx vitest run src/pages/Checkin.test.tsx` ✅ 13/13（广告闸门 + 失败分级 + 接口补签）
- `npx vitest run src/services/nativeBridge.rewardAd.contract.test.ts` ✅ 7/7
  （逐字回放 Native 文档的 Android `scene + callbackId` / `code:0 + data.status` 契约；
  确认 `closed / failed / no_fill` 是广告业务 status 而非 invocation error；
  并验证 `{"error":...}` envelope 在真实边界确实产出 `native-cancelled` / `native-permission-denied`）
- 原始 `feat/0928` 落地时的全量测试记录已被后续 `dev` 同步取代；PR #71 的最终
  Build / OpenCode Review 作为当前合并证据，不再沿用旧分支上的历史失败计数。

### 5.1 真实接口联调（7002 实测）

| 用例 | 结果 |
| --- | --- |
| `GET /signrecords/status`（有效 token） | 200 `{signed, consecutive_days, points, reward_desc}` ✅ |
| `GET /signrecords/index` | 200，返回记录数组；含 `status=10` 与 `status=20` ✅ |
| `GET /signactivity/list` | 200，数组含 `max_days=31` / `signed_days` / `is_makeup=1` ✅ |
| `POST /signrecords/add` | 200，状态与 `signed_days` 同步变化 ✅ |
| `POST /signrecords/add` 重复 | 400 `今日已签到` ✅ |
| `POST /signrecords/makeup {day}` | 200 `status=20` ✅ |
| `POST /signrecords/makeup` 今天/未来 | 400 `只能补签今天之前的日期` ✅ |

> 尚未执行：App WebView（H036）+ Native `getLoginToken()` 的完整登录态业务验收。

## 6. 仍然未决（未自行定稿）

- **B-019 月份切换范围**：原型 §6 只画了单月，本页仍不提供月份切换。
- **B-020 补签消耗 / 次数上限 / 不可补签判定**：仍属未确认，当前补签资格沿用「过往漏签即可补」。
- **补签日期回显**：见 §3，需后端确认字段或过滤能力。

## 7. 明确不做

- 未改动 `preview` 的视觉结论；未新增营销区块。
- 未把「会话内乐观点亮」写成「已持久化」。
- 未修改 Native 参考 / legacy 路由。
- 未在 `prod` 以 Mock 兜底。
