import { z } from 'zod'

import { getAuthSession } from './auth/session'
import { parseApiEnvelope } from './contracts/apiEnvelope'
import { httpClient } from './http'

/**
 * 会员资料读取（正式 H5）。
 *
 * 接口：`GET {VITE_API_BASE_URL}/api/user/detail`（本地联调 7002 已确认路径与信封结构）。
 *
 * 信封协议：2026-09-28 后端统一成功码为 `code: 0`（兼容原生），失败为非 0 code + `message` 字段。
 * 本接口 2026-09-24 实测的 `{"code":200,"message":"用户不存在！"}` 已由后端统一改回 0；
 * 本服务与其它正式接口共用 `parseApiEnvelope`，不保留 200 时代的兼容分支。
 *
 * 2026-09-24 模拟器联调实测：
 * - 后端鉴权读 `token` 请求头，只带 `Authorization: Bearer <accessToken>` 会 401「请先登录」；
 *   全局 HTTP 鉴权 provider 仍按既有口径附 Bearer，这里补上实测可用的 `token` 头，
 *   待后端确认 Bearer 口径后收口。
 */
export const USER_PROFILE_DETAIL_PATH = '/api/user/detail'

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

/** 纯解析：把统一信封的 `data` 收成页面可用字段；非 0 code 取 `message` 抛业务错误。 */
export function parseUserProfileDetail(payload: unknown): UserProfileDetail {
  const detail = parseApiEnvelope(payload, userDetailSchema, {
    contract: 'user.profile-detail',
    fallbackMessage: '会员资料获取失败',
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