import { useCallback, useEffect, useState } from 'react'
import { COUPON_PAGE_SIZE_MAX, COUPON_STATUS_ON_SHELF, fetchCouponIndex, toCouponRedeemView, type CouponRedeemView } from '../../services/coupons'
import { fetchRootCouponCategories, normalizeCategoryId, type CouponCategoryOption } from '../../services/couponCategories'

export type RemoteData<T> =
  | { state: 'loading' }
  | { state: 'success'; data: T }
  | { state: 'error'; message: string }

export interface ExchangeCouponsResult {
  remote: RemoteData<CouponRedeemView[]>
  reload: () => void
}
export interface ExchangeCategoriesResult {
  remote: RemoteData<CouponCategoryOption[]>
  reload: () => void
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '网络请求失败'
}

export function useExchangeCategories(): ExchangeCategoriesResult {
  const [remote, setRemote] = useState<RemoteData<CouponCategoryOption[]>>({ state: 'loading' })
  const [version, setVersion] = useState(0)
  useEffect(() => {
    let active = true
    setRemote({ state: 'loading' })
    void fetchRootCouponCategories().then(
      data => { if (active) setRemote({ state: 'success', data }) },
      error => { if (active) setRemote({ state: 'error', message: errorMessage(error) }) },
    )
    return () => { active = false }
  }, [version])
  const reload = useCallback(() => setVersion(value => value + 1), [])
  return { remote, reload }
}

/**
 * Backend CouponsIndex DTO only allows page/pageSize, NOT category_id.
 * Safely filter only after fetching and validating EVERY coupon page.
 * A truncated/unstable catalog is an explicit error, never a deceptive empty category.
 */
export async function fetchCompleteExchangeCoupons(): Promise<CouponRedeemView[]> {
  const first = await fetchCouponIndex({ status: COUPON_STATUS_ON_SHELF, page: 1, pageSize: COUPON_PAGE_SIZE_MAX })
  const maxPages = 20
  if (first.current_page !== 1 || first.last_page > maxPages || first.last_page < 1) {
    throw new Error('体验券数量超过当前可完整筛选范围，请联系管理员')
  }
  const rows = [...first.data]
  for (let page = 2; page <= first.last_page; page++) {
    const next = await fetchCouponIndex({ status: COUPON_STATUS_ON_SHELF, page, pageSize: COUPON_PAGE_SIZE_MAX })
    if (next.current_page !== page || next.total !== first.total || next.last_page !== first.last_page) {
      throw new Error('体验券列表发生变化，请重试')
    }
    rows.push(...next.data)
  }
  if (rows.length !== first.total || new Set(rows.map(item => item.id)).size !== first.total) {
    throw new Error('体验券列表不完整，暂不能按分类展示')
  }
  return rows.map(toCouponRedeemView)
}

export function filterCompleteCoupons(coupons: CouponRedeemView[], categoryId: string | undefined): CouponRedeemView[] {
  if (!categoryId) return coupons
  const normalized = normalizeCategoryId(categoryId)
  if (!normalized) throw new Error('体验券分类编号无效')
  if (coupons.some(coupon => !normalizeCategoryId(coupon.categoryId))) {
    throw new Error('后台券列表缺少分类编号，暂不能准确筛选')
  }
  return coupons.filter(coupon => normalizeCategoryId(coupon.categoryId) === normalized)
}

/** Category switches always discard stale responses; no one-page local filtering. */
export function useExchangeCoupons(categoryId?: string, enabled = true): ExchangeCouponsResult {
  const [reloadToken, setReloadToken] = useState(0)
  const key = `${categoryId ?? 'all'}:${enabled ? 'ready' : 'blocked'}:${reloadToken}`
  const [current, setCurrent] = useState<{ key: string; remote: RemoteData<CouponRedeemView[]> }>({
    key, remote: { state: 'loading' },
  })

  useEffect(() => {
    let active = true
    setCurrent({ key, remote: { state: 'loading' } })
    if (enabled) {
      void fetchCompleteExchangeCoupons().then(
        coupons => {
          if (!active) return
          try {
            setCurrent({ key, remote: { state: 'success', data: filterCompleteCoupons(coupons, categoryId) } })
          } catch (error) {
            setCurrent({ key, remote: { state: 'error', message: errorMessage(error) } })
          }
        },
        error => { if (active) setCurrent({ key, remote: { state: 'error', message: errorMessage(error) } }) },
      )
    }
    return () => { active = false }
  }, [key, categoryId, enabled])

  const reload = useCallback(() => setReloadToken(value => value + 1), [])
  // A category switch must never render the previous category's successful results for one frame.
  return { remote: current.key === key ? current.remote : { state: 'loading' }, reload }
}
