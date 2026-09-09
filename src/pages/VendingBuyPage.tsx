import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { MapPin, Minus, Plus, Package, Check, Wallet, ShoppingBag } from 'lucide-react'
import {
  DEVICE_LISTS,
  DEVICE_THEMES,
} from '../app/fixtures/device'
import { useUserInfo, userInfoActions } from './legacy/userInfoStore'
import { Button } from '../components/ui/button'
import { Dialog } from '../components/ui/dialog'

/**
 * 扫码购买页（T042）
 * - 扫码自助售货机后进入
 * - 展示商品（洗发水体验包）+ 数量选择
 * - 使用账户余额支付
 * - 购买成功弹窗
 */

interface Product {
  id: string
  name: string
  desc: string
  price: number
  originalPrice?: number
}

const PRODUCTS: Product[] = [
  {
    id: 'shampoo-trial',
    name: '洗发水体验包',
    desc: '卡博士定制 · 氨基酸配方 · 10ml',
    price: 2.99,
    originalPrice: 5.9,
  },
  {
    id: 'shampoo-trial-3',
    name: '洗发水体验包 ×3',
    desc: '卡博士定制 · 3 连包更划算',
    price: 7.99,
    originalPrice: 17.7,
  },
]

export default function VendingBuyPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const deviceId = searchParams.get('id') ?? 'vending-001'

  const device = DEVICE_LISTS.vending?.find((d) => d.id === deviceId)
    ?? DEVICE_LISTS.vending?.[0]
    ?? null

  const theme = DEVICE_THEMES.vending
  const userInfo = useUserInfo()
  const balance = userInfo.balance

  const [selectedProductId, setSelectedProductId] = useState(PRODUCTS[0].id)
  const [quantity, setQuantity] = useState(1)
  const [paying, setPaying] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const selectedProduct = PRODUCTS.find((p) => p.id === selectedProductId) ?? PRODUCTS[0]
  const totalPrice = +(selectedProduct.price * quantity).toFixed(2)
  const canPay = balance >= totalPrice && quantity > 0 && !paying

  function handleQuantityDelta(delta: number) {
    setQuantity((q) => Math.max(1, Math.min(99, q + delta)))
  }

  function handlePay() {
    if (!canPay) return
    setPaying(true)
    // 模拟支付流程
    setTimeout(() => {
      userInfoActions.update({ balance: +(balance - totalPrice).toFixed(2) })
      setPaying(false)
      setShowSuccess(true)
    }, 1200)
  }

  function handleCloseSuccess() {
    setShowSuccess(false)
    navigate(-1)
  }

  return (
    <div className="flex h-full w-full flex-col bg-bg-page" data-vending-buy-page>
      {/* 商品头部区 */}
      <div
        className="relative overflow-hidden px-4 pb-6 pt-4"
        style={{ background: 'linear-gradient(180deg, #FFF3E6 0%, #FFFFFF 100%)' }}
      >
        {/* 设备信息 */}
        <div className="mb-4 flex items-center gap-2 text-xs text-text-secondary">
          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="truncate">{device?.name ?? '自助售货机'}</span>
          <span className="flex-none rounded-full bg-surface px-2 py-0.5 text-[10px] text-text-tertiary">
            {device?.code}
          </span>
        </div>

        {/* 商品主图占位（渐变 + 图标） */}
        <div className="relative mx-auto mb-4 flex h-48 w-48 items-center justify-center rounded-3xl bg-white shadow-lg">
          <div
            className="absolute inset-4 rounded-2xl opacity-20"
            style={{ background: theme.iconBg }}
          />
          <div className="relative flex flex-col items-center gap-2">
            <ShoppingBag className="h-16 w-16" style={{ color: '#E64A19' }} aria-hidden="true" />
            <span className="text-xs text-text-tertiary">商品示意图</span>
          </div>
        </div>

        {/* 商品名 + 价格 */}
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-text-primary">{selectedProduct.name}</h1>
          <p className="text-xs text-text-tertiary">{selectedProduct.desc}</p>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-bold" style={{ color: '#E64A19' }}>
              ¥ {selectedProduct.price.toFixed(2)}
            </span>
            {selectedProduct.originalPrice && (
              <span className="text-xs text-text-tertiary line-through">
                ¥ {selectedProduct.originalPrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 商品选择列表 */}
      <div className="flex-1 px-4 py-4">
        <h3 className="mb-3 text-sm font-semibold text-text-primary">选择规格</h3>
        <div className="space-y-2">
          {PRODUCTS.map((p) => {
            const active = p.id === selectedProductId
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSelectedProductId(p.id)
                  setQuantity(1)
                }}
                className={`flex w-full items-center justify-between rounded-container bg-surface p-3 text-left transition ${
                  active ? 'ring-2 ring-[#FF8A65]' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-[#FFF3E6]"
                  >
                    <Package className="h-6 w-6 text-[#E64A19]" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text-primary">{p.name}</p>
                    <p className="truncate text-xs text-text-tertiary">{p.desc}</p>
                  </div>
                </div>
                <div className="flex flex-none items-center gap-2">
                  <span className="text-base font-semibold text-[#E64A19]">
                    ¥ {p.price.toFixed(2)}
                  </span>
                  {active && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FF8A65]">
                      <Check className="h-3 w-3 text-white" aria-hidden="true" />
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* 数量选择 */}
        <div className="mt-6 flex items-center justify-between rounded-container bg-surface p-4">
          <span className="text-sm font-medium text-text-primary">购买数量</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleQuantityDelta(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-page text-text-secondary active:bg-surface-selected"
              aria-label="减少数量"
            >
              <Minus className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="w-8 text-center text-base font-semibold text-text-primary">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => handleQuantityDelta(1)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF8A65] text-white active:bg-[#E64A19]"
              aria-label="增加数量"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* 底部结算栏 */}
      <div className="flex-none border-t border-border-subtle bg-surface px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <Wallet className="h-4 w-4" aria-hidden="true" />
            <span>余额：¥ {balance.toFixed(2)}</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-text-secondary">合计：</span>
            <span className="text-xl font-bold text-[#E64A19]">¥ {totalPrice.toFixed(2)}</span>
          </div>
        </div>
        <Button
          size="large"
          className="w-full"
          style={{ background: 'linear-gradient(135deg, #FF8A65 0%, #E64A19 100%)' }}
          onClick={handlePay}
          disabled={!canPay}
        >
          {paying ? '支付中...' : balance < totalPrice ? '余额不足，请先充值' : '立即购买'}
        </Button>
      </div>

      {/* 购买成功弹窗 */}
      <Dialog
        open={showSuccess}
        title="购买成功"
        onClose={handleCloseSuccess}
        size="compact"
        actions={
          <Button
            className="w-full"
            style={{ background: 'linear-gradient(135deg, #FF8A65 0%, #E64A19 100%)' }}
            onClick={handleCloseSuccess}
          >
            完成
          </Button>
        }
      >
        <div className="flex flex-col items-center py-2">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <Check className="h-7 w-7 text-green-600" aria-hidden="true" />
          </div>
          <p className="text-sm text-text-secondary">商品已从售货机送出，请在取物口领取</p>
          <div className="mt-4 w-full rounded-xl bg-bg-page p-3 text-left">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">商品</span>
              <span className="text-text-primary">{selectedProduct.name}</span>
            </div>
            <div className="mt-1 flex justify-between text-sm">
              <span className="text-text-secondary">数量</span>
              <span className="text-text-primary">× {quantity}</span>
            </div>
            <div className="mt-1 flex justify-between text-sm">
              <span className="text-text-secondary">实付</span>
              <span className="font-semibold text-[#E64A19]">¥ {totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
