import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Inbox, CheckCircle2 } from 'lucide-react'

interface RefundRecord {
  id: string
  receiptId: string
  receiptNo: string
  amount: number
  reason: string
  status: 'success' | 'pending' | 'failed'
  createdAt: string
}

/**
 * T028｜退款记录页
 * -------------------------------------------------------------
 * 从 localStorage 读取 RefundApplyPage 写入的记录，按时间倒序展示。
 */
export default function RefundRecordsPage() {
  const navigate = useNavigate()
  const [records, setRecords] = useState<RefundRecord[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('kbs_refund_records')
      const list = raw ? (JSON.parse(raw) as RefundRecord[]) : []
      setRecords(list)
    } catch {
      setRecords([])
    }
  }, [])

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
            退款记录
          </div>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-4 pb-12 pt-16">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-bg-secondary text-text-tertiary">
            <Inbox className="h-10 w-10" />
          </div>
          <div className="mt-4 text-sm text-text-secondary">暂无退款记录</div>
          <div className="mt-1 text-xs text-text-tertiary">在「我的小票」详情页可发起退款</div>
        </div>
      ) : (
        <div className="flex-1 space-y-3 px-4 pb-8 pt-4">
          {records.map((r) => (
            <div key={r.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-text-tertiary">退款单号</div>
                  <div className="mt-0.5 text-sm font-medium text-text-primary">{r.id}</div>
                  <div className="mt-2 text-xs text-text-tertiary">原小票</div>
                  <div className="mt-0.5 text-sm text-text-secondary">{r.receiptNo}</div>
                  <div className="mt-2 text-xs text-text-tertiary">退款原因</div>
                  <div className="mt-0.5 text-sm text-text-secondary">{r.reason}</div>
                  <div className="mt-2 text-xs text-text-tertiary">
                    {new Date(r.createdAt).toLocaleString('zh-CN')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-[#B8893D]">¥{r.amount.toFixed(2)}</div>
                  <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#FDF6E8] px-2 py-0.5 text-xs text-[#B8893D]">
                    <CheckCircle2 className="h-3 w-3" />
                    退款成功
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}