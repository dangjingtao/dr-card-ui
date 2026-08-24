import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { RouteMeta, RouteState } from '../router/routes'

/** 读取当前路由的确定性状态（`?state=`），返回匹配的 RouteState；无匹配返回 undefined */
export function useFixtureState(route?: RouteMeta): { raw: string | null; state?: RouteState } {
  const [searchParams] = useSearchParams()
  const raw = searchParams.get('state')
  const state = useMemo(() => {
    if (!route?.states || raw == null) return undefined
    return route.states.find((item) => item.key === raw)
  }, [route, raw])
  return { raw, state }
}

export interface OverlayControl {
  /** 当前打开的 overlay key（`?overlay=`），无则为 null */
  overlay: string | null
  open: (key: string) => void
  close: () => void
}

/**
 * 可复现弹层控制器：通过 URL `?overlay=` 打开/关闭弹窗或底部弹层。
 * 验收时可直达带参数的 URL 截图，无需手工改源码。
 */
export function useOverlay(): OverlayControl {
  const [searchParams, setSearchParams] = useSearchParams()
  const overlay = searchParams.get('overlay')
  const open = (key: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('overlay', key)
        return next
      },
      { replace: true },
    )
  }
  const close = () => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('overlay')
        return next
      },
      { replace: true },
    )
  }
  return { overlay, open, close }
}
