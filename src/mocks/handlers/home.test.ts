import { describe, expect, it } from 'vitest'

import { filterCouponList } from './home'

const url = (query: string) => new URL(`https://mock.local/api/coupons/index${query}`)

describe('coupon list mock filtering', () => {
  it('returns every coupon when no status filter is sent', () => {
    const body = filterCouponList(url(''))
    expect(body.data.total).toBe(5)
    expect(body.data.data.length).toBe(5)
  })

  it('filters by the confirmed status parameter', () => {
    const onShelf = filterCouponList(url('?status=10'))
    expect(onShelf.data.data.length).toBeGreaterThan(0)
    expect(onShelf.data.data.every((coupon) => coupon.status === 10)).toBe(true)
  })

  it('does not treat category_id as a confirmed mock contract', () => {
    const body = filterCouponList(url('?category_id=999'))
    expect(body.data.total).toBe(5)
    expect(body.data.data.length).toBe(5)
  })
})
