import { Ticket, X } from 'lucide-react'
import PromptOverlay from '../mobile/PromptOverlay'
import { Button } from '../ui'
import { PLACEHOLDER_COUPON } from '../../app/fixtures'

export interface PlaceholderCouponSheetProps {
  /** 弹窗是否展示 */
  open: boolean
  /** 点击主按钮：跳转到 PLACEHOLDER_COUPON.actionTo */
  onConfirm: () => void
  /** 关闭弹窗 */
  onDismiss: () => void
}

/**
 * 占位券演示态弹窗（T043）
 * -------------------------------------------------------------
 * 触发场景：诗得丽品牌专栏入口弹窗的"卡博士存量用户"分支（isDearseedCare === false）。
 * 视觉沿用已验收的 NewcomerCouponDialog 风格：
 *   - 暖色 overlay 卡片 + DEAR SEED 眉标 + 金色分隔线
 *   - 顶部新增「演示位 · 后续接入」tag 醒目但不刺眼
 * 占位券具体券种未定（B-044），后续接入真实券种时：
 *   - 只需替换 PLACEHOLDER_COUPON fixture 的文案/图标
 *   - 或新建 PlaceholderCouponSheet 的真实券版兄弟组件并替换本页调用
 * 不修改现有 NewcomerCouponDialog 的视觉/字段/核销链路。
 */
export default function PlaceholderCouponSheet({
  open,
  onConfirm,
  onDismiss,
}: PlaceholderCouponSheetProps) {
  return (
    <PromptOverlay open={open} label={PLACEHOLDER_COUPON.title} onDismiss={onDismiss}>
      <div className="bg-[var(--color-surface-overlay-warm)] px-5 pb-5 pt-6">
        <button
          type="button"
          aria-label={PLACEHOLDER_COUPON.dismissLabel}
          onClick={onDismiss}
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-text-tertiary active:bg-surface-pressed"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>

        {/* T043：演示位 tag，醒目但不刺眼（暖色背景 + 金色描边） */}
        <span
          className="inline-flex items-center gap-1 rounded-pill border border-reward/40 bg-reward-subtle px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] text-reward-strong"
          aria-label="演示位标识"
        >
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-reward" />
          {PLACEHOLDER_COUPON.demoTag}
        </span>

        <p className="mt-3 inline-flex items-center gap-1.5 rounded-pill bg-surface/70 px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] text-reward-strong">
          <Ticket className="h-3 w-3" aria-hidden />
          {PLACEHOLDER_COUPON.eyebrow}
        </p>

        <h2 className="mt-2 text-xl font-bold leading-7 text-text-primary">{PLACEHOLDER_COUPON.title}</h2>
        <span className="mt-3 block h-px w-12 bg-reward" aria-hidden />
        <p className="mt-3 text-sm leading-6 text-text-secondary">{PLACEHOLDER_COUPON.desc}</p>

        {/* 占位券卡：与 NewcomerCouponDialog 商品卡结构对齐，方便后续替换为真实券 */}
        <div
          className="mt-4 flex items-center gap-3 rounded-container border border-border-subtle border-dashed bg-surface p-3 shadow-floating"
          aria-label="占位券演示卡"
        >
          <span className="relative flex h-[72px] w-[60px] flex-none items-center justify-center overflow-hidden rounded-[12px] bg-surface-subtle">
            <span aria-hidden className="absolute h-14 w-14 rounded-full bg-reward/15 blur-lg" />
            <Ticket className="relative h-8 w-8 text-reward-strong" aria-hidden />
          </span>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-sm font-bold leading-5 text-text-primary">{PLACEHOLDER_COUPON.title}</p>
            <p className="mt-1 text-[11px] leading-4 text-text-tertiary">{PLACEHOLDER_COUPON.desc}</p>
          </div>
          <span className="flex-none rounded-pill bg-surface-subtle px-2 py-0.5 text-[11px] font-bold leading-4 text-text-tertiary">
            ×1
          </span>
        </div>
      </div>

      <div className="bg-surface px-5 pb-5 pt-4">
        <Button size="large" className="w-full rounded-pill" onClick={onConfirm}>
          {PLACEHOLDER_COUPON.action}
        </Button>
      </div>
    </PromptOverlay>
  )
}
