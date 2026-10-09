import { z } from 'zod'

import { parseApiEnvelope } from './contracts/apiEnvelope'
import { httpClient } from './http'

/**
 * 签到（每日打卡）接口。
 *
 * 契约来源：客户端《签到页面接口文档》（最新版），逐字段对齐。
 * - `GET /api/signrecords/status`：今天签到状态及可得泡泡值（day/month/year 为当前业务日，已签到/未签到都返回）。
 * - `POST /api/signrecords/add`：今天签到（空 body，日期由服务端按北京时间确定）。
 * - `POST /api/signrecords/makeup`：补签指定日期（body `{ day: 'YYYY-MM-DD' }`）。
 * - `GET /api/signrecords/index?range=month`：本月签到记录（裸数组）。
 * 另保留 `GET /api/signactivity/list`（泡泡任务区签到进度，契约属 points 页文档）。
 *
 * 全部端点都需要登录：Authorization 由全局 auth session provider 注入。
 * 未登录（401）时页面按未签到渲染、不弹错；登录重建由 httpClient 的 401 重试与
 * HomeAuthGate 统一处理，本服务不做页面级分支。
 *
 * 补签前必须先看完 Native 激励广告（`showRewardAd`），只有完成状态才发起本请求。
 *
 * 日期归属口径（`index` 实测）：`data` 是**整月**的裸数组；每条记录的**业务日历日**
 * 由 `year` / `month` / `day` 承载，日历格一律按它归属。
 * `create_time` / `update_time` / `delete_time` 是数据库自带字段（创建/更新/删除时间，
 * 可能是操作时刻，例如今天补签 9-20 时 `create_time` 是今天而非 9-20），**不是业务字段**，
 * 不参与日历归属；缺 `year`/`month`/`day` 的记录无法定位业务日，直接跳过。
 * 页面仍额外做会话内乐观点亮，以在接口刷新返回前即时反馈。
 */

/** 今日签到状态 / 今日可得泡泡值。 */
export const SIGN_RECORDS_STATUS_PATH = '/api/signrecords/status'

/** 签到记录列表。`range=month` 取本月，`week` 取本周；不传时后端默认 month。 */
export const SIGN_RECORDS_INDEX_PATH = '/api/signrecords/index'

/** 执行签到（空 body 即签到当天；重复签到由后端返回 400「今日已签到」）。 */
export const SIGN_RECORDS_ADD_PATH = '/api/signrecords/add'

/** 执行补签（body `{ day: 'YYYY-MM-DD' }`，仅允许今天之前的日期）。 */
export const SIGN_RECORDS_MAKEUP_PATH = '/api/signrecords/makeup'

/** 签到活动列表（最大签到天数 / 已签到天数 / 是否允许补签）。 */
export const SIGN_ACTIVITY_LIST_PATH = '/api/signactivity/list'

/** 记录状态：10=正常签到。 */
export const SIGN_RECORD_STATUS_SIGNED = 10

/** 记录状态：20=补签。 */
export const SIGN_RECORD_STATUS_MAKEUP = 20

/** 记录列表时间范围：本月。 */
export const SIGN_RECORDS_RANGE_MONTH = 'month'

/** 记录列表时间范围：本周。 */
export const SIGN_RECORDS_RANGE_WEEK = 'week'

export type SignRecordsRange = typeof SIGN_RECORDS_RANGE_MONTH | typeof SIGN_RECORDS_RANGE_WEEK

/** 活动类型：10=日常签到。 */
export const SIGN_ACTIVITY_TYPE_DAILY = 10

/** 活动状态：10=待使用。 */
export const SIGN_ACTIVITY_STATUS_PENDING = 10

/** 活动状态：20=使用中（正常展示可签到）。 */
export const SIGN_ACTIVITY_STATUS_ACTIVE = 20

/** 活动状态：40=已关闭。 */
export const SIGN_ACTIVITY_STATUS_CLOSED = 40

/** 补签日期入参格式，与后端校验 `^\d{4}-\d{2}-\d{2}$` 一致。 */
const SIGN_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/**
 * 今日签到状态。
 * `day` / `month` / `year` 是**当前业务日历日**（北京时间），**已签到与未签到都会返回**
 * （2026-09-29 以真实响应校准）；契约仍用 `.nullish()` 容错。
 * 页面月份仍以本地系统时间为准，不从这三个字段反推日历。
 */
const signStatusSchema = z
  .object({
    /** true=今天已签到；false=未签到（此时 consecutive_days/points 为「签到后将达到的值」）。 */
    signed: z.boolean(),
    consecutive_days: z.number(),
    points: z.number(),
    /** 奖励描述，仅未签到时可能有值；已签到时恒为 ""。 */
    reward_desc: z.string().nullish(),
    /** 当前日，格式 DD（已签到与未签到都返回；契约容错可缺省）。 */
    day: z.string().nullish(),
    /** 当前月，格式 MM（已签到与未签到都返回；契约容错可缺省）。 */
    month: z.string().nullish(),
    /** 当前年，格式 YYYY（已签到与未签到都返回；契约容错可缺省）。 */
    year: z.string().nullish(),
  })
  .passthrough()

