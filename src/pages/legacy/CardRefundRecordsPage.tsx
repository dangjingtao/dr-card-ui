import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, ArrowUpRight, Wallet } from 'lucide-react'
import { findCard, getCardRefundRecords, type TopupRecord } from './cardStore'

/**
 * T029｜退款记录列表页
 * -------------------------------------------------------------
 * URL：/legacy-profile/my-cards/:id/refund-records
 *
 * 视觉（与充值记录页对称，仅金额符号相反）：
 * - 顶部淡金渐变 + 返回 + 居中标题"退款记录"
 * - 顶部余额卡
 * - 流水列表：每条一行，左侧图标，中部时间+渠道，右侧金额（红色 -¥）
 * - 空态
 */
function formatTime(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const CHANNEL_LABEL: Record<TopupRecord['channel'], string> = {
  wechat: '微信钱包',
  alipay: '支付宝',
}

export default function CardRefundRecordsPage() {
  const navigate = useNavigate()
  const { id = '' } = useParams()
  const card = findCard(id)
  const records = getCardRefundRecords(id)

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

  return (
    <div className="mx-auto flex min-h-full max-w-[480px] flex-col bg-[#F8F8FA]">
      {/* 顶部淡金渐变 + 返回 + 标题 */}
      <div
        className="relative shrink-0 px-4 pt-3 pb-5"
        style={{ background: 'linear-gradient(135deg, #D4A853 0%, #E8C97A 50%, #F0D68E 100%)' }}
      >
        <div className="relative flex items-center">
          <button
            type="button"
            aria-label="返回"
            onClick={() => navigate(`/legacy-profile/my-cards/${id}`)}
            className="flex h-10 w-10 items-center justify-center text-white active:opacity-80"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold text-white">
            退款记录
          </div>
        </div>
      </div>

      {/* 顶部余额卡 */}
      <div className="mx-4 mt-3 rounded-2xl bg-white px-4 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            style={{ background: 'linear-gradient(135deg, #F0D78E 0%, #D4A853 100%)' }}
          >
            <Wallet className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm text-text-secondary">{card.projectName}</div>
            <div className="mt-0.5 flex items-baseline">
              <span className="text-xs text-text-tertiary">当前余额</span>
              <span className="ml-1 text-2xl font-bold text-[#DC2626]">{card.balance.toFixed(2)}</span>
              <span className="ml-1 text-xs text-text-tertiary">元</span>
            </div>
          </div>
        </div>
      </div>

      {/* 流水列表 */}
      <div className="mx-4 mt-3 rounded-2xl bg-white shadow-sm">
        {records.length === 0 ? (
          <div className="flex flex-col items-center px-4 py-12 text-text-tertiary">
            <ArrowUpRight className="mb-2 h-10 w-10 opacity-30" />
            <div className="text-sm">暂无退款记录</div>
          </div>
        ) : (
          <ul className="divide-y divide-divider">
            {records.map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-4 py-3">
                <span className="h-2 w-2 shrink-0 rounded-full bg-[#DC2626]" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-text-primary">
                    退款 · {CHANNEL_LABEL[r.channel]}
                  </div>
                  <div className="mt-0.5 text-xs text-text-tertiary">{formatTime(r.createdAt)}</div>
                </div>
                <div className="text-base font-semibold text-[#DC2626]">
                  -¥{r.amount.toFixed(2)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 提示 */}
      <p className="mx-6 mt-4 text-center text-xs leading-relaxed text-text-tertiary">
        退款将在 1–3 个工作日内原路退回到您的支付账户；
        <br />
        具体到账时间以银行为准。
      </p>
    </div>
  )
}
