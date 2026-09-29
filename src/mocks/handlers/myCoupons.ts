import { http, HttpResponse } from 'msw'

import {
  MY_COUPONS_PAGE_SIZE_DEFAULT,
  MY_COUPONS_PAGE_SIZE_MAX,
  MY_COUPONS_PATH,
  type MyCouponType,
} from '../../services/myCoupons'
import { MY_COUPONS_RECORDS_MOCK } from '../fixtures/myCoupons'

const VALID_TYPES: MyCouponType[] = ['unused', 'used', 'out_of_date']

function toPositiveInt(value: unknown, fallback: number) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 1) return fallback
  return Math.floor(parsed)
}

export const myCouponsHandlers = [
  http.post(`*${MY_COUPONS_PATH}`, async ({ request }) => {
    const body: unknown = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return HttpResponse.json({ code: 403, msg: '参数错误', status: 'fail', data: [] })
    }

    const raw = body as { type?: unknown; page?: unknown; pageSize?: unknown }
    if (typeof raw.type !== 'string' || !VALID_TYPES.includes(raw.type as MyCouponType)) {
      return HttpResponse.json({ code: 403, msg: '参数错误', status: 'fail', data: [] })
    }

    const type = raw.type as MyCouponType
    const page = toPositiveInt(raw.page, 1)
    const pageSize = Math.min(
      toPositiveInt(raw.pageSize, MY_COUPONS_PAGE_SIZE_DEFAULT),
      MY_COUPONS_PAGE_SIZE_MAX,
    )
    const records = MY_COUPONS_RECORDS_MOCK[type]
    const start = (page - 1) * pageSize
    const data = records.slice(start, start + pageSize)

    return HttpResponse.json({
      code: 0,
      msg: 'success',
      status: 'succ',
      data: {
        data,
        current_page: page,
        per_page: pageSize,
        total: records.length,
        last_page: Math.max(1, Math.ceil(records.length / pageSize)),
      },
    })
  }),
]
