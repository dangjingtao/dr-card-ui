import { z } from 'zod'

import { getAuthSession } from './auth/session'
import { parseContract } from './contracts/parseContract'
import { createBusinessError, httpClient } from './http'

/**
 * 会员资料读取（正式 H5）。
 *
 * 接口：`GET {VITE_API_BASE_URL}/api/user/detail`（本地联调 7002 已确认路径与信封结构）。
 *
 * 2026-09-24 模拟器联调实测：
 * - 后端鉴权读 `token` 请求头，只带 `Authorization: Bearer <accessToken>` 会 401「请先登录」；
 *   全局 HTTP 鉴权 provider 仍按既有口径附 Bearer，这里补上实测可用的 `token` 头，
 *   待后端确认 Bearer 口径后收口。
 * - 该接口当前对有效登录态只返回 `{"code":200,"message":"用户不存在！"}`，真实出参仍待后端补齐；
 *   因此本服务只映射已由真实用户实体响应确认过的字段（`nick_name`、`grade`），
 *   不臆造生日 / 消费密码等尚未确认的字段。
 */
export const USER_PROFILE_DETAIL_PATH = '/api/user/detail'

const detailEnvelopeSchema = z
  .object({
    code: z.union([z.number(), z.string()]),
    msg: z.string().optional(),
    message: z.string().optional(),
    data: z.unknown(),
  })
  .passthrough()

/** 只声明页面消费到的字段；其余字段原样放行，不把未确认结构写死。 */
const userDetailSchema = z
  .object({
    nick_name: z.string().nullish(),
    grade: z.string().nullish(),
  })
  .passthrough()

export interface UserProfileDetail {
  /** `nick_name`；接口未给时为空串。 */
  nickname: string
  /** `grade` 名称；与资料设置年级芯片同名时可直接回填，接口未给时为空串。 */
  grade: string
}

/** 纯解析：把 7002 的 `{code, msg/message, data}` 信封收成页面可用字段。 */
export function parseUserProfileDetail(payload: unknown): UserProfileDetail {
  const envelope = parseContract(detailEnvelopeSchema, payload, {
    source: 'api',
    contract: 'user.profile-detail',
  })

  // 7002 用 `code: 200` + message 表达「用户不存在」等业务失败，此时 data 为空数组。
  if (!envelope.data || typeof envelope.data !== 'object' || Array.isArray(envelope.data)) {
    throw createBusinessError(envelope.message ?? envelope.msg ?? '会员资料获取失败')
  }

  const detail = parseContract(userDetailSchema, envelope.data, {
    source: 'api',
    contract: 'user.profile-detail-data',
  })

  return {
    nickname: detail.nick_name?.trim() ?? '',
    grade: detail.grade?.trim() ?? '',
  }
}

export async function fetchUserProfileDetail(): Promise<UserProfileDetail> {
  const accessToken = getAuthSession()?.accessToken
  const payload = await httpClient.request<unknown>({
    method: 'GET',
    url: USER_PROFILE_DETAIL_PATH,
    headers: accessToken ? { token: accessToken } : undefined,
  })

  return parseUserProfileDetail(payload)
}