import { z } from 'zod'

import { parseApiEnvelope } from './contracts/apiEnvelope'
import { httpClient } from './http'

/**
 * 泡泡值（积分）接口。契约来源：2026-09-28《泡泡值（积分）页面接口接入文档》。
 *
 * 两个接口都需要登录，只返回当前登录用户自身数据，不传也不接受 user_id。
 * 认证头由全局 auth session provider 注入（`Authorization: Bearer <accessToken>`）；
 * 401 由 httpClient 重试 + 页面 AuthGate 统一处理，本服务不做页面级登录分支。
 *
 * 2026-09-28 对 7002 实测：`Authorization: Bearer <token>` 可用，旧的 `token` 请求头口径已失效，
 * 因此这里只用全局 provider，不再单独附 token 头。
 */

/** GET /api/userpoints/stat —— 泡泡值统计（可用 / 累计收入 / 累计消耗）。 */
export const USER_POINTS_STAT_PATH = '/api/userpoints/stat'

/** GET /api/userpoints/index —— 泡泡值明细列表（全部 / 收入 / 消费）。 */
export const USER_POINTS_INDEX_PATH = '/api/userpoints/index'

/** 流水 type：10=收入（增加）。 */
export const USER_POINTS_TYPE_INCOME = 10

/** 流水 type：20=消费（减少）。 */
export const USER_POINTS_TYPE_EXPENSE = 20

/**
 * 统计口径（前端务必遵守）：
 * - points 取用户表余额，是「当前可用」的唯一口径，禁止用 income - expense 反推；
 * - income / expense 来自流水求和（type=10 / type=20），与 points 是独立口径；
 * - 接口保证三者不为 null / undefined，均可能为 0，因此前端不写判空兜底。
 */
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

/**
 * 明细列表项。只对页面真正消费的字段做强约束，其余字段保留并整体放行，
 * 避免后端新增字段就触发契约失败。
 * - delete_time 恒定 null，保留但不参与渲染；
 * - operator（sign / 未来 exchange）前端不展示；
 * - object_type：task=签到任务（object 为签到活动 ID），order 待兑换功能上线后才会出现。
 */
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
  /** 不传=全部；10=收入；20=消费。 */
  type?: number
  /** 页码，默认 1。 */
  page?: number
  /** 每页条数，默认 15，上限 100。 */
  pageSize?: number
}

/**
 * 泡泡值明细列表。「全部 / 收入 / 消费」三个 Tab 复用同一接口，切换 Tab 只改 type。
 * 排序默认不传（后端按 id DESC，即最新在前），页面不暴露排序控件。
 */
export async function fetchUserPointsList(params: UserPointsListParams = {}): Promise<UserPointsPage> {
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
