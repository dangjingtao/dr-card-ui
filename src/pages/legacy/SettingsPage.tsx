import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'

/* ---- Fixture ---- */
const SETTING_ITEMS = [
  { key: 'refund', label: '退款' },
  { key: 'refund-record', label: '退款记录' },
  { key: 'payment-config', label: '支付流程配置' },
  { key: 'change-password', label: '修改密码' },
  { key: 'online-devices', label: '我的在线设备' },
  { key: 'user-agreement', label: '用户协议' },
  { key: 'privacy', label: '隐私政策' },
  { key: 'cancel-account', label: '注销账户' },
]

export default function SettingsPage() {
  const navigate = useNavigate()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const handleLogout = () => {
    setShowLogoutConfirm(false)
    // 退出登录逻辑
  }

  return (
    <div className="flex min-h-full flex-col bg-[#F8F8FA]">
      {/* 顶部栏 */}
      <div className="relative shrink-0 px-4 pt-12 pb-4">
        <div className="relative flex items-center">
          <button
            type="button"
            aria-label="返回"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center text-text-primary"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold text-text-primary">
            设置
          </div>
        </div>
      </div>

      {/* 设置列表 */}
      <div className="mt-2 bg-white">
        {SETTING_ITEMS.map((item, idx) => {
          const isLast = idx === SETTING_ITEMS.length - 1
          return (
            <button
              key={item.key}
              type="button"
              className={`flex w-full items-center justify-between px-5 py-3.5 active:bg-bg-secondary ${
                isLast ? '' : 'border-b border-border-light'
              }`}
            >
              <span className="text-sm text-[#B8893D]">{item.label}</span>
              <ChevronRight className="h-4 w-4 text-text-tertiary" />
            </button>
          )
        })}
      </div>

      {/* 退出登录按钮 */}
      <div className="mt-auto px-4 pb-8 pt-12">
        <button
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full rounded-full py-3.5 text-base font-medium text-white shadow-lg shadow-[#D4A853]/25 active:opacity-90"
          style={{ background: 'linear-gradient(135deg, #D4A853 0%, #E8C97A 100%)' }}
        >
          退出登录
        </button>
      </div>

      {/* 退出登录确认弹窗 */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-8">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6">
            <h3 className="text-center text-base font-semibold text-text-primary">
              确认退出登录？
            </h3>
            <p className="mt-2 text-center text-sm text-text-secondary">
              退出后需要重新登录才能使用
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 rounded-full border border-border py-2.5 text-sm text-text-secondary"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 rounded-full py-2.5 text-sm text-white"
                style={{ background: 'linear-gradient(135deg, #D4A853 0%, #E8C97A 100%)' }}
              >
                确认退出
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
