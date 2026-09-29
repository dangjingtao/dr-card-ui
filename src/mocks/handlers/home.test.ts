import { describe, expect, it } from 'vitest'

import { filterCouponList } from './home'

const url = (query: string) => new URL(`https://mock.local/api/coupons/index${query}`)

describe('coupon list mock filtering', () => {
  it('returns every coupon when no status / category filter is sent', () => {
    const body = filterCouponList(url(''))
    expect(body.data.total).toBe(5)
    expect(body.data.data.length).toBe(5)
  })

  it('filters by category_id so the exchange tabs are exercised honestly', () => {
    const shampoo = filterCouponList(url('?category_id=2'))
    expect(shampoo.data.data.length).toBeGreaterThan(0)
    expect(shampoo.data.data.every((coupon) => String(coupon.category_id) === '2')).toBe(true)

    const scalp = filterCouponList(url('?category_id=4'))
    expect(scalp.data.data.every((coupon) => String(coupon.category_id) === '4')).toBe(true)
  })

  it('applies status and category filters together', () => {
    const onShelf = filterCouponList(url('?status=10&category_id=2'))
    expect(onShelf.data.data.every((coupon) => coupon.status === 10)).toBe(true)
    expect(onShelf.data.data.every((coupon) => String(coupon.category_id) === '2')).toBe(true)
  })

  it('returns an empty page (not an error) for a category with no coupons', () => {
    const body = filterCouponList(url('?category_id=999'))
    expect(body.code).toBe(0)
    expect(body.data.data).toEqual([])
    expect(body.data.total).toBe(0)
  })
})
