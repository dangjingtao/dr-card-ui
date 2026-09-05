import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { findProject, projectActions, recomputeSchoolTotals } from './schoolAccountStore'

/**
 * T028｜项目退款页（图3）
 * -------------------------------------------------------------
 * 顶部蓝色背景 + 白色卡片：项目名 + 头像 + 余额细分
 * 退款金额(元)（默认 = 可退款金额）+ 退款方式（无选项，预留）
 * 灰色「确认退款」大按钮 + 底部温馨提示
 */
export default function SchoolRefundPage() {
  const navigate = useNavigate()
  const { id = '' } = useParams()
  const project = findProject(id)

  const [amount, setAmount] = useState<string>(
    project ? project.refundableBalance.toFixed(2) : '0',
  )
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

      {/* 项目卡片 */}
      <div className="mx-4 -mt-4 mb-4 rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="text-base font-semibold text-text-primary">
            {project.projectName}
          </div>
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
            style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)' }}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <Row label="小票余额" value={project.ticketBalance} />
          <Row label="可退款金额" value={project.refundableBalance} highlight />
          <Row label="赠送金额" value={project.giftBalance} />
        </div>
      </div>

      {/* 表单区 */}
      <div className="space-y-4 bg-white px-5 pb-4 pt-2">
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