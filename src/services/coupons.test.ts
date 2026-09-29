import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  COUPON_PAGE_SIZE_DEFAULT,
  COUPON_STATUS_ON_SHELF,
  fetchCouponIndex,
  toCouponRedeemView,
} from './coupons'

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
}))

vi.mock('./http', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./http')>()
  return { ...actual, httpClient: { request: mocks.request } }
})

const PAGE_DATA = {
  data: [
    {
      id: 1,
      name: 'Mock·洗护体验券',
      short_desc: '限到店核销',
      image: null,
      category_id: '2',
      points_number: '200',
      total_number: 300,
      exchanged_nuuur: 12,
      status: 10,
    },
  ],
  current_page: 1,
  per_page: 15,
  total: 1,
  last_page: 1,
}

describe('coupon index contract', () => {
  beforeEach(() => {
    mocks.request.mockReset()
  })

  it('defaults to page 1 / pageSize 15 and returns the pagination body', async () => {
    mocks.request.mockResolvedValue({ code: 0, msg: 'success', status: 'succ', data: PAGE_DATA })

    const page = await fetchCouponIndex()

    expect(mocks.request).toHaveBeenCalledWith({
      method: 'GET',
      url: '/api/coupons/index',
      params: { category_id: undefined, status: undefined, page: 1, pageSize: COUPON_PAGE_SIZE_DEFAULT },
    })
    expect(page.total).toBe(1)
    expect(page.data[0]).toMatchObject({ id: 1, name: 'Mock·洗护体验券' })
  })

  it('forwards the on-shelf status filter used by redeemable coupon surfaces', async () => {
    mocks.request.mockResolvedValue({ code: 0, msg: 'success', status: 'succ', data: PAGE_DATA })

    await fetchCouponIndex({ status: COUPON_STATUS_ON_SHELF })

    expect(mocks.request).toHaveBeenCalledWith({
      method: 'GET',
      url: '/api/coupons/index',
      params: {
        category_id: undefined,
        status: COUPON_STATUS_ON_SHELF,
        page: 1,
        pageSize: COUPON_PAGE_SIZE_DEFAULT,
      },
    })
  })

  it('tolerates string points_number / category_id from the backend', async () => {
    mocks.request.mockResolvedValue({ code: 0, msg: 'success', data: PAGE_DATA })

    await expect(fetchCouponIndex()).resolves.toMatchObject({ current_page: 1, last_page: 1 })
  })

  it('keeps an empty result as last_page 1 rather than 0', async () => {
    mocks.request.mockResolvedValue({
      code: 0,
      msg: 'success',
      data: { data: [], current_page: 1, per_page: 15, total: 0, last_page: 1 },
    })

    await expect(fetchCouponIndex()).resolves.toMatchObject({ data: [], total: 0, last_page: 1 })
  })

  it('throws a business error on failure so the page can degrade', async () => {
    mocks.request.mockResolvedValue({ code: 401, message: '请先登录', data: [] })

    await expect(fetchCouponIndex()).rejects.toMatchObject({ kind: 'business', message: '请先登录' })
  })
})

describe('toCouponRedeemView', () => {
  const base = {
    id: 7,
    name: 'Mock·洗护体验券',
    short_desc: '洗发 / 护发 / 沐浴体验，限到店核销',
    image: 'https://cdn.example.com/coupon.png',
    category_id: '2',
    points_number: '200',
    total_number: 300,
    exchanged_nuuur: 12,
    status: COUPON_STATUS_ON_SHELF,
  }

  it('maps points_number / exchanged_nuuur into the redeem view', () => {
    expect(toCouponRedeemView(base)).toEqual({
      id: 7,
      name: 'Mock·洗护体验券',
      desc: '洗发 / 护发 / 沐浴体验，限到店核销',
      cost: 200,
      redeemed: 12,
      image: 'https://cdn.example.com/coupon.png',
      soldOut: false,
    })
  })

  it('treats exchanged_nuuur >= total_number as sold out', () => {
    expect(toCouponRedeemView({ ...base, exchanged_nuuur: 300 }).soldOut).toBe(true)
    expect(toCouponRedeemView({ ...base, exchanged_nuuur: 301 }).soldOut).toBe(true)
  })

  it('treats an off-shelf coupon (status !== 10) as sold out', () => {
    expect(toCouponRedeemView({ ...base, status: 20 }).soldOut).toBe(true)
  })

  it('falls back to safe defaults for missing / invalid fields', () => {
    const view = toCouponRedeemView({
      id: 8,
      name: 'Mock·空值券',
      short_desc: null,
      image: '   ',
      points_number: null,
      exchanged_nuuur: null,
      status: COUPON_STATUS_ON_SHELF,
    })

    expect(view).toEqual({
      id: 8,
      name: 'Mock·空值券',
      desc: '',
      cost: 0,
      redeemed: 0,
      image: undefined,
      soldOut: false,
    })
  })

  it('does not mark sold out when total_number is absent', () => {
    expect(toCouponRedeemView({ ...base, total_number: null }).soldOut).toBe(false)
  })
})
