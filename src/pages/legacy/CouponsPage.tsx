import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

type CouponTab = 'unused' | 'used' | 'expired'

interface Coupon {
  id: string
  amount: string
  title: string
  availableAmount: string
  timeRange?: string
  status: 'unused' | 'used' | 'expired'
}

const TABS: { key: CouponTab; label: string }[] = [
  { key: 'unused', label: '未使用' },
  { key: 'used', label: '已使用' },
  { key: 'expired', label: '已过期' },
]

/* 未使用的优惠卡 */
const UNUSED_COUPONS: Coupon[] = [
  {
    id: 'u1',
    amount: '2.00',
    title: '洗护免费领取',
    availableAmount: '¥2.00',
    timeRange: '2026-09-01 ~ 2026-09-30',
    status: 'unused',
  },
  {
    id: 'u2',
    amount: '1.50',
    title: '天津职业大学洗护免',
    availableAmount: '¥1.50',
    timeRange: '2026-09-05 ~ 2026-10-05',
    status: 'unused',
  },
  {
    id: 'u3',
    amount: '5.00',
    title: '新人专享洗护优惠',
    availableAmount: '¥5.00',
    timeRange: '2026-08-20 ~ 2026-11-20',
    status: 'unused',
  },
]

/* 已使用的优惠卡 */
const USED_COUPONS: Coupon[] = [
  {
    id: 's1',
    amount: '1.00',
    title: '洗护免费领取',
    availableAmount: '¥1.00',
    timeRange: '2026-06-10 ~ 2026-06-20',
    status: 'used',
  },
  {
    id: 's2',
    amount: '0.80',
    title: '天津职业大学洗护免',
    availableAmount: '¥0.80',
    timeRange: '2026-05-15 ~ 2026-05-25',
    status: 'used',
  },
]

/* 已过期的优惠卡（与截图内容一致） */
const EXPIRED_COUPONS: Coupon[] = [
  {
    id: 'e1',
    amount: '0.80',
    title: '天津职业大学洗护免费领取',
    availableAmount: '¥0.80',
    status: 'expired',
  },
  {
    id: 'e2',
    amount: '1.00',
    title: '洗护免费领取',
    availableAmount: '¥1.00',
    timeRange: '2026-06-02 ~ 2026-06-03',
    status: 'expired',
  },
  {
    id: 'e3',
    amount: '1.00',
    title: '洗护免费领取',
    availableAmount: '¥1.00',
    timeRange: '2026-05-26 ~ 2026-06-01',
    status: 'expired',
  },
]

function getCouponsByTab(tab: CouponTab): Coupon[] {
  switch (tab) {
    case 'unused':
      return UNUSED_COUPONS
    case 'used':
      return USED_COUPONS
    case 'expired':
      return EXPIRED_COUPONS
  }
}

/**
 * T031｜优惠卡 二级页面
 * -------------------------------------------------------------
 * 顶部三 Tab（未使用 / 已使用 / 已过期）+ 优惠卡列表。
 * 对齐原小程序"优惠卡列表"页面。
 * 设计风格：卡博士 APP 淡金色。
 */
export default function CouponsPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<CouponTab>('unused')
  const coupons = getCouponsByTab(tab)

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

      {/* 优惠卡列表 */}
      {coupons.length > 0 ? (
        <div className="flex-1 space-y-3 px-4 py-4">
          {coupons.map((coupon) => (
            <CouponCard key={coupon.id} coupon={coupon} />
          ))}
          <div className="py-4 text-center text-xs text-text-tertiary">
            没有更多数据了
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center px-4 pb-12 pt-16">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-bg-secondary text-text-tertiary">
            <svg
              className="h-10 w-10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path d="M12 2v20M2 12h20" strokeLinecap="round" />
            </svg>
          </div>
          <div className="mt-4 text-sm text-text-tertiary">没有更多数据了</div>
        </div>
      )}
    </div>
  )
}

function CouponCard({ coupon }: { coupon: Coupon }) {
  const isUnused = coupon.status === 'unused'
  const isUsed = coupon.status === 'used'
  const isExpired = coupon.status === 'expired'

  const statusLabel = isUsed ? '已使用' : isExpired ? '已过期' : ''

  return (
    <div
      className={`relative flex overflow-hidden rounded-xl shadow-sm ${
        isUnused ? 'bg-white' : 'bg-white opacity-80'
      }`}
    >
      {/* 左侧金额区 */}
      <div
        className={`relative flex w-28 shrink-0 flex-col items-center justify-center py-5 ${
          isUnused
            ? 'text-white'
            : 'text-text-tertiary'
        }`}
        style={{
          background: isUnused
            ? 'linear-gradient(135deg, #D4A853 0%, #E8C97A 100%)'
            : '#F0F0F0',
        }}
      >
        <div className="flex items-baseline">
          <span className="text-sm font-medium">¥</span>
          <span className="text-3xl font-bold leading-none">{coupon.amount}</span>
        </div>

        {/* 锯齿分隔 - 右侧 */}
        <div className="absolute right-0 top-0 h-full w-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="absolute -right-1 h-2 w-2 rounded-full bg-[#F8F8FA]"
              style={{ top: `${i * 10 + 2}%` }}
            />
          ))}
        </div>
      </div>

      {/* 右侧内容区 */}
      <div className="relative flex flex-1 flex-col justify-center px-4 py-4">
        {/* 状态标签 */}
        {!isUnused && (
          <div
            className={`absolute right-4 top-4 text-xs ${
              isUsed ? 'text-text-secondary' : 'text-text-tertiary'
            }`}
          >
            {statusLabel}
          </div>
        )}

        <div
          className={`text-sm font-semibold leading-snug ${
            isUnused ? 'text-text-primary' : 'text-text-secondary'
          }`}
        >
          {coupon.title}
        </div>

        <div className="mt-1.5 text-xs text-text-tertiary">
          可用金额:{' '}
          <span
            className={`font-semibold ${
              isUnused ? 'text-[#D4A853]' : 'text-text-secondary'
            }`}
          >
            {coupon.availableAmount}
          </span>
        </div>

        {coupon.timeRange && (
          <div className="mt-1 text-xs text-text-tertiary">
            可用时间: {coupon.timeRange}
          </div>
        )}

        {/* 未使用状态显示"去使用"按钮 */}
        {isUnused && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-[#D4A853] to-[#E8C97A] px-3 py-1 text-xs font-medium text-white shadow-sm active:opacity-90"
          >
            去使用
          </button>
        )}
      </div>
    </div>
  )
}
