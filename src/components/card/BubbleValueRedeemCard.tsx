export interface BubbleValueRedeemCardProps {
  value?: number | string
  className?: string
  onRedeem?: () => void
}

/**
 * 我的泡泡值兑换卡（洗护体验券专区顶部横条）
 * -------------------------------------------------------------
 * 视觉来源：用户 2026-09-29 提供的 bubble-value-card.svg / BubbleValueRedeemCard.tsx。
 * 忠实还原原稿色值，不做 Token 替换。
 * 仅为渐变 / 滤镜 DOM id 加实例前缀，避免同页多实例 id 冲突。
 */
const FONT_FAMILY = 'PingFang SC, Microsoft YaHei, Noto Sans CJK SC, sans-serif'

export default function BubbleValueRedeemCard({ value = 0, className, onRedeem }: BubbleValueRedeemCardProps) {
  const displayValue = typeof value === 'number' ? value.toLocaleString('en-US') : value

  return (
    <svg
      className={className}
      viewBox="0 0 978 251"
      width="100%"
      role="img"
      aria-label={`我的泡泡值 ${displayValue}，立即兑换洗护体验券`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="bubbleCardBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFDF8" />
          <stop offset="1" stopColor="#FFF5E5" />
        </linearGradient>
        <linearGradient id="bubbleCardButtonBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F15A00" />
          <stop offset="1" stopColor="#E53B00" />
        </linearGradient>
        <linearGradient id="bubbleCardGiftTop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFE3A7" />
          <stop offset="1" stopColor="#FFD27C" />
        </linearGradient>
        <linearGradient id="bubbleCardGiftBody" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFF0C8" />
          <stop offset="1" stopColor="#FFC560" />
        </linearGradient>
        <radialGradient id="bubbleCardHalo" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#FFEFCF" stopOpacity="0.95" />
          <stop offset="1" stopColor="#FFF4DD" stopOpacity="0" />
        </radialGradient>
        <filter id="bubbleCardSoftShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="5" stdDeviation="8" floodColor="#EFB75F" floodOpacity="0.18" />
        </filter>
      </defs>

      <rect x="15" y="28" width="948" height="205" rx="26" fill="url(#bubbleCardBg)" stroke="#F1D49F" strokeWidth="1.5" />

      <text x="57" y="82" fill="#79563C" fontSize="28" fontFamily={FONT_FAMILY} fontWeight="500">
        我的泡泡值
      </text>

      <text y="153" fontFamily={FONT_FAMILY}>
        <tspan x="57" fill="#EF4B00" fontSize="66" fontWeight="700">
          {displayValue}
        </tspan>
        <tspan dx="18" fill="#8E4A18" fontSize="34" fontWeight="650">
          泡泡值
        </tspan>
      </text>

      <text x="57" y="202" fill="#9B866F" fontSize="26" fontFamily={FONT_FAMILY} fontWeight="400">
        兑换洗护体验券，享受更多权益
      </text>

      <path d="M468 123c7-2 12-7 14-14 2 7 7 12 14 14-7 2-12 7-14 14-2-7-7-12-14-14Z" fill="#FFC94B" />
      <path d="M675 76c7-2 12-7 14-14 2 7 7 12 14 14-7 2-12 7-14 14-2-7-7-12-14-14Z" fill="#FFC94B" />

      <circle cx="588" cy="121" r="74" fill="url(#bubbleCardHalo)" />
      <g transform="translate(532 75) rotate(7 56 55)" filter="url(#bubbleCardSoftShadow)">
        <rect x="11" y="42" width="91" height="76" rx="8" fill="url(#bubbleCardGiftBody)" />
        <rect x="4" y="34" width="105" height="25" rx="7" fill="url(#bubbleCardGiftTop)" />
        <rect x="50" y="34" width="15" height="84" fill="#F9A52A" />
        <rect x="4" y="43" width="105" height="9" rx="4.5" fill="#FFF2D1" opacity="0.8" />
        <path d="M55 33c-14-20-29-22-34-12-4 9 6 16 34 19" fill="none" stroke="#F39B22" strokeWidth="8" strokeLinecap="round" />
        <path d="M60 33c14-20 29-22 34-12 4 9-6 16-34 19" fill="none" stroke="#F39B22" strokeWidth="8" strokeLinecap="round" />
      </g>

      <g
        onClick={onRedeem}
        style={{ cursor: onRedeem ? 'pointer' : 'default' }}
        role={onRedeem ? 'button' : undefined}
        aria-label={onRedeem ? '立即兑换' : undefined}
      >
        <rect x="690" y="101" width="245" height="73" rx="37" fill="url(#bubbleCardButtonBg)" />
        <text x="756" y="148" fill="#FFFFFF" fontSize="31" fontFamily={FONT_FAMILY} fontWeight="650">
          立即兑换
        </text>
        <path d="M887 126l12 12-12 12" fill="none" stroke="#FFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  )
}
