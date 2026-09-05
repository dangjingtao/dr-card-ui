import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft, RotateCcw, Loader2, Check } from 'lucide-react'
import { useUserInfo, userInfoActions } from './userInfoStore'

/* ---- Mock 小票数据（与 ReceiptDetailPage 保持一致） ---- */
const RECEIPT_DETAIL_MAP: Record<
  string,
  { receiptNo: string; shopName: string; deviceName: string; actualPay: number; orderType: string; payTime: string }
> = {
  '1': { receiptNo: 'XP202608150001', shopName: '卡博士展厅（骏盈大厦）', deviceName: '4G蓝牙消费机-01438', actualPay: 2.5, orderType: '淋浴消费', payTime: '2026-08-15 14:32:18' },
  '2': { receiptNo: 'XP202608140023', shopName: 'A栋1楼洗衣房', deviceName: '洗衣机-A栋1楼001', actualPay: 4.0, orderType: '洗烘消费', payTime: '2026-08-14 20:15:42' },
  '3': { receiptNo: 'XP202608130017', shopName: 'B栋大堂', deviceName: '直饮机-B栋大堂', actualPay: 0.5, orderType: '饮水消费', payTime: '2026-08-13 09:45:30' },
  '4': { receiptNo: 'XP202608120009', shopName: 'C栋3楼淋浴间', deviceName: '吹风机-C栋3楼', actualPay: 1.2, orderType: '吹风消费', payTime: '2026-08-12 22:08:55' },
  '5': { receiptNo: 'XP202608100005', shopName: '卡博士展厅（骏盈大厦）', deviceName: '4G蓝牙消费机-01420', actualPay: 3.8, orderType: '淋浴消费', payTime: '2026-08-10 16:20:10' },
}

/* ---- 退款原因选项 ---- */
const REFUND_REASONS = [
  '设备故障未使用',
  '误操作 / 多扣款',
  '服务质量问题',
  '不想使用了',
  '其他原因',
]

type RefundAmountType = 'full' | 'partial'

/**
 * T028｜申请退款页（APP 内原生闭环）
 * -------------------------------------------------------------
 * 流程：
 *   1. 选择退款金额（全退 / 指定金额，金额 ≤ 实付金额）
 *   2. 选择退款原因
 *   3. 提交 → 异步 → store 扣减余额 → 跳 RefundSuccessPage
 *
 * "退款原路返回充值账户"：这里通过更新 userInfoStore.balance 模拟到账。
 */
