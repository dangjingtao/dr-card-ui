import { http, HttpResponse } from 'msw'

import { BANNERS_INDEX_PATH } from '../../services/banners'
import { COUPON_LIST_PATH } from '../../services/coupons'
import { SETTINGS_DETAIL_PATH } from '../../services/settings'
import {
  BRAND_CULTURE_SETTING_MOCK,
  COUPON_LIST_MOCK,
  HOME_BANNERS_MOCK,
  WELFARE_SETTING_MOCK,
} from '../fixtures/home'

/**
 * 券列表 Mock 只模拟当前已确认的 status 过滤。
 * category_id / 服务端分类能力仍待后端确认，因此 Mock 不实现也不暗示该契约。
 */
export function filterCouponList(url: URL) {
  const statusParam = url.searchParams.get('status')

  const list = COUPON_LIST_MOCK.data.data.filter(
    (coupon) => statusParam === null || String(coupon.status) === statusParam,
  )

  return {
    ...COUPON_LIST_MOCK,
    data: { ...COUPON_LIST_MOCK.data, data: list, total: list.length },
  }
}

/**
 * Mock 模式下的首页接口：与真实服务同一路径、同一信封，页面不做模式分支。
 * 签到状态 `/api/signrecords/status` 由 checkinHandlers 统一承载（含签到后的状态变化），
 * 这里不再重复注册，避免两个 handler 争抢同一路径。
 */
export const homeHandlers = [
  http.get(`*${BANNERS_INDEX_PATH}`, () => HttpResponse.json(HOME_BANNERS_MOCK)),
  http.get(`*${SETTINGS_DETAIL_PATH}`, ({ request }) => {
    const key = new URL(request.url).searchParams.get('key')
    if (key === 'brand_culture_setting') return HttpResponse.json(BRAND_CULTURE_SETTING_MOCK)
    if (key === 'welfare') return HttpResponse.json(WELFARE_SETTING_MOCK)
    return HttpResponse.json({ code: 500, message: '"配置标题" is required', data: [] })
  }),
  http.get(`*${COUPON_LIST_PATH}`, ({ request }) =>
    HttpResponse.json(filterCouponList(new URL(request.url))),
  ),
]