export type SignStatus = z.infer<typeof signStatusSchema>

export async function fetchSignStatus(): Promise<SignStatus> {
  const payload = await httpClient.request<unknown>({
    method: 'GET',
    url: SIGN_RECORDS_STATUS_PATH,
  })

  return parseApiEnvelope(payload, signStatusSchema, {
    contract: 'home.sign-status',
    fallbackMessage: '签到状态获取失败',
  })
}

/**
 * 签到记录项（`GET /api/signrecords/index` 实测字段）。
 * 仅约束页面真正消费的字段，其余放行，避免后端新增字段即触发契约失败。
 * - `year` / `month` / `day`：记录所属**业务日历日**（如 `"2026"` / `"09"` / `"29"`），
 *   是日历格归属的**唯一**来源；
 * - `create_time` / `update_time` / `delete_time`：数据库自带字段（创建/更新/删除时间），
 *   **不是业务字段**，不参与日历归属，仅按契约放行（`add` / `makeup` 响应可能缺省，
 *   且实测 `create_time` 为**秒级时间戳 number**，故与 `delete_time` 一样按联合类型容错）；
 * - `status`：10=正常签到 / 20=补签；
 * - `consecutive_days` / `points`：该次签到后的连续天数与获得泡泡值（补签固定 0）。
 */
const signRecordSchema = z
  .object({
    id: z.number(),
    /**
     * 数据库创建时间（审计字段），非业务日期。
     * 7002 实测真实响应是**秒级时间戳 number**（如 1790006400）；部分环境可能返回
     * 字符串或省略，故按联合类型容错，与 `delete_time` 口径一致。该字段不参与日历归属。
     */
    create_time: z.union([z.number(), z.string(), z.null()]).nullish(),
    user_id: z.number(),
    points: z.number(),
    consecutive_days: z.number(),
    status: z.number(),
    /** 业务日；格式 DD，例如 "29"。 */
    day: z.string().nullish(),
    /** 业务月；格式 MM。 */
    month: z.string().nullish(),
    /** 业务年；格式 YYYY。 */
    year: z.string().nullish(),
    reward_desc: z.string().nullish(),
    delete_time: z.union([z.number(), z.string(), z.null()]).nullish(),
  })
  .passthrough()

export type SignRecord = z.infer<typeof signRecordSchema>

/**
 * 文档口径 `index` 直接返回记录数组（不是 `{data,current_page,...}` 分页对象），
 * 但为兼容后端未来可能改成分页信封，这里对两种形态都做解析。
 */
const signRecordListSchema = z
  .union([z.array(signRecordSchema), z.object({ data: z.array(signRecordSchema) }).passthrough()])
  .transform((value) => (Array.isArray(value) ? value : value.data))

export type SignRecordList = z.infer<typeof signRecordListSchema>

export interface SignRecordListParams {
  /** 时间范围：`month`=本月，`week`=本周；不传由后端默认 month。签到页固定传 month。 */
  range?: SignRecordsRange
}

/** 本月 / 本周签到记录。文档口径 `data` 为裸数组，按 create_time 倒序。 */
export async function fetchSignRecords(params: SignRecordListParams = {}): Promise<SignRecordList> {
  const payload = await httpClient.request<unknown>({
    method: 'GET',
    url: SIGN_RECORDS_INDEX_PATH,
    params: {
      range: params.range ?? SIGN_RECORDS_RANGE_MONTH,
    },
  })

  return parseApiEnvelope(payload, signRecordListSchema, {
    contract: 'checkin.records',
    fallbackMessage: '签到记录获取失败',
  })
}

/** 签到当天。重复签到后端返回 400「今日已签到」，由 envelope 解析抛业务错误。 */
export async function submitSignIn(): Promise<SignRecord> {
  const payload = await httpClient.request<unknown>({
    method: 'POST',
    url: SIGN_RECORDS_ADD_PATH,
    data: {},
  })

  return parseApiEnvelope(payload, signRecordSchema, {
    contract: 'checkin.sign-in',
    fallbackMessage: '签到失败',
  })
}

/**
 * 补签指定日期。仅允许今天之前的日期（后端 400「只能补签今天之前的日期」）。
 * `day` 必须是 `YYYY-MM-DD`，本地校验先于网络，避免把格式错误打成 500。
 *
 * 调用前必须先通过 Native 激励广告闸门。
 */
