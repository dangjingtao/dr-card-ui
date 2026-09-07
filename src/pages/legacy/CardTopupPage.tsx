import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Building2, Loader2, Check } from 'lucide-react'
import { findCard } from './cardStore'

/* 快捷金额按钮：1 / 10 / 20 / 50 / 100 / 200 */
const QUICK_AMOUNTS = [1, 10, 20, 50, 100, 200]

/* 支付方式 */
const PAY_CHANNELS = [
  {
    id: 'wechat' as const,
    label: '微信支付',
    bg: 'from-[#07C160] to-[#10B981]',
    iconPath:
      'M9.5 4C5.36 4 2 6.69 2 10c0 1.81 1 3.44 2.59 4.53L4 17l2.71-1.41c.88.21 1.81.34 2.79.36-.07-.34-.1-.7-.1-1.06 0-3.31 3.13-6 7-6 .36 0 .72.02 1.06.07C16.95 6.06 13.55 4 9.5 4zm-2.4 4.5a.9.9 0 110 1.8.9.9 0 010-1.8zm4.8 0a.9.9 0 110 1.8.9.9 0 010-1.8zM16.4 10c-3.31 0-6 2.13-6 4.75 0 1.5.85 2.85 2.18 3.74L12 20l1.99-1.04c.71.16 1.46.27 2.24.29.21 0 .42-.01.62-.02L19 20l-.43-1.85C20.32 17.18 22 15.45 22 13.5c0-2.62-2.69-4.75-6-4.75zm-2 3.2a.7.7 0 110 1.4.7.7 0 010-1.4zm4 0a.7.7 0 110 1.4.7.7 0 010-1.4z',
  },
  {
    id: 'alipay' as const,
    label: '支付宝',
    bg: 'from-[#1677FF] to-[#4096FF]',
    iconPath:
      'M18.5 2h-13A2.5 2.5 0 003 4.5v15A2.5 2.5 0 005.5 22h13a2.5 2.5 0 002.5-2.5v-15A2.5 2.5 0 0018.5 2zm-7.5 18c-3.6 0-6.5-2.5-6.5-5.5s2.9-5.5 6.5-5.5c1.5 0 2.9.4 4 1.1l-1.6 1.5c-.7-.5-1.5-.7-2.4-.7-2.5 0-4.5 1.6-4.5 3.6s2 3.6 4.5 3.6c.6 0 1.2-.1 1.7-.3l-.7-2H8v-2h4.5l1 3c-.8.4-1.7.6-2.5.6-3.6 0-6.5-2.5-6.5-5.5z',
  },
]

/**
 * T031｜卡的充值/退款页（图2）
 * -------------------------------------------------------------
 * 顶部蓝色背景 + 卡博士库存项目
 * 购买金额(元) 输入 + 6 个快捷金额（充1/10/20/50/100/200）
 * 支付方式：微信 / 支付宝
 * 灰色「确认提交」+ 绿色「退款」+ 温馨提示
 *
 * 按截图：确认提交按钮灰色（loading 时也是灰色 disabled 态）
 */
