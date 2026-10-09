import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fetchCouponCategoryPage, fetchCouponCategorySelect, fetchCouponCategoryDetail,
  fetchRootCouponCategories, normalizeCategoryId,
  COUPON_CATEGORY_INDEX_PATH, COUPON_CATEGORY_SELECT_PATH,
} from './couponCategories'

const mocks = vi.hoisted(() => ({ request: vi.fn() }))
vi.mock('./http', async importOriginal => {
  const actual = await importOriginal<typeof import('./http')>()
  return { ...actual, httpClient: { request: mocks.request } }
})

const category = (id: number, sort: number, pid = 0) => ({
  id, name: '分类' + id, sort, pid, create_time: '2026-10-09 10:00:00',
})
const paged = (rows: ReturnType<typeof category>[], current_page = 1, total = rows.length, last_page = 1) =>
  ({ code: 0, data: { data: rows, current_page, per_page: 100, total, last_page } })

describe('#124 backend coupon category read contract', () => {
  beforeEach(() => mocks.request.mockReset())

  it('reads root categories with backend-defined ordering, without writes', async () => {
    mocks.request.mockResolvedValueOnce(paged([category(2, 10)]))
    await expect(fetchCouponCategoryPage()).resolves.toMatchObject({ total: 1 })
    expect(mocks.request).toHaveBeenCalledWith({
      method: 'GET', url: COUPON_CATEGORY_INDEX_PATH,
      params: { pid: 0, page: 1, pageSize: 100, 'orderBy[sort]': 'DESC' },
    })
  })

  it('normalizes mixed numeric and string identifiers without partial parse', () => {
    expect(normalizeCategoryId(12)).toBe('12')
    expect(normalizeCategoryId('012')).toBeUndefined()
    expect(normalizeCategoryId('12')).toBe('12')
    expect(normalizeCategoryId(0)).toBeUndefined()
    expect(normalizeCategoryId('12abc')).toBeUndefined()
  })

  it('reads select options but never trusts select pagination total', async () => {
    mocks.request.mockResolvedValueOnce({ code: 0, data: {
      data: [{ value: 2, label: 'Mock·体验' }],
      current_page: 1, per_page: 100, total: 1, last_page: 1,
    } })
    await expect(fetchCouponCategorySelect()).resolves.toEqual([{ key: '2', label: 'Mock·体验' }])
    expect(mocks.request).toHaveBeenCalledWith({ method: 'GET', url: COUPON_CATEGORY_SELECT_PATH })
  })

  it('returns null for nonexistent detail and rejects malformed ids', async () => {
    mocks.request.mockResolvedValue({ code: 0, data: null })
    await expect(fetchCouponCategoryDetail('12')).resolves.toBeNull()
    await expect(fetchCouponCategoryDetail('abc')).rejects.toThrow('分类编号无效')
  })

  it('aggregates every root page then sorts by sort desc / id desc', async () => {
    mocks.request.mockResolvedValueOnce(paged([category(3, 2)], 1, 2, 2))
      .mockResolvedValueOnce(paged([category(2, 90)], 2, 2, 2))
    expect(await fetchRootCouponCategories()).toEqual([
      { key: '2', label: '分类2' },
      { key: '3', label: '分类3' },
    ])
    expect(mocks.request).toHaveBeenCalledTimes(2)
  })

  it('fails closed on unstable/invalid page, missing type and backend errors', async () => {
    mocks.request.mockResolvedValueOnce(paged([category(3, 2)], 1, 2, 2))
      .mockResolvedValueOnce(paged([category(3, 2)], 2, 2, 2))
    await expect(fetchRootCouponCategories()).rejects.toThrow('不完整')
    mocks.request.mockResolvedValueOnce({ code: 500, message: '分类接口不可用', data: [] })
    await expect(fetchRootCouponCategories()).rejects.toThrow('分类接口不可用')
    mocks.request.mockResolvedValueOnce(paged([category(4, 1, 12)]))
    await expect(fetchRootCouponCategories()).rejects.toThrow('不完整')
  })
})
