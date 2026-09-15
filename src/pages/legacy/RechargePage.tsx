import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Building2, Loader2, Check } from 'lucide-react'
import { findProject, projectActions, recomputeSchoolTotals } from './schoolAccountStore'

/* 快捷金额按钮 */
const QUICK_AMOUNTS = [20, 50]

/* 支付方式 */
interface PayChannel {
  id: 'wechat' | 'alipay'
  label: string
  bg: string
  /** 内联 SVG path：微信绿/支付宝蓝 */
  iconPath: string
}

const PAY_CHANNELS: PayChannel[] = [
  {
    id: 'wechat',
    label: '微信支付',
    bg: 'from-[#07C160] to-[#10B981]',
    iconPath:
      'M9.5 4C5.36 4 2 6.69 2 10c0 1.81 1 3.44 2.59 4.53L4 17l2.71-1.41c.88.21 1.81.34 2.79.36-.07-.34-.1-.7-.1-1.06 0-3.31 3.13-6 7-6 .36 0 .72.02 1.06.07C16.95 6.06 13.55 4 9.5 4zm-2.4 4.5a.9.9 0 110 1.8.9.9 0 010-1.8zm4.8 0a.9.9 0 110 1.8.9.9 0 010-1.8zM16.4 10c-3.31 0-6 2.13-6 4.75 0 1.5.85 2.85 2.18 3.74L12 20l1.99-1.04c.71.16 1.46.27 2.24.29.21 0 .42-.01.62-.02L19 20l-.43-1.85C20.32 17.18 22 15.45 22 13.5c0-2.62-2.69-4.75-6-4.75zm-2 3.2a.7.7 0 110 1.4.7.7 0 010-1.4zm4 0a.7.7 0 110 1.4.7.7 0 010-1.4z',
  },
  {
    id: 'alipay',
    label: '支付宝',
    bg: 'from-[#1677FF] to-[#4096FF]',
    iconPath:
      'M18.5 2h-13A2.5 2.5 0 003 4.5v15A2.5 2.5 0 005.5 22h13a2.5 2.5 0 002.5-2.5v-15A2.5 2.5 0 0018.5 2zm-7.5 18c-3.6 0-6.5-2.5-6.5-5.5s2.9-5.5 6.5-5.5c1.5 0 2.9.4 4 1.1l-1.6 1.5c-.7-.5-1.5-.7-2.4-.7-2.5 0-4.5 1.6-4.5 3.6s2 3.6 4.5 3.6c.6 0 1.2-.1 1.7-.3l-.7-2H8v-2h4.5l1 3c-.8.4-1.7.6-2.5.6-3.6 0-6.5-2.5-6.5-5.5z',
  },
]

/**
 * T028｜项目充值/购买详情页（卡博士 APP 风格）
 * -------------------------------------------------------------
 * 顶部淡金渐变头部：项目名 + Building2 金色头像
 * 购买金额输入 + 快捷金额（充20 / 充50）
 * 支付方式：微信 / 支付宝 两条途径（带选中态）
 * 底部：金额合计 + 确认支付按钮（淡金渐变）+ 温馨提示
 */
export default function RechargePage() {
  const navigate = useNavigate()
  const { id = '' } = useParams()
  const project = findProject(id)

  const [amount, setAmount] = useState<string>('20')
  const [channel, setChannel] = useState<PayChannel['id']>('wechat')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!project) {
    return (
      <div className="mx-auto flex min-h-full max-w-[480px] flex-col items-center justify-center bg-[#F8F8FA]">
        <div className="text-sm text-text-tertiary">项目不存在</div>
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
      /* 累加小票余额 + 可退款金额 */
      const list = projectActions.get()
      const newList = list.map((p) =>
        p.id === id
          ? {
              ...p,
              ticketBalance: Number((p.ticketBalance + numericAmount).toFixed(2)),
              refundableBalance: Number((p.refundableBalance + numericAmount).toFixed(2)),
            }
          : p,
      )
      projectActions.set(newList)
      recomputeSchoolTotals()

      setSubmitting(false)
      alert(`充值成功 ¥${numericAmount.toFixed(2)}`)
      navigate(`/legacy-profile/school-accounts`)
    }, 800)
  }

  return (
    <div className="mx-auto flex min-h-full max-w-[480px] flex-col bg-[#F8F8FA]">
      {/* 顶部淡金渐变头部：项目名 + 头像 */}
      <div
        className="relative shrink-0 px-5 pt-12 pb-5"
        style={{ background: 'linear-gradient(135deg, #D4A853 0%, #E8C97A 50%, #F0D68E 100%)' }}
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
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm"
            style={{ background: 'linear-gradient(135deg, #B8893D 0%, #8B6F2F 100%)' }}
          >
            <Building2 className="h-5 w-5" />
          </div>
          <div className="text-base font-semibold">{project.projectName}</div>
        </div>
      </div>

      {/* 购买金额 */}
      <div className="mx-4 mt-4 rounded-2xl bg-white p-5 shadow-sm">
        <div className="text-sm font-semibold text-text-primary">购买金额</div>
        <div className="mt-3 flex items-center gap-2 border-b border-divider py-2">
          <span className="text-base text-text-secondary">¥</span>
          <input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value)
              setError('')
            }}
            className="flex-1 bg-transparent text-2xl font-bold text-[#B8893D] outline-none"
            placeholder="0"
          />
          <span className="text-xs text-text-tertiary">元</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
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
                className={`rounded-full py-2 text-sm transition ${
                  active
                    ? 'bg-gradient-to-r from-[#D4A853] to-[#E8C97A] text-white shadow-sm'
                    : 'bg-bg-secondary text-text-secondary'
                }`}
              >
                充{q}元
              </button>
            )
          })}
        </div>
        {error && <div className="mt-2 text-xs text-red-500">{error}</div>}
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
      </div>

      {/* 温馨提示 */}
      <div className="mx-4 mt-3 rounded-xl bg-[#FFF8E8] px-3 py-2.5 text-xs leading-relaxed text-text-secondary">
        支付完成后金额将实时到账，可在「我的小票」对应项目查看最新余额。
      </div>

      {/* 底部支付按钮 */}
      <div className="mt-auto px-4 pb-6 pt-4">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-base font-semibold text-white shadow-md active:opacity-90 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #D4A853 0%, #E8C97A 100%)' }}
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting
            ? '支付中…'
            : `确认支付 ¥${numericAmount.toFixed(2)}`}
        </button>
      </div>
    </div>
  )
}