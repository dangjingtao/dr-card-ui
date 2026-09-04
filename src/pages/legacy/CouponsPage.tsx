import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Ticket } from 'lucide-react'

type CouponTab = 'unused' | 'used' | 'expired'

const TABS: { key: CouponTab; label: string }[] = [
  { key: 'unused', label: '未使用' },
  { key: 'used', label: '已使用' },
  { key: 'expired', label: '已过期' },
]

/**
 * T031｜优惠卡 二级页面
 * -------------------------------------------------------------
 * 顶部三 Tab（未使用 / 已使用 / 已过期）+ 列表空态。
 * 对齐原小程序"优惠卡列表"页面。
 * 数据先空态（mock），待 B-048 决策后再接入优惠卡券接口。
 */
export default function CouponsPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<CouponTab>('unused')

  return (
    <div className="mx-auto flex min-h-full max-w-[480px] flex-col bg-[#F8F8FA]">
      {/* 顶部栏：淡金渐变背景（与状态栏同色） */}
      <div className="relative shrink-0 bg-gradient-to-br from-[#D4A853] to-[#E8C97A] px-4 pt-3 pb-3">
        <div className="relative flex items-center">
          <button
            type="button"
            aria-label="返回"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center text-white active:opacity-80"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold text-white">
            优惠卡列表
          </div>
        </div>
      </div>

      {/* Tab 横铺满行，无圆角 */}
      <div className="flex border-b border-border-light bg-white">
        {TABS.map((t) => {
          const active = t.key === tab
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`relative flex-1 py-3 text-center text-sm transition ${
                active ? 'font-semibold text-[#B8893D]' : 'text-text-secondary'
              }`}
            >
              {t.label}
              {active && (
                <span className="absolute right-1/2 bottom-0 h-0.5 w-10 translate-x-1/2 bg-[#D4A853]" />
              )}
            </button>
          )
        })}
      </div>

      {/* 空态 */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-12 pt-16">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-bg-secondary text-text-tertiary">
          <Ticket className="h-10 w-10" />
        </div>
        <div className="mt-4 text-sm text-text-tertiary">没有更多数据了</div>
      </div>
    </div>
  )
}
