import { Crown, Gift, Sparkles, X } from 'lucide-react'
import PromptOverlay from '../mobile/PromptOverlay'
import { IDENTITY_PICKER } from '../../app/fixtures'

export type PickerIdentity = 'existing' | 'new'

export interface IdentityPickerSheetProps {
  /** 弹窗是否展示 */
  open: boolean
  /** 用户选定身份后回调：'existing' → 卡博士存量用户；'new' → 诗得丽新增用户 */
  onPick: (identity: PickerIdentity) => void
  /** 关闭弹窗 */
  onDismiss: () => void
}

/**
 * 身份选择弹窗（T043｜Demo 演示态）
 * -------------------------------------------------------------
 * 触发场景：用户点击诗得丽品牌专栏顶部轮播图。
 * 视觉规范沿用 NewcomerCouponDialog 暖色 overlay + DEAR SEED 眉标 + 金色分隔线。
 * 两个并排选项卡，点击后回调身份 ID，由宿主页面决定后续弹窗。
 * 后端真实身份识别（B-043）就位后，本弹窗可整体移除或降级为隐藏态。
 */
export default function IdentityPickerSheet({
  open,
  onPick,
  onDismiss,
}: IdentityPickerSheetProps) {
  const { eyebrow, title, desc, dismissLabel, existing, new: newUser } = IDENTITY_PICKER

  return (
    <PromptOverlay open={open} label={title} onDismiss={onDismiss}>
      <div className="bg-[var(--color-surface-overlay-warm)] px-5 pb-5 pt-6">
        <button
          type="button"
          aria-label={dismissLabel}
          onClick={onDismiss}
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-text-tertiary active:bg-surface-pressed"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>

        <p className="inline-flex items-center gap-1.5 rounded-pill bg-surface/70 px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] text-reward-strong">
          <Sparkles className="h-3 w-3" aria-hidden />
          {eyebrow}
        </p>
        <h2 className="mt-2 text-xl font-bold leading-7 text-text-primary">{title}</h2>
        <span className="mt-3 block h-px w-12 bg-reward" aria-hidden />
        <p className="mt-3 text-sm leading-6 text-text-secondary">{desc}</p>

        {/* 两个并排的身份选项卡 */}
        <div className="mt-5 grid grid-cols-2 gap-3" aria-label="身份选项">
          {/* 卡博士存量用户 */}
          <button
            type="button"
            aria-label={existing.cta}
            onClick={() => onPick('existing')}
            className="flex flex-col items-center gap-2 rounded-container border border-border-subtle bg-reward-subtle p-3 text-left shadow-bubble active:scale-[0.98] active:bg-reward-subtle"
          >
            <span
              className="flex h-12 w-12 items-center justify-center rounded-full text-reward-strong"
              style={{ background: 'rgba(255, 218, 169, 0.55)' }}
              aria-hidden
            >
              <Gift className="h-6 w-6" />
            </span>
            <span className="text-center text-sm font-bold leading-5 text-text-primary">
              {existing.title}
            </span>
            <span className="text-center text-[11px] leading-4 text-text-tertiary">
              {existing.desc}
            </span>
          </button>

          {/* 诗得丽新增用户 */}
          <button
            type="button"
            aria-label={newUser.cta}
            onClick={() => onPick('new')}
            className="flex flex-col items-center gap-2 rounded-container border border-border-subtle bg-member-surface p-3 text-left shadow-bubble active:scale-[0.98] active:bg-member-surface"
          >
            <span
              className="flex h-12 w-12 items-center justify-center rounded-full text-member-accent"
              style={{ background: 'rgba(244, 192, 122, 0.25)' }}
              aria-hidden
            >
              <Crown className="h-6 w-6" />
            </span>
            <span className="text-center text-sm font-bold leading-5 text-text-primary">
              {newUser.title}
            </span>
            <span className="text-center text-[11px] leading-4 text-text-tertiary">
              {newUser.desc}
            </span>
          </button>
        </div>
      </div>
    </PromptOverlay>
  )
}
