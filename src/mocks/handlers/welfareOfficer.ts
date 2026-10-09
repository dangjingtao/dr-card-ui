import { http, HttpResponse } from 'msw'

import { SETTINGS_DETAIL_PATH } from '../../services/settings'
import { WELFARE_OFFICER_SETTINGS_KEY } from '../../services/welfareOfficer'
import { WELFARE_OFFICER_CONFIG_MOCK } from '../fixtures/welfareOfficer'

/**
 * 仅接管 brand_welfare_setting；不拦截 welfare / brand_culture_setting 等旧富文本路由。
 * API 模式不会启用该 MSW handler。
 */
export const welfareOfficerHandlers = [
  http.get(`*${SETTINGS_DETAIL_PATH}`, ({ request }) => {
    const key = new URL(request.url).searchParams.get('key')
    if (key !== WELFARE_OFFICER_SETTINGS_KEY) return
    return HttpResponse.json(WELFARE_OFFICER_CONFIG_MOCK)
  }),
]
