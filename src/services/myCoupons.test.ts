import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  fetchMyCoupons,
  MY_COUPONS_PAGE_SIZE_MAX,
  MY_COUPONS_PATH,
} from './myCoupons'

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
}))

vi.mock('./http', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./http')>()
  return { ...actual, httpClient: { request: mocks.request } }
})

describe('MyCoupons contract', () => {
  beforeEach(() => {
    mocks.request.mockReset()
  })

  it('posts type / page / pageSize and preserves user-held coupon fields', async () => {
    mocks.request.mockResolvedValue({
      code: 0,
      msg: 'success',
      status: 'succ',
      data: {
        data: [
          {
            id: 1001,
            active_name: '新人体验活动',
            get_amount: '10.00',
            used_amount: 0,
            enable_amount: '10.00',
            valid_date_range: '2026-09-29 ~ 2026-10-29',
            dc_type: 10,
            dc_type_format: '满减券',
          },
        ],
        current_page: 2,
        per_page: 15,
        total: 21,
        last_page: 2,
      },
    })

    const page = await fetchMyCoupons({ type: 'unused', page: 2, pageSize: 15 })

    expect(mocks.request).toHaveBeenCalledWith({
      method: 'POST',
      url: MY_COUPONS_PATH,
      data: { type: 'unused', page: 2, pageSize: 15 },
    })
    expect(page.data[0]).toEqual(expect.objectContaining({
      id: 1001,
      active_name: '新人体验活动',
      get_amount: '10.00',
      used_amount: 0,
      enable_amount: '10.00',
      valid_date_range: '2026-09-29 ~ 2026-10-29',
      dc_type: 10,
      dc_type_format: '满减券',
    }))
    expect(page.total).toBe(21)
  })

  it.each(['unused', 'used', 'out_of_date'] as const)('supports the documented %s category', async (type) => {
    mocks.request.mockResolvedValue({
      code: 0,
      msg: 'success',
      data: { data: [], current_page: 1, per_page: 15, total: 0, last_page: 1 },
    })

    await fetchMyCoupons({ type })

    expect(mocks.request).toHaveBeenCalledWith({
      method: 'POST',
      url: MY_COUPONS_PATH,
      data: { type, page: 1, pageSize: 15 },
    })
  })

  it('accepts numeric or string amount and dc_type fields', async () => {
    mocks.request.mockResolvedValue({
      code: 0,
      msg: 'success',
      data: {
        data: [
          {
            id: 2,
            active_name: '数字字段',
            get_amount: 20,
            used_amount: '5.00',
            enable_amount: 15,
            valid_date_range: '2026-09-01 ~ 2026-09-30',
            dc_type: '10',
            dc_type_format: '满减券',
          },
        ],
        current_page: 1,
        per_page: 15,
        total: 1,
        last_page: 1,
      },
    })

    await expect(fetchMyCoupons({ type: 'used' })).resolves.toMatchObject({
      data: [{ get_amount: 20, used_amount: '5.00', enable_amount: 15, dc_type: '10' }],
    })
  })

  it('keeps empty-list pagination metadata', async () => {
    mocks.request.mockResolvedValue({
      code: 0,
      msg: 'success',
      data: { data: [], current_page: 1, per_page: 15, total: 0, last_page: 1 },
    })

    await expect(fetchMyCoupons({ type: 'out_of_date' })).resolves.toEqual({
      data: [],
      current_page: 1,
      per_page: 15,
      total: 0,
      last_page: 1,
    })
  })

  it('caps pageSize at the documented maximum', async () => {
    mocks.request.mockResolvedValue({
      code: 0,
      msg: 'success',
      data: { data: [], current_page: 1, per_page: MY_COUPONS_PAGE_SIZE_MAX, total: 0, last_page: 1 },
    })

    await fetchMyCoupons({ type: 'unused', pageSize: 999 })

    expect(mocks.request).toHaveBeenCalledWith({
      method: 'POST',
      url: MY_COUPONS_PATH,
      data: { type: 'unused', page: 1, pageSize: MY_COUPONS_PAGE_SIZE_MAX },
    })
  })

  it('surfaces non-zero business responses through the shared error model', async () => {
    mocks.request.mockResolvedValue({
      code: 403,
      message: '参数错误',
      data: [],
    })

    await expect(fetchMyCoupons({ type: 'unused' })).rejects.toMatchObject({
      kind: 'business',
      message: '参数错误',
    })
  })
})
