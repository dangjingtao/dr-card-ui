import { http, HttpResponse } from 'msw'

import { BANNERS_INDEX_PATH } from '../../services/banners'
import { COUPON_LIST_PATH } from '../../services/coupons'
import { SETTINGS_DETAIL_PATH } from '../../services/settings'
import { SIGN_RECORDS_STATUS_PATH } from '../../services/signrecords'
import { COUPON_LIST_MOCK, HOME_BANNERS_MOCK, HOME_SETTINGS_MOCK, HOME_SIGN_STATUS_MOCK } from '../fixtures/home'

/** Mock 模式下的首页接口：与真实服务同一路径、同一信封，页面不做模式分支。 */
export const homeHandlers = [
  http.get(`*${BANNERS_INDEX_PATH}`, () => HttpResponse.json(HOME_BANNERS_MOCK)),
  http.get(`*${SIGN_RECORDS_STATUS_PATH}`, () => HttpResponse.json(HOME_SIGN_STATUS_MOCK)),
  http.get(`*${SETTINGS_DETAIL_PATH}`, () => HttpResponse.json(HOME_SETTINGS_MOCK)),
  http.get(`*${COUPON_LIST_PATH}`, () => HttpResponse.json(COUPON_LIST_MOCK)),
]