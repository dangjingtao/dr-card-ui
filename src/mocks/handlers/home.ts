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
 * 券列表 Mock 按请求参数做服务端过滤（与真实 7002 语义一致）：
 * - `status`：只返回该状态的券（不传则全量）；
 * - `category_id`：只返回该分类的券（不传则全量）。
 *
 * 页面切分类 Tab 时会带 `category_id` 重新请求，这里必须真的过滤，
 * 否则 Mock 会掩盖前端的分类逻辑错误。
 */
export function filterCouponList(url: URL) {
  const statusParam = url.searchParams.get('status')
  const categoryParam = url.searchParams.get('category_id')

  const list = COUPON_LIST_MOCK.data.data.filter((coupon) => {
    const statusMatched = statusParam === null || String(coupon.status) === statusParam
    const categoryMatched = categoryParam === null || String(coupon.category_id) === categoryParam
    return statusMatched && categoryMatched
  })

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
