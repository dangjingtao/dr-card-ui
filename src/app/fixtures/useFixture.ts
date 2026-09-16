import { useMemo } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import type { Location, NavigateOptions, To } from 'react-router-dom'
import type { RouteMeta, RouteState } from '../router/routes'
import { runtimePolicy } from '../config/runtime'

const RUNTIME_STATE_KEYS = {
  state: '__drCardFixtureState',
  overlay: '__drCardOverlay',
} as const

export type FixtureQueryKey = 'state' | 'overlay' | 'debug'
export type FixtureQueryPatch = Partial<Record<FixtureQueryKey, string | null>>
export type SearchPatch = Record<string, string | null>

function asLocationState(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

function applySearchPatch(params: URLSearchParams, patch: SearchPatch) {
  for (const [key, value] of Object.entries(patch)) {
    if (value == null) params.delete(key)
    else params.set(key, value)
  }
}

function applyFixtureQueryPatch(params: URLSearchParams, patch: FixtureQueryPatch) {
  applySearchPatch(params, patch as SearchPatch)
}

function applyRuntimeStatePatch(
  current: Record<string, unknown>,
  patch: FixtureQueryPatch,
): Record<string, unknown> {
  const next = { ...current }

  for (const key of ['state', 'overlay'] as const) {
    if (!(key in patch)) continue
    const runtimeKey = RUNTIME_STATE_KEYS[key]
    const value = patch[key]
    if (value == null) delete next[runtimeKey]
    else next[runtimeKey] = value
  }

  // `debug` intentionally has no runtime-state representation outside fixture environments.
  return next
}

export interface ProtectedFixtureRedirect {
  to: To
  state: Record<string, unknown> | null
}

/**
 * H004 shell guard.
 *
 * In test/prod/API mode protected fixture/debug parameters are removed before the page Outlet is
 * rendered. A direct browser entry/reload (`location.key === 'default'`) never inherits their value.
 * For an in-app SPA navigation from older code we temporarily convert state/overlay into router
 * location state so user-triggered prototype interactions keep working until H014 migrates them.
 * Debug is always dropped.
 */
export function protectedFixtureRedirect(location: Location): ProtectedFixtureRedirect | null {
  if (runtimePolicy.fixtureQueriesEnabled) return null

  const params = new URLSearchParams(location.search)
  const state = params.get('state')
  const overlay = params.get('overlay')
  const debug = params.get('debug')
  if (state == null && overlay == null && debug == null) return null

  params.delete('state')
  params.delete('overlay')
  params.delete('debug')

  const directEntry = location.key === 'default'
  const nextState = asLocationState(location.state)
  if (directEntry) {
    delete nextState[RUNTIME_STATE_KEYS.state]
    delete nextState[RUNTIME_STATE_KEYS.overlay]
  } else {
    if (state == null) delete nextState[RUNTIME_STATE_KEYS.state]
    else nextState[RUNTIME_STATE_KEYS.state] = state
    if (overlay == null) delete nextState[RUNTIME_STATE_KEYS.overlay]
    else nextState[RUNTIME_STATE_KEYS.overlay] = overlay

    // Home / Dearseed historically suppress their automatic identity picker when an overlay is the
    // explicit destination. Preserve that in-app behavior without leaving `?overlay=` trustworthy.
    if (overlay != null && (location.pathname === '/' || location.pathname === '/dearseed')) {
      params.set('picker', 'off')
    }
  }

  const query = params.toString()
  return {
    to: {
      pathname: location.pathname,
      search: query ? `?${query}` : '',
      hash: location.hash,
    },
    state: Object.keys(nextState).length > 0 ? nextState : null,
  }
}

/**
 * Centralized protected state controls.
 *
 * - preview/dev Mock: state/overlay/debug are URL-backed deterministic fixture controls.
 * - test/prod/API mode: external protected query keys are ignored. state/overlay written by the
 *   app itself live only in router location state as a temporary compatibility bridge; debug is off.
 *
 * H014 will replace page-local fake business outcomes with service/MSW/API flows. H004 only makes
 * the URL boundary trustworthy without breaking existing user-triggered UI transitions.
 */
export function useFixtureQueryControls() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const locationState = asLocationState(location.state)

  const get = (key: FixtureQueryKey) => {
    if (runtimePolicy.fixtureQueriesEnabled) return searchParams.get(key)
    if (key === 'debug') return null
    const value = locationState[RUNTIME_STATE_KEYS[key]]
    return typeof value === 'string' ? value : null
  }

  const patch = (values: FixtureQueryPatch, searchPatch: SearchPatch = {}) => {
    if (runtimePolicy.fixtureQueriesEnabled) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          applySearchPatch(next, searchPatch)
          applyFixtureQueryPatch(next, values)
          return next
        },
        { replace: true },
      )
      return
    }

    const nextSearch = new URLSearchParams(location.search)
    applySearchPatch(nextSearch, searchPatch)
    const nextState = applyRuntimeStatePatch(locationState, values)
    const query = nextSearch.toString()
    navigate(
      {
        pathname: location.pathname,
        search: query ? `?${query}` : '',
        hash: location.hash,
      },
      {
        replace: true,
        state: Object.keys(nextState).length > 0 ? nextState : null,
      },
    )
  }

  return {
    fixtureUrlEnabled: runtimePolicy.fixtureQueriesEnabled,
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
 * 因此 production 点击不会主动把 `state/overlay/debug` 写进地址栏。
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
  applyFixtureQueryPatch(params, patch)
  const nextQuery = params.toString()
  return `${pathname}${nextQuery ? `?${nextQuery}` : ''}${hash}`
}

/**
 * 跨路由 fixture 导航。Mock 环境把状态编码进 URL；API/test/prod 只把 app 自己触发的
 * state/overlay 放进 destination location state，外部同名 query 仍然无效。
 */
export function useFixtureNavigate() {
  const navigate = useNavigate()

  return (
    path: string,
    patch: FixtureQueryPatch,
    options: NavigateOptions = {},
  ) => {
    if (runtimePolicy.fixtureQueriesEnabled) {
      navigate(withFixtureQuery(path, patch), options)
      return
    }

    const runtimeState = applyRuntimeStatePatch(asLocationState(options.state), patch)
    navigate(path, {
      ...options,
      state: Object.keys(runtimeState).length > 0 ? runtimeState : options.state,
    })
  }
}

/**
 * 读取当前路由的确定性状态（`?state=`）。
 * URL fixture 只在 preview/dev Mock 生效；API/test/prod 仅接受 app 内部 location state。
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
  /** Mock 环境来自 `?overlay=`；API/test/prod 只接受 app 内部 router location state。 */
  overlay: string | null
  open: (key: string, searchPatch?: SearchPatch) => void
  close: () => void
}

/**
 * 弹层控制器。外部 `?overlay=` 在 test/prod/API mode 被忽略，真实点击仍可通过 router state
 * 打开弹层。`open` 的可选 searchPatch 用于需要同时携带普通业务选择参数的交互。
 */
export function useOverlay(): OverlayControl {
  const { get, patch } = useFixtureQueryControls()

  return {
    overlay: get('overlay'),
    open: (key, searchPatch = {}) => patch({ overlay: key }, searchPatch),
    close: () => patch({ overlay: null }),
  }
}
