import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  MapPin,
  Ticket,
  Check,
  Package,
  PackageCheck,
  Loader2,
  Sparkles,
} from 'lucide-react'
import {
  DEVICE_LISTS,
  DEVICE_THEMES,
} from '../app/fixtures/device'
import { Button } from '../components/ui/Button'
import { Dialog } from '../components/ui/Dialog'

/**
 * 扫码购买页（T042 + R042）
 * - 扫码自助售货机后进入
 * - 3 款洗发水体验包：去屑 / 控油 / 虫草修复（统一 ¥1/包）
 * - R042：硬件单次仅出 1 包 → 单包单选（去掉数量加减，点选一款出货）
 * - 优惠券自动抵扣（1 张洗发水体验装抵扣券 = 免 1 包 = 减 ¥1，强制使用）
 * - 底部：微信 / 支付宝 支付方式选择 + 确认支付按钮
 * - 支付成功：出货中（3s 倒计时）→ 出货成功弹窗
 */

export interface VendingProduct {
  id: string
  name: string
  desc: string
  price: number
  gradient: string
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

type PayMethod = 'wechat' | 'alipay'
type ShipPhase = 'idle' | 'shipping' | 'success'

export default function VendingBuyPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const deviceId = searchParams.get('id') ?? 'vending-001'

  const device = DEVICE_LISTS.vending?.find((d) => d.id === deviceId)
    ?? DEVICE_LISTS.vending?.[0]
    ?? null

  /* R042：单包单选 — 默认第 1 款；一次只出 1 包 */
  const [selectedProductId, setSelectedProductId] = useState(PRODUCTS[0].id)
  const selectedProduct = PRODUCTS.find((p) => p.id === selectedProductId) ?? null

  const totalCount = selectedProduct ? 1 : 0
  const subtotal = selectedProduct?.price ?? 0

  /* 优惠券抵扣：1 张券抵 1 包 = 减 ¥1（强制优先） */
  const couponDeductCount = Math.min(AVAILABLE_COUPON_COUNT, totalCount)
  const couponDeductAmount = couponDeductCount * 1
  const totalPay = Math.max(0, subtotal - couponDeductAmount)

  const [payMethod, setPayMethod] = useState<PayMethod>('wechat')
  const [paying, setPaying] = useState(false)

  /* 出货状态 */
  const [shipPhase, setShipPhase] = useState<ShipPhase>('idle')
  const [countdown, setCountdown] = useState(3)

