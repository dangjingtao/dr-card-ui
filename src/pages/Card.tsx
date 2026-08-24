import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CalendarDays, Check, Clock, Info, KeyRound, QrCode, ReceiptText, Ticket, X } from 'lucide-react'
import DebugPanel from '../components/mobile/DebugPanel'
import PageContainer from '../components/mobile/PageContainer'
import { useFixtureState, useOverlay } from '../app/fixtures/useFixture'
import { findRouteByPathname } from '../app/router/routes'
import {
  CARD_PACK_TABS,
  CARD_PACK_TIPS,
  cardCouponCount,
  cardCouponsByStatus,
  resolveCardCoupon,
  type CardCouponFixture,
  type CardCouponStatus,
} from '../app/fixtures'

export default function Card() {
  const navigate = useNavigate()
  const route = findRouteByPathname('/card')
  const { state } = useFixtureState(route)
  const { overlay, close } = useOverlay()
  const [searchParams, setSearchParams] = useSearchParams()

  /** 节点 #62/#63/#64：Tab 初值来自 `?state=`，验收可直达 URL 截图 */
  const [tab, setTab] = useState<CardCouponStatus>((state?.key as CardCouponStatus) ?? 'available')

  /** `?state=` 变化时同步可见 Tab（调试面板切换状态走的就是这条链路） */
  useEffect(() => {
    setTab((state?.key as CardCouponStatus) ?? 'available')
  }, [state?.key])

  /** 弹层内展示的券由 `?coupon=` 决定，保证「使用」弹层可复现 */
  const activeCoupon = resolveCardCoupon(searchParams.get('coupon'))
  const list = cardCouponsByStatus(tab)

  /** 切换 Tab 时把状态同步写回 `?state=`，保证 URL 始终等于页面真实状态（验收可直达截图） */
  const selectTab = (next: CardCouponStatus) => {
    setTab(next)
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev)
        params.set('state', next)
        params.delete('overlay')
        params.delete('coupon')
        return params
      },
      { replace: true },
    )
  }

  const openUseSheet = (coupon: CardCouponFixture) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('coupon', coupon.id)
        next.set('overlay', 'use')
        return next
      },
      { replace: true },
    )
  }

  return (
    <PageContainer className="pb-24">
      <div className="flex gap-2 rounded-xl border border-border-subtle bg-surface p-1" role="tablist" aria-label="卡包状态">
        {CARD_PACK_TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            onClick={() => selectTab(item.key)}
            className={`flex h-10 flex-1 items-center justify-center gap-1 rounded-lg border border-transparent text-sm ${
              tab === item.key ? 'border-primary bg-surface text-text-brand' : 'text-text-secondary'
            }`}
          >
            {item.label}
            <span
              className={`inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[11px] ${
                tab === item.key
                  ? 'bg-surface-selected text-text-brand'
                  : 'bg-surface-inactive text-text-inactive-muted'
              }`}
            >
              {cardCouponCount(item.key)}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-4" aria-live="polite">
        {tab === 'available' &&
          list.map((coupon) => (
            <article key={coupon.id} className="overflow-hidden rounded-[16px] bg-surface shadow-sm">
              <div className="h-[5px] bg-[linear-gradient(90deg,var(--color-reward),var(--color-reward-strong))]" />
              <div className="px-4 pb-4 pt-3.5">
                <div className="flex items-center justify-between gap-2.5">
                  {coupon.amountLabel ? (
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold leading-none text-reward-text">{coupon.amountLabel}</span>
                      <span className="text-base font-semibold text-text-primary">{coupon.name}</span>
                    </div>
                  ) : (
                    <h3 className="text-base font-semibold text-text-primary">{coupon.name}</h3>
                  )}
                  <span className="inline-flex h-6 items-center gap-1 rounded-full bg-reward-subtle px-2.5 text-xs font-semibold text-reward-text">
                    <Check className="h-3.5 w-3.5" />
                    可用
                  </span>
                </div>
                <div className="mt-2.5 flex items-center gap-1 text-xs text-text-tertiary">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {coupon.expireAt} 到期
                </div>
                <div className="mt-3.5 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => openUseSheet(coupon)}
                    className="h-9 rounded-full bg-primary px-[22px] text-sm font-semibold text-text-inverse shadow-primary-button active:bg-primary-pressed"
                  >
                    使用
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/card/share?coupon=${coupon.id}`)}
                    className="h-9 rounded-full border border-border-strong bg-transparent px-[22px] text-sm font-semibold text-text-secondary"
                  >
                    转赠
                  </button>
                </div>
              </div>
            </article>
          ))}

        {tab === 'used' && list.length === 0 && (
          <div className="flex flex-col items-center rounded-2xl bg-surface px-6 py-12 text-center shadow-sm">
            <span className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-surface-inactive text-icon-inactive">
              <ReceiptText className="h-7 w-7" />
            </span>
            <h3 className="mt-4 text-base font-semibold text-text-primary">暂无已使用的体验券</h3>
            <p className="mt-1 text-sm text-text-secondary">已核销或已完成使用的体验券，会显示在这里</p>
          </div>
        )}

        {tab === 'used' &&
          list.map((coupon) => (
            <article key={coupon.id} className="overflow-hidden rounded-[16px] bg-surface shadow-sm">
              <div className="h-[5px] bg-coupon-inactive-bar" />
              <div className="px-4 pb-4 pt-3.5">
                <div className="flex items-center justify-between gap-2.5">
                  {coupon.amountLabel ? (
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold leading-none text-coupon-used">{coupon.amountLabel}</span>
                      <span className="text-base font-semibold text-coupon-used">{coupon.name}</span>
                    </div>
                  ) : (
                    <h3 className="text-base font-semibold text-coupon-used">{coupon.name}</h3>
                  )}
                  <span className="inline-flex h-6 items-center gap-1 rounded-full bg-coupon-used-bg px-2.5 text-xs font-semibold text-coupon-used">
                    <ReceiptText className="h-3.5 w-3.5" />
                    已使用
                  </span>
                </div>
                <div className="mt-2.5 flex items-center gap-1 text-xs text-text-inactive-muted">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {coupon.expireAt} 到期
                </div>
              </div>
            </article>
          ))}

        {tab === 'expired' &&
          list.map((coupon) => (
            <article key={coupon.id} className="overflow-hidden rounded-[16px] bg-surface opacity-90 shadow-sm">
              <div className="h-[5px] bg-coupon-inactive-bar" />
              <div className="px-4 pb-4 pt-3.5">
                <div className="flex items-center justify-between gap-2.5">
                  {coupon.amountLabel ? (
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold leading-none text-text-inactive">{coupon.amountLabel}</span>
                      <span className="text-base font-semibold text-text-inactive">{coupon.name}</span>
                    </div>
                  ) : (
                    <h3 className="text-base font-semibold text-text-inactive">{coupon.name}</h3>
                  )}
                  <span className="inline-flex h-6 items-center gap-1 rounded-full bg-surface-inactive px-2.5 text-xs font-semibold text-text-inactive-muted">
                    <Clock className="h-3.5 w-3.5" />
                    已过期
                  </span>
                </div>
                <div className="mt-2.5 flex items-center gap-1 text-xs text-text-inactive-muted">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {coupon.expireAt} 到期
                </div>
              </div>
            </article>
          ))}

        {tab === 'expired' && list.length === 0 && (
          <div className="flex flex-col items-center rounded-2xl bg-surface px-6 py-12 text-center shadow-sm">
            <span className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-surface-inactive text-icon-inactive">
              <Clock className="h-7 w-7" />
            </span>
            <h3 className="mt-4 text-base font-semibold text-text-primary">暂无已过期的体验券</h3>
            <p className="mt-1 text-sm text-text-secondary">超过有效期的体验券，会显示在这里</p>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-3 rounded-2xl bg-surface p-4 shadow-sm">
        {CARD_PACK_TIPS.map((tip, index) => (
          <div key={tip} className="flex items-center gap-2.5">
            <span className="inline-flex h-5 w-5 flex-none items-center justify-center rounded-full bg-reward-subtle text-[11px] font-bold text-reward-text">
              {index + 1}
            </span>
            <span className="text-sm text-text-secondary">{tip}</span>
          </div>
        ))}
      </div>

      {overlay === 'use' && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-scrim" onClick={close}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="使用体验券"
            className="w-full max-w-[448px] rounded-t-overlay bg-surface px-4 pb-[env(safe-area-inset-bottom)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mt-2 h-1 w-9 rounded-full bg-border" aria-hidden />
            <div className="flex items-start justify-between gap-3 px-4 pb-2 pt-1">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">使用体验券</h2>
                <p className="text-sm text-text-tertiary">请选择核销方式</p>
              </div>
              <button type="button" aria-label="关闭" onClick={close} className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-surface-subtle text-text-secondary">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-reward-subtle text-reward-text">
                  <Ticket className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary">
                    {activeCoupon.amountLabel ? `${activeCoupon.amountLabel} ${activeCoupon.name}` : activeCoupon.name}
                  </p>
                  <p className="text-xs text-text-tertiary">
                    {activeCoupon.expireAt} 到期 · {activeCoupon.limitNote}
                  </p>
                </div>
              </div>

              <p className="mb-2 mt-5 text-sm font-medium text-text-primary">选择核销方式</p>
              <button
                type="button"
                onClick={() => navigate('/card/verify')}
                className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left active:bg-surface-subtle"
              >
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-surface-subtle text-text-secondary">
                  <QrCode className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-text-primary">扫码核销</span>
                  <span className="block text-xs text-text-tertiary">出示二维码，由门店扫码完成核销</span>
                </span>
                <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full border border-border">
                  <span className="h-2.5 w-2.5 rounded-full bg-transparent" />
                </span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/card/verify/password')}
                className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left active:bg-surface-subtle"
              >
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-surface-subtle text-text-secondary">
                  <KeyRound className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-text-primary">消费密码核销</span>
                  <span className="block text-xs text-text-tertiary">输入 6 位消费密码，由店员确认核销</span>
                </span>
                <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full border border-border">
                  <span className="h-2.5 w-2.5 rounded-full bg-transparent" />
                </span>
              </button>

              <div className="mt-3 flex items-start gap-2 rounded-lg bg-surface-subtle p-3">
                <Info className="mt-0.5 h-4 w-4 flex-none text-text-tertiary" />
                <p className="text-xs text-text-secondary">同一张体验券仅可选择一种核销方式，确认后不可更改</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <DebugPanel route={route} />
    </PageContainer>
  )
}
