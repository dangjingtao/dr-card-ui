import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { findSchool, schoolAccountActions } from './schoolAccountStore'

/**
 * T028｜学校账户退款页（图3）
 * -------------------------------------------------------------
 * 顶部蓝色背景
 * 退款金额(元)（默认 = 可退款金额）+ 退款方式（无选项，预留）
 * 灰色「确认退款」大按钮（loading）+ 底部温馨提示
 */
export default function SchoolRefundPage() {
  const navigate = useNavigate()
  const { id = '' } = useParams()
  const account = findSchool(id)

  const [amount, setAmount] = useState<string>(
    account ? account.refundableBalance.toFixed(2) : '0',
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!account) {
    return (
      <div className="mx-auto flex min-h-full max-w-[480px] flex-col items-center justify-center bg-[#F8F8FA]">
        <div className="text-sm text-text-tertiary">学校账户不存在</div>
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
    if (numericAmount > account.refundableBalance) {
      setError(`退款金额不能超过可退款金额 ¥${account.refundableBalance.toFixed(2)}`)
      return
    }

    setSubmitting(true)
    setTimeout(() => {
      const list = schoolAccountActions.get()
      const newList = list.map((s) =>
        s.id === id
          ? {
              ...s,
              ticketBalance: Number((s.ticketBalance - numericAmount).toFixed(2)),
              refundableBalance: Number((s.refundableBalance - numericAmount).toFixed(2)),
            }
          : s,
      )
      schoolAccountActions.set(newList)
      setSubmitting(false)
      alert(`退款成功 ¥${numericAmount.toFixed(2)}`)
      navigate(`/legacy-profile/school-account/${id}`)
    }, 800)
  }

  return (
    <div className="mx-auto flex min-h-full max-w-[480px] flex-col bg-[#F8F8FA]">
      {/* 顶部蓝色背景 */}
      <div
        className="relative shrink-0 px-5 pt-12 pb-6"
        style={{ background: 'linear-gradient(180deg, #3B82F6 0%, #60A5FA 100%)' }}
      >
        <button
          type="button"
          aria-label="返回"
          onClick={() => navigate(-1)}
          className="absolute left-4 top-12 flex h-10 w-10 items-center justify-center text-white active:opacity-80"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      </div>

      {/* 表单区 */}
      <div className="flex-1 space-y-4 bg-white px-5 pb-4 pt-5">
        <div>
          <div className="text-sm text-text-primary">退款金额(元)</div>
          <div className="mt-2 flex items-start gap-2 border-b border-divider py-2">
            <span className="text-base text-text-secondary">¥</span>
            <input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value)
                setError('')
              }}
              className="flex-1 bg-transparent text-base font-medium text-text-primary outline-none"
              placeholder="0"
            />
          </div>
        </div>

        <div>
          <div className="text-sm text-text-primary">退款方式</div>
          <div className="mt-2 min-h-[44px] border-b border-divider" />
        </div>
      </div>

      {/* 确认按钮 + 温馨提示 */}
      <div className="space-y-3 bg-[#F8F8FA] px-5 pb-6 pt-3">
        {error && <div className="text-xs text-red-500">{error}</div>}

        <button
          type="button"
          onClick={handleConfirm}
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-base font-semibold text-white shadow-md active:opacity-90 disabled:opacity-60"
          style={{ background: '#9CA3AF' }}
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? '退款中…' : '确认退款'}
        </button>

        <div className="pt-1 text-xs leading-relaxed text-text-secondary">
          <div>温馨提示：</div>
          <div className="mt-1 text-text-tertiary">
            尊敬的用户，您好！您可致电运营商处理提现问题，运营商电话：18102203429。
          </div>
        </div>
      </div>
    </div>
  )
}