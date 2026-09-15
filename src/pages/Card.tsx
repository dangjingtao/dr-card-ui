import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CalendarDays, Check, ChevronRight, Clock, Info, KeyRound, QrCode, ReceiptText, Ticket, X } from 'lucide-react'
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
  COUPON_USE_GUIDE,
} from '../app/fixtures'

/**
 * 电影票样式卡券（自营页面专用 - 第一版）
 * -------------------------------------------------------------
 * 视觉特征：
 *  - 横向票，左右两端各一个半圆缺口（撕齿效果）
 *  - 中间用虚线分隔线把票分成两半：
 *    左半：金色渐变色块（active）/ 灰色（used/expired），大金额 + 副券名
 *    右半：白底，标题 + 到期 + 状态 + 使用须知 + 操作按钮
 *  - 底部细灰色券号（票根感）
 * - 把所有样式 inline 写在本组件里，方便后续整体替换为更精细的版本。
 * - 不引入 CSS 变量，固定值先用 Tailwind class 表达；金色渐变通过 inline style 注入。
 */
interface MovieTicketProps {
  coupon: CardCouponFixture
  /** 是否已过期（叠加全卡 opacity） */
  expired?: boolean
  /** 是否已使用（左右色块灰化，但保留布局） */
  used?: boolean
  onUse: () => void
  onShare: () => void
}

const NOTCH_SIZE = 14 // 两端半圆缺口直径（px）

