import { useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Bell, MessageSquare, Settings } from 'lucide-react'
import BottomNav from '../components/mobile/BottomNav'
import StatusBar from '../components/mobile/StatusBar'
import TitleBar from '../components/mobile/TitleBar'
import { findRouteByPathname, isLegacyTabPath, isTabPath } from '../app/router/routes'
import { useNotifications } from '../app/state/notifications'
import { useUserInfo } from '../pages/legacy/userInfoStore'

/**
 * 移动应用壳层（T004）
 * - 顶部安全区与原型状态栏统一在壳层渲染（index.html 已 viewport-fit=cover）
 * - 页面只有一个纵向滚动区；状态栏、标题栏、TabBar 不参与页面滚动
 * - TabBar 位于壳层底部，自身负责底部安全区，页面不再重复预留
 * - 二级页不显示底部导航，避免遮挡输入区/弹层
 * - /legacy-home 为独立入口，使用「首页 / 服务 / 我的」三项导航，与主入口五项 TabBar 并存
 * - T037（2026-09-07 用户决定）：冷启动进入 `/` 且未登录时，自动重定向到登录页
 *   `/legacy-profile/login`；已登录（账号已写入 userInfoStore 且 isRegistered=true）
 *   则正常渲染诗得丽专栏首页。
 */
export default function MobileLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { unreadCount } = useNotifications()
  const userInfo = useUserInfo()
  const showLegacyNav = isLegacyTabPath(location.pathname)
  const showNav = showLegacyNav || isTabPath(location.pathname)
  const route = findRouteByPathname(location.pathname)
  const titleBarMode = route?.titleBar ?? 'back'
  const fallbackTitle = location.pathname === '/tokens' ? '品牌 Token 展示' : '页面不存在'
  const title = route?.titleBarTitle ?? route?.title ?? fallbackTitle
  const isNotificationsPage = location.pathname === '/notifications'
  const allNotificationsRead = unreadCount === 0

  /* T037：未登录访问根路由时引导到登录页；登录后（account 非空且 isRegistered=true）放行 */
  const isLoggedIn = Boolean(userInfo.account) && userInfo.isRegistered
  useEffect(() => {
    if (location.pathname === '/' && !isLoggedIn) {
      navigate('/legacy-profile/login', { replace: true })
    }
  }, [location.pathname, isLoggedIn, navigate])

  const openMarkAllRead = () => {
    const params = new URLSearchParams(location.search)
    params.set('overlay', 'clear')
    navigate({ pathname: location.pathname, search: params.toString() })
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
        <button type="button" aria-label="设置" onClick={() => navigate('/settings')} className="flex h-9 w-9 items-center justify-center rounded-full text-text-primary active:bg-[rgba(89,55,15,0.06)]">
          <Settings className="h-[22px] w-[22px]" />
        </button>
      )
      : route?.titleBarAction === 'notifications'
        ? (
          <button type="button" aria-label="通知" onClick={() => navigate('/notifications')} className="flex h-9 w-9 items-center justify-center rounded-full text-text-primary active:bg-[rgba(89,55,15,0.06)]">
            <Bell className="h-[22px] w-[22px]" />
          </button>
        )
        : location.pathname === '/service/chat'
          ? (
            /* T013R5+R6：「企微客服」pill 回到壳层 TitleBar 右侧（与「< 智能客服」同右侧）；
              * 点击通过 location.hash = '#wecom' 通知 ServiceChat 弹企微二维码，
              * 不需要新增全局 store。T013R6：pill 不限制宽度、whitespace-nowrap
              * 保证「企微客服」四个字自然横向不被换行或裁剪。 */
            <button
              type="button"
              data-chat-wecom-entry
              onClick={() => navigate('/service/chat#wecom')}
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
            action={titleAction}
            actionWide={isNotificationsPage}
          />
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain" data-page-scroll>
        <Outlet />
      </div>
      {showNav && <BottomNav variant={showLegacyNav ? 'legacy' : 'main'} />}
    </div>
  )
}
