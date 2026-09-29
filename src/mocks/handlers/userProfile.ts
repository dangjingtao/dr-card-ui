import { http, HttpResponse } from 'msw'

import {
  USER_PROFILE_DETAIL_PATH,
  USER_PROFILE_PATH,
  USER_UPDATE_PATH,
} from '../../services/userProfile'
import {
  USER_PROFILE_DETAIL_MOCK,
  USER_PROFILE_MOCK,
  USER_UPDATE_MOCK,
} from '../fixtures/userProfile'

/**
 * Mock 模式下的会员资料：与真实服务同一路径、同一信封，页面不做模式分支。
 *
 * - `GET /api/user/detail`  —— 资料设置页（历史端点）；
 * - `GET /api/user/profile` —— 我的页（等级 / 券数量 / 泡泡值 / 地区）；
 * - `POST /api/user/update` —— 修改资料，只回显文档示例的成功响应，不做真实持久化。
 */
export const userProfileHandlers = [
  http.get(`*${USER_PROFILE_DETAIL_PATH}`, () => HttpResponse.json(USER_PROFILE_DETAIL_MOCK)),

  http.get(`*${USER_PROFILE_PATH}`, () => HttpResponse.json(USER_PROFILE_MOCK)),

  http.post(`*${USER_UPDATE_PATH}`, () => HttpResponse.json(USER_UPDATE_MOCK)),
]