export default function RefundApplyPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const receiptId = searchParams.get('receipt') || '1'
  const receipt = RECEIPT_DETAIL_MAP[receiptId]

  /* 选金额 / 选原因 / 提交态 */
  const [amountType, setAmountType] = useState<RefundAmountType>('full')
  const [customAmount, setCustomAmount] = useState<string>('')
  const [reason, setReason] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  /* 计算实际退款金额 */
  const finalAmount =
    amountType === 'full'
      ? receipt?.actualPay ?? 0
      : Math.min(parseFloat(customAmount || '0') || 0, receipt?.actualPay ?? 0)

  if (!receipt) {
    return (
      <div className="mx-auto flex min-h-full max-w-[480px] flex-col items-center justify-center bg-[#F8F8FA]">
        <div className="text-sm text-text-tertiary">小票不存在</div>
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

  const handleSubmit = async () => {
    setError('')
    if (!reason) {
      setError('请选择退款原因')
      return
    }
    if (amountType === 'partial' && finalAmount <= 0) {
      setError('退款金额必须大于 0')
      return
    }
    if (amountType === 'partial' && finalAmount > receipt.actualPay) {
      setError(`退款金额不能超过实付金额 ¥${receipt.actualPay.toFixed(2)}`)
      return
    }

    setSubmitting(true)
    /* 模拟异步请求 1 秒 */
    setTimeout(() => {
      /* 更新余额：原路返回 */
      userInfoActions.update({
        balance: Math.max(0, Number((useUserInfo().balance + finalAmount).toFixed(2))),
      })

      /* 写入退款记录到 localStorage（持久化跨刷新） */
      try {
        const key = 'kbs_refund_records'
        const raw = localStorage.getItem(key)
        const list = raw ? (JSON.parse(raw) as any[]) : []
        list.unshift({
          id: `RF${Date.now()}`,
          receiptId,
          receiptNo: receipt.receiptNo,
          amount: finalAmount,
          reason,
          status: 'success',
          createdAt: new Date().toISOString(),
        })
        localStorage.setItem(key, JSON.stringify(list))
      } catch {
        /* localStorage 不可用时静默忽略 */
      }

      setSubmitting(false)
      /* 跳成功页，带金额参数 */
      navigate(`/legacy-profile/refund-success?amount=${finalAmount}&receipt=${receiptId}`)
    }, 1000)
  }

  return (
    <div className="mx-auto flex min-h-full max-w-[480px] flex-col bg-[#F8F8FA]">
      {/* 顶部栏 */}
      <div className="relative shrink-0 bg-gradient-to-br from-[#D4A853] to-[#E8C97A] px-4 pt-3 pb-3">
        <div className="relative flex items-center">
          <button
            type="button"
            aria-label="返回"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center text-white active:opacity-80"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold text-white">
            申请退款
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-3 px-4 pb-8 pt-4">
        {/* 小票信息卡 */}
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-text-secondary">{receipt.shopName}</div>
              <div className="mt-1 text-base font-medium text-text-primary">
                {receipt.deviceName}
              </div>
              <div className="mt-1 text-xs text-text-tertiary">
                小票编号：{receipt.receiptNo}
              </div>
              <div className="mt-0.5 text-xs text-text-tertiary">
                支付时间：{receipt.payTime}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-text-tertiary">实付</div>
              <div className="text-lg font-bold text-[#B8893D]">
                ¥{receipt.actualPay.toFixed(2)}
              </div>
              <div className="mt-1 text-xs text-text-tertiary">{receipt.orderType}</div>
            </div>
          </div>
        </div>

        {/* 退款金额 */}
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="text-sm font-semibold text-text-primary">退款金额</div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <AmountCard
              active={amountType === 'full'}
              label="全额退款"
              amount={receipt.actualPay}
              onClick={() => setAmountType('full')}
            />
            <AmountCard
              active={amountType === 'partial'}
              label="指定金额"
              amount={null}
              onClick={() => setAmountType('partial')}
            />
          </div>
          {amountType === 'partial' && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#FFF8E8] px-3 py-2.5">
              <span className="text-base text-[#B8893D]">¥</span>
              <input
                type="number"
                inputMode="decimal"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder={`最多 ¥${receipt.actualPay.toFixed(2)}`}
                className="flex-1 flex-1 bg-transparent text-base font-medium outline-none placeholder:text-text-tertiary"
              />
              <span className="text-xs text-text-tertiary">元</span>
            </div>
          )}
          <div className="mt-3 flex items-center justify-between rounded-xl bg-bg-secondary px-3 py-2.5 text-sm">
            <span className="text-text-secondary">本次退款金额</span>
            <span className="text-base font-bold text-[#B8893D]">
              ¥{finalAmount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* 退款原因 */}
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="text-sm font-semibold text-text-primary">退款原因</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {REFUND_REASONS.map((r) => {
              const active = reason === r
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs transition ${
                    active
                      ? 'bg-gradient-to-r from-[#D4A853] to-[#E8C97A] text-white shadow-sm'
                      : 'bg-bg-secondary text-text-secondary'
                  }`}
                >
                  {active && <Check className="h-3 w-3" />}
                  {r}
                </button>
              )
            })}
          </div>
        </div>

        {/* 退款去向说明 */}
        <div className="rounded-2xl bg-[#FFF8E8] p-4">
          <div className="flex items-start gap-2">
            <RotateCcw className="mt-0.5 h-4 w-4 text-[#B8893D]" />
            <div className="flex-1">
              <div className="text-sm font-medium text-text-primary">退款到账方式</div>
              <div className="mt-1 text-xs leading-relaxed text-text-secondary">
                退款将原路返回至您的充值账户余额（微信支付/支付宝等渠道充值的金额会回到原账户）。
                预计 1-3 个工作日到账，最快当日到账。
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-500">{error}</div>
        )}
      </div>

      {/* 底部提交按钮 */}
      <div className="px-4 pb-6">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#D4A853] to-[#E8C97A] py-3.5 text-base font-semibold text-white shadow-md active:opacity-90 disabled:opacity-60"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? '提交中…' : `确认退款 ¥${finalAmount.toFixed(2)}`}
        </button>
      </div>
    </div>
  )
}

function AmountCard({
  active,
  label,
  amount,
  onClick,
}: {
  active: boolean
  label: string
  amount: number | null
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-xl border-2 py-3 transition ${
        active
          ? 'border-[#D4A853] bg-[#FFF8E8] text-[#B8893D]'
          : 'border-transparent bg-bg-secondary text-text-secondary'
      }`}
    >
      <span className="text-sm font-medium">{label}</span>
      <span className="text-base font-bold">
        {amount === null ? '自定义' : `¥${amount.toFixed(2)}`}
      </span>
    </button>
  )
}