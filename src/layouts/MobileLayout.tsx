import { useLayoutEffect, useRef } from 'react'
import {
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
  useNavigationType,
  useViewTransitionState,
} from 'react-router-dom'
import { Bell, MessageSquare, Settings } from 'lucide-react'
import BottomNav from '../components/mobile/BottomNav'
import TitleBar from '../components/mobile/TitleBar'
import { findRouteByPathname, isLegacyTabPath } from '../app/router/routes'
import { getRouteScope, isActiveFormalH5Route, isFormalH5TabPath } from '../app/router/routeScope'
import { navigateWithH5ViewTransition } from '../app/router/h5Transition'
import { useNotifications } from '../app/state/notifications'
import { protectedFixtureRedirect, useOverlay } from '../app/fixtures/useFixture'
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
  const navigationType = useNavigationType()
  const nativeTransitionActive = useViewTransitionState(location)
  const previousPathname = useRef(location.pathname)
  const previousPath = previousPathname.current
  const pathnameChanged = previousPath !== location.pathname
  const currentRoute = findRouteByPathname(location.pathname)
  const previousRoute = findRouteByPathname(previousPath)
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

  return (
    <div
      key={location.pathname}
      className="h5-route-frame h-full min-h-full"
      data-h5-route-active={isActiveFormalH5Route(currentRoute) ? 'true' : 'false'}
      data-h5-route-transition={transition}
    >
      <Outlet />
    </div>
  )
}

/**
 * WebView 应用壳层（T004 + H021）
 * - 不模拟手机系统状态栏；顶部只保留 H5 自身的 App 标准业务标题栏
 * - 标题栏固定在页面滚动区之外：44px，高度、返回、居中标题与右侧动作按 App 导航栏结构统一
 * - active formal H5 的标题栏与内容随 WebView 宽度铺满；Native reference/deferred 保留历史预览边界
 * - TabBar 位于壳层底部，自身负责底部安全区，页面不再重复预留
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
  const { unreadCount } = useNotifications()
  const { open: openOverlay } = useOverlay()
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
  const requestedLeadingAction = route?.leadingAction ?? 'auto'
  const leadingAction =
    titleBarMode === 'hidden'
      ? 'none'
      : requestedLeadingAction !== 'auto'
        ? requestedLeadingAction
        : activeFormalH5 && isFormalH5TabPath(location.pathname)
          ? 'close'
          : titleBarMode === 'back'
            ? 'back'
            : 'none'
  const isNotificationsPage = location.pathname === '/notifications'
  const allNotificationsRead = unreadCount === 0

  useLayoutEffect(() => {
    previousShellPathname.current = location.pathname
  }, [location.pathname])

  if (fixtureRedirect) {
    return <Navigate to={fixtureRedirect.to} replace state={fixtureRedirect.state} />
  }

  const navigateShell = (target: string) => {
    const targetRoute = findRouteByPathname(target)
    if (isActiveFormalH5Route(route) && isActiveFormalH5Route(targetRoute)) {
      navigateWithH5ViewTransition(navigate, target)
      return
    }
    navigate(target)
  }

  const openMarkAllRead = () => {
    openOverlay('clear')
  }

  const openWecom = () => {
    navigate(
      {
        pathname: location.pathname,
        search: location.search,
        hash: '#wecom',
      },
      { replace: true, state: location.state },
    )
  }

  const titleAction = isNotificationsPage
    ? (
      <button
        type="button"
        onClick={openMarkAllRead}
        disabled={allNotificationsRead}
        className="min-h-9 whitespace-nowrap rounded-control px-1.5 text-[13px] font-medium text-reward-strong transition active:bg-[rgba(89,55,15,0.06)] disabled:pointer-events-none disabled:text-text-disabled"
      >
        {allNotificationsRead ? '全部已读' : '一键已读'}
      </button>
    )
    : route?.titleBarAction === 'settings'
      ? (
        <button type="button" aria-label="设置" onClick={() => navigateShell('/settings')} className="flex h-9 w-9 items-center justify-center rounded-full text-text-primary active:bg-[rgba(89,55,15,0.06)]">
          <Settings className="h-[22px] w-[22px]" />
        </button>
      )
      : route?.titleBarAction === 'notifications'
        ? (
          <button type="button" aria-label="通知" onClick={() => navigateShell('/notifications')} className="flex h-9 w-9 items-center justify-center rounded-full text-text-primary active:bg-[rgba(89,55,15,0.06)]">
            <Bell className="h-[22px] w-[22px]" />
          </button>
        )
        : location.pathname === '/service/chat'
          ? (
            /* T013R5+R6：「企微客服」pill 回到壳层 TitleBar 右侧（与「< 智能客服」同右侧）；
              * H016：hash 只表示当前页弹层状态，使用 replace 避免新增历史项和触发页面级滚动/过渡。
              * T013R6：pill 不限制宽度、whitespace-nowrap，保证「企微客服」四个字自然横向不被换行或裁剪。 */
            <button
              type="button"
              data-chat-wecom-entry
              onClick={openWecom}
              className="inline-flex min-h-9 items-center gap-1 whitespace-nowrap rounded-pill bg-surface px-3 text-[13px] font-medium text-text-brand shadow-sm active:bg-surface-selected"
            >
              <MessageSquare className="h-3.5 w-3.5" aria-hidden />
              企微客服
            </button>
          )
          : undefined

  return (
    <div className="app-background flex h-dvh flex-col overflow-hidden pt-[env(safe-area-inset-top)] text-text-primary">
      {/* T013R7：min-w-0 防止 TitleBar 第三列 action 被撑大撑出页面右侧 */}
      <div className="min-w-0 shrink-0">
        {titleBarMode !== 'hidden' && (
          <TitleBar
            title={title}
            leadingAction={leadingAction}
            onBack={route?.backTo ? () => navigateShell(route.backTo as string) : undefined}
            action={titleAction}
            actionWide={isNotificationsPage || location.pathname === '/service/chat'}
            fullWidth={activeFormalH5}
          />
        )}
      </div>
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
