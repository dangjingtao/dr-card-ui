import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Building2, Loader2, Check } from 'lucide-react'
import { findProject, projectActions, recomputeSchoolTotals } from './schoolAccountStore'

/* 退款渠道（与购买支付方式共用微信/支付宝两条） */
interface RefundChannel {
  id: 'wechat' | 'alipay'
  label: string
  bg: string
  iconPath: string
}

const REFUND_CHANNELS: RefundChannel[] = [
  {
    id: 'wechat',
    label: '原路退回微信',
    bg: 'from-[#07C160] to-[#10B981]',
    iconPath:
      'M9.5 4C5.36 4 2 6.69 2 10c0 1.81 1 3.44 2.59 4.53L4 17l2.71-1.41c.88.21 1.81.34 2.79.36-.07-.34-.1-.7-.1-1.06 0-3.31 3.13-6 7-6 .36 0 .72.02 1.06.07C16.95 6.06 13.55 4 9.5 4zm-2.4 4.5a.9.9 0 110 1.8.9.9 0 010-1.8zm4.8 0a.9.9 0 110 1.8.9.9 0 010-1.8zM16.4 10c-3.31 0-6 2.13-6 4.75 0 1.5.85 2.85 2.18 3.74L12 20l1.99-1.04c.71.16 1.46.27 2.24.29.21 0 .42-.01.62-.02L19 20l-.43-1.85C20.32 17.18 22 15.45 22 13.5c0-2.62-2.69-4.75-6-4.75zm-2 3.2a.7.7 0 110 1.4.7.7 0 010-1.4zm4 0a.7.7 0 110 1.4.7.7 0 010-1.4z',
  },
  {
    id: 'alipay',
    label: '原路退回支付宝',
    bg: 'from-[#1677FF] to-[#4096FF]',
    iconPath:
      'M18.5 2h-13A2.5 2.5 0 003 4.5v15A2.5 2.5 0 005.5 22h13a2.5 2.5 0 002.5-2.5v-15A2.5 2.5 0 0018.5 2zm-7.5 18c-3.6 0-6.5-2.5-6.5-5.5s2.9-5.5 6.5-5.5c1.5 0 2.9.4 4 1.1l-1.6 1.5c-.7-.5-1.5-.7-2.4-.7-2.5 0-4.5 1.6-4.5 3.6s2 3.6 4.5 3.6c.6 0 1.2-.1 1.7-.3l-.7-2H8v-2h4.5l1 3c-.8.4-1.7.6-2.5.6-3.6 0-6.5-2.5-6.5-5.5z',
  },
]

/**
 * T028｜项目退款详情页（卡博士 APP 风格）
 * -------------------------------------------------------------
 * 顶部淡金渐变头部：项目名 + 金色建筑头像
 * 白色卡：项目名 + 余额细分
 * 退款金额 + 退款方式（原路退回微信 / 支付宝）
 * 底部：金额合计 + 确认退款按钮（淡金渐变）+ 温馨提示
 */
export default function SchoolRefundPage() {
  const navigate = useNavigate()
  const { id = '' } = useParams()
  const project = findProject(id)

  const [amount, setAmount] = useState<string>(
    project ? project.refundableBalance.toFixed(2) : '0',
  )
  const [channel, setChannel] = useState<RefundChannel['id']>('wechat')
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

  const handleConfirm = async () => {
    setError('')
    if (numericAmount <= 0) {
      setError('请输入大于 0 的金额')
      return
    }
    if (numericAmount > project.refundableBalance) {
      setError(`退款金额不能超过可退款金额 ¥${project.refundableBalance.toFixed(2)}`)
      return
    }

    setSubmitting(true)
    setTimeout(() => {
      const list = projectActions.get()
      const newList = list.map((p) =>
        p.id === id
          ? {
              ...p,
              ticketBalance: Number((p.ticketBalance - numericAmount).toFixed(2)),
              refundableBalance: Number((p.refundableBalance - numericAmount).toFixed(2)),
            }
          : p,
      )
      projectActions.set(newList)
      recomputeSchoolTotals()
      setSubmitting(false)
      alert(`退款成功 ¥${numericAmount.toFixed(2)}`)
      navigate(`/legacy-profile/school-accounts`)
    }, 800)
  }

  return (
    <div className="mx-auto flex min-h-full max-w-[480px] flex-col bg-[#F8F8FA]">
      {/* 顶部淡金渐变头部 */}
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

      {/* 项目卡（白卡刺入淡金区域） */}
      <div className="mx-4 -mt-2 rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="text-base font-semibold text-text-primary">
            {project.projectName}
          </div>
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
            style={{ background: 'linear-gradient(135deg, #D4A853 0%, #B8893D 100%)' }}
          >
            <Building2 className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <Row label="小票余额" value={project.ticketBalance} />
          <Row label="可退款金额" value={project.refundableBalance} highlight />
          <Row label="赠送金额" value={project.giftBalance} />
        </div>
      </div>

      {/* 退款金额 + 退款方式 */}
      <div className="mx-4 mt-3 rounded-2xl bg-white p-5 shadow-sm">
        <div className="text-sm font-semibold text-text-primary">退款金额</div>
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

        <div className="mt-4 text-sm font-semibold text-text-primary">退款方式</div>
        <div className="mt-3 space-y-2">
          {REFUND_CHANNELS.map((c) => {
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
        退款将原路返回至您的微信/支付宝账户，预计 1-3 个工作日到账。
      </div>

      {/* 底部确认按钮 */}
      <div className="mt-auto px-4 pb-6 pt-4">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-base font-semibold text-white shadow-md active:opacity-90 disabled:opacity-60"
          style={{ background: '#1F2937' }}
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting
            ? '退款中…'
            : `确认退款 ¥${numericAmount.toFixed(2)}`}
        </button>
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: number
  highlight?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-text-secondary">{label}</span>
      <span
        className={
          highlight
            ? 'text-base font-bold text-[#B8893D]'
            : 'text-sm text-text-primary'
        }
      >
        ¥{value.toFixed(2)}
      </span>
    </div>
  )
}