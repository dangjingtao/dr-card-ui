import { useLocation, useNavigate } from 'react-router-dom'
import { CreditCard, Gift, Home, User } from 'lucide-react'
import { BottomNavigation } from '../ui'

const items = [
  { value: '/', label: '首页', icon: Home },
  { value: '/card', label: '卡包', icon: CreditCard },
  { value: '/exchange', label: '兑换', icon: Gift },
  { value: '/profile', label: '我的', icon: User },
]

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <BottomNavigation
      items={items}
      value={location.pathname}
      onChange={(value) => navigate(value)}
      className="fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)]"
    />
  )
}
