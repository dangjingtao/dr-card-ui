import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDownLeft, ArrowUpRight, ChevronRight, Gift, Sparkles } from 'lucide-react'
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
import pointsBenefitCheckin from '../assets/brand/bubble/points-benefit-checkin.webp'
import pointsBenefitHero from '../assets/brand/bubble/points-benefit-hero-v2.webp'
import pointsBenefitVoucher from '../assets/brand/bubble/points-benefit-voucher.webp'

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
      <section className="relative z-10 mx-4 mt-2 overflow-hidden rounded-[20px] border border-[#eec77e] bg-[linear-gradient(118deg,#fffaf1_0%,#fff6e5_48%,#f6d79f_100%)] shadow-[0_10px_28px_rgba(169,111,22,0.14)]">
        <img
          src={pointsBenefitHero}
          alt=""
          aria-hidden
          className="absolute -right-5 -top-2 h-[190px] w-[235px] object-cover object-center"
          style={{
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,.85) 27%, #000 46%, #000 100%)',
            maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,.85) 27%, #000 46%, #000 100%)',
          }}
        />
        <span
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_12%,rgba(255,255,255,0.86),transparent_28%)]"
          aria-hidden
        />

        <div className="relative z-10 min-h-[132px] px-4 pt-4">
          <p className="text-xs font-medium tracking-wide text-[#845a2e]">泡泡值余额</p>
          <div className="mt-1 flex items-end gap-1.5">
            <p className="text-[42px] font-bold leading-none tracking-[-0.045em] text-[#21190f]">
              {BUBBLE_BALANCE.toLocaleString()}
            </p>
            <span className="pb-1 text-xs font-medium text-[#765634]">泡泡值</span>
          </div>
          <span className="mt-3 inline-flex items-center gap-1 rounded-pill border border-[#e7b96b]/70 bg-white/70 px-2.5 py-1 text-[11px] font-medium text-[#765634] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-sm">
            <Gift className="h-3.5 w-3.5" aria-hidden />
            攒泡泡 · 兑体验券
          </span>
        </div>

        <div className="relative z-10 grid grid-cols-2 border-t border-[#e9c98f]/65 bg-[linear-gradient(90deg,rgba(255,250,240,0.92),rgba(255,245,225,0.82))] py-2.5 backdrop-blur-md">
          <div className="px-4">
            <p className="text-[11px] text-[#8c7357]">累计收入</p>
            <p className="mt-0.5 text-sm font-semibold text-success-text">+{income}</p>
          </div>
          <div className="border-l border-[#e6cda3] px-5">
            <p className="text-[11px] text-[#8c7357]">累计消耗</p>
            <p className="mt-0.5 text-sm font-semibold text-danger-text">-{expense}</p>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-4 mt-4" aria-labelledby="points-benefits-title">
        <div className="mb-2 flex items-center justify-between px-0.5">
          <h2 id="points-benefits-title" className="flex items-center gap-1.5 text-base font-semibold text-text-primary">
            <Sparkles className="h-4 w-4 text-reward-strong" aria-hidden />
            泡泡福利
          </h2>
          <button
            type="button"
            onClick={() => navigate('/exchange')}
            className="inline-flex items-center gap-0.5 text-[11px] text-text-tertiary transition active:opacity-60"
          >
            赚泡泡 · 兑体验券
            <ChevronRight className="h-3 w-3" aria-hidden />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => navigate('/checkin')}
            className="group relative flex min-h-[84px] items-center overflow-hidden rounded-[16px] border border-[#efcf98] bg-[linear-gradient(120deg,#fffaf0_0%,#fff8e9_58%,#f8e3bc_100%)] pl-[68px] pr-6 text-left shadow-[0_5px_14px_rgba(166,111,32,0.08)] transition active:scale-[.98]"
          >
            <span className="pointer-events-none absolute inset-y-0 left-0 flex w-[68px] items-center justify-center" aria-hidden>
              <img src={pointsBenefitCheckin} alt="" className="h-[72px] w-[72px] max-w-none object-contain" />
            </span>
            <span className="relative z-10 min-w-0 flex-1">
              <span className="block whitespace-nowrap text-[13px] font-semibold text-bubble-text">每日签到</span>
              <span className="mt-0.5 block text-[11px] text-bubble-muted">打卡赚泡泡</span>
            </span>
            <ChevronRight className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#b27b27] transition-transform group-active:translate-x-0.5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => navigate('/exchange')}
            className="group relative flex min-h-[84px] items-center overflow-hidden rounded-[16px] border border-[#efcf98] bg-[linear-gradient(120deg,#fffaf0_0%,#fff8e9_58%,#f8e3bc_100%)] pl-[68px] pr-6 text-left shadow-[0_5px_14px_rgba(166,111,32,0.08)] transition active:scale-[.98]"
          >
            <span className="pointer-events-none absolute inset-y-0 left-0 flex w-[68px] items-center justify-center" aria-hidden>
              <img src={pointsBenefitVoucher} alt="" className="h-[72px] w-[72px] max-w-none object-contain" />
            </span>
            <span className="relative z-10 min-w-0 flex-1">
              <span className="block whitespace-nowrap text-[13px] font-semibold text-reward-text">体验券兑换</span>
              <span className="mt-0.5 block text-[11px] text-reward-text/80">泡泡值兑券</span>
            </span>
            <ChevronRight className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#b27b27] transition-transform group-active:translate-x-0.5" aria-hidden />
          </button>
        </div>
      </section>

      <div className="relative z-10 mx-4 mt-4">
        <SegmentedControl
          items={BUBBLE_FILTERS.map((item) => ({ value: item.value, label: item.label }))}
          value={filter}
          className="border border-[#eadbc2]/80 bg-[#f5ecdf]/90 shadow-[inset_0_1px_1px_rgba(127,82,27,0.04)] [&>button]:text-[#74634f] [&>button[aria-selected=true]]:border [&>button[aria-selected=true]]:border-[#ebd1a4] [&>button[aria-selected=true]]:bg-[#fffaf1] [&>button[aria-selected=true]]:text-[#b56e22] [&>button[aria-selected=true]]:shadow-[0_2px_6px_rgba(145,91,24,0.08)]"
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