function MovieTicket({ coupon, expired, used, onUse, onShare }: MovieTicketProps) {
  const isInactive = expired || used
  /** 左半色块：金 vs 灰 */
  const leftBg = isInactive
    ? 'linear-gradient(135deg, #bdbdbd 0%, #9e9e9e 100%)'
    : 'linear-gradient(135deg, var(--color-reward) 0%, var(--color-reward-strong) 100%)'
  /** 操作按钮可用性 */
  const canAction = !isInactive
  return (
    <article
      className="relative"
      aria-label={`${coupon.name}${coupon.amountLabel ?? ''} - ${isInactive ? (expired ? '已过期' : '已使用') : '可用'}`}
    >
      {/* 外层卡片 + 圆角 + 阴影；overflow-hidden 负责裁掉左右两个 notch 的内圈 */}
      <div className={`relative overflow-hidden rounded-[16px] bg-surface shadow-sm ${expired ? 'opacity-90' : ''}`}>
        {/* 左端半圆缺口（撕齿）：用绝对定位的圆形 + 与背景同色覆盖实现 */}
        <span
          aria-hidden
          className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-surface-inactive"
          style={{ width: NOTCH_SIZE, height: NOTCH_SIZE }}
        />
        <span
          aria-hidden
          className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 rounded-full bg-surface-inactive"
          style={{ width: NOTCH_SIZE, height: NOTCH_SIZE }}
        />

        {/* 主体：flex 左右两栏 */}
        <div className="flex">
          {/* 左半：色块区 */}
          <div
            className="flex flex-col items-center justify-center px-4 py-4 text-center"
            style={{
              background: leftBg,
              minWidth: 120,
              flex: '0 0 auto',
            }}
            aria-hidden
          >
            {coupon.amountLabel ? (
              <div className="flex items-baseline gap-0.5 leading-none text-white">
                <span className="text-lg font-semibold">¥</span>
                <span className="text-[34px] font-bold tracking-tight">{coupon.amountLabel.replace('¥', '')}</span>
              </div>
            ) : (
              <Ticket className="h-7 w-7 text-white" strokeWidth={1.8} />
            )}
            <span className="mt-2 text-[11px] font-medium tracking-widest text-white/85">卡券</span>
          </div>

          {/* 中间虚线撕齿分隔 */}
          <div
            aria-hidden
            className="my-3 border-l border-dashed"
            style={{ borderColor: isInactive ? '#cfcfcf' : 'var(--color-reward-soft)' }}
          />

          {/* 右半：内容区 */}
          <div className="flex-1 px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className={`min-w-0 truncate text-[15px] font-semibold ${isInactive ? 'text-coupon-used' : 'text-text-primary'}`}>
                {coupon.name}
              </h3>
              <span
                className={`inline-flex h-5 flex-none items-center gap-1 rounded-full px-2 text-[10px] font-semibold ${
                  expired
                    ? 'bg-surface-inactive text-text-inactive-muted'
                    : used
                      ? 'bg-coupon-used-bg text-coupon-used'
                      : 'bg-reward-subtle text-reward-text'
                }`}
              >
                {expired ? <Clock className="h-3 w-3" /> : used ? <ReceiptText className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                {expired ? '已过期' : used ? '已使用' : '可用'}
              </span>
            </div>

            <div className={`mt-1.5 flex items-center gap-1 text-[11px] ${isInactive ? 'text-text-inactive-muted' : 'text-text-tertiary'}`}>
              <CalendarDays className="h-3 w-3" />
              {coupon.expireAt} 到期
            </div>

            {coupon.limitNote && (
              <div className={`mt-1 text-[11px] ${isInactive ? 'text-text-inactive-muted' : 'text-text-tertiary'}`}>
                {coupon.limitNote}
              </div>
            )}

            {/* 操作按钮：等宽并列、无主辅关系。
             *  使用：橙色实心 pill；转赠：白底描边 pill。
             *  两个按钮 flex-1 平分宽度，视觉权重一致。
             *  已过期：两按钮都禁用；已使用：使用按钮隐藏（演示态）。 */}
            <div className="mt-3 flex items-center gap-2">
              {!used && !expired && (
                <button
                  type="button"
                  onClick={onUse}
                  className="h-8 flex-1 rounded-full bg-primary text-[12px] font-semibold text-text-inverse shadow-primary-button active:bg-primary-pressed"
                >
                  使用
                </button>
              )}
              <button
                type="button"
                onClick={onShare}
                disabled={!canAction}
                className={`h-8 flex-1 rounded-full border text-[12px] font-semibold ${
                  canAction
                    ? 'border-border-strong bg-transparent text-text-secondary active:bg-surface-subtle'
                    : 'border-border bg-transparent text-text-inactive-muted'
                }`}
              >
                转赠
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

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
            <MovieTicket
              key={coupon.id}
              coupon={coupon}
              onUse={() => openUseSheet(coupon)}
              onShare={() => navigate(`/card/share?coupon=${coupon.id}`)}
            />
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
            <MovieTicket
              key={coupon.id}
              coupon={coupon}
              used
              onUse={() => openUseSheet(coupon)}
              onShare={() => navigate(`/card/share?coupon=${coupon.id}`)}
            />
          ))}

        {tab === 'expired' &&
          list.map((coupon) => (
            <MovieTicket
              key={coupon.id}
              coupon={coupon}
              expired
              onUse={() => openUseSheet(coupon)}
              onShare={() => navigate(`/card/share?coupon=${coupon.id}`)}
            />
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
                <p className="text-sm text-text-tertiary">{COUPON_USE_GUIDE.subtitle}</p>
              </div>
              <button type="button" aria-label="关闭" onClick={close} className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-surface-subtle text-text-secondary">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-4 py-3">
              {/* T044｜原「查看商城体验券商品」按钮改为纯展示块，去掉 onClick/aria-label/ChevronRight。
               *  不加 pill 背景，仅保留图标 + 文案，作为下方核销 pill 的「标题/上下文」。
               *  mt-4 仍保留，与下方核销 pill 间距加大。 */}
              <div className="-m-2.5 flex items-center gap-3 rounded-xl p-2.5">
                <span className="flex h-10 w-10 flex-none items-center justify-center self-center rounded-full bg-surface text-reward-strong shadow-sm">
                  <Ticket className="h-5 w-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-text-primary">
                    {activeCoupon.amountLabel ? `${activeCoupon.amountLabel} ${activeCoupon.name}` : activeCoupon.name}
                  </span>
                  <span className="block text-xs text-text-tertiary">
                    {activeCoupon.expireAt} 到期 · {activeCoupon.limitNote}
                  </span>
                </span>
              </div>

              {/* T044｜移除 radio 圆圈与二选一控件，改为两行并列的使用指引。
               *  扫码核销：系统会优先抵扣体验券
               *  消费密码核销：在设备上输入手机号和 6 位消费密码，点击确认即可领取
               *  mt-4：券卡与下方核销 pill 之间加大间距（PRD 要求）。 */}
              <div className="mt-4 space-y-2">
                {/* T044｜两个 pill 高度统一 h-20，icon + 文字 self-center 上下居中。
                 *  扫码/密码两行文案长度不同，靠固定高度 + flex 居中让两个 pill 视觉一致。 */}
                <button
                  type="button"
                  onClick={() => navigate('/card/verify')}
                  className="flex h-20 w-full items-center gap-3 rounded-pill bg-surface-subtle p-3 text-left active:bg-surface-selected"
                >
                  <span className="flex h-10 w-10 flex-none items-center justify-center self-center rounded-full bg-surface text-reward-strong shadow-sm">
                    <QrCode className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1 self-center">
                    <span className="block text-sm font-medium text-text-primary">扫码核销</span>
                    <span className="mt-1 block text-xs leading-4 text-text-tertiary">
                      {COUPON_USE_GUIDE.scanHint}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/card/verify/password')}
                  className="flex h-20 w-full items-center gap-3 rounded-pill bg-surface-subtle p-3 text-left active:bg-surface-selected"
                >
                  <span className="flex h-10 w-10 flex-none items-center justify-center self-center rounded-full bg-surface text-reward-strong shadow-sm">
                    <KeyRound className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1 self-center">
                    <span className="block text-sm font-medium text-text-primary">消费密码核销</span>
                    <span className="mt-1 block text-xs leading-4 text-text-tertiary">
                      {COUPON_USE_GUIDE.passwordHint}
                    </span>
                  </span>
                </button>
              </div>

              <div className="mt-3 flex items-start gap-2 rounded-lg bg-surface-subtle p-3">
                <Info className="mt-0.5 h-4 w-4 flex-none text-text-tertiary" />
                <p className="text-xs text-text-secondary">{COUPON_USE_GUIDE.footnote}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <DebugPanel route={route} />
    </PageContainer>
  )
}
