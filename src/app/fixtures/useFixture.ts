import { useMemo } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import type { RouteMeta, RouteState } from '../router/routes'
import { runtimePolicy } from '../config/runtime'

const RUNTIME_OVERLAY_STATE_KEY = '__drCardOverlay'

function asLocationState(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

/**
 * 读取当前路由的确定性状态（`?state=`）。
 * 只有 preview/dev Mock 环境允许 URL fixture；test/prod 与 API mode 一律忽略该参数。
 */
export function useFixtureState(route?: RouteMeta): { raw: string | null; state?: RouteState } {
  const [searchParams] = useSearchParams()
  const raw = runtimePolicy.fixtureQueriesEnabled ? searchParams.get('state') : null
  const state = useMemo(() => {
    if (!route?.states || raw == null) return undefined
    return route.states.find((item) => item.key === raw)
  }, [route, raw])
  return { raw, state }
}

export interface OverlayControl {
  /** 当前打开的 overlay key；Mock 环境来自 `?overlay=`，API 环境来自 router location state。 */
  overlay: string | null
  open: (key: string) => void
  close: () => void
}

/**
 * 弹层控制器。
 *
 * - preview/dev Mock：继续使用 `?overlay=`，保留可复制 URL、截图与验收能力；
 * - test/prod/API mode：忽略外部 `?overlay=`，用户真实操作改走 router location state，
 *   因此业务弹层仍可正常跨壳层/页面协作，但 query 参数不能伪造业务状态。
 */
export function useOverlay(): OverlayControl {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const locationState = asLocationState(location.state)
  const runtimeOverlay = locationState[RUNTIME_OVERLAY_STATE_KEY]
  const overlay = runtimePolicy.fixtureQueriesEnabled
    ? searchParams.get('overlay')
    : typeof runtimeOverlay === 'string'
      ? runtimeOverlay
      : null

  const open = (key: string) => {
    if (runtimePolicy.fixtureQueriesEnabled) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set('overlay', key)
          return next
        },
        { replace: true },
      )
      return
    }

    navigate(
      {
        pathname: location.pathname,
        search: location.search,
        hash: location.hash,
      },
      {
        replace: true,
        state: {
          ...locationState,
          [RUNTIME_OVERLAY_STATE_KEY]: key,
        },
      },
    )
  }

  const close = () => {
    if (runtimePolicy.fixtureQueriesEnabled) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.delete('overlay')
          return next
        },
        { replace: true },
      )
      return
    }

    const nextState = { ...locationState }
    delete nextState[RUNTIME_OVERLAY_STATE_KEY]
    navigate(
      {
        pathname: location.pathname,
        search: location.search,
        hash: location.hash,
      },
      {
        replace: true,
        state: Object.keys(nextState).length > 0 ? nextState : null,
      },
    )
  }

  return { overlay, open, close }
}