  /* 出货倒计时 */
  useEffect(() => {
    if (shipPhase !== 'shipping') return
    if (countdown <= 0) {
      setShipPhase('success')
      return
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [shipPhase, countdown])

  const canPay = selectedProduct != null && !paying

  function handlePay() {
    if (!canPay) return
    setPaying(true)
    // 模拟支付 1.2s
    setTimeout(() => {
      setPaying(false)
      setShipPhase('shipping')
      setCountdown(3)
    }, 1200)
  }

  function handleShipSuccessClose() {
    setShipPhase('idle')
    navigate('/legacy-home')
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
          任选一款 · ¥1/包 · 体验装 10ml
        </p>
      </div>

      {/* 商品列表 + 优惠券 + 支付方式（可滚动） */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {/* 商品：R042 单包单选（一次仅出 1 包） */}
        {PRODUCTS.map((p) => {
          const isSelected = selectedProductId === p.id
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedProductId(p.id)}
              aria-pressed={isSelected}
              aria-label={`选择${p.name}出货`}
              className={`flex w-full items-center gap-3 rounded-container p-3 text-left transition ${
                isSelected
                  ? 'bg-[#FFF3E6] ring-2 ring-[#E64A19]'
                  : 'bg-surface ring-1 ring-transparent'
              }`}
            >
              <div
                className="flex h-16 w-16 flex-none items-center justify-center rounded-xl text-xs font-bold text-white shadow-sm"
                style={{ background: p.gradient }}
              >
                {p.iconText}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text-primary">{p.name}</p>
                <p className="mt-0.5 truncate text-xs text-text-tertiary">{p.desc}</p>
                <p className="mt-1 text-base font-bold text-[#E64A19]">
                  ¥ {p.price.toFixed(2)}
                  <span className="ml-1 text-[10px] font-normal text-text-tertiary">/包</span>
                </p>
              </div>
              <div className="flex flex-none items-center">
                {isSelected ? (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E64A19]">
                    <Check className="h-3.5 w-3.5 text-white" aria-hidden="true" />
                  </span>
                ) : (
                  <span className="h-6 w-6 rounded-full border border-border-subtle" aria-hidden="true" />
                )}
              </div>
            </button>
          )
        })}

        {/* 优惠券区 */}
        <div className="rounded-container bg-surface p-3">
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
            <span className="text-xs text-[#E64A19]">
              {couponDeductCount > 0 ? `已抵扣 ${couponDeductCount} 包` : '暂不可用'}
            </span>
          </div>
          {AVAILABLE_COUPON_COUNT > 0 && (
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-[#FFF3E6] px-3 py-2">
              <Sparkles className="h-3.5 w-3.5 text-[#E64A19]" aria-hidden="true" />
              <p className="flex-1 text-xs text-text-secondary">
                洗发水体验装抵扣券 · 可抵 1 包
              </p>
              <span className="text-xs font-semibold text-[#E64A19]">
                -¥{couponDeductAmount.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* 支付方式 */}
        <div className="rounded-container bg-surface p-3">
          <h3 className="mb-2 text-sm font-semibold text-text-primary">支付方式</h3>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setPayMethod('wechat')}
              className={`flex w-full items-center justify-between rounded-lg p-3 transition ${
                payMethod === 'wechat' ? 'bg-[#F0FDF4] ring-1 ring-green-400' : 'bg-bg-page'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                    <path d="M8.5 11a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm7 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
                    <path d="M12 4C6.477 4 2 7.582 2 12c0 2.55 1.374 4.81 3.5 6.258L4.5 20l2.5-1.25A10.3 10.3 0 0 0 12 20c5.523 0 10-3.582 10-8s-4.477-8-10-8z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-text-primary">微信支付</span>
              </div>
              {payMethod === 'wechat' && (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500">
                  <Check className="h-3 w-3 text-white" aria-hidden="true" />
                </div>
              )}
            </button>

            <button
              type="button"
              onClick={() => setPayMethod('alipay')}
              className={`flex w-full items-center justify-between rounded-lg p-3 transition ${
                payMethod === 'alipay' ? 'bg-[#EFF6FF] ring-1 ring-blue-400' : 'bg-bg-page'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                    <path d="M18.5 8.5c-.5 0-.9.4-.9.9s.4.9.9.9.9-.4.9-.9-.4-.9-.9-.9zm-13 0c-.5 0-.9.4-.9.9s.4.9.9.9.9-.4.9-.9-.4-.9-.9-.9z" />
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-text-primary">支付宝</span>
              </div>
              {payMethod === 'alipay' && (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500">
                  <Check className="h-3 w-3 text-white" aria-hidden="true" />
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 底部结算栏 */}
      <div className="flex-none border-t border-border-subtle bg-surface px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xs text-text-secondary">实付：</span>
              <span className="text-xl font-bold text-[#E64A19]">¥ {totalPay.toFixed(2)}</span>
            </div>
            {couponDeductCount > 0 && (
              <p className="mt-0.5 text-[10px] text-text-tertiary">
                已优惠 ¥{couponDeductAmount.toFixed(2)}（{totalCount} 件）
              </p>
            )}
          </div>
        </div>
        <Button
          size="large"
          className="w-full"
          style={{ background: 'linear-gradient(135deg, #FF8A65 0%, #E64A19 100%)' }}
          onClick={handlePay}
          disabled={!canPay}
        >
          {paying ? '支付中...' : `确认支付 ¥${totalPay.toFixed(2)}`}
        </Button>
      </div>

      {/* 出货中弹窗 */}
      <Dialog
        open={shipPhase === 'shipping'}
        title="正在出货..."
        size="compact"
      >
        <div className="flex flex-col items-center py-4">
          <div className="relative mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#FFF3E6]">
            <Package className="h-10 w-10 text-[#E64A19]" aria-hidden="true" />
            <Loader2 className="absolute -right-1 -top-1 h-6 w-6 animate-spin text-[#FF8A65]" aria-hidden="true" />
          </div>
          <p className="text-lg font-semibold text-text-primary">
            {countdown}s 后出货完成
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            商品正在从取物口送出，请稍候
          </p>
        </div>
      </Dialog>

      {/* 出货成功弹窗 */}
      <Dialog
        open={shipPhase === 'success'}
        title="出货成功！"
        size="compact"
        actions={
          <Button
            className="w-full"
            style={{ background: 'linear-gradient(135deg, #FF8A65 0%, #E64A19 100%)' }}
            onClick={handleShipSuccessClose}
          >
            完成
          </Button>
        }
      >
        <div className="flex flex-col items-center py-4">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <PackageCheck className="h-10 w-10 text-green-600" aria-hidden="true" />
          </div>
          <p className="text-sm text-text-secondary">
            请在取物口领取您的商品
          </p>
          <div className="mt-4 w-full rounded-xl bg-bg-page p-3 text-left text-xs">
            <div className="flex justify-between">
              <span className="text-text-secondary">商品</span>
              <span className="text-text-primary">
                {selectedProduct ? `${selectedProduct.name} · ${totalCount} 包` : '—'}
              </span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-text-secondary">实付</span>
              <span className="font-semibold text-[#E64A19]">¥{totalPay.toFixed(2)}</span>
            </div>
            {couponDeductCount > 0 && (
              <div className="mt-1 flex justify-between">
                <span className="text-text-secondary">优惠</span>
                <span className="text-[#E64A19]">-¥{couponDeductAmount.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      </Dialog>
    </div>
  )
}
