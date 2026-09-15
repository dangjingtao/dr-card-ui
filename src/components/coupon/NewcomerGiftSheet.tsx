import { Gift, Sparkles, X } from 'lucide-react'
import PromptOverlay from '../mobile/PromptOverlay'
import { Button } from '../ui'
import { GIFT_FOR_NEW_USERS } from '../../app/fixtures'

export interface NewcomerGiftSheetProps {
  /** 弹窗是否展示 */
  open: boolean
  /** 点击主按钮：跳转到 GIFT_FOR_NEW_USERS.actionTo */
  onConfirm: () => void
  /** 关闭弹窗 */
  onDismiss: () => void
}

/**
 * 新人礼包演示态弹窗（T043）
 * -------------------------------------------------------------
 * 触发场景：身份选择弹窗选中「卡博士存量用户」后展示。
 * 视觉规范沿用 NewcomerCouponDialog 暖色 overlay + DEAR SEED 眉标 + 金色分隔线，
 * 并复用 PlaceholderCouponSheet 的「演示位 · 后续接入」tag 体系。
 * 占位券具体券种未定（B-044），等丁总指定后只需替换 fixture 文案/图标。
 * 与 NewcomerCouponDialog 的字段/链路完全解耦，互不影响。
 */
export default function NewcomerGiftSheet({
  open,
  onConfirm,
  onDismiss,
}: NewcomerGiftSheetProps) {
  return (
    <PromptOverlay open={open} label={GIFT_FOR_NEW_USERS.title} onDismiss={onDismiss}>
      <div className="bg-[var(--color-surface-overlay-warm)] px-5 pb-5 pt-6">
        <button
          type="button"
          aria-label={GIFT_FOR_NEW_USERS.dismissLabel}
          onClick={onDismiss}
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-text-tertiary active:bg-surface-pressed"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>

        {/* 演示位 tag */}
        <span
          className="inline-flex items-center gap-1 rounded-pill border border-reward/40 bg-reward-subtle px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] text-reward-strong"
          aria-label="演示位标识"
        >
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-reward" />
          {GIFT_FOR_NEW_USERS.demoTag}
        </span>

        <p className="mt-3 inline-flex items-center gap-1.5 rounded-pill bg-surface/70 px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] text-reward-strong">
          <Sparkles className="h-3 w-3" aria-hidden />
          {GIFT_FOR_NEW_USERS.eyebrow}
        </p>

        <h2 className="mt-2 text-xl font-bold leading-7 text-text-primary">
          {GIFT_FOR_NEW_USERS.title}
        </h2>
        <span className="mt-3 block h-px w-12 bg-reward" aria-hidden />
        <p className="mt-3 text-sm leading-6 text-text-secondary">{GIFT_FOR_NEW_USERS.desc}</p>

        {/* 占位礼包卡：礼盒图标，dashed 边框表示演示位 */}
        <div
          className="mt-4 flex items-center gap-3 rounded-container border border-border-subtle border-dashed bg-surface p-3 shadow-floating"
          aria-label="新人礼包占位卡"
        >
          <span className="relative flex h-[72px] w-[60px] flex-none items-center justify-center overflow-hidden rounded-[12px] bg-surface-subtle">
            <span aria-hidden className="absolute h-14 w-14 rounded-full bg-reward/15 blur-lg" />
            <Gift className="relative h-8 w-8 text-reward-strong" aria-hidden />
          </span>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-sm font-bold leading-5 text-text-primary">
              {GIFT_FOR_NEW_USERS.title}
            </p>
            <p className="mt-1 text-[11px] leading-4 text-text-tertiary">
              {GIFT_FOR_NEW_USERS.desc}
            </p>
          </div>
          <span className="flex-none rounded-pill bg-surface-subtle px-2 py-0.5 text-[11px] font-bold leading-4 text-text-tertiary">
            ×1
          </span>
        </div>
      </div>

      <div className="bg-surface px-5 pb-5 pt-4">
        <Button size="large" className="w-full rounded-pill" onClick={onConfirm}>
          {GIFT_FOR_NEW_USERS.action}
        </Button>
      </div>
    </PromptOverlay>
  )
}
