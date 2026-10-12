import { http, HttpResponse } from 'msw'

import { EXCHANGE_REDEEM_PATH } from '../../services/exchange'

async function readCouponId(request: Request) {
  const body: unknown = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') return null
  const id = (body as { id?: unknown }).id
  return typeof id === 'number' && Number.isInteger(id) && id > 0 ? id : null
}

export const exchangeHandlers = [
  http.post(`*${EXCHANGE_REDEEM_PATH}`, async ({ request }) => {
    const couponId = await readCouponId(request)
    if (couponId === null) {
      return HttpResponse.json({
        code: 500,
        message: '"优惠券ID" is required',
        data: [],
      })
    }

    // Preview/dev mock intentionally uses the exact production endpoint and envelope.
    // It only simulates the confirmed contract; it does not claim a real deduction/issue.
    return HttpResponse.json({
      code: 0,
      msg: 'success',
      status: 'succ',
      data: {
        coupon_id: couponId,
        points: 1080,
      },
    })
  }),
]
