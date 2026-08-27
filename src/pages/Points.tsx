import { useNavigate } from 'react-router-dom'
import {
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Flame,
  Gift,
  ListTodo,
  Sparkles,
  UserPlus,
  Video,
  Waves,
  type LucideIcon,
} from 'lucide-react'
import DebugPanel from '../components/mobile/DebugPanel'
import PageContainer from '../components/mobile/PageContainer'
import { Button, ProgressIndicator } from '../components/ui'
import { findRouteByPathname } from '../app/router/routes'
import {
  BUBBLE_BALANCE,
  LUCK_PLACEHOLDER,
  POINTS_TASK_PLACEHOLDERS,
  POINTS_TASK_PLACEHOLDER_NOTE,
  pointsTaskPercent,
  sumBubbleRecords,
  type PointsTaskPlaceholder,
} from '../app/fixtures'
import pointsBenefitCheckin from '../assets/brand/bubble/points-benefit-checkin.webp'
import pointsBenefitHero from '../assets/brand/bubble/points-benefit-hero-v2.webp'
import pointsBenefitVoucher from '../assets/brand/bubble/points-benefit-voucher.webp'

/**
 * 泡泡值（#5）
 * -------------------------------------------------------------
 * 事实源：docs/prototype/02-membership-and-checkin.md §3
 * 已确认：泡泡值余额（1280）、保留前往兑换入口。
 * ⚠️ B-002 未决：历史稿把原型紫色改为暖橙/暖金，并新增余额胶囊与 15 条 mock。
 *    因此这里不引入新的品牌配色方案，只用项目已确认的语义 Token；
 *    余额与任务一律读 fixtures，定稿时只改夹具，不改页面。
 * 需求确认（docs/requirements/2026-08-27-ui-change-requirements.md §4）：
 *    §4.1/§4.2 本页不再以流水列表为主要内容，原明细区域改为任务占位区，
 *              资产卡「看明细」跳转独立明细页 /points/detail；
 *    §4.3 澡运入口保持金色卡片风格，且入口与目标页均为占位（LUCK_PLACEHOLDER）；
 *    §4.4 底部主按钮文案改为「泡泡值兑换」，样式、位置与跳转逻辑保持不变。
 */

/** 占位任务与图标的对应关系；任务语义沿用流水夹具中的同名条目 */
const TASK_ICONS: Record<string, LucideIcon> = {
  'daily-checkin': CalendarCheck,
  'streak-checkin': Flame,
  'watch-video': Video,
  'invite-buddy': UserPlus,
}

/** 三个状态各自的 Token 组合，避免在 JSX 里散落条件类名 */
const TASK_STATE_STYLES = {
  done: {
    icon: 'bg-checkin-success-bg text-checkin-success',
    tag: 'bg-checkin-success-bg text-checkin-success',
    bar: '[&>div>div]:bg-checkin-success',
  },
  active: {
    icon: 'bg-reward text-reward-strong',
    tag: 'bg-reward text-reward-strong',
    bar: '[&>div>div]:bg-reward-strong',
  },
  todo: {
    icon: 'bg-surface-subtle text-text-tertiary',
    tag: 'bg-surface-subtle text-text-tertiary',
    bar: '[&>div>div]:bg-border-subtle',
  },
} as const

/**
 * 任务占位卡。
 * 需求 §4.2 只要求「视觉完整的占位卡片」，因此这里刻意不做成可点击控件，
 * 避免把未定稿的任务体系表现成已经可用的功能入口。
 */
