import { useEffect, useState } from 'react'

import { fetchHomeBanners, type BannerItem } from '../../services/banners'
import { fetchSignStatus, type SignStatus } from '../../services/signrecords'

export type HomeRemoteData<T> =
  | { state: 'loading' }
  | { state: 'success'; data: T }
  | { state: 'error'; message: string }

/**
 * 首页接口数据加载（mock/api 同路径，页面不做模式分支）。
 * 单个接口失败只落在对应区域的降级展示上，不阻塞其它模块。
 */
function useRemoteData<T>(load: () => Promise<T>): HomeRemoteData<T> {
  const [remote, setRemote] = useState<HomeRemoteData<T>>({ state: 'loading' })

  useEffect(() => {
    let active = true
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
  }, [load])

  return remote
}

export function useHomeBanners(): HomeRemoteData<BannerItem[]> {
  return useRemoteData(fetchHomeBanners)
}

export function useSignStatus(): HomeRemoteData<SignStatus> {
  return useRemoteData(fetchSignStatus)
}

export function useHomeSettings(): HomeRemoteData<HomeSettings> {
  return useRemoteData(fetchHomeSettings)
}