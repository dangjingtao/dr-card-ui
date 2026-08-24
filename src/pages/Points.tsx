import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDownLeft, ArrowUpRight, CalendarCheck2, ChevronRight, Gift, Sparkles } from 'lucide-react'
import DebugPanel from '../components/mobile/DebugPanel'
import PageContainer from '../components/mobile/PageContainer'
import { Button, EmptyState, SegmentedControl } from '../components/ui'
import { useFixtureState } from '../app/fixtures/useFixture'
import { findRouteByPathname } from '../app/router/routes'
import {
  BUBBLE_BALANCE,
  BUBBLE_FILTERS,
  BUBBLE_LIST_END,
  filterBubbleRecords,
  isBubbleFilter,
  sumBubbleRecords,
  type BubbleFilter,
} from '../app/fixtures'
import pointsBenefitHero from '../assets/brand/bubble/points-benefit-hero-v2.webp'

/**
 * 泡泡值明细（#5）
 * -------------------------------------------------------------
 * 事实源：docs/prototype/02-membership-and-checkin.md §3
 * 已确认：泡泡值余额（1280）、筛选 Tab 全部/收入/消耗、流水含时间与来源增减、
 *        无更多数据时「暂时没有更多记录啦」、保留前往兑换入口（「立即兑换」→洗护兑换专区）。
 * ⚠️ B-002 未决：历史稿把原型紫色改为暖橙/暖金，并新增余额胶囊、北极熊剪影与 15 条 mock。
 *    因此这里不引入新的品牌配色方案，只用项目已确认的语义 Token；
 *    余额与流水一律读 fixtures，定稿时只改夹具，不改页面。
 * 用户 2026-08-24 确认本页需补充插画设计、活动感和福利感：余额 Hero 采用 Penpot 已确认
 * 的礼盒水滴物料，福利入口只承载原型已有的「签到赚泡泡 / 泡泡值兑换」，不新增奖励规则。
 * 可复现状态：?state=income / expense / empty
 */
export default function Points() {
  const navigate = useNavigate()
  const route = findRouteByPathname('/points')
  const { state } = useFixtureState(route)

  const initialFilter: BubbleFilter = isBubbleFilter(state?.key ?? null) ? (state!.key as BubbleFilter) : 'all'
  const [filter, setFilter] = useState<BubbleFilter>(initialFilter)

  /** ?state=empty 用于验收空态，不代表业务上真的没有数据 */
  const forceEmpty = state?.key === 'empty'
  const records = useMemo(() => (forceEmpty ? [] : filterBubbleRecords(filter)), [filter, forceEmpty])

  const income = sumBubbleRecords('income')
  const expense = sumBubbleRecords('expense')

  // 底部主操作沿用滚动列表页的 sticky bottom-0 约定；/points 现为「泡泡」一级 Tab，
  // TabBar 位于 MobileLayout 的滚动区之外，sticky 操作区会自然停在 TabBar 上方。
  return (
    <PageContainer className="flex flex-col pb-0" inset={false}>
      <section className="relative z-10 mx-4 mt-2 overflow-hidden rounded-feature border border-bubble-accent/30 bg-bubble-surface shadow-bubble">
        <img
          src={pointsBenefitHero}
          alt=""
          aria-hidden
          className="absolute right-[-18px] top-0 h-[148px] w-[218px] object-cover object-center"
          style={{
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, #000 24%, #000 100%)',
            maskImage: 'linear-gradient(to right, transparent 0%, #000 24%, #000 100%)',
          }}
        />
        <span className="absolute right-3 top-3 h-5 w-5 rounded-full border border-bubble-accent/50 bg-surface/70" aria-hidden />
        <span className="absolute right-[112px] top-5 h-2.5 w-2.5 rounded-full bg-bubble-accent/60" aria-hidden />

        <div className="relative z-10 min-h-[148px] px-5 pt-4">
          <p className="text-xs font-medium text-bubble-muted">泡泡值余额</p>
          <div className="mt-1 flex items-end gap-1.5">
            <p className="text-4xl font-bold tracking-tight text-bubble-text">{BUBBLE_BALANCE.toLocaleString()}</p>
            <span className="pb-1 text-xs text-bubble-muted">泡泡值</span>
          </div>
          <span className="mt-3 inline-flex items-center gap-1 rounded-pill border border-bubble-accent/30 bg-surface/80 px-2.5 py-1 text-[11px] font-medium text-bubble-muted">
            <Gift className="h-3.5 w-3.5" aria-hidden />
            攒泡泡 · 兑好礼
          </span>
        </div>

        <div className="relative z-10 grid grid-cols-2 border-t border-border-subtle bg-surface/85 py-3 backdrop-blur-sm">
          <div className="px-5">
            <p className="text-[11px] text-text-tertiary">累计收入</p>
            <p className="mt-0.5 text-sm font-semibold text-success-text">+{income}</p>
          </div>
          <div className="border-l border-border-subtle px-5">
            <p className="text-[11px] text-text-tertiary">累计消耗</p>
            <p className="mt-0.5 text-sm font-semibold text-danger-text">-{expense}</p>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-4 mt-4" aria-labelledby="points-benefits-title">
        <div className="mb-2.5 flex items-center justify-between px-1">
          <h2 id="points-benefits-title" className="flex items-center gap-1.5 text-base font-semibold text-text-primary">
            <Sparkles className="h-4 w-4 text-reward-strong" aria-hidden />
            泡泡福利
          </h2>
          <span className="text-[11px] text-text-tertiary">赚泡泡 · 兑好礼</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => navigate('/checkin')}
            className="flex min-h-[76px] items-center gap-2.5 rounded-container border border-bubble-accent/30 bg-bubble-surface px-3 text-left transition active:scale-[.98] active:bg-surface-pressed"
          >
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-control bg-bubble-accent text-bubble-on-gold">
              <CalendarCheck2 className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-bubble-text">每日签到</span>
              <span className="mt-0.5 block text-[11px] text-bubble-muted">打卡赚泡泡</span>
            </span>
            <ChevronRight className="h-3.5 w-3.5 flex-none text-bubble-muted" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => navigate('/exchange')}
            className="flex min-h-[76px] items-center gap-2.5 rounded-container border border-reward/40 bg-reward-subtle px-3 text-left transition active:scale-[.98] active:bg-surface-pressed"
          >
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-control bg-reward text-bubble-on-gold">
              <Gift className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-reward-text">洗护好礼</span>
              <span className="mt-0.5 block text-[11px] text-reward-text/80">泡泡值兑换</span>
            </span>
            <ChevronRight className="h-3.5 w-3.5 flex-none text-reward-text" aria-hidden />
          </button>
        </div>
      </section>

      <div className="relative z-10 mx-4 mt-4">
        <SegmentedControl
          items={BUBBLE_FILTERS.map((item) => ({ value: item.value, label: item.label }))}
          value={filter}
          onChange={(value) => {
            if (isBubbleFilter(value)) setFilter(value)
          }}
        />
      </div>

      <section className="relative z-10 mx-4 mt-4 flex-1" aria-label="泡泡值变动记录">
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

      <div className="sticky bottom-0 z-20 mt-4 bg-background px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
        <Button
          size="large"
          onClick={() => navigate('/exchange')}
          trailingIcon={ChevronRight}
          className="w-full rounded-pill text-sm"
        >
          立即兑换
        </Button>
      </div>

      <DebugPanel route={route} />
    </PageContainer>
  )
}
