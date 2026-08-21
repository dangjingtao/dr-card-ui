import { NavLink } from 'react-router-dom';
import { CreditCard, Gift, Home, User } from 'lucide-react';

const items=[['/','首页',Home],['/card','卡包',CreditCard],['/exchange','兑换',Gift],['/profile','我的',User]];
export default function BottomNav(){return <nav className="fixed bottom-0 inset-x-0 h-16 bg-surface border-t border-border flex justify-around items-center">{items.map(([p,t,I])=><NavLink key={p} to={p} className="flex flex-col items-center text-xs"><I size={20}/>{t}</NavLink>)}</nav>}
