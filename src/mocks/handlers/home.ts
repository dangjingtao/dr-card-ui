import { http, HttpResponse } from 'msw'

import { BANNERS_INDEX_PATH } from '../../services/banners'
import { COUPON_LIST_PATH } from '../../services/coupons'
import { SETTINGS_DETAIL_PATH } from '../../services/settings'
import { COUPON_LIST_MOCK, HOME_BANNERS_MOCK, HOME_SETTINGS_MOCK } from '../fixtures/home'

/**
 * Mock 模式下的首页接口：与真实服务同一路径、同一信封，页面不做模式分支。
 * 签到状态 `/api/signrecords/status` 由 checkinHandlers 统一承载（含签到后的状态变化），
 * 这里不再重复注册，避免两个 handler 争抢同一路径。
 */
export const homeHandlers = [
  http.get(`*${BANNERS_INDEX_PATH}`, () => HttpResponse.json(HOME_BANNERS_MOCK)),
  http.get(`*${SETTINGS_DETAIL_PATH}`, () => HttpResponse.json(HOME_SETTINGS_MOCK)),
  http.get(`*${COUPON_LIST_PATH}`, () => HttpResponse.json(COUPON_LIST_MOCK)),
]