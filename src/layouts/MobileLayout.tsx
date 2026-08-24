import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Bell, Settings } from 'lucide-react'
import BottomNav from '../components/mobile/BottomNav'
import StatusBar from '../components/mobile/StatusBar'
import TitleBar from '../components/mobile/TitleBar'
import { findRouteByPathname, isTabPath } from '../app/router/routes'

/**
 * 移动应用壳层（T004）
 * - 顶部安全区与原型状态栏统一在壳层渲染（index.html 已 viewport-fit=cover）
 * - 页面只有一个纵向滚动区；状态栏、标题栏、TabBar 不参与页面滚动
 * - TabBar 位于壳层底部，自身负责底部安全区，页面不再重复预留
 * - 二级页不显示底部导航，避免遮挡输入区/弹层
 */
export default function MobileLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const showNav = isTabPath(location.pathname)
  const route = findRouteByPathname(location.pathname)
  const titleBarMode = route?.titleBar ?? 'back'
  const fallbackTitle = location.pathname === '/tokens' ? '品牌 Token 展示' : '页面不存在'
  const title = route?.titleBarTitle ?? route?.title ?? fallbackTitle
  const titleAction = route?.titleBarAction === 'settings'
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
      : undefined

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background pt-[env(safe-area-inset-top)] text-text-primary">
      <div className="shrink-0">
        <StatusBar />
        {titleBarMode !== 'hidden' && <TitleBar title={title} back={titleBarMode === 'back'} action={titleAction} />}
      </div>
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain" data-page-scroll>
        <Outlet />
      </div>
      {showNav && <BottomNav />}
    </div>
  )
}
