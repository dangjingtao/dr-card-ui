import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronRight, Droplets, Gift, Search, Ticket } from 'lucide-react'
import DebugPanel from '../components/mobile/DebugPanel'
import PageContainer from '../components/mobile/PageContainer'
import { BottomSheet, Button, EmptyState, SegmentedControl } from '../components/ui'
import { useFixtureState, useOverlay } from '../app/fixtures/useFixture'
import { findRouteByPathname } from '../app/router/routes'
import {
  BUBBLE_BALANCE,
  EXCHANGE_CATEGORIES,
  EXCHANGE_COPY,
  exchangeAvailability,
  exchangeProductsByCategory,
  exchangeProductsBySort,
  exchangeSearch,
  resolveExchangeCategory,
  resolveExchangeProduct,
  resolveExchangeSort,
  type ExchangeProductFixture,
} from '../app/fixtures'
import kitThumb from '../assets/brand/member/checkin-dearseed-kit.webp'
import bubbleOrb from '../assets/brand/bubble/checkin-bubble-3d.webp'
import hotBerry from '../assets/brand/exchange/profile-hot-berry.webp'
import hotHoney from '../assets/brand/exchange/profile-hot-honey.webp'
import hotSeasalt from '../assets/brand/exchange/profile-hot-seasalt.webp'
import hotHerbal from '../assets/brand/exchange/profile-hot-herbal.webp'

const PRODUCT_IMAGES: Partial<Record<NonNullable<ExchangeProductFixture['thumb']>, string>> = {
  'dearseed-kit': kitThumb,
  berry: hotBerry,
  honey: hotHoney,
  seasalt: hotSeasalt,
  herbal: hotHerbal,
}

/**
 * 洗护兑换专区（#18 / #37 / #38 / #39）
 * -------------------------------------------------------------
 * 事实源：docs/prototype/04-mall-card-order.md §1–§3
 * 已确认：搜索框、用户参考图确认的四分类 Tab、展示洗护关爱机 SKU、
 *        商品卡含商品名 + 所需泡泡值 + 兑换量、点击商品打开兑换弹窗（商品图名 / x1 / 说明 / 泡泡值 / 立即兑换）。
 * B-008 视觉方向已于 2026-08-24 由用户提供界面参考：采用暖白底、轻量余额、胶囊分段、
 *    三列紧凑商品卡与深色兑换按钮；仍只使用 Com Design exchange-* / bubble-* / coupon-* 语义 Token。
 * ⚠️ B-024 / B-025 / B-026：排序方向、SKU 清单与泡泡值扣减规则见 EXCHANGE_RULE_STATUS，
 *    页面只读夹具，不自行补写业务判定；兑换不做持久化扣减。
 * 可复现状态：?category=shampoo / conditioner / scalp-care，?overlay=redeem&product=e1..e5；
 *              原型排序状态仍保留为 ?state=sort-exchange / sort-points，供调试验收。
 */
