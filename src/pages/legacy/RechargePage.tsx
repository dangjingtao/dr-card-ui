import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, UserRound, Loader2 } from 'lucide-react'
import { findSchool, schoolAccountActions } from './schoolAccountStore'

/* 快捷金额按钮 */
const QUICK_AMOUNTS = [20, 50]

/**
 * T028｜充值/购买页（图2）
 * -------------------------------------------------------------
 * 输入金额 + 快捷金额（充20 / 充50）+ 确认提交（蓝色大按钮）
 * + 退款按钮（绿色大按钮，跳学校退款）+ 底部温馨提示。
 */
export default function RechargePage() {
  const navigate = useNavigate()
  const { id = '' } = useParams()
  const account = findSchool(id)

  const [amount, setAmount] = useState<string>('20')
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
      const list = schoolAccountActions.get()
      const newList = list.map((s) =>
        s.id === id
          ? {
              ...s,
              ticketBalance: Number((s.ticketBalance + numericAmount).toFixed(2)),
              refundableBalance: Number((s.refundableBalance + numericAmount).toFixed(2)),
            }
          : s,
      )
      schoolAccountActions.set(newList)

      setSubmitting(false)
      alert(`充值成功 ¥${numericAmount.toFixed(2)}`)
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

        <div className="mt-12 flex items-center gap-2 text-white">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur"
          >
            <UserRound className="h-5 w-5" />
          </div>
          <div className="text-base font-semibold">{account.schoolName}</div>
        </div>
      </div>

      {/* 表单区 */}
      <div className="flex-1 space-y-3 bg-white px-5 pb-4 pt-5">
        <div>
          <div className="text-sm text-text-primary">购买金额(元)</div>
          <div className="mt-2 flex items-center gap-2 border-b border-divider py-2">
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
          <div className="mt-1 text-xs text-text-tertiary">最多可输入金额50元</div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
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
                className={`relative flex items-center justify-center gap-2 rounded-2xl py-3 text-base font-semibold transition ${
                  active
                    ? 'border-2 border-[#D4A853] bg-white text-[#B8893D]'
                    : 'border border-divider bg-white text-text-primary'
                }`}
              >
                充{q}元
                {active && (
                  <span className="absolute right-1 bottom-1 text-xs text-[#D4A853]">✓</span>
                )}
              </button>
            )
          })}
        </div>

        <div className="pt-1 text-xs text-text-secondary">温馨提示：最少购买金额为0元</div>
      </div>

      {/* 支付金额 + 提交按钮 + 退款按钮 + 温馨提示 */}
      <div className="space-y-3 bg-[#F8F8FA] px-5 pb-6 pt-3">
        <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
          <span className="text-sm text-text-secondary">支付金额：</span>
          <span className="text-base font-bold text-[#B8893D]">{numericAmount.toFixed(2)}元</span>
        </div>
        {error && <div className="text-xs text-red-500">{error}</div>}

        <button
          type="button"
          onClick={handleConfirm}
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-base font-semibold text-white shadow-md active:opacity-90 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)' }}
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? '提交中…' : '确认提交'}
        </button>

        <button
          type="button"
          onClick={() => navigate(`/legacy-profile/school-refund/${id}`)}
          className="w-full rounded-full py-3.5 text-base font-semibold text-white shadow-md active:opacity-90"
          style={{ background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)' }}
        >
          退款
        </button>

        <div className="pt-1 text-xs leading-relaxed text-text-secondary">
          尊敬的用户，您好！您可致电运营商处理提现问题，运营商电话：18102203429。
        </div>

        {/* 广告位（按截图保留） */}
        <div className="mt-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#FCD34D] to-[#FDE68A] p-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-white/60" />
            <div className="flex-1">
              <div className="text-xs font-semibold text-text-primary">
                终于让我发现了这个宝藏！
              </div>
              <div className="mt-0.5 text-[10px] text-text-secondary">上面买东西真的很划算</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}