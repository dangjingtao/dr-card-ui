import { Outlet } from 'react-router-dom'
import BottomNav from '../components/mobile/BottomNav'

export default function MobileLayout() {
  return (
    <div className="min-h-dvh bg-background pb-[calc(4rem+env(safe-area-inset-bottom))] text-text-primary">
      <Outlet />
      <BottomNav />
    </div>
  )
}
