import { useCallback, useEffect, useRef, useState } from 'react'

import {
  fetchSignActivities,
  type SignActivity,
} from '../../services/signrecords'
import {
  fetchUserPointsList,
  fetchUserPointsStat,
  type UserPointsPage,
  type UserPointsRecord,
  type UserPointsStat,
} from '../../services/userpoints'

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
 * 与首页 useHomeFeed 同构：单个接口失败只落在对应区域，不阻塞其它模块。
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

/** GET /api/userpoints/stat：当前用户泡泡值可用 / 累计收入 / 累计消耗。 */
export function useUserPointsStat(): RemoteResult<UserPointsStat> {
  return useRemoteData(fetchUserPointsStat)
}

/**
 * GET /api/signactivity/list：签到活动（最大天数 / 已签到天数）。
 *
 * 「泡泡任务」区签到类任务（每日打卡 / 连续签到）的数据源：标题取 `title`，
 * 进度取 `signed_days / max_days`。与签到页共用同一 service，不另做 mock/api 分支。
 */
export function useSignActivityList(): RemoteResult<SignActivity[]> {
  return useRemoteData(fetchSignActivities)
}

export interface UserPointsListQuery {
  /** 不传=全部；10=收入；20=消费。 */
  type?: number
  pageSize?: number
}

export interface UserPointsListResult {
  remote: RemoteData<UserPointsPage>
  /** 已累计到第几页（>1 时说明前面几页已追加在 records 里）。 */
  loadedPage: number
  /** 当前筛选下「加载更多」是否可用（已到末页则为 false）。 */
  canLoadMore: boolean
  /** 仅表示追加页请求中；首屏数据继续保留渲染。 */
  loadingMore: boolean
  /** 追加页失败只在列表下方反馈，不把已加载列表替换成整页错误态。 */
  loadMoreError: string | null
  /** 请求下一页；在当前筛选下追加，不整表替换。 */
  loadMore: () => void
  /** 强制重新加载（错误重试）；从第 1 页重新开始。 */
  reload: () => void
}

/**
 * GET /api/userpoints/index：泡泡值明细列表。
 *
 * 「加载更多」是**追加**语义：翻到第 2 页时保留第 1 页数据一起展示，而不是整表替换。
 * 切换 type（Tab）或重新加载时回到第 1 页并清空已累计数据。
 * 页面不做 mock/api 分支，全部走同一 service。
 */
export function useUserPointsList(query: UserPointsListQuery): UserPointsListResult {
  const { type, pageSize } = query
  const [remote, setRemote] = useState<RemoteData<UserPointsPage>>({ state: 'loading' })
  const [records, setRecords] = useState<UserPointsRecord[]>([])
  const [loadedPage, setLoadedPage] = useState(0)
  const [lastPage, setLastPage] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)
  const requestVersionRef = useRef(0)

  // 首屏 / Tab 切换 / 手动重载：从第 1 页重新建立列表。
  useEffect(() => {
    const requestVersion = ++requestVersionRef.current
    let active = true

    setRemote({ state: 'loading' })
    setRecords([])
    setLoadedPage(0)
    setLastPage(1)
    setLoadingMore(false)
    setLoadMoreError(null)

    void fetchUserPointsList({ type, page: 1, pageSize }).then(
      (data) => {
        if (!active || requestVersion !== requestVersionRef.current) return
        setRecords(data.data)
        setLoadedPage(data.current_page)
        setLastPage(data.last_page)
        setRemote({ state: 'success', data })
      },
      (error: unknown) => {
        if (!active || requestVersion !== requestVersionRef.current) return
        setRemote({
          state: 'error',
          message: error instanceof Error ? error.message : '网络请求失败',
        })
      },
    )

    return () => {
      active = false
    }
  }, [type, pageSize, reloadToken])

  // 追加页独立于首屏 remote 状态：请求中/失败时都保留已加载 records。
  const loadMore = useCallback(() => {
    if (remote.state !== 'success' || loadingMore || loadedPage >= lastPage) return

    const nextPage = loadedPage + 1
    const requestVersion = requestVersionRef.current
    setLoadingMore(true)
    setLoadMoreError(null)

    void fetchUserPointsList({ type, page: nextPage, pageSize }).then(
      (data) => {
        if (requestVersion !== requestVersionRef.current) return
        setRecords((prev) => [...prev, ...data.data])
        setLoadedPage(data.current_page)
        setLastPage(data.last_page)
        setLoadingMore(false)
      },
      (error: unknown) => {
        if (requestVersion !== requestVersionRef.current) return
        setLoadMoreError(error instanceof Error ? error.message : '网络请求失败')
        setLoadingMore(false)
      },
    )
  }, [lastPage, loadedPage, loadingMore, pageSize, remote.state, type])

  const reload = useCallback(() => setReloadToken((value) => value + 1), [])

  const merged: RemoteData<UserPointsPage> =
    remote.state === 'success'
      ? {
          state: 'success',
          data: {
            ...remote.data,
            data: records,
            current_page: loadedPage || remote.data.current_page,
            last_page: lastPage,
          },
        }
      : remote

  return {
    remote: merged,
    loadedPage,
    canLoadMore: remote.state === 'success' && loadedPage < lastPage,
    loadingMore,
    loadMoreError,
    loadMore,
    reload,
  }
}
