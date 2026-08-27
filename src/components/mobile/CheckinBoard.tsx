import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, CalendarDays, Check, CheckCircle2, ChevronRight, Gift, ListTodo, Sparkles } from 'lucide-react'
import { Button, ProgressIndicator } from '../ui'
import {
  CHECKIN_CALENDAR,
  CHECKIN_CYCLE_LABEL,
  CHECKIN_DAILY_TASK,
  CHECKIN_FIRST_WEEKDAY,
  CHECKIN_PICKS,
  CHECKIN_REWARDS,
  CHECKIN_RULE_STATUS,
  CHECKIN_STATUS_TEXT,
  CHECKIN_STREAK,
  CHECKIN_WEEK_LABELS,
  type CheckinDay,
} from '../../app/fixtures'
import checkinRitualHero from '../../assets/brand/bubble/checkin-ritual-hero-v2.webp'
import pickShampooA from '../../assets/brand/exchange/exchange-pick-shampoo-a.webp'
import pickShampooB from '../../assets/brand/exchange/exchange-pick-shampoo-b.webp'

const pickAssets = [pickShampooA, pickShampooB] as const

/**
 * 奖励轨道填充比例：按「已达成的最后一个节点 + 相邻节点之间的天数插值」派生。
 * 只用 CHECKIN_STREAK 与 CHECKIN_REWARDS 的既有天数，不引入任何未确认规则或奖励数值。
 */
function getRewardRailPercent() {
  const total = CHECKIN_REWARDS.length
  if (total < 2) return CHECKIN_STREAK >= (CHECKIN_REWARDS[0]?.days ?? 0) ? 100 : 0

  let reached = -1
  CHECKIN_REWARDS.forEach((reward, index) => {
    if (CHECKIN_STREAK >= reward.days) reached = index
  })
  if (reached === total - 1) return 100

  const from = reached >= 0 ? CHECKIN_REWARDS[reached].days : 0
  const to = CHECKIN_REWARDS[reached + 1].days
  const span = to - from
  const inner = span > 0 ? (CHECKIN_STREAK - from) / span : 0
  const ratio = (reached + Math.min(1, Math.max(0, inner))) / (total - 1)
  return Math.min(100, Math.max(0, ratio * 100))
}

/** 是日任务进度条比例：解析夹具里既有的「1 / 1」文案，不额外引入进度字段。 */
const CHECKIN_DAILY_TASK_PERCENT = (() => {
  const [done, total] = CHECKIN_DAILY_TASK.progress.split('/').map((part) => Number(part.trim()))
  if (!Number.isFinite(done) || !Number.isFinite(total) || total <= 0) return 0
  return Math.min(100, Math.max(0, (done / total) * 100))
})()

export interface CheckinBoardProps {
  /** 打卡成功态（#8）：精选模块换成「查看完整签到状态」 */
  isSuccess?: boolean
  /** 点击月历「补签」：由宿主页面决定打开哪个补打卡成功弹窗 */
  onMakeup: () => void
  /** `?debug=1` 时追加未决规则说明 */
  debug?: boolean
}

/**
 * 打卡业务内容（今日签到状态 / 当月签到日历 / 是日任务 / 为你精选）
 * -------------------------------------------------------------
 * 事实源与视觉口径完全沿用 T006 已验收的 /checkin，本组件只做「内容抽取」：
 * - 不含页面标题栏、返回栏、底部导航与 PageContainer，宿主页面自备唯一外壳；
 * - 不含 reminder / make-up-success 弹窗，弹窗仍由宿主页面按自己的 `?overlay=` 登记持有；
 * - section 自管 `mx-4`，宿主需用 `inset={false}` 的 PageContainer 承载。
 * T021 起被 /checkin 与诗得丽品牌专栏首页 `/` 共同复用，避免出现两套打卡实现。
 */
