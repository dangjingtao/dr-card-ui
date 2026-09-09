import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { MapPin, Minus, Plus, Ticket, ChevronRight, Sparkles } from 'lucide-react'
import {
  DEVICE_LISTS,
  DEVICE_THEMES,
} from '../app/fixtures/device'

/**
 * 扫码购买页（T042）
 * - 扫码自助售货机后进入
 * - 3 款洗发水体验包：去屑 / 控油 / 虫草修复（统一 ¥1/包）
 * - 每款可独立选数量
 * - 优惠券自动抵扣（1 张洗发水体验装抵扣券 = 免 1 包 = 减 ¥1，强制使用）
 * - 底部：应付金额 + 「去结算」pill → 跳订单确认页
 */

export interface VendingProduct {
  id: string
  name: string
  desc: string
  price: number
  /** 顶部渐变背景色 */
  gradient: string
  /** 图标 emoji / 文字占位 */
  iconText: string
}

const PRODUCTS: VendingProduct[] = [
  {
    id: 'anti-dandruff',
    name: '去屑洗发水',
    desc: '净爽去屑 · 控油平衡',
    price: 1,
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    iconText: '去屑',
  },
  {
    id: 'oil-control',
    name: '控油洗发水',
    desc: '深层清洁 · 持久蓬松',
    price: 1,
    gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    iconText: '控油',
  },
  {
    id: 'cordyceps-repair',
    name: '虫草修复洗发水',
    desc: '滋养修护 · 柔顺亮泽',
    price: 1,
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    iconText: '虫草',
  },
]

/** 可用优惠券张数（mock：用户有 1 张体验装抵扣券） */
const AVAILABLE_COUPON_COUNT = 1

