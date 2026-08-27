import { useMemo, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import DebugPanel from '../components/mobile/DebugPanel'
import PageContainer from '../components/mobile/PageContainer'
import { EmptyState, SegmentedControl } from '../components/ui'
import { useFixtureState } from '../app/fixtures/useFixture'
import { findRouteByPathname } from '../app/router/routes'
import {
  BUBBLE_FILTERS,
  BUBBLE_LIST_END,
  filterBubbleRecords,
  isBubbleFilter,
  type BubbleFilter,
} from '../app/fixtures'

/**
 * 泡泡值明细（#5 明细分支）
 * -------------------------------------------------------------
 * 事实源：docs/prototype/02-membership-and-checkin.md §3
 * 需求确认（docs/requirements/2026-08-27-ui-change-requirements.md §4.1）：
 *   本页是「纯明细页」，内容只包含全部 / 收入 / 消耗 Tab、泡泡值流水列表与已有空态；
 *   Tab 与列表样式直接继承原泡泡值页面，不新增视觉方案。
 * 因此本页不承载任务、泡泡福利、资产营销与底部兑换主操作。
 * ⚠️ B-002 未决：15 条 mock 与配色方案未定稿，余额与流水一律读 fixtures。
 * 可复现状态：?state=income / expense / empty
 */
export default function PointsDetail() {
  const route = findRouteByPathname('/points/detail')
  const { state } = useFixtureState(route)

  const initialFilter: BubbleFilter = isBubbleFilter(state?.key ?? null) ? (state!.key as BubbleFilter) : 'all'
  const [filter, setFilter] = useState<BubbleFilter>(initialFilter)

  /** ?state=empty 用于验收空态，不代表业务上真的没有数据 */
  const forceEmpty = state?.key === 'empty'
  const records = useMemo(() => (forceEmpty ? [] : filterBubbleRecords(filter)), [filter, forceEmpty])

  return (
    <PageContainer inset={false} className="pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
      <div className="mx-4 mt-3">
        <SegmentedControl
          items={BUBBLE_FILTERS.map((item) => ({ value: item.value, label: item.label }))}
          value={filter}
          className="border border-[#eadbc2]/80 bg-[#f5ecdf]/90 shadow-[inset_0_1px_1px_rgba(127,82,27,0.04)] [&>button]:text-[#74634f] [&>button[aria-selected=true]]:border [&>button[aria-selected=true]]:border-[#ebd1a4] [&>button[aria-selected=true]]:bg-[#fffaf1] [&>button[aria-selected=true]]:text-[#b56e22] [&>button[aria-selected=true]]:shadow-[0_2px_6px_rgba(145,91,24,0.08)]"
          onChange={(value) => {
            if (isBubbleFilter(value)) setFilter(value)
          }}
        />
      </div>

      <section className="mx-4 mt-4" aria-label="泡泡值变动记录">
        {records.length === 0 ? (
          <div className="rounded-feature border border-border-subtle bg-surface py-6 shadow-bubble">
            {/* 原型 §3 只给了「暂时没有更多记录啦」，不额外补写引导文案 */}
            <EmptyState variant="no-data" title={BUBBLE_LIST_END} />
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-feature border border-border-subtle bg-surface shadow-bubble">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center gap-3 border-b border-border-subtle px-4 py-3.5 last:border-0"
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      record.kind === 'income' ? 'bg-success-bg text-success-text' : 'bg-danger-bg text-danger-text'
                    }`}
                    aria-hidden
                  >
                    {record.kind === 'income' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-primary">{record.title}</p>
                    <p className="mt-0.5 text-xs text-text-tertiary">{record.time}</p>
                  </div>
                  <span
                    className={`text-base font-semibold ${
                      record.kind === 'income' ? 'text-success-text' : 'text-danger-text'
                    }`}
                  >
                    {record.kind === 'income' ? '+' : '-'}
                    {record.amount}
                    <span className="ml-0.5 text-xs font-normal">🫧</span>
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-center text-xs text-text-tertiary">{BUBBLE_LIST_END}</p>
          </>
        )}
      </section>

      <DebugPanel route={route} />
    </PageContainer>
  )
}
