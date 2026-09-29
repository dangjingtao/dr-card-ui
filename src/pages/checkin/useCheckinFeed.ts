import { useCallback, useEffect, useState } from 'react'

import {
  buildSignRecordDayMap,
  fetchSignActivities,
  fetchSignRecords,
  fetchSignStatus,
  submitMakeup as submitMakeupRequest,
  submitSignIn as submitSignInRequest,
  type SignActivity,
  type SignRecord,
  type SignRecordDayMap,
  type SignStatus,
} from '../../services/signrecords'

export type CheckinRemoteData<T> =
  | { state: 'loading' }
  | { state: 'success'; data: T }
  | { state: 'error'; message: string }

export interface CheckinRemoteResult<T> {
  remote: CheckinRemoteData<T>
  reload: () => void
}

function useRemoteData<T>(load: () => Promise<T>): CheckinRemoteResult<T> {
  const [remote, setRemote] = useState<CheckinRemoteData<T>>({ state: 'loading' })
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

/** GET /api/signrecords/status：今日是否已签到 / 连续天数 / 可得泡泡值。 */
export function useSignStatus(): CheckinRemoteResult<SignStatus> {
  return useRemoteData(fetchSignStatus)
}

/** GET /api/signrecords/index：本月签到记录（打卡日历的已签/补签依据）。 */
export function useSignRecords(): CheckinRemoteResult<SignRecord[]> {
  return useRemoteData(fetchSignRecords)
}

/** GET /api/signactivity/list：签到活动（最大天数 / 已签到天数 / 是否允许补签）。 */
export function useSignActivities(): CheckinRemoteResult<SignActivity[]> {
  return useRemoteData(fetchSignActivities)
}

export type CheckinActionKind = 'sign-in' | 'makeup'

export interface CheckinActionsResult {
  /** 正在执行的动作；无则 null。 */
  pending: CheckinActionKind | null
  /** 上一次动作的失败文案；成功后清空。 */
  error: string | null
  /** 上次补签成功的目标日期（`YYYY-MM-DD`），用于月历乐观点亮。 */
  lastMakeupDay: string | null
  /** 执行签到；成功后 resolve true。 */
  signIn: () => Promise<boolean>
  /** 执行补签指定日期；成功后 resolve true。 */
  makeup: (day: string) => Promise<boolean>
  /** 清空动作错误。 */
  dismissError: () => void
}

/**
 * 签到 / 补签动作。走真实 service（`add` / `makeup`），页面不做模式分支。
 *
 * ℹ️ 补签已纳入当前《签到页面接口文档》，走正式 `POST /api/signrecords/makeup`；
 * 调用前必须先通过 Native 激励广告闸门（在宿主页面完成，本 hook 只负责接口调用）。
 *
 * `index` 记录带业务日期字段 `year`/`month`/`day`，接口刷新后能正确归属；
 * 这里额外返回 `lastMakeupDay` 供月历在刷新返回前做**会话内乐观点亮**。
 */
export function useCheckinActions(onSuccess?: (kind: CheckinActionKind, day?: string) => void): CheckinActionsResult {
  const [pending, setPending] = useState<CheckinActionKind | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastMakeupDay, setLastMakeupDay] = useState<string | null>(null)

  const run = useCallback(
    async (kind: CheckinActionKind, day?: string) => {
      if (pending) return false

      setPending(kind)
      setError(null)

      try {
        if (kind === 'sign-in') {
          await submitSignInRequest()
        } else {
          if (!day) throw new Error('缺少补签日期')
          await submitMakeupRequest(day)
          setLastMakeupDay(day)
        }
        onSuccess?.(kind, day)
        return true
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : kind === 'sign-in' ? '签到失败' : '补签失败')
        return false
      } finally {
        setPending(null)
      }
    },
    [onSuccess, pending],
  )

  const signIn = useCallback(() => run('sign-in'), [run])
  const makeup = useCallback((day: string) => run('makeup', day), [run])
  const dismissError = useCallback(() => setError(null), [])

  return { pending, error, lastMakeupDay, signIn, makeup, dismissError }
}

export { buildSignRecordDayMap }
export type { SignRecordDayMap }