export default function VendingBuyPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const deviceId = searchParams.get('id') ?? 'vending-001'

  const device = DEVICE_LISTS.vending?.find((d) => d.id === deviceId)
    ?? DEVICE_LISTS.vending?.[0]
    ?? null

  const theme = DEVICE_THEMES.vending

  /* 各商品数量，默认第 1 款 1 件，其余 0 */
  const [quantities, setQuantities] = useState<Record<string, number>>({
    [PRODUCTS[0].id]: 1,
    [PRODUCTS[1].id]: 0,
    [PRODUCTS[2].id]: 0,
  })

  const totalCount = Object.values(quantities).reduce((sum, q) => sum + q, 0)
  const subtotal = PRODUCTS.reduce(
    (sum, p) => sum + p.price * (quantities[p.id] ?? 0),
    0,
  )

  /* 优惠券抵扣：1 张券抵 1 包 = 减 ¥1，有多少张券就减多少包，但不超过总数量 */
  const couponDeductCount = Math.min(AVAILABLE_COUPON_COUNT, totalCount)
  const couponDeductAmount = couponDeductCount * 1 // 每包 ¥1
  const totalPay = Math.max(0, subtotal - couponDeductAmount)

  const canCheckout = totalCount > 0

  function handleQtyDelta(productId: string, delta: number) {
    setQuantities((prev) => {
      const next = Math.max(0, Math.min(99, (prev[productId] ?? 0) + delta))
      return { ...prev, [productId]: next }
    })
  }

  function handleCheckout() {
    if (!canCheckout) return
    const params = new URLSearchParams()
    params.set('id', deviceId)
    // 把各商品数量传过去
    PRODUCTS.forEach((p) => {
      if ((quantities[p.id] ?? 0) > 0) {
        params.set(p.id, String(quantities[p.id]))
      }
    })
    params.set('coupon', String(couponDeductCount))
    navigate(`/vending/order?${params.toString()}`)
  }

  return (
    <div className="flex h-full w-full flex-col bg-bg-page" data-vending-buy-page>
      {/* 顶部渐变区 */}
      <div
        className="relative overflow-hidden px-4 pb-4 pt-4"
        style={{ background: 'linear-gradient(180deg, #FFF3E6 0%, #FFFFFF 100%)' }}
      >
        {/* 设备信息 */}
        <div className="mb-3 flex items-center gap-2 text-xs text-text-secondary">
          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="truncate">{device?.name ?? '自助售货机'}</span>
          <span className="flex-none rounded-full bg-surface px-2 py-0.5 text-[10px] text-text-tertiary">
            {device?.code}
          </span>
        </div>

        {/* 标题 */}
        <h1 className="text-xl font-bold text-text-primary">洗发水体验装</h1>
        <p className="mt-1 text-xs text-text-tertiary">
          任选搭配 · ¥1/包 · 体验装 10ml
        </p>
      </div>

      {/* 商品列表 */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {PRODUCTS.map((p) => {
          const qty = quantities[p.id] ?? 0
          return (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-container bg-surface p-3"
            >
              {/* 商品图 */}
              <div
                className="flex h-16 w-16 flex-none items-center justify-center rounded-xl text-xs font-bold text-white shadow-sm"
                style={{ background: p.gradient }}
              >
                {p.iconText}
              </div>
              {/* 商品信息 */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text-primary">{p.name}</p>
                <p className="mt-0.5 truncate text-xs text-text-tertiary">{p.desc}</p>
                <p className="mt-1 text-base font-bold text-[#E64A19]">
                  ¥ {p.price.toFixed(2)}
                  <span className="ml-1 text-[10px] font-normal text-text-tertiary">/包</span>
                </p>
              </div>
              {/* 数量选择 */}
              <div className="flex flex-none items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleQtyDelta(p.id, -1)}
                  disabled={qty <= 0}
                  className={`flex h-7 w-7 items-center justify-center rounded-full transition ${
                    qty <= 0
                      ? 'bg-bg-disabled text-text-disabled'
                      : 'bg-bg-page text-text-secondary active:bg-surface-selected'
                  }`}
                  aria-label={`减少${p.name}数量`}
                >
                  <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <span className="w-6 text-center text-sm font-semibold text-text-primary">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => handleQtyDelta(p.id, 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FF8A65] text-white active:bg-[#E64A19]"
                  aria-label={`增加${p.name}数量`}
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          )
        })}

        {/* 优惠券区 */}
        <div className="mt-4 rounded-container bg-surface p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ticket className="h-4 w-4 text-[#E64A19]" aria-hidden="true" />
              <span className="text-sm font-medium text-text-primary">优惠券</span>
              {AVAILABLE_COUPON_COUNT > 0 && (
                <span className="rounded-full bg-[#FFE4D6] px-2 py-0.5 text-[10px] font-medium text-[#E64A19]">
                  {AVAILABLE_COUPON_COUNT} 张可用
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs">
              {couponDeductCount > 0 ? (
                <span className="text-[#E64A19]">
                  已抵扣 {couponDeductCount} 包
                </span>
              ) : (
                <span className="text-text-tertiary">暂不可用</span>
              )}
              <ChevronRight className="h-3.5 w-3.5 text-text-tertiary" aria-hidden="true" />
            </div>
          </div>
          {AVAILABLE_COUPON_COUNT > 0 && (
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-[#FFF3E6] px-3 py-2">
              <Sparkles className="h-3.5 w-3.5 text-[#E64A19]" aria-hidden="true" />
              <p className="flex-1 text-xs text-text-secondary">
                洗发水体验装抵扣券 · 可抵 1 包
              </p>
              <span className="text-xs font-semibold text-[#E64A19]">-¥{couponDeductAmount.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {/* 底部结算栏 */}
      <div className="flex-none border-t border-border-subtle bg-surface px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xs text-text-secondary">合计：</span>
              <span className="text-xl font-bold text-[#E64A19]">¥ {totalPay.toFixed(2)}</span>
            </div>
            {couponDeductCount > 0 && (
              <p className="mt-0.5 text-[10px] text-text-tertiary">
                已优惠 ¥{couponDeductAmount.toFixed(2)}（共 {totalCount} 件）
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleCheckout}
            disabled={!canCheckout}
            className={`flex h-10 items-center gap-1.5 rounded-full px-5 text-sm font-semibold text-white transition ${
              canCheckout
                ? 'shadow-md active:opacity-90'
                : 'cursor-not-allowed opacity-50'
            }`}
            style={{
              background: canCheckout
                ? 'linear-gradient(135deg, #FF8A65 0%, #E64A19 100%)'
                : undefined,
              backgroundColor: canCheckout ? undefined : '#ccc',
            }}
          >
            去结算
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}
