import { useMemo } from 'react'
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
  type LucideIcon,
} from 'lucide-react'
import DebugPanel from '../components/mobile/DebugPanel'
import PageContainer from '../components/mobile/PageContainer'
import { Button, ProgressIndicator } from '../components/ui'
import { findRouteByPathname } from '../app/router/routes'
import {
  LUCK_PLACEHOLDER,
  POINTS_TASK_PLACEHOLDERS,
  type PointsTaskPlaceholder,
} from '../app/fixtures'
import {
  SIGN_ACTIVITY_STATUS_ACTIVE,
  SIGN_ACTIVITY_STATUS_CLOSED,
  type SignActivity,
} from '../services/signrecords'
import { useSignActivityList, useUserPointsStat } from './points/usePointsFeed'
import pointsBenefitCheckin from '../assets/brand/bubble/points-benefit-checkin.webp'
import pointsBenefitHero from '../assets/brand/bubble/points-benefit-hero-v2.webp'
import pointsBenefitLuck from '../assets/brand/bubble/points-benefit-luck.svg'
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
 * 2026-08-28：澡运入口补独立金色图标物料，不再使用通用 Waves 线框图标。
 * 2026-09-28：接入 GET /api/userpoints/stat —— 顶部「可用 / 累计收入 / 累计消耗」三块数字
 *    改为读接口（可用严格取 points，禁止用 income - expense 反推）。泡泡任务区仍为占位，
 *    继续读 fixtures，不受本次接口接入影响。
 * 2026-09-28（续）：泡泡任务区接入 GET /api/signactivity/list —— 签到类任务（每日打卡 /
 *    连续签到）的标题与进度改读接口（title / signed_days / max_days）；「观看视频」「邀请好友」
 *    在该接口无对应数据，继续读 fixtures 占位。接口返回什么状态就展示什么，前端暂不过滤。
 * 2026-09-29：泡泡任务区移除「占位」标签与占位说明文案；「进行中」任务的状态色由金色
 *    改为品牌橙（浅橙底 + 主色图标/文字），避免与相邻任务并排时出现厚重金色块。
 */

/** 占位任务与图标的对应关系；任务语义沿用流水夹具中的同名条目 */
const TASK_ICONS: Record<string, LucideIcon> = {
  'daily-checkin': CalendarCheck,
  'streak-checkin': Flame,
  'watch-video': Video,
  'invite-buddy': UserPlus,
}

/**
 * 打卡类任务（每日打卡 / 连续签到）复用 Dashboard 语义的图标。
 * signactivity/list 的 title 是后端配置文案，不能保证与 id 稳定对应，
 * 因此按「标题包含关键词」做软匹配，未命中一律回退到通用任务图标。
 */
function resolveTaskIcon(title: string): LucideIcon {
  if (title.includes('连续')) return Flame
  if (title.includes('签到') || title.includes('打卡')) return CalendarCheck
  return ListTodo
}

/** 三个状态各自的 Token 组合，避免在 JSX 里散落条件类名 */
const TASK_STATE_STYLES = {
  done: {
    icon: 'bg-checkin-success-bg text-checkin-success',
    tag: 'bg-checkin-success-bg text-checkin-success',
    bar: '[&>div>div]:bg-checkin-success',
  },
  active: {
    icon: 'bg-secondary text-text-brand',
    tag: 'bg-secondary text-text-brand',
    bar: '[&>div>div]:bg-primary',
  },
  todo: {
    icon: 'bg-surface-subtle text-text-tertiary',
    tag: 'bg-surface-subtle text-text-tertiary',
    bar: '[&>div>div]:bg-border-subtle',
  },
} as const

/**
 * 任务卡视图模型。占位卡与接口卡共用同一张卡皮肤，
 * 差异只在数据来源，避免两套卡片视觉漂移。
 */
interface TaskCardView {
  id: string
  title: string
  description: string
  current: number
  target: number
  state: keyof typeof TASK_STATE_STYLES
  stateLabel: string
  rewardBubble: number | null
  icon: LucideIcon
}

function toPercent(current: number, target: number): number {
  if (target <= 0) return 0
  return Math.min(100, Math.round((current / target) * 100))
}

/** 占位卡 → 视图模型 */
function toPlaceholderView(task: PointsTaskPlaceholder): TaskCardView {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    current: task.current,
    target: task.target,
    state: task.state,
    stateLabel: task.stateLabel,
    rewardBubble: task.rewardBubble,
    icon: TASK_ICONS[task.id] ?? ListTodo,
  }
}

/**
 * 签到活动 → 视图模型。
 * 进度用文档建议的 `signed_days / max_days`，并用 Math.min 兜底避免超过 100%。
 * 状态映射：20=进行中、40=已关闭，其余未开始；
 * 进度打满时优先记为已完成 —— 这是纯展示派生，不写入任何业务结算。
 */
