import { useNavigate } from 'react-router-dom'
import {
  Settings,
  Pencil,
  ClipboardList,
  CreditCard,
  Smartphone,
  CalendarCheck,
  Ban,
  Receipt,
  Phone,
  Heart,
  Wrench,
} from 'lucide-react'

/* ---- Fixture ---- */
const USER_INFO = {
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=weixin',
  nickname: '微信用户',
  account: 'K011079469',
}

const ORDER_ENTRIES = [
  { key: 'all', label: '全部', icon: ClipboardList, bg: 'from-[#FF9A6B] to-[#FFB37B]' },
  { key: 'pending', label: '待支付', icon: CreditCard, bg: 'from-[#FFB347] to-[#FFCC66]' },
  { key: 'paid', label: '已支付', icon: Smartphone, bg: 'from-[#A78BFA] to-[#C4B5FD]' },
  { key: 'completed', label: '已完成', icon: CalendarCheck, bg: 'from-[#818CF8] to-[#A5B4FC]' },
  { key: 'cancelled', label: '已取消', icon: Ban, bg: 'from-[#F87171] to-[#FCA5A5]' },
]

const QUICK_ENTRIES = [
  { key: 'receipt', label: '我的小票', icon: Receipt, bg: 'from-[#F472B6] to-[#F9A8D4]' },
  { key: 'frequent', label: '常用设备', icon: Phone, bg: 'from-[#5EEAD4] to-[#99F6E4]' },
  { key: 'favorite', label: '收藏设备', icon: Heart, bg: 'from-[#FB7185] to-[#FDA4AF]' },
  { key: 'repair', label: '报修', icon: Wrench, bg: 'from-[#FB923C] to-[#FDBA74]' },
]

export default function ProfileHome() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-full flex-col bg-[#F8F8FA]">
      {/* 顶部区 */}
      <div
        className="relative shrink-0 px-5 pt-12 pb-24"
        style={{ background: 'linear-gradient(135deg, #D4A853 0%, #E8C97A 50%, #F0D68E 100%)' }}
      >
        {/* 设置按钮 */}
        <button
          type="button"
          aria-label="设置"
          onClick={() => navigate('/legacy-profile/settings')}
          className="absolute right-4 top-12 flex h-10 w-10 items-center justify-center text-white"
        >
          <Settings className="h-6 w-6" />
        </button>

        {/* 用户信息 */}
        <div className="flex items-center gap-3">
          <img
            src={USER_INFO.avatar}
            alt="头像"
            className="h-16 w-16 rounded-full border-2 border-white/50 bg-white object-cover shadow-lg"
          />
          <div className="flex-1">
            <button
              type="button"
              onClick={() => navigate('/legacy-profile/info')}
              className="flex items-center gap-1.5 text-white"
            >
              <span className="text-lg font-semibold">{USER_INFO.nickname}</span>
              <Pencil className="h-4 w-4 opacity-80" />
            </button>
            <div className="mt-1 text-sm text-white/80">
              账号：{USER_INFO.account}
            </div>
          </div>
        </div>
      </div>

      {/* 内容区（上浮叠在顶部渐变上） */}
      <div className="-mt-16 flex-1 space-y-4 px-4 pb-6">
        {/* 我的订单 */}
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-text-primary">我的订单</h3>
            <button
              type="button"
              onClick={() => navigate('/legacy-profile/orders')}
              className="text-sm text-text-tertiary"
            >
              全部订单
            </button>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {ORDER_ENTRIES.map((entry) => {
              const Icon = entry.icon
              return (
                <button
                  key={entry.key}
                  type="button"
                  onClick={() => navigate(`/legacy-profile/orders?tab=${entry.key}`)}
                  className="flex flex-col items-center gap-1.5 py-1"
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${entry.bg} text-white shadow-sm`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-xs text-text-secondary">{entry.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 快捷功能 */}
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="grid grid-cols-4 gap-2">
            {QUICK_ENTRIES.map((entry) => {
              const Icon = entry.icon
              const handleClick = () => {
                if (entry.key === 'repair') {
                  navigate('/legacy-service/repair/projects')
                }
              }
              return (
                <button
                  key={entry.key}
                  type="button"
                  onClick={handleClick}
                  className="flex flex-col items-center gap-1.5 py-2"
                >
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${entry.bg} text-white shadow-sm`}
                  >
                    <Icon className="h-7 w-7" />
                  </div>
                  <span className="text-xs text-text-secondary">{entry.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
