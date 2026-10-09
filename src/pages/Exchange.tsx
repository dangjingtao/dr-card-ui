import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Droplets, PartyPopper, Ticket } from 'lucide-react'
import DebugPanel from '../components/mobile/DebugPanel'
import PageContainer from '../components/mobile/PageContainer'
import PromptOverlay from '../components/mobile/PromptOverlay'
import BubbleValueRedeemCard from '../components/card/BubbleValueRedeemCard'
import { BottomSheet, Button, EmptyState, SegmentedControl } from '../components/ui'
import { findRouteByPathname } from '../app/router/routes'
import { runtimePolicy } from '../app/config/runtime'
import { useUserPointsStat } from './points/usePointsFeed'
import { useExchangeCoupons } from './exchange/useExchangeFeed'
import {
  EXCHANGE_CATEGORIES,
  EXCHANGE_COPY,
  resolveExchangeCategory,
  type ExchangeCategory,
} from '../app/fixtures'
import type { CouponRedeemView } from '../services/coupons'
import { redeemExchangeProduct, H014_EXCHANGE_REDEEM_UNAVAILABLE_COPY } from '../services/exchange'
import kitThumb from '../assets/brand/member/checkin-dearseed-kit.webp'

/** 接口 `image` 为空时的券图兜底（沿用已验收品牌图，不新增假字段）。 */
const COUPON_COVER_FALLBACK = kitThumb

const EXCHANGE_REQUEST_ERROR_COPY = '兑换失败，请稍后重试'

type ExchangeAvailability = 'redeemable' | 'insufficient' | 'sold-out' | 'balance-unavailable'

/**
 * 券可兑换状态（与接口字段口径对齐）：
 * - `sold-out` ← 接口 `exchanged_nuuur >= total_number` 或已下架（service 已收敛为 `soldOut`）；
 * - `insufficient` ← 所需泡泡值 `points_number` 高于当前用户可用余额；
 * - 其余为 `redeemable`。
 */
function resolveAvailability(coupon: CouponRedeemView, balance: number | null): ExchangeAvailability {
  if (coupon.soldOut) return 'sold-out'
  if (balance == null) return 'balance-unavailable'
  return coupon.cost > balance ? 'insufficient' : 'redeemable'
}

const availabilityButtonLabel = (state: ExchangeAvailability): string =>
  state === 'sold-out'
    ? EXCHANGE_COPY.soldOut
    : state === 'insufficient'
      ? EXCHANGE_COPY.insufficient
      : EXCHANGE_COPY.action

/**
 * 洗护体验券兑换专区（#18 / #37 / #38 / #39）
 * -------------------------------------------------------------
 * 事实源：docs/prototype/04-mall-card-order.md §1–§3；用户 2026-09-29 提供的界面参考图（图一）。
 * 接口来源：`GET /api/coupons/index`（7002「优惠券管理」，券列表接口，用户 2026-09-29 提供图二）。
 * 已确认：顶部「我的泡泡值 + 立即兑换」余额条、四分类 Tab、两列体验券卡
 *        （券图 / 名称 / 所需泡泡值 / 兑换量 / 已兑完遮罩 / 兑换按钮）、
 *        点击卡片打开兑换弹窗（券图名 / x1 / 说明 / 泡泡值 / 立即兑换）。
 *
 * 数据口径（2026-09-29 与产品确认）：
 * - 当前真实业务只开放「通用体验包」兑换；多分类 / 多券页面结构保留，作为后续恢复多体验券时的扩展位，
 *   不代表当前后端必须实现多 SKU 兑换；
 * - 分类 Tab 只保留 H5 历史页面状态；后端是否支持 `category_id` / 服务端分类过滤仍待确认，
 *   当前请求不携带分类参数，也不预设后端分类主键；
 * - 卡片所需泡泡值 ← `points_number`，兑换量 ← `exchanged_nuuur`，
 *   已兑完 ← `exchanged_nuuur >= total_number` 或已下架，泡泡值不足 ← `points_number > 我的余额`；
 * - 接口无 `desc` / `image` 时分别用 `short_desc` 与本地品牌图兜底。
 *
 * ⚠️ B-024 / B-025 / B-026：排序方向、完整 SKU 清单与泡泡值扣减 / 卡包写入均为服务端规则，
 *    页面只展示接口结果，不做持久化扣减。
 * UX-E（2026-10-09）：分类 / 券选择 / 确认 / 兑换结果只用组件状态，绝不通过 URL 驱动。
 * H014 占位仅允许 Mock 演示；正式 API 未接通之前禁止假成功或模拟扣点入包。
 */
