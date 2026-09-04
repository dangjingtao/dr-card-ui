import { useLocation, useNavigate } from 'react-router-dom'
import { BottomNavigation } from '../ui'
import { LEGACY_TAB_ITEMS, TAB_ROUTES } from '../../app/router/routes'

// 一级导航配置以 ROUTES 为单一事实源，避免路由、文案与图标分别维护。
const mainItems = TAB_ROUTES.flatMap((route) =>
  route.tab && route.label && route.icon
    ? [{ value: route.path, label: route.label, icon: route.icon, fab: route.tabFab }]
    : [],
)

// 历史首页入口的三项导航同样从注册表派生，不在组件内另写一份配置。
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
