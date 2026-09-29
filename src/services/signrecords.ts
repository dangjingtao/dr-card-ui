import { z } from 'zod'

import { parseApiEnvelope } from './contracts/apiEnvelope'
import { httpClient } from './http'

/**
 * 签到（每日打卡）接口。
 *
 * 契约来源：
 * - `GET /api/signrecords/status`：2026-09-28 首页联调文档。
 * - 其余端点：2026-09-28 对 7002 的实测探针结论（`docs/api/dearseed-api.md` 只有 CRUD 菜单，
 *   未定义响应字段，实测补齐如下真实行为）。
 *
 * 全部端点都需要登录：Authorization 由全局 auth session provider 注入。
 * 未登录（401）时页面按未签到渲染、不弹错；登录重建由 httpClient 的 401 重试与
 * HomeAuthGate 统一处理，本服务不做页面级分支。
 *
 * ⚠️ 2026-09-28 实测未决项（不臆造，仅如实记录）：
 * 1. `signrecords/index` 的记录没有独立的「签到日期」字段，只有 `create_time`；补签记录的
 *    `create_time` 是补签**操作时刻**，不回显被补的那一天。因此月历中「补签落在哪一格」无法
 *    从接口还原，页面只能做会话内乐观更新。已按 TODO 标记，待后端补字段或补过滤能力。
 * 2. `signrecords/index` 实测不接受任何按月份过滤的入参（month/date/day/start_date/sign_date
 *    等 9 个候选名均无效，返回全量列表），故拉取后由前端按本地月份过滤。
 */

/** 今日签到状态 / 今日可得泡泡值。 */
export const SIGN_RECORDS_STATUS_PATH = '/api/signrecords/status'

/** 签到记录列表（真实数据源：每条记录的 create_time + status 即打卡日历依据）。 */
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

/** 活动类型：10=日常签到。 */
export const SIGN_ACTIVITY_TYPE_DAILY = 10

/** 活动状态：10=待使用。 */
export const SIGN_ACTIVITY_STATUS_PENDING = 10

/** 活动状态：20=使用中（正常展示可签到）。 */
export const SIGN_ACTIVITY_STATUS_ACTIVE = 20

/** 活动状态：40=已关闭。 */
export const SIGN_ACTIVITY_STATUS_CLOSED = 40

/** 补签日期入参格式，与后端校验 `^\d{4}-\d{2}-\d{2}$` 一致。 */
const SIGN_MAKEUP_DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/** 只声明首页消费的字段；其余字段原样放行，不把未确认结构写死。 */
const signStatusSchema = z
  .object({
    /** true=今天已签到；false=未签到（此时 consecutive_days/points 为「签到后将达到的值」）。 */
    signed: z.boolean(),
    consecutive_days: z.number(),
    points: z.number(),
    /** 奖励描述，仅未签到时可能有值；已签到时恒为 ""。 */
    reward_desc: z.string().nullish(),
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
 * 签到记录项（实测返回字段）。
 * 仅约束页面真正消费的字段，其余放行，避免后端新增字段即触发契约失败。
 * - `create_time`：记录创建时刻（补签时为补签操作时刻，不是被补日期）；
 * - `status`：10=正常签到 / 20=补签；
 * - `consecutive_days` / `points`：该次签到后的连续天数与获得泡泡值。
 */
const signRecordSchema = z
  .object({
    id: z.number(),
    create_time: z.string(),
    user_id: z.number(),
    points: z.number(),
    consecutive_days: z.number(),
    status: z.number(),
  })
  .passthrough()

export type SignRecord = z.infer<typeof signRecordSchema>

/**
 * 实测 `index` 直接返回记录数组（不是 `{data,current_page,...}` 分页对象），
 * 但为兼容后端未来可能改成分页信封，这里对两种形态都做解析。
 */
const signRecordListSchema = z
  .union([z.array(signRecordSchema), z.object({ data: z.array(signRecordSchema) }).passthrough()])
  .transform((value) => (Array.isArray(value) ? value : value.data))

export type SignRecordList = z.infer<typeof signRecordListSchema>

export interface SignRecordListParams {
  page?: number
  pageSize?: number
}

/** 签到记录列表。实测不接受月份过滤，日期归属由调用方按本地时区判断。 */
export async function fetchSignRecords(params: SignRecordListParams = {}): Promise<SignRecordList> {
  const payload = await httpClient.request<unknown>({
    method: 'GET',
    url: SIGN_RECORDS_INDEX_PATH,
    params: {
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 100,
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
 */
export async function submitMakeup(day: string): Promise<SignRecord> {
  if (!SIGN_MAKEUP_DAY_PATTERN.test(day)) {
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
 * 把签到记录归约为「日期 → 已签/补签」映射，供打卡日历渲染。
 * 日期取 `create_time` 的前 10 位（后端格式 `YYYY-MM-DD HH:mm:ss`），
 * 与本地月份判断同一时区口径，不做 UTC 转换，避免跨日漂移。
 */
export interface SignRecordDayMap {
  /** `YYYY-MM-DD` → 记录；同一天多条时保留最新一条。 */
  get(dateKey: string): SignRecord | undefined
  /** 全部 `YYYY-MM-DD`。 */
  keys(): string[]
}

export function buildSignRecordDayMap(records: SignRecord[]): SignRecordDayMap {
  const map = new Map<string, SignRecord>()

  for (const record of records) {
    const dateKey = record.create_time.slice(0, 10)
    if (!SIGN_MAKEUP_DAY_PATTERN.test(dateKey)) continue

    const existing = map.get(dateKey)
    if (!existing || record.id > existing.id) map.set(dateKey, record)
  }

  return {
    get: (dateKey) => map.get(dateKey),
    keys: () => [...map.keys()],
  }
}