function PointsTaskCard({ task }: { task: PointsTaskPlaceholder }) {
  const Icon = TASK_ICONS[task.id] ?? ListTodo
  const styles = TASK_STATE_STYLES[task.state]
  const percent = pointsTaskPercent(task)

  return (
    <div className="flex items-center gap-3 border-b border-border-subtle px-4 py-3.5 last:border-0">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-app-icon ${styles.icon}`} aria-hidden>
        <Icon className="h-5 w-5" strokeWidth={1.9} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-medium text-text-primary">{task.title}</p>
          <span
            className={`inline-flex shrink-0 items-center gap-0.5 rounded-pill px-1.5 py-0.5 text-[10px] font-semibold ${styles.tag}`}
          >
            {task.state === 'done' ? (
              <CheckCircle2 className="h-3 w-3" aria-hidden />
            ) : (
              <Clock3 className="h-3 w-3" aria-hidden />
            )}
            {task.stateLabel}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-text-tertiary">{task.description}</p>
        <div className="mt-2 flex items-center gap-2">
          <ProgressIndicator
            value={percent}
            label={`${task.title}进度`}
            className={`min-w-0 flex-1 [&>div]:h-1.5 [&>div]:bg-surface-subtle ${styles.bar}`}
          />
          <span className="shrink-0 text-[11px] tabular-nums text-text-tertiary">
            {task.current}/{task.target}
          </span>
        </div>
      </div>

      <span className="shrink-0 text-sm font-semibold text-reward-strong">
        +{task.rewardBubble}
        <span className="ml-0.5 text-xs font-normal">🫧</span>
      </span>
    </div>
  )
}

/** 三个福利入口共用同一张卡片皮肤，保证「同风格」要求 */
const BENEFIT_CARD_CLASS =
  'group relative flex flex-col items-center overflow-hidden rounded-[16px] border border-[#efcf98] bg-[linear-gradient(150deg,#fffaf0_0%,#fff8e9_58%,#f8e3bc_100%)] px-1.5 pb-3 pt-3 text-center shadow-[0_5px_14px_rgba(166,111,32,0.08)] transition active:scale-[.98]'

export default function Points() {
  const navigate = useNavigate()
  const route = findRouteByPathname('/points')

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

        {/* 需求 §4.2：资产卡的「看明细」是进入纯流水明细页的唯一入口 */}
        <div className="relative z-10 flex items-center border-t border-[#e9c98f]/65 bg-[linear-gradient(90deg,rgba(255,250,240,0.92),rgba(255,245,225,0.82))] py-2.5 pr-3 backdrop-blur-md">
          <div className="min-w-0 flex-1 px-4">
            <p className="text-[11px] text-[#8c7357]">累计收入</p>
            <p className="mt-0.5 text-sm font-semibold text-success-text">+{income}</p>
          </div>
          <div className="min-w-0 flex-1 border-l border-[#e6cda3] px-4">
            <p className="text-[11px] text-[#8c7357]">累计消耗</p>
            <p className="mt-0.5 text-sm font-semibold text-danger-text">-{expense}</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/points/detail')}
            className="inline-flex shrink-0 items-center gap-0.5 rounded-pill border border-[#e7b96b]/70 bg-white/75 px-2.5 py-1 text-[11px] font-medium text-[#8a5f24] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition active:opacity-70"
          >
            看明细
            <ChevronRight className="h-3 w-3" aria-hidden />
          </button>
        </div>
      </section>

      {/* 需求 §4.2：泡泡福利区按「每日签到 / 澡运 / 体验券兑换」顺序展示三个同风格入口 */}
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
        <div className="grid grid-cols-3 gap-2.5">
          <button type="button" onClick={() => navigate('/checkin')} className={BENEFIT_CARD_CLASS}>
            <span className="flex h-14 w-14 items-center justify-center" aria-hidden>
              <img src={pointsBenefitCheckin} alt="" className="h-[64px] w-[64px] max-w-none object-contain" />
            </span>
            <span className="mt-1 block whitespace-nowrap text-[13px] font-semibold text-bubble-text">每日签到</span>
            <span className="mt-0.5 block whitespace-nowrap text-[11px] text-bubble-muted">打卡赚泡泡</span>
          </button>

          {/* 需求 §4.3：澡运沿用金色插画风格，但入口副标题直接标注占位，不暗示玩法已定稿。
              品牌素材里澡运只有整页蓝色 Hero，不适合当 56px 图标，因此用金色圆底 + Waves 图标。 */}
          <button type="button" onClick={() => navigate('/luck')} className={BENEFIT_CARD_CLASS}>
            <span
              className="flex h-14 w-14 items-center justify-center rounded-full border border-[#eec77e] bg-[linear-gradient(140deg,#fff4dc,#f3d59b)] text-[#a96f16] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]"
              aria-hidden
            >
              <Waves className="h-7 w-7" strokeWidth={1.8} />
            </span>
            <span className="mt-1 block whitespace-nowrap text-[13px] font-semibold text-bubble-text">澡运</span>
            <span className="mt-0.5 block whitespace-nowrap text-[11px] text-bubble-muted">
              {LUCK_PLACEHOLDER.entrySubtitle}
            </span>
          </button>

          <button type="button" onClick={() => navigate('/exchange')} className={BENEFIT_CARD_CLASS}>
            <span className="flex h-14 w-14 items-center justify-center" aria-hidden>
              <img src={pointsBenefitVoucher} alt="" className="h-[64px] w-[64px] max-w-none object-contain" />
            </span>
            <span className="mt-1 block whitespace-nowrap text-[13px] font-semibold text-reward-text">体验券兑换</span>
            <span className="mt-0.5 block whitespace-nowrap text-[11px] text-reward-text/80">泡泡值兑券</span>
          </button>
        </div>
      </section>

      {/* 需求 §4.2：原流水区域释放给任务内容，当前为视觉完整的占位卡 */}
      <section className="relative z-10 mx-4 mt-5 flex-1" aria-labelledby="points-tasks-title">
        <div className="mb-2 flex items-center justify-between px-0.5">
          <h2 id="points-tasks-title" className="flex items-center gap-1.5 text-base font-semibold text-text-primary">
            <ListTodo className="h-4 w-4 text-reward-strong" aria-hidden />
            泡泡任务
          </h2>
          <span className="inline-flex items-center rounded-pill bg-secondary px-2 py-0.5 text-[11px] font-semibold text-text-brand">
            占位
          </span>
        </div>
        <p className="mb-2 px-0.5 text-[11px] leading-5 text-text-tertiary">{POINTS_TASK_PLACEHOLDER_NOTE}</p>
        <div className="overflow-hidden rounded-feature border border-border-subtle bg-surface shadow-bubble">
          {POINTS_TASK_PLACEHOLDERS.map((task) => (
            <PointsTaskCard key={task.id} task={task} />
          ))}
        </div>
      </section>

      {/* 需求 §4.4：仅改文案，样式、位置与跳转逻辑保持不变 */}
      <div className="sticky bottom-0 z-20 mt-4 bg-background px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
        <Button
          size="large"
          onClick={() => navigate('/exchange')}
          trailingIcon={ChevronRight}
          className="w-full rounded-pill text-sm"
        >
          泡泡值兑换
        </Button>
      </div>

      <DebugPanel route={route} />
    </PageContainer>
  )
}
