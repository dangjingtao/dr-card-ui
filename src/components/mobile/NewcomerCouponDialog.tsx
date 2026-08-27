import { CheckCircle2, Gift, X } from 'lucide-react'
import PromptOverlay from './PromptOverlay'
import { Button } from '../ui'
import {
  NEWCOMER_COUPON_DIALOG,
  NEWCOMER_COUPON_SUCCESS,
  type NewcomerCoupon,
} from '../../app/fixtures'
import dearseedKit from '../../assets/brand/member/checkin-dearseed-kit.webp'
import shampooA from '../../assets/brand/exchange/exchange-pick-shampoo-a.webp'
import shampooB from '../../assets/brand/exchange/exchange-pick-shampoo-b.webp'

const thumbAssets: Record<NewcomerCoupon['thumb'], string> = {
  'dearseed-kit': dearseedKit,
  'shampoo-a': shampooA,
  'shampoo-b': shampooB,
}

export interface NewcomerCouponDialogProps {
  /** 券弹窗是否展示 */
  open: boolean
  /** 领取成功反馈是否展示 */
  successOpen: boolean
  /** 本次赠送的体验券（1 张或 2 张，由宿主页面按确定性夹具选出） */
  coupons: NewcomerCoupon[]
  /** 点击「确定」：先出领取成功反馈 */
  onConfirm: () => void
  /** 关闭：不领取，停留当前页 */
  onDismiss: () => void
  /** 领取成功后进入体验券页面 */
  onSuccessAction: () => void
}

/**
 * 新人体验券弹窗 + 领取成功反馈
 * -------------------------------------------------------------
 * 事实源：docs/requirements/2026-08-27-ui-change-requirements.md §3.1 §3.2
 * 已确认：面向新用户在专栏首页弹出；每次展示 1 张或 2 张体验券；弹窗内直接展示本次赠送的
 *        体验券商品内容与数量；确定 → 先呈现领取成功反馈，再进入体验券页面；关闭 → 不领取。
 * 视觉口径沿用已验收的 /dearseed?overlay=reminder（NewcomerDialog）：暖色 overlay 卡片 +
 * DEAR SEED 眉标 + 金色分隔线 + 商品图文行 + 底部通栏主按钮，不新造一套弹窗语言。
 * ⚠️ 未决规则隔离在 fixtures 的 NEWCOMER_COUPON_RULE_STATUS（B-031 新用户识别 / B-032 随机发券口径）。
 */
export default function NewcomerCouponDialog({
  open,
  successOpen,
  coupons,
  onConfirm,
  onDismiss,
  onSuccessAction,
}: NewcomerCouponDialogProps) {
  const totalQuantity = coupons.reduce((sum, coupon) => sum + coupon.quantity, 0)

  return (
    <>
      <PromptOverlay open={open} label="新人体验券" onDismiss={onDismiss}>
        <div className="bg-[var(--color-surface-overlay-warm)] px-5 pb-5 pt-6">
          <button
            type="button"
            aria-label="关闭新人体验券"
            onClick={onDismiss}
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-text-tertiary active:bg-surface-pressed"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>

          <p className="mx-auto inline-flex items-center gap-1.5 rounded-pill bg-surface/70 px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] text-reward-strong">
            <Gift className="h-3 w-3" aria-hidden />
            {NEWCOMER_COUPON_DIALOG.eyebrow}
          </p>
          <h2 className="mt-2 text-xl font-bold leading-7 text-text-primary">{NEWCOMER_COUPON_DIALOG.title}</h2>
          <span className="mx-auto mt-3 block h-px w-12 bg-reward" aria-hidden />
          <p className="mt-3 text-sm leading-6 text-text-secondary">{NEWCOMER_COUPON_DIALOG.desc}</p>

          <p className="mt-4 inline-flex items-center rounded-pill bg-reward-subtle px-2.5 py-1 text-[11px] font-semibold text-reward-text">
            本次共 {totalQuantity} 张体验券
          </p>

          <ul className="mt-3 space-y-3" aria-label="本次赠送的体验券">
            {coupons.map((coupon) => (
              <li
                key={coupon.id}
                className="flex items-center gap-3 rounded-container border border-border-subtle bg-surface p-3 shadow-floating"
              >
                <span className="relative flex h-[72px] w-[60px] flex-none items-center justify-center overflow-hidden rounded-[12px] bg-surface-subtle">
                  <span aria-hidden className="absolute h-14 w-14 rounded-full bg-reward/15 blur-lg" />
                  <img
                    src={thumbAssets[coupon.thumb]}
                    alt=""
                    aria-hidden
                    className="relative h-16 w-11 object-contain drop-shadow-[0_8px_10px_rgba(51,37,20,0.16)]"
                  />
                </span>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-sm font-bold leading-5 text-text-primary">{coupon.name}</p>
                  <p className="mt-1 text-[11px] leading-4 text-text-tertiary">{coupon.desc}</p>
                </div>
                <span className="flex-none rounded-pill bg-reward px-2 py-0.5 text-[11px] font-bold leading-4 text-text-inverse">
                  ×{coupon.quantity}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-surface px-5 pb-5 pt-4">
          <Button size="large" className="w-full rounded-pill" onClick={onConfirm}>
            {NEWCOMER_COUPON_DIALOG.action}
          </Button>
        </div>
      </PromptOverlay>

      <PromptOverlay
        open={successOpen}
        label="体验券领取成功"
        onDismiss={onSuccessAction}
        className="rounded-feature bg-surface px-6 pb-6 pt-7 text-center shadow-modal"
      >
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-reward-subtle text-reward-strong">
          <CheckCircle2 className="h-9 w-9" aria-hidden />
        </span>
        <h2 className="mt-4 text-xl font-bold text-text-primary">{NEWCOMER_COUPON_SUCCESS.title}</h2>
        <p className="mt-2 text-sm leading-6 text-text-secondary">{NEWCOMER_COUPON_SUCCESS.desc}</p>
        <Button className="mt-5 w-full rounded-pill" size="large" onClick={onSuccessAction}>
          {NEWCOMER_COUPON_SUCCESS.action}
        </Button>
      </PromptOverlay>
    </>
  )
}
