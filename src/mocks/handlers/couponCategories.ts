import { http, HttpResponse } from 'msw'
import {
  COUPON_CATEGORY_INDEX_PATH,
  COUPON_CATEGORY_SELECT_PATH,
  COUPON_CATEGORY_DETAIL_PATH,
} from '../../services/couponCategories'

/** Dev/preview-only sample. One mock root category, not four fictitious real SKUs. */
const category = { id: 1, name: 'Mock·通用体验包', pid: 0, sort: 100, create_time: '2026-10-09 10:00:00' }
const success = (data: unknown) => HttpResponse.json({ code: 0, msg: 'success', status: 'succ', data })

export const couponCategoryHandlers = [
  http.get(`*${COUPON_CATEGORY_INDEX_PATH}`, ({ request }) => {
    const q = new URL(request.url).searchParams
    const page = Math.max(1, Number(q.get('page')) || 1)
    const pageSize = Math.max(1, Math.min(100, Number(q.get('pageSize')) || 15))
    const data = q.get('pid') === '0' || q.get('pid') == null ? [category] : []
    return success({
      data: page === 1 ? data : [], current_page: page, per_page: pageSize,
      total: data.length, last_page: 1,
    })
  }),
  http.get(`*${COUPON_CATEGORY_SELECT_PATH}`, () =>
    success({ data: [{ value: 1, label: category.name }], current_page: 1, per_page: 100, total: 1, last_page: 1 }),
  ),
  http.get(`*${COUPON_CATEGORY_DETAIL_PATH}`, ({ request }) =>
    success(new URL(request.url).searchParams.get('id') === '1' ? category : null),
  ),
]
