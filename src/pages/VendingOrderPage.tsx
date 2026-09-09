import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Check,
  Ticket,
  Package,
  PackageCheck,
  Loader2,
  ChevronRight,
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Dialog } from '../components/ui/dialog'

/**
 * 售货机订单确认页（T042）
 * - 上方：应付金额 + 商品明细 + 优惠券抵扣
 * - 下方：微信 / 支付宝 支付方式选择
 * - 支付成功后：出货中（3s 倒计时）→ 出货成功弹窗
 */

interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
}

const PRODUCT_MAP: Record<string, { name: string; price: number }> = {
  'anti-dandruff': { name: '去屑洗发水', price: 1 },
  'oil-control': { name: '控油洗发水', price: 1 },
  'cordyceps-repair': { name: '虫草修复洗发水', price: 1 },
}

type PayMethod = 'wechat' | 'alipay'

type ShipPhase = 'idle' | 'shipping' | 'success'

export default function VendingOrderPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const deviceId = searchParams.get('id') ?? 'vending-001'
  const couponCount = Number(searchParams.get('coupon') ?? 0)

  /* 从 URL 参数解析商品列表 */
  const items: OrderItem[] = Object.keys(PRODUCT_MAP)
    .map((id) => {
      const qty = Number(searchParams.get(id) ?? 0)
      if (qty <= 0) return null
      return { id, name: PRODUCT_MAP[id].name, quantity: qty, price: PRODUCT_MAP[id].price }
    })
    .filter(Boolean) as OrderItem[]

  const totalCount = items.reduce((sum, it) => sum + it.quantity, 0)
  const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0)
  const couponDeduct = couponCount * 1
  const totalPay = Math.max(0, subtotal - couponDeduct)

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

  function handlePay() {
    if (paying) return
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
    // 支付成功后返回上一页（或首页）
    navigate('/legacy-home')
  }

  return (
    <div className="flex h-full w-full flex-col bg-bg-page" data-vending-order-page>
      {/* 顶部金额区 */}
      <div
        className="px-4 pb-8 pt-6"
        style={{ background: 'linear-gradient(180deg, #FFF3E6 0%, #FFFFFF 100%)' }}
      >
        <p className="text-xs text-text-secondary">实付金额</p>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-3xl font-bold text-[#E64A19]">¥ {totalPay.toFixed(2)}</span>
        </div>
        {couponDeduct > 0 && (
          <p className="mt-1 text-xs text-[#E64A19]">
            已优惠 ¥{couponDeduct.toFixed(2)}（{couponCount} 张体验装抵扣券）
          </p>
        )}
      </div>

      {/* 商品明细 */}
      <div className="flex-1 space-y-3 px-4 py-4">
        <div className="rounded-container bg-surface p-3">
          <h3 className="mb-2 text-sm font-semibold text-text-primary">商品明细</h3>
          <div className="space-y-2">
            {items.map((it) => (
              <div key={it.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFF3E6] text-[10px] font-bold text-[#E64A19]">
                    {it.name.slice(0, 2)}
                  </div>
                  <span className="text-text-primary">{it.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-text-primary">¥{it.price.toFixed(2)}</span>
                  <span className="ml-2 text-text-tertiary">× {it.quantity}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 border-t border-border-subtle pt-2 text-xs">
            <div className="flex justify-between text-text-secondary">
              <span>共 {totalCount} 件</span>
              <span>小计 ¥{subtotal.toFixed(2)}</span>
            </div>
            {couponDeduct > 0 && (
              <div className="mt-1 flex justify-between text-[#E64A19]">
                <span className="flex items-center gap-1">
                  <Ticket className="h-3 w-3" aria-hidden="true" />
                  优惠券抵扣
                </span>
                <span>-¥{couponDeduct.toFixed(2)}</span>
              </div>
            )}
          </div>
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

      {/* 底部支付按钮 */}
      <div className="flex-none border-t border-border-subtle bg-surface px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs text-text-secondary">实付</span>
          <span className="text-xl font-bold text-[#E64A19]">¥ {totalPay.toFixed(2)}</span>
        </div>
        <Button
          size="large"
          className="w-full"
          style={{ background: 'linear-gradient(135deg, #FF8A65 0%, #E64A19 100%)' }}
          onClick={handlePay}
          disabled={paying || items.length === 0}
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
              <span className="text-text-primary">{items.length} 款共 {totalCount} 包</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-text-secondary">实付</span>
              <span className="font-semibold text-[#E64A19]">¥{totalPay.toFixed(2)}</span>
            </div>
            {couponDeduct > 0 && (
              <div className="mt-1 flex justify-between">
                <span className="text-text-secondary">优惠</span>
                <span className="text-[#E64A19]">-¥{couponDeduct.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      </Dialog>
    </div>
  )
}
