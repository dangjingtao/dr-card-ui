import { useLocation, useNavigate } from 'react-router-dom'
import { BottomNavigation } from '../ui'
import { TAB_ROUTES } from '../../app/router/routes'

// 一级导航配置以 ROUTES 为单一事实源，避免路由、文案与图标分别维护。
const items = TAB_ROUTES.flatMap((route) =>
  route.tab && route.label && route.icon
    ? [{ value: route.path, label: route.label, icon: route.icon, fab: route.tabFab }]
    : [],
)

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  // 子路径（如 /card/verify）仍高亮所属一级 Tab
  const active =
    items.find((item) =>
      item.value === '/' ? location.pathname === '/' : location.pathname.startsWith(item.value),
    )?.value ?? '/'

  return (
    <BottomNavigation
      items={items}
      value={active}
      onChange={(value) => navigate(value)}
      className="relative z-40 mx-auto w-full max-w-[480px] shrink-0"
    />
  )
}