export default function Exchange() {
  const navigate = useNavigate()
  const route = findRouteByPathname('/exchange')
  const { state } = useFixtureState(route)
  const { overlay, close } = useOverlay()
  const [searchParams, setSearchParams] = useSearchParams()

  /** 排序状态继续兼容原型直达 URL；前台主 Tab 按用户参考图切换商品分类。 */
  const sort = resolveExchangeSort(state?.key ?? null)
  const category = resolveExchangeCategory(searchParams.get('category'))
  const [keyword, setKeyword] = useState('')

  const list = useMemo(
    () => exchangeSearch(exchangeProductsByCategory(exchangeProductsBySort(sort), category), keyword),
    [category, sort, keyword],
  )

  /** 弹层内展示的商品由 `?product=` 决定，保证兑换弹窗可复现 */
  const activeProduct = resolveExchangeProduct(searchParams.get('product'))
  const availability = exchangeAvailability(activeProduct)

  const [submitting, setSubmitting] = useState(false)
  const timers = useRef<number[]>([])
  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), [])

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
    })
  }

  const openRedeem = (product: ExchangeProductFixture) => {
    patchParams((next) => {
      next.set('product', product.id)
      next.set('overlay', 'redeem')
    })
  }

  const submit = () => {
    if (availability !== 'redeemable' || submitting) return
    setSubmitting(true)
    /** 提交中态：夹具环境下用固定时长模拟一次请求往返，非随机 */
    timers.current.push(
      window.setTimeout(() => {
        setSubmitting(false)
        const query = new URLSearchParams({ product: activeProduct.id })
        if (searchParams.get('debug') === '1') query.set('debug', '1')
        navigate(`/exchange/result?${query.toString()}`)
      }, 700),
    )
  }

  return (
    <PageContainer className="flex flex-col bg-[linear-gradient(180deg,var(--color-reward-subtle)_0%,var(--color-background)_24%)] pb-8" inset={false}>
      <div className="mx-4 mt-1 flex items-center justify-between gap-3">
        <label className="flex min-h-9 flex-1 items-center gap-2 rounded-pill border border-border-subtle bg-surface/90 px-3 text-text-tertiary shadow-sm focus-within:border-border-focused">
          <Search className="h-4 w-4 shrink-0" aria-hidden />
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder={EXCHANGE_COPY.searchPlaceholder}
            aria-label={EXCHANGE_COPY.searchPlaceholder}
            className="min-w-0 flex-1 bg-transparent text-xs text-text-primary outline-none placeholder:text-text-placeholder"
          />
        </label>
        <button
          type="button"
          onClick={() => navigate('/points')}
          className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-pill bg-surface/90 px-2.5 text-xs text-text-secondary shadow-sm transition active:scale-[.98]"
        >
          <img src={bubbleOrb} alt="" className="h-6 w-6 object-contain" />
          <strong className="text-sm font-semibold text-exchange-price-text">{BUBBLE_BALANCE.toLocaleString()}</strong>
          <span className="text-[10px]">泡泡值</span>
        </button>
      </div>

      <SegmentedControl
        variant="accent-pill"
        className="mx-4 mt-2.5"
        items={EXCHANGE_CATEGORIES.map((item) => ({ value: item.key, label: item.label }))}
        value={category}
        onChange={changeCategory}
      />

      <div className="mx-4 mt-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-reward-subtle text-exchange-accent">
          <Gift className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-semibold text-text-primary">小样兑换专区</p>
          <p className="text-[10px] text-text-tertiary">更多小样好礼，超值兑换</p>
        </div>
      </div>

      <section className="mx-4 mt-2.5 flex-1" aria-label="洗护兑换商品列表">
        {list.length === 0 ? (
          <div className="rounded-container bg-surface py-2 shadow-sm">
            <EmptyState
              variant="no-results"
              title={EXCHANGE_COPY.emptyTitle}
              supportingText={EXCHANGE_COPY.emptyDesc}
              primaryAction={
                <Button variant="outline" onClick={() => setKeyword('')}>
                  {EXCHANGE_COPY.emptyAction}
                </Button>
              }
            />
          </div>
        ) : (
          <ul className="grid grid-cols-3 gap-2" aria-live="polite">
            {list.map((product) => {
              const productState = exchangeAvailability(product)
              const image = product.thumb ? PRODUCT_IMAGES[product.thumb] : undefined
              return (
                <li key={product.id} className="min-w-0">
                  <button
                    type="button"
                    onClick={() => openRedeem(product)}
                    aria-label={`${product.name}，${product.cost} ${EXCHANGE_COPY.costUnit}`}
                    className="flex h-full w-full flex-col rounded-[10px] border border-border-subtle bg-surface p-1.5 text-left shadow-sm transition active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focused"
                  >
                    <span className="relative block aspect-[1/1.06] w-full overflow-hidden rounded-[8px] bg-surface-subtle">
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
                    <p className="mt-1.5 line-clamp-2 min-h-8 text-[11px] font-medium leading-4 text-text-primary">{product.name}</p>
                    <div className="mt-1 flex items-baseline gap-1 whitespace-nowrap">
                      <span className="text-sm font-semibold text-exchange-price-text">
                        {product.cost}
                        <span className="ml-0.5 text-[9px] font-normal">泡泡值</span>
                      </span>
                    </div>
                    <span className="mt-0.5 text-[9px] text-text-tertiary">{EXCHANGE_COPY.redeemedPrefix} {product.redeemedLabel}</span>
                    <span
                      className={`mt-1.5 flex min-h-7 w-full items-center justify-center rounded-pill text-[10px] font-medium text-text-inverse ${productState === 'redeemable' ? 'bg-surface-inverse' : 'bg-surface-inactive-strong'}`}
                    >
                      {productState === 'sold-out'
                        ? EXCHANGE_COPY.soldOut
                        : productState === 'insufficient'
                          ? EXCHANGE_COPY.insufficient
                          : EXCHANGE_COPY.action}
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
          <span className="block text-xs font-medium text-text-primary">小样好礼，先兑后洗</span>
          <span className="block truncate text-[10px] text-text-tertiary">泡泡值可兑换洗护关爱机内精选商品</span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-text-tertiary" aria-hidden />
      </button>

      {/* #39 商品兑换弹窗（原型 §3） */}
      <BottomSheet open={overlay === 'redeem'} title="确认兑换" onClose={close}>
        <div className="flex gap-3">
          <span className="relative block h-20 w-20 shrink-0 overflow-hidden rounded-coupon bg-surface-subtle">
            {activeProduct.thumb && PRODUCT_IMAGES[activeProduct.thumb] ? (
              <img src={PRODUCT_IMAGES[activeProduct.thumb]} alt="" className="h-full w-full object-cover" />
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
          <span className="font-medium text-text-primary">{BUBBLE_BALANCE.toLocaleString()} 🫧</span>
        </div>

        {availability !== 'redeemable' && (
          <p className="mt-2 text-xs text-danger-text" role="status">
            {availability === 'sold-out' ? EXCHANGE_COPY.soldOut : EXCHANGE_COPY.insufficient}
          </p>
        )}

        <Button
          size="large"
          className="mt-4 w-full rounded-full"
          loading={submitting}
          disabled={availability !== 'redeemable'}
          onClick={submit}
        >
          {submitting
            ? EXCHANGE_COPY.submitting
            : availability === 'sold-out'
              ? EXCHANGE_COPY.soldOut
              : availability === 'insufficient'
                ? EXCHANGE_COPY.insufficient
                : EXCHANGE_COPY.action}
        </Button>
      </BottomSheet>

      <DebugPanel route={route} />
    </PageContainer>
  )
}