export default function CheckinBoard({ isSuccess = false, onMakeup, debug = false }: CheckinBoardProps) {
  const navigate = useNavigate()
  const completedDays = CHECKIN_CALENDAR.filter((item) => item.state === 'done' || item.state === 'today').length
  const rewardRailPercent = getRewardRailPercent()

  return (
    <>
      <section
        className="relative mx-4 min-h-[180px] overflow-hidden rounded-feature px-5 pb-5 pt-4 shadow-bubble"
        aria-label="今日签到状态"
        style={{ backgroundImage: 'var(--gradient-checkin-hero)' }}
      >
        <span aria-hidden className="absolute -right-8 -top-14 h-44 w-44 rounded-full border border-white/40" />
        <span aria-hidden className="absolute right-4 top-4 h-28 w-28 rounded-full bg-surface/25 blur-2xl" />
        <span aria-hidden className="absolute right-[128px] top-5 h-4 w-4 rounded-full border border-surface/70 bg-surface/30 shadow-sm" />
        <span aria-hidden className="absolute right-[146px] top-12 h-2.5 w-2.5 rounded-full bg-surface/55" />
        <img src={checkinRitualHero} alt="" aria-hidden className="absolute -right-1 -bottom-2 h-[168px] w-[152px] object-contain drop-shadow-[0_14px_18px_rgba(122,33,6,0.18)]" />
        <div className="relative max-w-[210px]">
          <p className="inline-flex items-center gap-1.5 rounded-pill bg-surface/45 px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] text-bubble-on-gold-muted">
            <Sparkles className="h-3 w-3" aria-hidden />
            DAILY CHECK-IN
          </p>
          <p className="mt-2.5 flex items-center gap-1.5 text-2xl font-bold leading-8 text-bubble-on-gold">
            <CheckCircle2 className="h-6 w-6" strokeWidth={2.4} aria-hidden />
            {CHECKIN_STATUS_TEXT}
          </p>
          <p className="mt-1 text-[11px] text-bubble-on-gold-muted">{CHECKIN_CYCLE_LABEL}</p>
          <div className="mt-3.5 flex items-end gap-2.5">
            <span className="text-[40px] font-semibold leading-none tracking-tight text-bubble-on-gold">{String(CHECKIN_STREAK).padStart(2, '0')}</span>
            <span className="mb-0.5 border-l border-bubble-on-gold-muted/25 pl-2.5 text-xs leading-[18px] text-bubble-on-gold-muted">当前周期<br />连续签到天数</span>
          </div>
        </div>
      </section>

      <section className="relative mx-4 mt-4 overflow-hidden rounded-feature bg-surface p-4 shadow-bubble" aria-label="当月签到日历">
        <span aria-hidden className="absolute -right-5 -top-7 h-24 w-24 rounded-full bg-reward-subtle/70" />
        <header className="mb-4 flex items-center justify-between">
          <div className="relative flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-app-icon bg-secondary text-text-brand">
              <CalendarDays className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-base font-bold text-text-primary">2026 年 6 月</h2>
              <p className="mt-0.5 text-[11px] text-text-tertiary">本周期签到日历</p>
            </div>
          </div>
          <span className="relative rounded-pill bg-reward-subtle px-2.5 py-1 text-[10px] font-semibold text-reward-text">已点亮 {completedDays} 天</span>
        </header>

        <div className="grid grid-cols-7 gap-1">
          {CHECKIN_WEEK_LABELS.map((label) => (
            <span key={label} className="pb-1 text-center text-[11px] font-medium text-text-tertiary">
              {label}
            </span>
          ))}
          {Array.from({ length: CHECKIN_FIRST_WEEKDAY }, (_, index) => (
            <span key={`blank-${index}`} aria-hidden />
          ))}
          {CHECKIN_CALENDAR.map((item) => (
            <CalendarCell key={item.day} item={item} onMakeup={onMakeup} />
          ))}
        </div>

        <div className="relative mt-5 overflow-hidden rounded-feature bg-reward-subtle p-3.5">
          <span aria-hidden className="absolute -bottom-9 -right-7 h-24 w-24 rounded-full bg-reward/15 blur-xl" />
          <div className="relative mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-reward text-text-inverse" aria-hidden>
                <Gift className="h-3.5 w-3.5" />
              </span>
              <h3 className="text-sm font-semibold text-text-primary">连续签到奖励</h3>
            </div>
            <span className="rounded-pill bg-surface/85 px-2 py-0.5 text-[10px] font-semibold text-reward-text">下一节点 10 天</span>
          </div>

          <div className="relative">
            <ProgressIndicator
              value={rewardRailPercent}
              label="连续签到奖励进度"
              className="absolute left-[18px] right-[18px] top-[18px] -translate-y-1/2 [&>div]:h-1.5 [&>div]:bg-surface [&>div>div]:bg-reward"
            />
            <ul className="relative grid grid-cols-2 gap-8">
              {CHECKIN_REWARDS.map((reward, index) => {
                const achieved = CHECKIN_STREAK >= reward.days
                const isLast = index === CHECKIN_REWARDS.length - 1

                return (
                  <li key={reward.days} className={`relative ${isLast ? 'text-right' : 'text-left'}`}>
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full ${isLast ? 'ml-auto' : ''} ${
                        achieved
                          ? 'bg-reward text-text-inverse shadow-[0_4px_10px_rgba(191,142,58,0.35)]'
                          : 'border-[3px] border-surface bg-reward-subtle text-reward-strong'
                      }`}
                      aria-hidden
                    >
                      {achieved ? <Check className="h-4 w-4" strokeWidth={3} /> : <Gift className="h-3.5 w-3.5" />}
                    </span>
                    <span className="mt-2 block text-[11px] leading-4 text-text-tertiary">连续签到</span>
                    <span className="block text-lg font-bold leading-6 text-text-primary">{reward.days} 天</span>
                    {reward.bubble != null ? (
                      <span
                        className={`mt-1 inline-flex items-center rounded-pill px-2 py-0.5 text-xs font-bold leading-4 ${
                          achieved ? 'bg-reward text-text-inverse' : 'bg-surface text-bubble-text'
                        }`}
                      >
                        +{reward.bubble}🫧
                      </span>
                    ) : (
                      /* 原型只写「连续 10 天等」，未给数值，不自行补值 */
                      <span className="mt-1 inline-flex items-center rounded-pill bg-surface/85 px-2 py-0.5 text-xs leading-4 text-text-tertiary">
                        奖励待定
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-4 mt-7" aria-label="是日任务">
        <header className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.16em] text-reward-strong">DAILY MISSION</p>
            <h2 className="mt-1 text-lg font-bold leading-6 text-text-primary">是日任务</h2>
          </div>
          <span className="inline-flex items-center gap-1 rounded-pill bg-checkin-success-bg px-2.5 py-1 text-[11px] font-semibold text-checkin-success">
            <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
            今日进度 {CHECKIN_DAILY_TASK.progress}
          </span>
        </header>

        <article
          className="relative mt-3 overflow-hidden rounded-feature bg-surface p-4 shadow-bubble"
          aria-label={`${CHECKIN_DAILY_TASK.title} 已完成`}
        >
          <span aria-hidden className="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-checkin-success-bg/60" />
          <div className="relative flex items-center gap-3">
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-app-icon bg-secondary text-text-brand" aria-hidden>
              <ListTodo className="h-5 w-5" strokeWidth={2.2} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold leading-5 text-text-primary">{CHECKIN_DAILY_TASK.title}</p>
              <p className="mt-0.5 text-xs leading-[18px] text-text-secondary">{CHECKIN_DAILY_TASK.description}</p>
            </div>
            <span className="flex flex-none flex-col items-end gap-1">
              <span className="inline-flex items-center rounded-pill bg-reward px-2 py-0.5 text-xs font-bold leading-4 text-text-inverse">
                +{CHECKIN_DAILY_TASK.rewardBubble}🫧
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-checkin-success">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                已完成
              </span>
            </span>
          </div>

          <ProgressIndicator
            value={CHECKIN_DAILY_TASK_PERCENT}
            label={`${CHECKIN_DAILY_TASK.title}进度`}
            className="relative mt-3.5 [&>div]:h-1.5 [&>div]:bg-surface-subtle [&>div>div]:bg-checkin-success"
          />
        </article>
      </section>

      {isSuccess ? (
        <div className="mx-4 mt-4">
          <Button variant="outline" className="w-full" onClick={() => navigate('/checkin')}>
            查看完整签到状态
          </Button>
        </div>
      ) : (
        <section className="mx-4 mt-7" aria-label="为你精选">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[11px] font-medium tracking-[0.16em] text-reward-strong">CURATED EXPERIENCES</p>
              <h2 className="mt-1 text-xl font-bold leading-7 text-text-primary">为你精选</h2>
            </div>
            <button type="button" onClick={() => navigate('/exchange')} className="flex min-h-11 items-center gap-0.5 text-sm text-text-secondary">
              体验券兑换
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
          {/* B-018 未决：该模块无对应视觉稿，卡片样式对齐 /dearseed 已验收的「为你精选」双列卡片 */}
          <div className="mt-3 grid grid-cols-2 gap-3">
            {CHECKIN_PICKS.map((pick, index) => (
              <article
                key={pick.id}
                className={`relative flex min-h-[248px] flex-col overflow-hidden rounded-feature border border-border-subtle p-3 shadow-bubble ${
                  index % 2 === 0 ? 'bg-reward-subtle' : 'bg-surface'
                }`}
              >
                <div className="relative flex h-[104px] items-center justify-center overflow-hidden rounded-[14px] bg-surface/75">
                  <span aria-hidden className="absolute h-20 w-20 rounded-full bg-reward/20 blur-xl" />
                  <img
                    src={pickAssets[index]}
                    alt=""
                    aria-hidden
                    className="relative h-24 w-16 object-contain drop-shadow-[0_10px_12px_rgba(51,37,20,0.18)]"
                  />
                </div>

                <h3 className="mt-3 text-[12px] font-bold leading-[17px] text-text-primary">{pick.name}</h3>
                <p className="mt-1 line-clamp-2 text-[10px] leading-[15px] text-text-tertiary">{pick.desc}</p>

                <div className="mt-auto flex items-end justify-between pt-3">
                  {pick.cost != null ? (
                    <span className="text-base font-bold leading-5 text-exchange-price">
                      {pick.cost}
                      <span className="ml-0.5 text-[10px] font-medium">🫧</span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold leading-5 text-text-secondary">到店核销</span>
                  )}
                  <button
                    type="button"
                    onClick={() => navigate('/exchange')}
                    aria-label={`${pick.name} 去兑换`}
                    className="flex min-h-10 items-center gap-0.5 rounded-pill bg-primary px-3 text-[10px] font-semibold text-text-inverse shadow-primary-button active:bg-primary-pressed"
                  >
                    去兑换
                    <ArrowUpRight className="h-3 w-3" aria-hidden />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {debug && (
        <p className="mx-4 mt-4 text-xs leading-5 text-text-tertiary">
          夹具态：{CHECKIN_RULE_STATUS.monthSwitch.note}
          {CHECKIN_RULE_STATUS.makeup.note}
        </p>
      )}
    </>
  )
}

function CalendarCell({ item, onMakeup }: { item: CheckinDay; onMakeup: () => void }) {
  if (item.state === 'makeup') {
    return (
      <button
        type="button"
        onClick={onMakeup}
        aria-label={`${item.day} 日补签`}
        className="flex aspect-square w-full flex-col items-center justify-center rounded-lg border border-primary text-[10px] font-medium text-text-brand active:bg-surface-pressed"
      >
        <span className="text-[11px] leading-none">{item.day}</span>
        <span className="mt-0.5 leading-none">补签</span>
      </button>
    )
  }

  if (item.state === 'today') {
    return (
      <div
        aria-label={`${item.day} 日 ${CHECKIN_STATUS_TEXT}`}
        className="flex aspect-square w-full flex-col items-center justify-center rounded-lg bg-primary text-text-inverse shadow-primary-button"
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
        <span className="mt-0.5 text-[10px] leading-none">今天</span>
      </div>
    )
  }

  if (item.state === 'done') {
    return (
      <div
        aria-label={`${item.day} 日已签到`}
        className="flex aspect-square w-full flex-col items-center justify-center rounded-lg bg-reward-subtle text-reward-strong"
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
        <span className="mt-0.5 text-[10px] leading-none">{item.day}</span>
      </div>
    )
  }

  return (
    <div
      aria-label={`${item.day} 日未到`}
      className="flex aspect-square w-full items-center justify-center rounded-lg bg-surface-subtle text-[11px] text-text-tertiary"
    >
      {item.day}
    </div>
  )
}
