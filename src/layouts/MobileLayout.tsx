import { useLayoutEffect, useRef } from 'react'
import { Navigate, Outlet, useLocation, useNavigate, useNavigationType } from 'react-router-dom'
import { Bell, MessageSquare, Settings } from 'lucide-react'
import BottomNav from '../components/mobile/BottomNav'
import StatusBar from '../components/mobile/StatusBar'
import TitleBar from '../components/mobile/TitleBar'
import { findRouteByPathname, isLegacyTabPath } from '../app/router/routes'
import { isActiveFormalH5Route, isFormalH5TabPath } from '../app/router/routeScope'
import { navigateWithH5ViewTransition } from '../app/router/h5Transition'
import { useNotifications } from '../app/state/notifications'
import { protectedFixtureRedirect, useOverlay } from '../app/fixtures/useFixture'
import H5ScrollRestoration from '../components/mobile/H5ScrollRestoration'

type H5RouteTransitionKind = 'none' | 'tab' | 'forward' | 'back'

/**
 * H016 route-motion boundary.
 *
 * - Only active formal-H5 pathname changes animate; search/hash/fixture state changes stay in-page.
 * - POP and an explicit route `backTo` relationship are treated as back navigation.
 * - Entering a first-level tab fades only; deeper routes get a very small forward/back displacement.
 * - Native reference and deferred formal-H5 routes never opt into this boundary.
 */
function H5RouteOutlet() {
  const location = useLocation()
  const navigationType = useNavigationType()
  const previousPathname = useRef(location.pathname)
  const previousPath = previousPathname.current
  const pathnameChanged = previousPath !== location.pathname
  const currentRoute = findRouteByPathname(location.pathname)
  const previousRoute = findRouteByPathname(previousPath)
  const activeTransition =
    pathnameChanged &&
    isActiveFormalH5Route(previousRoute) &&
    isActiveFormalH5Route(currentRoute)

  let transition: H5RouteTransitionKind = 'none'
  if (activeTransition) {
    if (navigationType === 'POP' || previousRoute.backTo === location.pathname) {
      transition = 'back'
    } else if (isFormalH5TabPath(location.pathname)) {
      transition = 'tab'
    } else {
      transition = 'forward'
    }
  }

  useLayoutEffect(() => {
    previousPathname.current = location.pathname
  }, [location.pathname])

  return (
    <div
      key={location.pathname}
      className="h5-route-frame min-h-full"
      data-h5-route-active={isActiveFormalH5Route(currentRoute) ? 'true' : 'false'}
      data-h5-route-transition={transition}
    >
      <Outlet />
    </div>
  )
}

/**
 * 移动应用壳层（T004）
 * - 顶部安全区与原型状态栏统一在壳层渲染（index.html 已 viewport-fit=cover）
 * - 页面只有一个纵向滚动区；状态栏、标题栏、TabBar 不参与页面滚动
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
  const { unreadCount } = useNotifications()
  const { open: openOverlay } = useOverlay()
  const showLegacyNav = isLegacyTabPath(location.pathname)
  const showNav = showLegacyNav || isFormalH5TabPath(location.pathname)
  const route = findRouteByPathname(location.pathname)
  const fixtureRedirect = isActiveFormalH5Route(route) ? protectedFixtureRedirect(location) : null
  const titleBarMode = route?.titleBar ?? 'back'
  const fallbackTitle = location.pathname === '/tokens' ? '品牌 Token 展示' : '页面不存在'
  const title = route?.titleBarTitle ?? route?.title ?? fallbackTitle
  const isNotificationsPage = location.pathname === '/notifications'
  const allNotificationsRead = unreadCount === 0

  if (fixtureRedirect) {
    return <Navigate to={fixtureRedirect.to} replace state={fixtureRedirect.state} />
  }

  const navigateShell = (target: string, kind: 'forward' | 'back') => {
    const targetRoute = findRouteByPathname(target)
    if (isActiveFormalH5Route(route) && isActiveFormalH5Route(targetRoute)) {
      navigateWithH5ViewTransition(navigate, target, kind)
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
        <button type="button" aria-label="设置" onClick={() => navigateShell('/settings', 'forward')} className="flex h-9 w-9 items-center justify-center rounded-full text-text-primary active:bg-[rgba(89,55,15,0.06)]">
          <Settings className="h-[22px] w-[22px]" />
        </button>
      )
      : route?.titleBarAction === 'notifications'
        ? (
          <button type="button" aria-label="通知" onClick={() => navigateShell('/notifications', 'forward')} className="flex h-9 w-9 items-center justify-center rounded-full text-text-primary active:bg-[rgba(89,55,15,0.06)]">
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
        <StatusBar />
        {titleBarMode !== 'hidden' && (
          <TitleBar
            title={title}
            back={titleBarMode === 'back'}
            onBack={route?.backTo ? () => navigateShell(route.backTo as string, 'back') : undefined}
            action={titleAction}
            actionWide={isNotificationsPage || location.pathname === '/service/chat'}
          />
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain" data-page-scroll>
        {isActiveFormalH5Route(route) && <H5ScrollRestoration />}
        <H5RouteOutlet />
      </div>
      {showNav && <BottomNav variant={showLegacyNav ? 'legacy' : 'main'} />}
    </div>
  )
}
