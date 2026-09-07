import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDownLeft, ArrowUpRight, Headset } from 'lucide-react'
import PageContainer from '../../components/mobile/PageContainer'
import { EmptyState, SegmentedControl } from '../../components/ui'
import { usePoints } from './pointsStore'

type FilterType = 'all' | 'income' | 'expense'

const FILTERS = [
  { value: 'all' as const, label: '全部' },
  { value: 'income' as const, label: '收入' },
  { value: 'expense' as const, label: '消耗' },
]

/**
 * 积分明细页（卡博士版，T025）
 * -------------------------------------------------------------
 * 与诗得丽"泡泡值明细"共用同一份数据（pointsStore），只是文案不同。
 * 底部「立即兑换」跳积分商城 H5（/mall）。
 */
export default function PointsPage() {
  const navigate = useNavigate()
  const points = usePoints()
  const [filter, setFilter] = useState<FilterType>('all')

  const records = useMemo(() => {
    if (filter === 'all') return points.records
    return points.records.filter((r) => r.kind === filter)
  }, [points.records, filter])

  return (
    <PageContainer inset={false} className="bg-[#F5F5F5]">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between bg-white px-4 py-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center text-[#333]"
          aria-label="返回"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-base font-semibold text-[#1A1A1A]">积分明细</h1>
        <button
          type="button"
          onClick={() => navigate('/legacy-profile/customer-service')}
          className="flex h-9 w-9 items-center justify-center text-[#333]"
          aria-label="客服"
        >
          <Headset className="h-5 w-5" />
        </button>
      </div>

      {/* 积分余额 */}
      <div className="bg-white px-6 pt-2 pb-6 text-center">
        <p className="text-sm text-[#999]">我的积分</p>
        <p className="mt-1 text-[48px] font-bold leading-tight text-[#FF4D4F]">
          {points.balance.toLocaleString()}
        </p>
        <button
          type="button"
          onClick={() => navigate('/legacy-profile/customer-service')}
          className="mt-1 text-xs text-[#999] underline underline-offset-2"
        >
          积分说明
        </button>
      </div>

      {/* 筛选 Tab */}
      <div className="mx-4 mt-3">
        <SegmentedControl
          items={FILTERS.map((f) => ({ value: f.value, label: f.label }))}
          value={filter}
          className="bg-white [&>button]:text-[#999] [&>button[aria-selected=true]]:bg-[#FFF0EE] [&>button[aria-selected=true]]:text-[#FF4D4F]"
          onChange={(v) => setFilter(v as FilterType)}
        />
      </div>

      {/* 流水列表 */}
      <section className="mx-4 mt-3 mb-28" aria-label="积分变动记录">
        {records.length === 0 ? (
          <div className="rounded-2xl bg-white py-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <EmptyState variant="no-data" title="暂时没有更多记录啦" />
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center gap-3 border-b border-[#F5F5F5] px-4 py-3.5 last:border-0"
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      record.kind === 'income'
                        ? 'bg-[#FFF0EE] text-[#FF4D4F]'
                        : 'bg-[#F5F5F5] text-[#999]'
                    }`}
                    aria-hidden
                  >
                    {record.kind === 'income' ? (
                      <ArrowDownLeft className="h-5 w-5" />
                    ) : (
                      <ArrowUpRight className="h-5 w-5" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#1A1A1A]">{record.title}</p>
                    <p className="mt-0.5 text-xs text-[#999]">{record.time}</p>
                  </div>
                  <span
                    className={`text-base font-semibold ${
                      record.kind === 'income' ? 'text-[#FF4D4F]' : 'text-[#1A1A1A]'
                    }`}
                  >
                    {record.kind === 'income' ? '+' : '-'}
                    {record.amount}
                    <span className="ml-0.5 text-xs font-normal text-[#999]">分</span>
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-center text-xs text-[#CCC]">— 没有更多记录啦 —</p>
          </>
        )}
      </section>

      {/* 底部立即兑换按钮 */}
      <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-[430px] -translate-x-1/2 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
        <button
          type="button"
          onClick={() => navigate('/mall')}
          className="w-full rounded-full bg-gradient-to-r from-[#FF6B5A] to-[#FF4D4F] py-3.5 text-base font-semibold text-white shadow-[0_6px_16px_rgba(255,77,79,0.3)] active:scale-[0.98]"
        >
          立即兑换
        </button>
      </div>

      {/* 右下角客服悬浮球 */}
      <button
        type="button"
        onClick={() => navigate('/legacy-profile/customer-service')}
        className="fixed bottom-20 right-4 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#FF4D4F] shadow-lg"
        aria-label="客服"
      >
        <Headset className="h-5 w-5" />
      </button>
    </PageContainer>
  )
}
