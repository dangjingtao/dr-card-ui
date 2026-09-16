import { useLocation, useNavigate } from 'react-router-dom'
import { BottomNavigation } from '../ui'
import { findRouteByPathname, LEGACY_TAB_ITEMS } from '../../app/router/routes'
import { FORMAL_H5_TAB_ROUTES, isActiveFormalH5Route } from '../../app/router/routeScope'
import { navigateWithH5ViewTransition } from '../../app/router/h5Transition'

// 主入口只消费 formal-H5 Tab 路由；Native reference 使用独立 legacy 导航。
const mainItems = FORMAL_H5_TAB_ROUTES.flatMap((route) =>
  route.tab && route.label && route.icon
    ? [{ value: route.path, label: route.label, icon: route.icon, fab: route.tabFab }]
    : [],
)

// 历史首页入口的三项导航继续作为 Native reference 独立存在。
const legacyItems = LEGACY_TAB_ITEMS.map((item) => ({
  value: item.key,
  label: item.label,
  icon: item.icon,
}))

// 只有配置了 to 的项可跳转，其余为纯视觉展示。
const legacyTargets = new Map(
  LEGACY_TAB_ITEMS.flatMap((item) => (item.to ? [[item.key, item.to] as const] : [])),
)

// 反向映射：路径 → Tab key
const pathToLegacyKey = new Map(
  LEGACY_TAB_ITEMS.flatMap((item) => (item.to ? [[item.to, item.key] as const] : [])),
)

export default function BottomNav({ variant = 'main' }: { variant?: 'main' | 'legacy' }) {
  const location = useLocation()
  const navigate = useNavigate()
  const isLegacy = variant === 'legacy'
  const items = isLegacy ? legacyItems : mainItems

  // 主入口：子路径仍高亮所属一级 Tab
  // 历史入口：根据当前路径匹配对应 Tab key
  const active = isLegacy
    ? pathToLegacyKey.get(location.pathname) ?? 'home'
    : (items.find((item) =>
        item.value === '/' ? location.pathname === '/' : location.pathname.startsWith(item.value),
      )?.value ?? '/')

  const handleChange = (value: string) => {
    if (isLegacy) {
      const target = legacyTargets.get(value)
      if (target && target !== location.pathname) navigate(target)
      return
    }

    if (value === location.pathname) return

    const currentRoute = findRouteByPathname(location.pathname)
    const targetRoute = findRouteByPathname(value)
    if (isActiveFormalH5Route(currentRoute) && isActiveFormalH5Route(targetRoute)) {
      navigateWithH5ViewTransition(navigate, value)
      return
    }

    // Deferred formal-H5 routes (currently mall) and Native reference routes keep their old behavior.
    navigate(value)
  }

  return (
    <BottomNavigation
      items={items}
      value={active}
      onChange={handleChange}
      className="relative z-40 mx-auto w-full max-w-[480px] shrink-0"
    />
  )
}
