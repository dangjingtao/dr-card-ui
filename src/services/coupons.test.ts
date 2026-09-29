import { beforeEach, describe, expect, it, vi } from 'vitest'

import { COUPON_PAGE_SIZE_DEFAULT, fetchCouponIndex } from './coupons'

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
