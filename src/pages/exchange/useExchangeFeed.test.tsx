import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchCompleteExchangeCoupons, filterCompleteCoupons, useExchangeCoupons } from './useExchangeFeed'

const mocks = vi.hoisted(() => ({ fetch: vi.fn() }))
vi.mock('../../services/coupons', async importOriginal => {
  const real = await importOriginal<typeof import('../../services/coupons')>()
  return { ...real, fetchCouponIndex: mocks.fetch }
})

const product = (id: number, category_id: number | string | null) => ({
  id, category_id, name: 'Mock·体验券 ' + id, status: 10, points_number: '200',
  exchanged_nuuur: 0, total_number: 100, short_desc: '测试',
})
const page = (products: ReturnType<typeof product>[], current_page = 1, total = products.length, last_page = 1) => ({
  data: products, current_page, per_page: 100, total, last_page,
})

describe('#124 complete catalog classification and request lifecycle', () => {
  beforeEach(() => mocks.fetch.mockReset())

  it('fetches every page before locally filtering; category_id numeric/string compare identically', async () => {
    mocks.fetch.mockResolvedValueOnce(page([product(1, '2')], 1, 2, 2))
      .mockResolvedValueOnce(page([product(3, 3)], 2, 2, 2))
    const all = await fetchCompleteExchangeCoupons()
    expect(all.map(p => p.id)).toEqual([1, 3])
    expect(filterCompleteCoupons(all, '2').map(p => p.id)).toEqual([1])
    expect(filterCompleteCoupons(all, '3').map(p => p.id)).toEqual([3])
    expect(mocks.fetch.mock.calls.map(args => args[0])).toEqual([
      { status: 10, page: 1, pageSize: 100 },
      { status: 10, page: 2, pageSize: 100 },
    ])
    // No unverified category_id query reaches the backend.
    expect(JSON.stringify(mocks.fetch.mock.calls)).not.toContain('category_id')
  })

  it('rejects missing category identity, incomplete pagination and repeated records', async () => {
    expect(() => filterCompleteCoupons([{ id: 2, name: 'sample', desc: '', cost: 0, redeemed: 0, soldOut: false }], '2'))
      .toThrow('缺少分类编号')

    mocks.fetch.mockResolvedValueOnce(page([product(1, 1)], 1, 2, 1))
    await expect(fetchCompleteExchangeCoupons()).rejects.toThrow('不完整')

    mocks.fetch.mockResolvedValueOnce(page([product(1, 1)], 1, 2, 2))
      .mockResolvedValueOnce(page([product(1, 1)], 2, 2, 2))
    await expect(fetchCompleteExchangeCoupons()).rejects.toThrow('不完整')
  })

  it('rejects changed pagination and oversized catalogs instead of claiming no coupons', async () => {
    mocks.fetch.mockResolvedValueOnce(page([product(1, 1)], 1, 2, 2))
      .mockResolvedValueOnce(page([product(2, 1)], 2, 3, 2))
    await expect(fetchCompleteExchangeCoupons()).rejects.toThrow('发生变化')
    mocks.fetch.mockResolvedValueOnce(page([product(1, 1)], 1, 9999, 99))
    await expect(fetchCompleteExchangeCoupons()).rejects.toThrow('超过')
  })

  it('ignores an outdated category response after switching tabs', async () => {
    let completeOld: ((x: ReturnType<typeof page>) => void) | undefined
    mocks.fetch.mockImplementationOnce(() => new Promise(resolve => { completeOld = resolve }))
      .mockResolvedValueOnce(page([product(2, 2), product(3, 3)]))
    const hook = renderHook(({ cat }) => useExchangeCoupons(cat), { initialProps: { cat: '2' } })
    hook.rerender({ cat: '3' })
    await waitFor(() => {
      expect(hook.result.current.remote).toMatchObject({ state: 'success', data: [{ id: 3 }] })
    })
    await act(async () => { completeOld?.(page([product(1, 2)])) })
    expect(hook.result.current.remote).toMatchObject({ state: 'success', data: [{ id: 3 }] })
    hook.unmount()
  })
})