export default function CardTopupPage() {
  const navigate = useNavigate()
  const { id = '' } = useParams()
  const card = findCard(id)

  const [amount, setAmount] = useState<string>('1')
  const [channel, setChannel] = useState<'wechat' | 'alipay'>('wechat')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!card) {
    return (
      <div className="mx-auto flex min-h-full max-w-[480px] flex-col items-center justify-center bg-[#F8F8FA]">
        <div className="text-sm text-text-tertiary">卡片不存在</div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mt-4 text-sm text-[#B8893D]"
        >
          返回
        </button>
      </div>
    )
  }

  const numericAmount = parseFloat(amount || '0') || 0
  const selectedQuick = QUICK_AMOUNTS.find((q) => q === numericAmount)

  const handleConfirm = async () => {
    setError('')
    if (numericAmount <= 0) {
      setError('请输入大于 0 的金额')
      return
    }
    setSubmitting(true)
    setTimeout(() => {
      setSubmitting(false)
      alert(`充值成功 ¥${numericAmount.toFixed(2)}`)
      navigate(`/legacy-profile/my-cards/${id}`)
    }, 800)
  }

  return (
    <div className="mx-auto flex min-h-full max-w-[480px] flex-col bg-[#F8F8FA]">
      {/* 顶部蓝色背景 */}
      <div
        className="relative shrink-0 px-5 pt-12 pb-6"
        style={{ background: '#1E40AF' }}
      >
        <button
          type="button"
          aria-label="返回"
          onClick={() => navigate(-1)}
          className="absolute left-4 top-12 flex h-10 w-10 items-center justify-center text-white active:opacity-80"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <div className="mt-12 flex items-center gap-2.5 text-white">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full text-white shadow-sm"
            style={{ background: '#DC2626' }}
          >
            {/* 卡博士 logo */}
            <span className="text-sm font-bold">卡</span>
          </div>
          <div className="text-base font-semibold">{card.projectName}</div>
        </div>
      </div>

      {/* 购买金额 */}
      <div className="mx-4 mt-4 rounded-2xl bg-white p-5 shadow-sm">
        <div className="text-sm text-text-primary">购买金额(元)</div>
        <div className="mt-2 flex items-start gap-2 border-b border-divider py-2">
          <span className="mt-1 text-base text-text-secondary">¥</span>
          <input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value)
              setError('')
            }}
            className="flex-1 bg-transparent text-2xl font-medium text-text-primary outline-none"
            placeholder="0"
          />
          <span className="mt-1 text-xs text-text-tertiary">元</span>
        </div>
        <div className="mt-1 text-xs text-text-tertiary">最多可输入金额200元</div>

        {/* 快捷金额（6 个：1/10/20/50/100/200，三列两行） */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          {QUICK_AMOUNTS.map((q) => {
            const active = selectedQuick === q
            return (
              <button
                key={q}
                type="button"
                onClick={() => {
                  setAmount(String(q))
                  setError('')
                }}
                className={`relative rounded-xl border py-3 text-center text-base transition ${
                  active
                    ? 'border-[#D4A853] bg-white text-[#B8893D]'
                    : 'border-divider bg-white text-text-primary'
                }`}
              >
                充{q}元
                {active && (
                  <span className="absolute right-1 bottom-1 text-[10px] text-[#D4A853]">✓</span>
                )}
              </button>
            )
          })}
        </div>

        <div className="mt-3 text-xs text-text-secondary">温馨提示：最少购买金额为0元</div>
      </div>

      {/* 支付方式 */}
      <div className="mx-4 mt-3 rounded-2xl bg-white p-5 shadow-sm">
        <div className="text-sm font-semibold text-text-primary">支付方式</div>
        <div className="mt-3 space-y-2">
          {PAY_CHANNELS.map((c) => {
            const active = c.id === channel
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setChannel(c.id)}
                className={`flex w-full items-center justify-between rounded-xl border-2 px-3 py-3 transition ${
                  active
                    ? 'border-[#D4A853] bg-[#FFF8E8]'
                    : 'border-transparent bg-bg-secondary'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${c.bg} text-white shadow-sm`}
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                      <path d={c.iconPath} />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-text-primary">{c.label}</span>
                </div>
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full ${
                    active ? 'bg-gradient-to-br from-[#D4A853] to-[#E8C97A]' : 'border border-divider bg-white'
                  }`}
                >
                  {active && <Check className="h-3.5 w-3.5 text-white" />}
                </span>
              </button>
            )
          })}
        </div>
        {error && <div className="mt-2 text-xs text-red-500">{error}</div>}
      </div>

      {/* 温馨提示 */}
      <div className="mx-4 mt-3 rounded-xl bg-[#FFF8E8] px-3 py-2.5 text-xs leading-relaxed text-text-secondary">
        尊敬的用户，您好！您可致电运营商处理提现问题，运营商电话：18826090020。
        若无法联系运营商，请在 9:00~17:30 时间致电平台协助解决你的问题，
        平台售后电话：4006-444-996。
      </div>

      {/* 底部：支付金额 + 灰色确认提交 + 绿色退款 */}
      <div className="space-y-3 bg-[#F8F8FA] px-4 pb-6 pt-3">
        <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
          <span className="text-sm text-text-secondary">支付金额：</span>
          <span className="text-base font-bold text-[#DC2626]">{numericAmount.toFixed(2)}元</span>
        </div>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-base font-semibold text-white shadow-sm active:opacity-90 disabled:opacity-60"
          style={{ background: '#9CA3AF' }}
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? '提交中…' : '确认提交'}
        </button>

        <button
          type="button"
          onClick={() => alert('卡的退款流程施工中')}
          className="w-full rounded-full py-3.5 text-base font-semibold text-white shadow-sm active:opacity-90"
          style={{ background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)' }}
        >
          退款
        </button>

        {/* 广告位（按截图保留） */}
        <div className="mt-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#FCD34D] to-[#FDE68A] p-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-white/60" />
            <div className="flex-1">
              <div className="text-xs font-semibold text-text-primary">
                1. 去哪儿 APP 福利满满，机票酒店特惠，轻松奔赴
              </div>
              <div className="mt-0.5 text-[10px] text-text-secondary">去哪儿旅行</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}