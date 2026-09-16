import { useMemo } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import type { RouteMeta, RouteState } from '../router/routes'
import { runtimePolicy } from '../config/runtime'

const RUNTIME_OVERLAY_STATE_KEY = '__drCardOverlay'

export type FixtureQueryKey = 'state' | 'overlay' | 'debug'
export type FixtureQueryPatch = Partial<Record<FixtureQueryKey, string | null>>

function asLocationState(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

function applyFixturePatch(params: URLSearchParams, patch: FixtureQueryPatch) {
  for (const [key, value] of Object.entries(patch) as Array<[FixtureQueryKey, string | null | undefined]>) {
    if (value == null) params.delete(key)
    else params.set(key, value)
  }
}

/**
 * Centralized fixture query controls. Formal pages may use this helper for deterministic demo URLs;
 * test/prod/API mode always observes these protected query keys as disabled.
 */
export function useFixtureQueryControls() {
  const [searchParams, setSearchParams] = useSearchParams()

  const get = (key: FixtureQueryKey) =>
    runtimePolicy.fixtureQueriesEnabled ? searchParams.get(key) : null

  const patch = (values: FixtureQueryPatch) => {
    if (!runtimePolicy.fixtureQueriesEnabled) return
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        applyFixturePatch(next, values)
        return next
      },
      { replace: true },
    )
  }

  return {
    enabled: runtimePolicy.fixtureQueriesEnabled,
    get,
    patch,
  }
}

/** `?debug=1` 只在允许 fixture 的环境中生效。 */
export function useFixtureDebug(): boolean {
  const { get } = useFixtureQueryControls()
  return get('debug') === '1'
}

/**
 * 给跨路由验收链接附加受控 fixture 参数。非 fixture 环境只返回原业务 URL，
 * 因此 production 点击不会把 `state/overlay/debug` 写进地址栏。
 */
export function withFixtureQuery(path: string, patch: FixtureQueryPatch): string {
  if (!runtimePolicy.fixtureQueriesEnabled) return path

  const hashIndex = path.indexOf('#')
  const hash = hashIndex >= 0 ? path.slice(hashIndex) : ''
  const beforeHash = hashIndex >= 0 ? path.slice(0, hashIndex) : path
  const queryIndex = beforeHash.indexOf('?')
  const pathname = queryIndex >= 0 ? beforeHash.slice(0, queryIndex) : beforeHash
  const query = queryIndex >= 0 ? beforeHash.slice(queryIndex + 1) : ''
  const params = new URLSearchParams(query)
  applyFixturePatch(params, patch)
  const nextQuery = params.toString()
  return `${pathname}${nextQuery ? `?${nextQuery}` : ''}${hash}`
}

/**
 * 读取当前路由的确定性状态（`?state=`）。
 * 只有 preview/dev Mock 环境允许 URL fixture；test/prod 与 API mode 一律忽略该参数。
 */
export function useFixtureState(route?: RouteMeta): { raw: string | null; state?: RouteState } {
  const { get } = useFixtureQueryControls()
  const raw = get('state')
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