export async function submitMakeup(day: string): Promise<SignRecord> {
  if (!SIGN_DATE_PATTERN.test(day)) {
    throw new Error('补签日期格式需为 YYYY-MM-DD')
  }

  const payload = await httpClient.request<unknown>({
    method: 'POST',
    url: SIGN_RECORDS_MAKEUP_PATH,
    data: { day },
  })

  return parseApiEnvelope(payload, signRecordSchema, {
    contract: 'checkin.makeup',
    fallbackMessage: '补签失败',
  })
}

/**
 * 签到活动项。契约来源：2026-09-28《泡泡值（积分）页面接口接入文档》第 3 节。
 * 该接口同时是「泡泡任务」区签到类任务（每日打卡 / 连续签到）的数据源：
 * 任务卡标题取 `title`，进度 `current / target` 取 `signed_days / max_days`。
 *
 * 只约束页面真正消费的字段，其余 `.passthrough()` 放行，避免后端新增字段即触发契约失败。
 */
const signActivitySchema = z
  .object({
    id: z.number(),
    title: z.string(),
    /** 活动类型：10=日常签到，20=节日签到，30=限时签到。 */
    type: z.number(),
    /** 活动封面图完整 URL；可能为 null，前端用本地兜底图。 */
    image: z.string().nullish(),
    /** 是否允许补签：0=否，1=是（为 1 时才展示补签入口）。 */
    is_makeup: z.number(),
    /** 状态：10=待使用，20=使用中，40=已关闭。 */
    status: z.number(),
    /** 后台排序值；接口已按 sort_number 升序、再按 id 升序排好。 */
    sort_number: z.number(),
    /** 最大签到天数（进度条总长度）；无奖励档位时为 0。 */
    max_days: z.number(),
    /** 当前用户已签到的连续天数（进度条当前值）；从没签过为 0。 */
    signed_days: z.number(),
  })
  .passthrough()

export type SignActivity = z.infer<typeof signActivitySchema>

/** 签到活动列表。`data` 为数组。 */
export async function fetchSignActivities(): Promise<SignActivity[]> {
  const payload = await httpClient.request<unknown>({
    method: 'GET',
    url: SIGN_ACTIVITY_LIST_PATH,
  })

  return parseApiEnvelope(payload, z.array(signActivitySchema), {
    contract: 'checkin.activities',
    fallbackMessage: '签到活动获取失败',
  })
}

/**
 * 把签到记录归约为「日期 → 已签」映射，供打卡日历渲染。
 *
 * 归属口径（`index` 实测）：业务日历日只认 `year` / `month` / `day`，按它们拼出的
 * `YYYY-MM-DD` 归属；缺日期字段的记录直接跳过。
 * `create_time` / `update_time` / `delete_time` 是数据库自带审计字段（操作时刻），
 * **不是业务字段**，不参与归属。
 * （页面另以 `optimisticMakeupDays` 在接口刷新返回前做会话内即时点亮，二者互补。）
 *
 * 日期串与本地月份判断同一时区口径，不做 UTC 转换，避免跨日漂移。
 */
export interface SignRecordDayMap {
  /** `YYYY-MM-DD` → 记录；同一天多条时保留最新一条。 */
  get(dateKey: string): SignRecord | undefined
  /** 全部 `YYYY-MM-DD`。 */
  keys(): string[]
}

/** 把一位/两位数字补成两位；非纯数字返回 null。 */
function toPaddedDayPart(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null
  const text = `${value}`.trim()
  return /^\d{1,2}$/.test(text) ? text.padStart(2, '0') : null
}

/**
 * 解析记录所属业务日期键 `YYYY-MM-DD`：**只**用业务字段 `year` / `month` / `day`。
 * 缺失或非法时返回 null（该记录不进日历，绝不用 `create_time` 等审计字段猜业务日）。
 */
function resolveSignRecordDateKey(record: SignRecord): string | null {
  const year = `${record.year ?? ''}`.trim()
  const month = toPaddedDayPart(record.month)
  const day = toPaddedDayPart(record.day)

  if (!/^\d{4}$/.test(year) || !month || !day) return null

  const key = `${year}-${month}-${day}`
  return SIGN_DATE_PATTERN.test(key) ? key : null
}

export function buildSignRecordDayMap(records: SignRecord[]): SignRecordDayMap {
  const map = new Map<string, SignRecord>()

  for (const record of records) {
    // 只认正常签到与补签，其余状态不进日历。
    if (record.status !== SIGN_RECORD_STATUS_SIGNED && record.status !== SIGN_RECORD_STATUS_MAKEUP) {
      continue
    }

    const dateKey = resolveSignRecordDateKey(record)
    if (!dateKey) continue

    const existing = map.get(dateKey)
    if (!existing || record.id > existing.id) map.set(dateKey, record)
  }

  return {
    get: (dateKey) => map.get(dateKey),
    keys: () => [...map.keys()],
  }
}
