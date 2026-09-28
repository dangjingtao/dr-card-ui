import { z } from 'zod'

import { parseApiEnvelope } from './contracts/apiEnvelope'
import { httpClient } from './http'

/**
 * 今日签到状态 / 今日可得泡泡值（契约来源：2026-09-28 首页联调文档）。
 * `GET /api/signrecords/status`，需登录：Authorization 由全局 auth session provider 注入。
 *
 * 未登录（401）时页面按未签到渲染、不弹错；登录重建由 httpClient 的 401 重试与
 * HomeAuthGate 统一处理，本服务不做页面级分支。
 */
export const SIGN_RECORDS_STATUS_PATH = '/api/signrecords/status'

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