export default function Exchange() {
  const navigate = useNavigate()
  const route = findRouteByPathname('/exchange')
  /** 当前分类只是一项 H5 展示状态，不映射成后台分类参数或 URL。 */
  const [category, setCategory] = useState<ExchangeCategory>('all')
  const [activeProductId, setActiveProductId] = useState<string | null>(null)
  const [simulationComplete, setSimulationComplete] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const submissionLock = useRef(false)
  const couponListRef = useRef<HTMLElement>(null)

  /** GET /api/coupons/index：保持真实列表来源及服务端字段语义。 */
  const { remote: listRemote, reload: reloadCoupons } = useExchangeCoupons()
  const list = listRemote.state === 'success' ? listRemote.data : []

  /** GET /api/userpoints/stat：余额严格取 points。兑换结果不在页面伪扣款。 */
  const { remote: statRemote, reload: reloadPoints } = useUserPointsStat()
  const balance = statRemote.state === 'success' ? statRemote.data.points : null

  // Resolve against current list to prevent a stale coupon selection after a reload.
  const activeProduct = activeProductId === null
    ? null
    : list.find((product) => String(product.id) === activeProductId) ?? null
  const availability = activeProduct ? resolveAvailability(activeProduct, balance) : 'balance-unavailable'

  const closeRedeem = () => {
    if (submissionLock.current) return
    setActiveProductId(null)
    setSubmitError(null)
  }

  const changeCategory = (value: string) => {
    if (submissionLock.current) return
    setCategory(resolveExchangeCategory(value))
    setActiveProductId(null)
    setSubmitError(null)
  }

  const openRedeem = (product: CouponRedeemView) => {
    if (submissionLock.current || simulationComplete) return
    setActiveProductId(String(product.id))
    setSubmitError(null)
  }

  const closeResult = () => {
    setSimulationComplete(false)
    setActiveProductId(null)
    setSubmitError(null)
  }

  const openCardPack = () => {
    closeResult()
    navigate('/card')
  }

  /** 顶部卡已经位于兑换专区内，「立即兑换」只需把用户带到券列表，不应离开本页。 */
  const onBubbleValueRedeem = () => {
    couponListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const submit = async () => {
    if (!activeProduct || availability !== 'redeemable' || submissionLock.current) return
    // #74: No confirmed production endpoint exists. H014 mock is strictly a dev/preview
    // simulation and must not emit a real issue/settlement success in API/test/prod.
    if (runtimePolicy.dataMode !== 'mock') {
      setSubmitError(H014_EXCHANGE_REDEEM_UNAVAILABLE_COPY)
      return
    }

    submissionLock.current = true
    setSubmitting(true)
    setSubmitError(null)
    try {
      await redeemExchangeProduct(String(activeProduct.id))
      setActiveProductId(null)
      setSimulationComplete(true)
      // A mock response does NOT decrement points, issue a coupon or prove real settlement.
      // #74 owns the eventual real endpoint and authoritative refresh rules.
    } catch (error) {
      setSubmitError(error instanceof Error && error.message ? error.message : EXCHANGE_REQUEST_ERROR_COPY)
    } finally {
      submissionLock.current = false
      setSubmitting(false)
    }
  }

  return (
    <PageContainer className="flex flex-col pb-8" inset={false}>
      <BubbleValueRedeemCard
        className="mx-4 mt-3 block h-auto w-auto"
        value={balance ?? '--'}
        onRedeem={onBubbleValueRedeem}
      />

      <SegmentedControl
        variant="accent-pill"
        className="mx-4 mt-2.5"
        items={EXCHANGE_CATEGORIES.map((item) => ({ value: item.key, label: item.label }))}
        value={category}
        onChange={changeCategory}
      />

      <section ref={couponListRef} className="mx-4 mt-3 flex-1" aria-label="洗护体验券列表">
        {listRemote.state === 'loading' ? (
          <ul className="grid grid-cols-2 gap-3" aria-busy>
            {Array.from({ length: 4 }).map((_, index) => (
              <li key={index} className="min-w-0">
                <div className="flex h-full w-full flex-col rounded-[12px] border border-border-subtle bg-surface p-2 shadow-sm">
                  <span className="block aspect-[4/3] w-full animate-pulse rounded-[9px] bg-surface-subtle" />
                  <span className="mt-2 block h-4 w-4/5 animate-pulse rounded bg-surface-subtle" />
                  <span className="mt-2 block h-3.5 w-1/2 animate-pulse rounded bg-surface-subtle" />
                  <span className="mt-2 block h-8 w-full animate-pulse rounded-pill bg-surface-subtle" />
                </div>
              </li>
            ))}
          </ul>
        ) : listRemote.state === 'error' ? (
          <div className="rounded-container bg-surface py-2 shadow-sm">
            <EmptyState
              variant="no-results"
              title={EXCHANGE_COPY.errorTitle}
              supportingText={listRemote.message}
              primaryAction={
                <Button variant="outline" onClick={reloadCoupons}>
                  {EXCHANGE_COPY.retryAction}
                </Button>
              }
            />
          </div>
        ) : list.length === 0 ? (
          <div className="rounded-container bg-surface py-2 shadow-sm">
            <EmptyState
              variant="no-results"
              title={EXCHANGE_COPY.emptyTitle}
              supportingText={EXCHANGE_COPY.emptyDesc}
              primaryAction={
                category === 'all' ? undefined : (
                  <Button variant="outline" onClick={() => changeCategory('all')}>
                    {EXCHANGE_COPY.emptyAction}
                  </Button>
                )
              }
            />
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3" aria-live="polite">
            {list.map((product) => {
              const productState = resolveAvailability(product, balance)
              const image = product.image || COUPON_COVER_FALLBACK
              return (
                <li key={product.id} className="min-w-0">
                  <button
                    type="button"
                    onClick={() => openRedeem(product)}
                    aria-label={`${product.name}，${product.cost} ${EXCHANGE_COPY.costUnit}`}
                    className="flex h-full w-full flex-col rounded-[12px] border border-border-subtle bg-surface p-2 text-left shadow-sm transition active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focused"
                  >
                    <span className="relative block aspect-[4/3] w-full overflow-hidden rounded-[9px] bg-surface-subtle">
                      {image ? (
                        <img src={image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-text-tertiary" aria-hidden>
                          <Droplets className="h-8 w-8" />
                        </span>
                      )}
                      {productState === 'sold-out' && (
                        <span className="absolute inset-0 flex items-center justify-center bg-scrim text-sm font-medium text-text-inverse">
                          {EXCHANGE_COPY.soldOut}
                        </span>
                      )}
                    </span>
                    <p className="mt-2 line-clamp-2 min-h-10 text-[13px] font-medium leading-5 text-text-primary">{product.name}</p>
                    <div className="mt-1 flex items-baseline gap-1 whitespace-nowrap">
                      <span className="text-[15px] font-semibold text-exchange-price-text">
                        {product.cost}
                        <span className="ml-0.5 text-[10px] font-normal">泡泡值</span>
                      </span>
                    </div>
                    <span className="mt-0.5 text-[10px] text-text-tertiary">
                      {EXCHANGE_COPY.redeemedPrefix} {product.redeemed.toLocaleString()}
                    </span>
                    <span
                      className={`mt-2 flex min-h-8 w-full items-center justify-center rounded-pill text-xs font-medium text-text-inverse ${productState === 'redeemable' ? 'bg-surface-inverse' : 'bg-surface-inactive-strong'}`}
                    >
                      {availabilityButtonLabel(productState)}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <button
        type="button"
        onClick={() => navigate('/points')}
        className="mx-4 mt-3 flex min-h-11 items-center gap-2 rounded-container border border-border-subtle bg-surface px-3 text-left shadow-sm"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-reward-subtle text-exchange-accent">
          <Ticket className="h-4 w-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-medium text-text-primary">洗护体验券，先兑后体验</span>
          <span className="block truncate text-[10px] text-text-tertiary">泡泡值可兑换洗护关爱机体验券</span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-text-tertiary" aria-hidden />
      </button>

      {/* #39 体验券兑换弹窗（原型 §3） */}
      <BottomSheet open={activeProduct !== null} title="确认兑换" onClose={closeRedeem}>
        {activeProduct && (
          <>
            <div className="flex gap-3">
              <span className="relative block h-20 w-20 shrink-0 overflow-hidden rounded-coupon bg-surface-subtle">
                {activeProduct.image || COUPON_COVER_FALLBACK ? (
                  <img
                    src={activeProduct.image || COUPON_COVER_FALLBACK}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-text-tertiary" aria-hidden>
                    <Ticket className="h-7 w-7" />
                  </span>
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                  <p className="min-w-0 flex-1 text-sm font-medium text-text-primary">{activeProduct.name}</p>
                  <span className="shrink-0 text-sm text-text-secondary">{EXCHANGE_COPY.quantity}</span>
                </div>
                <p className="mt-1 text-xs leading-5 text-text-secondary">{activeProduct.desc}</p>
                <p className="mt-2 text-base font-semibold text-exchange-price-text">
                  {activeProduct.cost}
                  <span className="ml-0.5 text-xs font-normal">🫧 {EXCHANGE_COPY.costUnit}</span>
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between rounded-control bg-surface-subtle px-3 py-2 text-xs">
              <span className="text-text-secondary">{EXCHANGE_COPY.balanceLabel}</span>
              <span className="font-medium text-text-primary">{balance == null ? '--' : `${balance.toLocaleString()} 🫧`}</span>
            </div>

            {(availability === 'sold-out' || availability === 'insufficient') && (
              <p className="mt-2 text-xs text-danger-text" role="status">
                {availability === 'sold-out' ? EXCHANGE_COPY.soldOut : EXCHANGE_COPY.insufficient}
              </p>
            )}

            {runtimePolicy.dataMode !== 'mock' && (
              <p className="mt-2 text-xs text-text-secondary" role="status">
                {H014_EXCHANGE_REDEEM_UNAVAILABLE_COPY}
              </p>
            )}

            {submitError && (
              <p className="mt-2 text-xs text-danger-text" role="alert">
                {submitError}
              </p>
            )}

            <Button
              size="large"
              className="mt-4 w-full rounded-full"
              loading={submitting}
              disabled={availability !== 'redeemable' || runtimePolicy.dataMode !== 'mock'}
              onClick={() => void submit()}
            >
              {submitting ? EXCHANGE_COPY.submitting : availabilityButtonLabel(availability)}
            </Button>
          </>
        )}
      </BottomSheet>

      <PromptOverlay
        open={simulationComplete}
        label="模拟兑换结果"
        onDismiss={closeResult}
        className="bg-surface px-6 pb-6 pt-7 text-center"
      >
        <div
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-full"
          style={{ background: 'var(--gradient-claim)' }}
          aria-hidden
        >
          <PartyPopper className="h-9 w-9 text-claim-text" />
        </div>
        <h2 className="mt-4 text-lg font-bold leading-6 text-text-primary">
          兑换成功演示
        </h2>
        <p className="mt-2 text-sm leading-6 text-text-secondary">
          仅供 H5 预览。未实际扣除泡泡值，也未发放卡券。
        </p>
        <Button size="large" className="mt-6 h-11 w-full rounded-full" onClick={openCardPack}>
          {EXCHANGE_COPY.successAction}
        </Button>
        <Button variant="ghost" className="mt-2 w-full rounded-full" onClick={closeResult}>
          {EXCHANGE_COPY.successClose}
        </Button>
      </PromptOverlay>

      <DebugPanel route={route} />
    </PageContainer>
  )
}
