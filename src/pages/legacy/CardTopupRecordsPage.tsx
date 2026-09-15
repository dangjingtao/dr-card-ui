import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, ArrowDownLeft, Wallet } from 'lucide-react'
import { findCard, getCardTopupRecords, type TopupRecord } from './cardStore'

/**
 * T029｜充值记录列表页
 * -------------------------------------------------------------
 * URL：/legacy-profile/my-cards/:id/topup-records
 *
 * 视觉（参考卡详情页风格）：
 * - 顶部淡金渐变 + 返回 + 居中标题"充值记录"
 * - 顶部余额卡：项目名 + 余额数字
 * - 流水列表：每条一行，左侧图标（成功绿/失败红/进行中灰），中部时间+状态，右侧金额
 * - 空态：无记录时显示空态文案
 */
function formatTime(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const CHANNEL_LABEL: Record<TopupRecord['channel'], string> = {
  wechat: '微信支付',
  alipay: '支付宝',
}

function statusMeta(status: TopupRecord['status']) {
  if (status === 'success') return { dot: 'bg-[#10B981]', label: '成功', amountClass: 'text-[#10B981]' }
  if (status === 'failed') return { dot: 'bg-[#DC2626]', label: '失败', amountClass: 'text-[#DC2626]' }
  return { dot: 'bg-[#9CA3AF]', label: '处理中', amountClass: 'text-text-tertiary' }
}

export default function CardTopupRecordsPage() {
  const navigate = useNavigate()
  const { id = '' } = useParams()
  const card = findCard(id)
  const records = getCardTopupRecords(id)

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
            充值记录
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
            <ArrowDownLeft className="mb-2 h-10 w-10 opacity-30" />
            <div className="text-sm">暂无充值记录</div>
          </div>
        ) : (
          <ul className="divide-y divide-divider">
            {records.map((r) => {
              const m = statusMeta(r.status)
              return (
                <li key={r.id} className="flex items-center gap-3 px-4 py-3">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${m.dot}`} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-text-primary">
                      {m.label} · {CHANNEL_LABEL[r.channel]}
                    </div>
                    <div className="mt-0.5 text-xs text-text-tertiary">{formatTime(r.createdAt)}</div>
                    {r.failReason && (
                      <div className="mt-0.5 text-xs text-[#DC2626]">{r.failReason}</div>
                    )}
                  </div>
                  <div className={`text-base font-semibold ${m.amountClass}`}>
                    +¥{r.amount.toFixed(2)}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* 底部：提示文案 */}
      <p className="mx-6 mt-4 text-center text-xs leading-relaxed text-text-tertiary">
        仅展示近期的充值记录；
        <br />
        如需更早的记录请联系客服。
      </p>

      {/* 底部按钮 */}
      <div className="mt-auto px-4 pb-6 pt-6">
        <button
          type="button"
          onClick={() => navigate(`/legacy-profile/my-cards/${id}/topup`)}
          className="w-full rounded-full bg-[#D4A853] py-3.5 text-base font-semibold text-white shadow-sm active:opacity-90"
        >
          去充值
        </button>
      </div>
    </div>
  )
}
