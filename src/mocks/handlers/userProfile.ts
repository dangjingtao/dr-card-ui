import { http, HttpResponse } from 'msw'

import { USER_PROFILE_DETAIL_PATH } from '../../services/userProfile'
import { USER_PROFILE_DETAIL_MOCK } from '../fixtures/userProfile'

/** Mock 模式下的会员资料读取：与真实服务同一路径、同一信封，页面不做模式分支。 */
export const userProfileHandlers = [
  http.get(`*${USER_PROFILE_DETAIL_PATH}`, () => HttpResponse.json(USER_PROFILE_DETAIL_MOCK)),
]