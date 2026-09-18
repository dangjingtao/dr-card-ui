import { useLayoutEffect, useRef } from 'react'
import {
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
  useNavigationType,
  useViewTransitionState,
} from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import BottomNav from '../components/mobile/BottomNav'
import TitleBar from '../components/mobile/TitleBar'
import { findRouteByPathname, isLegacyTabPath } from '../app/router/routes'
import { getRouteScope, isActiveFormalH5Route, isFormalH5TabPath } from '../app/router/routeScope'
import { navigateWithH5ViewTransition } from '../app/router/h5Transition'
import { protectedFixtureRedirect } from '../app/fixtures/useFixture'
import H5ScrollRestoration from '../components/mobile/H5ScrollRestoration'

type H5RouteTransitionKind = 'none' | 'tab' | 'forward' | 'back'

/**
 * H016 route-motion boundary.
 *
 * - Only active formal-H5 pathname changes animate; search/hash/fixture state changes stay in-page.
 * - Browser POP is treated as back navigation.
 * - Entering a first-level tab fades only; deeper routes get a very small forward/back displacement.
 * - Native reference and deferred formal-H5 routes never opt into this boundary.
 */
function H5RouteOutlet() {
  const location = useLocation()
  const navigate = useNavigate()
  const navigationType = useNavigationType()
  const nativeTransitionActive = useViewTransitionState(location)
  const previousPathname = useRef(location.pathname)
  const previousPath = previousPathname.current
  const pathnameChanged = previousPath !== location.pathname
  const currentRoute = findRouteByPathname(location.pathname)
  const previousRoute = findRouteByPathname(previousPath)
  const activeFormalH5 = isActiveFormalH5Route(currentRoute)
  const titleBarMode = currentRoute?.titleBar ?? 'back'
  const showPageBack =
    activeFormalH5 && !isFormalH5TabPath(location.pathname) && titleBarMode === 'back'
  const activeTransition =
    pathnameChanged &&
    isActiveFormalH5Route(previousRoute) &&
    isActiveFormalH5Route(currentRoute)

  let navigationKind: H5RouteTransitionKind = 'none'
  if (activeTransition) {
    if (navigationType === 'POP') {
      navigationKind = 'back'
    } else if (isFormalH5TabPath(location.pathname)) {
      navigationKind = 'tab'
    } else {
      navigationKind = 'forward'
    }
  }

  // React Router can automatically run a native View Transition on browser POP/Forward after a
  // transition-enabled navigation. Trust the router's live state rather than a timer/DOM marker so
  // the CSS fallback never double-animates with that native transition.
  const transition: H5RouteTransitionKind = nativeTransitionActive ? 'none' : navigationKind

  useLayoutEffect(() => {
    previousPathname.current = location.pathname
  }, [location.pathname])

  useLayoutEffect(() => {
    const root = document.documentElement
    if (nativeTransitionActive && navigationKind !== 'none') {
      root.dataset.h5NativeTransition = navigationKind
    } else {
      delete root.dataset.h5NativeTransition
    }

    return () => {
      if (root.dataset.h5NativeTransition === navigationKind) {
        delete root.dataset.h5NativeTransition
      }
    }
  }, [nativeTransitionActive, navigationKind])

  const handlePageBack = () => {
    if (currentRoute?.backTo) {
      navigateWithH5ViewTransition(navigate, currentRoute.backTo)
      return
    }
    navigate(-1)
  }

  return (
    <div
      key={location.pathname}
      className={`h5-route-frame relative h-full min-h-full ${showPageBack ? 'pt-11' : ''}`}
      data-h5-route-active={activeFormalH5 ? 'true' : 'false'}
      data-h5-route-transition={transition}
    >
      {showPageBack && (
        <button
          type="button"
          data-h5-back
          aria-label="返回"
          onClick={handlePageBack}
          className="absolute left-2 top-1 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-surface/90 text-text-primary shadow-sm backdrop-blur-sm active:bg-surface-pressed"
        >
          <ChevronLeft className="h-[22px] w-[22px] stroke-[2.2]" aria-hidden />
        </button>
      )}
      <Outlet />
    </div>
  )
}

/**
 * WebView 页面壳层（T004 + H021）
 * - active formal H5 是 App WebView 内的纯页面：不模拟手机状态栏，也不渲染共享宿主标题栏
 * - 顶部 safe-area 仍保留为 WebView 兼容边界；是否由 Native 进一步接管要等真实宿主协议确认
 * - 页面只有一个纵向滚动区；正式 H5 的业务内容直接从该滚动区开始
 * - TabBar 是 H5 自身业务导航，位于壳层底部并负责底部安全区
 * - 二级页不显示底部导航，避免遮挡输入区/弹层
 * - /legacy-home 为独立入口，使用「首页 / 服务 / 我的」三项导航，与主入口五项 TabBar 并存
 * - H003：正式 H5 壳层不再从 Native reference mock 用户状态推断登录态，也不再把 `/`
 *   重定向到 `/legacy-profile/login`。真实认证 / App 宿主会话协议尚未确认，在协议到位前
 *   保持正式 H5 路由可直接运行，不用 legacy mock 冒充生产认证。
 * - H004：仅 active formal H5 在页面渲染前处理受保护 fixture/debug query。preview/dev Mock
 *   保持 URL 可复现；test/prod/API mode 的外部 state/overlay/debug 会被剥离，旧的 SPA 内部
 *   跳转仅临时转成 router location state。Native reference / deferred 路由不受该策略改写。
 */
export default function MobileLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const previousShellPathname = useRef(location.pathname)
  const scrollSourcePathname = previousShellPathname.current
  const showLegacyNav = isLegacyTabPath(location.pathname)
  const showNav = showLegacyNav || isFormalH5TabPath(location.pathname)
  const route = findRouteByPathname(location.pathname)
  const routeScope = route ? getRouteScope(route) : undefined
  const activeFormalH5 =
    routeScope?.ownership === 'formal-h5' && routeScope.engineeringScope === 'active'
  const fixtureRedirect = activeFormalH5 ? protectedFixtureRedirect(location) : null
  const titleBarMode = route?.titleBar ?? 'back'
  const fallbackTitle = location.pathname === '/tokens' ? '品牌 Token 展示' : '页面不存在'
  const title = route?.titleBarTitle ?? route?.title ?? fallbackTitle

  useLayoutEffect(() => {
    previousShellPathname.current = location.pathname
  }, [location.pathname])

  if (fixtureRedirect) {
    return <Navigate to={fixtureRedirect.to} replace state={fixtureRedirect.state} />
  }

  const navigateShell = (target: string) => {
    navigate(target)
  }

  return (
    <div className="app-background flex h-dvh flex-col overflow-hidden pt-[env(safe-area-inset-top)] text-text-primary">
      {/* H021：active formal H5 不再模拟宿主顶部栏；Native reference / deferred / 工程兜底保持既有壳层。 */}
      {!activeFormalH5 && (
        <div className="min-w-0 shrink-0">
          {titleBarMode !== 'hidden' && (
            <TitleBar
              title={title}
              back={titleBarMode === 'back'}
              onBack={route?.backTo ? () => navigateShell(route.backTo as string) : undefined}
            />
          )}
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain" data-page-scroll>
        {isActiveFormalH5Route(route) && (
          <H5ScrollRestoration previousPathname={scrollSourcePathname} />
        )}
        <H5RouteOutlet />
      </div>
      {showNav && <BottomNav variant={showLegacyNav ? 'legacy' : 'main'} />}
    </div>
  )
}
