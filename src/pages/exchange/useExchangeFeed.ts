import { useCallback, useEffect, useState } from 'react'

import {
  COUPON_PAGE_SIZE_MAX,
  COUPON_STATUS_ON_SHELF,
  fetchCouponIndex,
  toCouponRedeemView,
  type CouponRedeemView,
} from '../../services/coupons'

export type RemoteData<T> =
  | { state: 'loading' }
  | { state: 'success'; data: T }
  | { state: 'error'; message: string }

export interface ExchangeCouponsResult {
  remote: RemoteData<CouponRedeemView[]>
  /** 重新拉取（用于错误重试）。 */
  reload: () => void
}

/**
 * GET /api/coupons/index：洗护体验券专区列表。
 *
 * 与我的页「热门体验券」共用同一 service，差别只在本页：
 * - 只取上架券（`status=10`）；
 * - 切换分类 Tab 时带 `category_id` 重新请求（服务端过滤，非前端本地分组）；
 * - 首屏一次取满 `COUPON_PAGE_SIZE_MAX`，专区不做分页（后续如券量增长再接分页）。
 *
 * 页面不做 mock/api 分支：mock 模式下由 MSW 拦截同一路径返回同一信封。
 */
export function useExchangeCoupons(categoryId?: number): ExchangeCouponsResult {
  const [remote, setRemote] = useState<RemoteData<CouponRedeemView[]>>({ state: 'loading' })
  const [reloadToken, setReloadToken] = useState(0)

  const load = useCallback(
    () =>
      fetchCouponIndex({
        status: COUPON_STATUS_ON_SHELF,
        categoryId,
        pageSize: COUPON_PAGE_SIZE_MAX,
      }),
    [categoryId],
  )

  useEffect(() => {
    let active = true
    setRemote({ state: 'loading' })
    void load().then(
      (page) => {
        if (active) setRemote({ state: 'success', data: page.data.map(toCouponRedeemView) })
      },
      (error: unknown) => {
        if (active) {
          setRemote({
            state: 'error',
            message: error instanceof Error ? error.message : '网络请求失败',
          })
        }
      },
    )
    return () => {
      active = false
    }
  }, [load, reloadToken])

  const reload = useCallback(() => setReloadToken((value) => value + 1), [])

  return { remote, reload }
}