export function toActivityView(activity: SignActivity): TaskCardView {
  const target = Math.max(activity.max_days, 0)
  const current = Math.min(Math.max(activity.signed_days, 0), target)
  const done = target > 0 && current >= target
  const active = activity.status === SIGN_ACTIVITY_STATUS_ACTIVE
  const closed = activity.status === SIGN_ACTIVITY_STATUS_CLOSED

  return {
    id: `signactivity-${activity.id}`,
    title: activity.title,
    description: done ? '已达成本轮签到进度' : '签到累积进度',
    current,
    target,
    state: done ? 'done' : active ? 'active' : 'todo',
    stateLabel: done ? '已完成' : closed ? '已关闭' : active ? '进行中' : '未开始',
    rewardBubble: null,
    icon: resolveTaskIcon(activity.title),
  }
}

/**
 * 任务卡（占位 / 接口共用）。
 * 需求 §4.2 只要求「视觉完整的占位卡片」，因此这里刻意不做成可点击控件，
 * 避免把未定稿的任务体系表现成已经可用的功能入口。
 */
function PointsTaskCard({ task }: { task: TaskCardView }) {
  const Icon = task.icon
  const styles = TASK_STATE_STYLES[task.state]
  const percent = toPercent(task.current, task.target)

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

      {task.rewardBubble == null ? null : (
        <span className="shrink-0 text-sm font-semibold text-reward-strong">
          +{task.rewardBubble}
          <span className="ml-0.5 text-xs font-normal">🫧</span>
        </span>
      )}
    </div>
  )
}

/** 三个福利入口共用同一张卡片皮肤，保证「同风格」要求 */
const BENEFIT_CARD_CLASS =
  'group relative flex flex-col items-center overflow-hidden rounded-[16px] border border-[#efcf98] bg-[linear-gradient(150deg,#fffaf0_0%,#fff8e9_58%,#f8e3bc_100%)] px-1.5 pb-3 pt-3 text-center shadow-[0_5px_14px_rgba(166,111,32,0.08)] transition active:scale-[.98]'

/** 余额 / 累计数字在加载或失败时的占位，不显示误导性的旧夹具值。 */
const POINTS_VALUE_PLACEHOLDER = '--'

export default function Points() {
  const navigate = useNavigate()
  const route = findRouteByPathname('/points')

  // GET /api/userpoints/stat：可用严格取 points，累计收入 / 消耗取 income / expense。
  // 两者是独立口径，禁止用 income - expense 反推可用余额。
  const { remote: statRemote } = useUserPointsStat()
  const stat = statRemote.state === 'success' ? statRemote.data : null
  const balanceText = stat ? stat.points.toLocaleString() : POINTS_VALUE_PLACEHOLDER
  const incomeText = stat ? String(stat.income) : POINTS_VALUE_PLACEHOLDER
  const expenseText = stat ? String(stat.expense) : POINTS_VALUE_PLACEHOLDER

  // GET /api/signactivity/list：签到类任务（每日打卡 / 连续签到）的数据源。
  // 接口返回什么状态就展示什么，前端暂不过滤（产品未定是否过滤 status=10/40）。
  const { remote: activityRemote } = useSignActivityList()

  // 任务区最终列表 = 接口返回的签到活动（成功时）+ 无数据源的占位卡。
  // 接口失败时回退为纯占位，不把失败伪装成空数据。
  const taskCards = useMemo<TaskCardView[]>(() => {
    const activityCards =
      activityRemote.state === 'success' ? activityRemote.data.map(toActivityView) : []

    // 「观看视频」「邀请好友」在 signactivity/list 中无对应数据，保持占位。
    const placeholderOnly = POINTS_TASK_PLACEHOLDERS.filter(
      (task) => task.id === 'watch-video' || task.id === 'invite-buddy',
    ).map(toPlaceholderView)

    return [...activityCards, ...placeholderOnly]
  }, [activityRemote])

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
              {balanceText}
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
            <p className="mt-0.5 text-sm font-semibold text-success-text">
              {stat ? `+${incomeText}` : incomeText}
            </p>
          </div>
          <div className="min-w-0 flex-1 border-l border-[#e6cda3] px-4">
            <p className="text-[11px] text-[#8c7357]">累计消耗</p>
            <p className="mt-0.5 text-sm font-semibold text-danger-text">
              {stat ? `-${expenseText}` : expenseText}
            </p>
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

          {/* 2026-08-28：澡运补独立金色图标物料，保持与两侧福利插画同级，不再用通用线框 icon。 */}
          <button type="button" onClick={() => navigate('/luck')} className={BENEFIT_CARD_CLASS}>
            <span className="flex h-14 w-14 items-center justify-center" aria-hidden>
              <img src={pointsBenefitLuck} alt="" className="h-[64px] w-[64px] max-w-none object-contain" />
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

      {/* 需求 §4.2：原流水区域释放给任务内容 */}
      <section className="relative z-10 mx-4 mt-5 flex-1" aria-labelledby="points-tasks-title">
        <h2
          id="points-tasks-title"
          className="mb-2 flex items-center gap-1.5 px-0.5 text-base font-semibold text-text-primary"
        >
          <ListTodo className="h-4 w-4 text-reward-strong" aria-hidden />
          泡泡任务
        </h2>
        <div className="overflow-hidden rounded-feature border border-border-subtle bg-surface shadow-bubble">
          {taskCards.map((task) => (
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
