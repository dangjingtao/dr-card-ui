import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronRight, Droplets, Ticket } from 'lucide-react'
import DebugPanel from '../components/mobile/DebugPanel'
import PageContainer from '../components/mobile/PageContainer'
import BubbleValueRedeemCard from '../components/card/BubbleValueRedeemCard'
import { BottomSheet, Button, EmptyState, SegmentedControl } from '../components/ui'
import { useOverlay } from '../app/fixtures/useFixture'
import { findRouteByPathname } from '../app/router/routes'
import { useUserPointsStat } from './points/usePointsFeed'
import { useExchangeCoupons } from './exchange/useExchangeFeed'
import {
  EXCHANGE_CATEGORIES,
  EXCHANGE_COPY,
  resolveExchangeCategory,
  resolveExchangeCategoryId,
} from '../app/fixtures'
import type { CouponRedeemView } from '../services/coupons'
import { redeemExchangeProduct } from '../services/exchange'
import kitThumb from '../assets/brand/member/checkin-dearseed-kit.webp'

/** 接口 `image` 为空时的券图兜底（沿用已验收品牌图，不新增假字段）。 */
const COUPON_COVER_FALLBACK = kitThumb

const EXCHANGE_REQUEST_ERROR_COPY = '兑换失败，请稍后重试'

type ExchangeAvailability = 'redeemable' | 'insufficient' | 'sold-out'

/**
 * 券可兑换状态（与接口字段口径对齐）：
 * - `sold-out` ← 接口 `exchanged_nuuur >= total_number` 或已下架（service 已收敛为 `soldOut`）；
 * - `insufficient` ← 所需泡泡值 `points_number` 高于当前用户可用余额；
 * - 其余为 `redeemable`。
 */
function resolveAvailability(coupon: CouponRedeemView, balance: number | null): ExchangeAvailability {
  if (coupon.soldOut) return 'sold-out'
  if (balance == null) return 'redeemable'
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
 * - 分类 Tab 按 `category_id` **服务端过滤**，切换 Tab 重新请求；
 * - 卡片所需泡泡值 ← `points_number`，兑换量 ← `exchanged_nuuur`，
 *   已兑完 ← `exchanged_nuuur >= total_number` 或已下架，泡泡值不足 ← `points_number > 我的余额`；
 * - 接口无 `desc` / `image` 时分别用 `short_desc` 与本地品牌图兜底。
 *
 * ⚠️ B-024 / B-025 / B-026：排序方向、完整 SKU 清单与泡泡值扣减 / 卡包写入均为服务端规则，
 *    页面只展示接口结果，不做持久化扣减。
 * 可复现状态：?category=shampoo / conditioner / scalp-care，?overlay=redeem&product=<券id>。
 */
export default function Exchange() {
  const navigate = useNavigate()
  const route = findRouteByPathname('/exchange')
  const { overlay, close } = useOverlay()
  const [searchParams, setSearchParams] = useSearchParams()

  /** 前台主 Tab 按用户参考图切换体验券分类；分类由后端 `category_id` 服务端过滤。 */
  const category = resolveExchangeCategory(searchParams.get('category'))
  const categoryId = resolveExchangeCategoryId(category)

  /** GET /api/coupons/index：分类切换带 category_id 重新请求（服务端过滤）。 */
  const { remote: listRemote, reload } = useExchangeCoupons(categoryId)
  const list = listRemote.state === 'success' ? listRemote.data : []

  /** GET /api/userpoints/stat：可用余额严格取 points，不用 income - expense 反推。 */
  const { remote: statRemote } = useUserPointsStat()
  const balance = statRemote.state === 'success' ? statRemote.data.points : null

  /** 弹层内展示的体验券由 `?product=` 决定，保证兑换弹窗可复现 */
  const activeProductId = searchParams.get('product')
  const activeProduct =
    list.find((item) => String(item.id) === activeProductId) ?? list[0] ?? null
  const availability = activeProduct ? resolveAvailability(activeProduct, balance) : 'redeemable'

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const patchParams = (patch: (next: URLSearchParams) => void) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        patch(next)
        return next
      },
      { replace: true },
    )
  }

  const changeCategory = (value: string) => {
    const nextCategory = resolveExchangeCategory(value)
    patchParams((next) => {
      if (nextCategory === 'all') next.delete('category')
      else next.set('category', nextCategory)
      /** 分类切换后原券可能不在新列表里，清掉弹层选中券避免错配。 */
      next.delete('product')
    })
    close()
  }

  const openRedeem = (product: CouponRedeemView) => {
    setSubmitError(null)
    patchParams((next) => {
      next.set('product', String(product.id))
      next.set('overlay', 'redeem')
    })
  }

  /** banner 整卡点击与右上角「泡泡值」胶囊同源，统一进入 /points。 */
  const onBubbleValueRedeem = () => {
    navigate('/points')
  }

  const submit = async () => {
    if (!activeProduct || availability !== 'redeemable' || submitting) return

    setSubmitting(true)
    setSubmitError(null)
    try {
      await redeemExchangeProduct(String(activeProduct.id))
      setSubmitting(false)
      const query = new URLSearchParams({ product: String(activeProduct.id) })
      if (searchParams.get('debug') === '1') query.set('debug', '1')
      navigate(`/exchange/result?${query.toString()}`)
    } catch {
      setSubmitting(false)
      setSubmitError(EXCHANGE_REQUEST_ERROR_COPY)
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

      <section className="mx-4 mt-3 flex-1" aria-label="洗护体验券列表">
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
                <Button variant="outline" onClick={reload}>
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
      <BottomSheet open={overlay === 'redeem' && activeProduct !== null} title="确认兑换" onClose={close}>
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

            {availability !== 'redeemable' && (
              <p className="mt-2 text-xs text-danger-text" role="status">
                {availability === 'sold-out' ? EXCHANGE_COPY.soldOut : EXCHANGE_COPY.insufficient}
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
              disabled={availability !== 'redeemable'}
              onClick={() => void submit()}
            >
              {submitting ? EXCHANGE_COPY.submitting : availabilityButtonLabel(availability)}
            </Button>
          </>
        )}
      </BottomSheet>

      <DebugPanel route={route} />
    </PageContainer>
  )
}
