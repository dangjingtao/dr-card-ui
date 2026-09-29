import { useCallback, useEffect, useState } from 'react'

import { fetchCouponIndex, type CouponTemplate } from '../../services/coupons'
import { fetchUserProfile, type UserProfile } from '../../services/userProfile'

export type RemoteData<T> =
  | { state: 'loading' }
  | { state: 'success'; data: T }
  | { state: 'error'; message: string }

export interface RemoteResult<T> {
  remote: RemoteData<T>
  /** 重新拉取（用于错误重试）。 */
  reload: () => void
}

/**
 * 通用远程数据 hook（mock/api 同路径，页面不做模式分支）。
 * 与 `usePointsFeed` 的同名实现同构：单个接口失败只落在对应区域，不阻塞其它模块。
 */
function useRemoteData<T>(load: () => Promise<T>): RemoteResult<T> {
  const [remote, setRemote] = useState<RemoteData<T>>({ state: 'loading' })
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let active = true
    setRemote({ state: 'loading' })
    void load().then(
      (data) => {
        if (active) setRemote({ state: 'success', data })
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

/** GET /api/user/profile：我的页个人资料（头像 / 昵称 / 等级 / 券数量 / 泡泡值）。 */
export function useProfileFeed(): RemoteResult<UserProfile> {
  return useRemoteData(fetchUserProfile)
}

/**
 * GET /api/coupons/index：我的页「热门体验券」横滑区（券模板，可兑换的券）。
 *
 * 与券页共用同一 service，走 `fetchCouponIndex` 的契约校验口径。
 * 首屏只取第 1 页，「查看更多」跳券页承接完整分页。
 */
export function useProfileCoupons(): RemoteResult<CouponTemplate[]> {
  return useRemoteData(useCallback(async () => (await fetchCouponIndex()).data, []))
}
