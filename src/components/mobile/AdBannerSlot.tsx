import { Sparkles } from 'lucide-react'

export interface AdBannerSlotProps {
  /** 广告主标题，例如「卡博士开学季福利」 */
  title?: string
  /** 广告副标题/卖点 */
  subtitle?: string
  /** CTA 文案 */
  ctaText?: string
  /** 点击广告位的回调（可选：未传则仅展示） */
  onClick?: () => void
  /** 用于埋点的稳定 slot id */
  slotId?: string
  className?: string
}

/**
 * T041：设备列表页广告位
 * - 与设备卡片等高（约 78px），保持列表视觉节奏。
 * - 角标「广告」放在图标胶囊左上方，避免误点击。
 * - 背景使用浅金渐变 + 细边框，与白底设备卡片形成明显差异。
 * - 点击行为由调用方决定（默认不响应）。
 */
export default function AdBannerSlot({
  title = '卡博士开学季福利',
  subtitle = '充值满 50 减 8，新生专享',
  ctaText = '去看看',
  onClick,
  slotId,
  className = '',
}: AdBannerSlotProps) {
  const interactive = typeof onClick === 'function'

  const body = (
    <div
      data-ad-slot={slotId ?? 'device-list'}
      className={`flex h-[78px] items-center gap-3 overflow-hidden rounded-2xl border px-3 shadow-sm ${
        interactive ? 'cursor-pointer transition active:opacity-90' : ''
      } ${className}`}
      style={{
        background: 'linear-gradient(135deg, var(--ad-banner-bg-from) 0%, var(--ad-banner-bg-to) 100%)',
        borderColor: 'var(--ad-banner-border)',
      }}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={`广告：${title}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (!interactive) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.()
        }
      }}
    >
      {/* 图标 + 角标 */}
      <div className="relative flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-white/70">
        <Sparkles className="h-6 w-6" style={{ color: 'var(--ad-banner-cta-to)' }} />
        <span
          className="absolute -top-1.5 left-0 rounded-full px-1.5 py-px text-[9px] font-medium leading-none"
          style={{
            backgroundColor: 'var(--ad-banner-badge-bg)',
            color: 'var(--ad-banner-badge-text)',
          }}
        >
          广告
        </span>
      </div>

      {/* 文案 */}
      <div className="min-w-0 flex-1">
        <h4
          className="truncate text-sm font-semibold"
          style={{ color: 'var(--ad-banner-title)' }}
        >
          {title}
        </h4>
        <p
          className="mt-0.5 truncate text-[11px]"
          style={{ color: 'var(--ad-banner-subtitle)' }}
        >
          {subtitle}
        </p>
      </div>

      {/* CTA */}
      <span
        className="flex-none rounded-full px-3 py-1.5 text-[11px] font-semibold shadow-sm"
        style={{
          background: 'linear-gradient(135deg, var(--ad-banner-cta-from) 0%, var(--ad-banner-cta-to) 100%)',
          color: 'var(--ad-banner-cta-text)',
        }}
      >
        {ctaText}
      </span>
    </div>
  )

  return body
}
