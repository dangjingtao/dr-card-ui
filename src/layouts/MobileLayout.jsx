import { Outlet } from 'react-router-dom';
import BottomNav from '../components/mobile/BottomNav';

export default function MobileLayout() {
  return <div className="min-h-screen bg-bg text-text pb-20"><Outlet /><BottomNav /></div>;
}
