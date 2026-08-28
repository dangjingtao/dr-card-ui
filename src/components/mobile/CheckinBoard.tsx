import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, CalendarDays, Check, CheckCircle2, ChevronRight, Gift, ListTodo, Sparkles } from 'lucide-react'
import { Button, ProgressIndicator } from '../ui'
import {
  CHECKIN_CALENDAR,
  CHECKIN_DAILY_TASK,
  CHECKIN_PICKS,
  CHECKIN_RULE_STATUS,
  CHECKIN_STATUS_TEXT,
  CHECKIN_STREAK,
  type CheckinDay,
} from '../../app/fixtures'
import checkinRitualHero from '../../assets/brand/bubble/checkin-ritual-hero-v2.webp'
import pickShampooA from '../../assets/brand/exchange/exchange-pick-shampoo-a.webp'
import pickShampooB from '../../assets/brand/exchange/exchange-pick-shampoo-b.webp'

const pickAssets = [pickShampooA, pickShampooB] as const
const CHECKIN_CYCLE_TARGET = 7
const CHECKIN_CYCLE_WEEK_LABELS = ['一', '二', '三', '四', '五', '六', '日'] as const

/**
 * 7 天签到只重组既有确定性日历夹具，不另造签到事实。
 * 当前 fixture 的「今天」始终被放在本轮 7 天内；连续天数超过 7 天时只展示最近 7 天。
 */
function getCheckinCycleDays(): CheckinDay[] {
  const todayIndex = CHECKIN_CALENDAR.findIndex((item) => item.state === 'today')
  if (todayIndex < 0) return CHECKIN_CALENDAR.slice(0, CHECKIN_CYCLE_TARGET)

  const maxStart = Math.max(0, CHECKIN_CALENDAR.length - CHECKIN_CYCLE_TARGET)
  const todayOffset = Math.min(Math.max(CHECKIN_STREAK - 1, 0), CHECKIN_CYCLE_TARGET - 1)
  const startIndex = Math.min(Math.max(todayIndex - todayOffset, 0), maxStart)
  return CHECKIN_CALENDAR.slice(startIndex, startIndex + CHECKIN_CYCLE_TARGET)
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
  /** 点击 7 天进度中的「补签」：由宿主页面决定打开哪个补打卡成功弹窗 */
  onMakeup: () => void
  /** `?debug=1` 时追加未决规则说明 */
  debug?: boolean
}

/**
 * 打卡业务内容（今日签到状态 / 7 天签到挑战 / 是日任务 / 为你精选）
 * -------------------------------------------------------------
 * 2026-08-28 用户确认：签到周期改为 7 天；签到进度去掉「卡片套卡片」，强化连续完成感。
 * 本组件继续只负责业务内容：
 * - 不含页面标题栏、返回栏、底部导航与 PageContainer，宿主页面自备唯一外壳；
 * - 不含 reminder / make-up-success 弹窗，弹窗仍由宿主页面按自己的 `?overlay=` 登记持有；
 * - 7 天周期由既有 CHECKIN_CALENDAR + CHECKIN_STREAK 派生，不新增奖励数值与结算规则；
 * - section 自管 `mx-4`，宿主需用 `inset={false}` 的 PageContainer 承载。
 */
export default function CheckinBoard({ isSuccess = false, onMakeup, debug = false }: CheckinBoardProps) {
  const navigate = useNavigate()
  const cycleDays = getCheckinCycleDays()
  const completedDays = cycleDays.filter((item) => item.state === 'done' || item.state === 'today').length
  const remainingDays = Math.max(0, CHECKIN_CYCLE_TARGET - completedDays)
  const challengeComplete = remainingDays === 0

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
          <p className="mt-1 text-[11px] font-medium text-bubble-on-gold-muted">7 天签到挑战</p>
          <div className="mt-3.5 flex items-end gap-2.5">
            <span className="text-[40px] font-semibold leading-none tracking-tight text-bubble-on-gold">{String(completedDays).padStart(2, '0')}</span>
            <span className="mb-0.5 border-l border-bubble-on-gold-muted/25 pl-2.5 text-xs leading-[18px] text-bubble-on-gold-muted">本轮已点亮<br />目标 07 天</span>
          </div>
        </div>
      </section>

      <section className="relative mx-4 mt-4 overflow-hidden rounded-feature bg-surface px-4 pb-4 pt-4 shadow-bubble" aria-label="7 天签到挑战">
        <span aria-hidden className="absolute -right-5 -top-7 h-24 w-24 rounded-full bg-reward-subtle/70" />
        <header className="relative flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-app-icon bg-secondary text-text-brand">
              <CalendarDays className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-text-primary">7 天签到挑战</h2>
              <p className="mt-0.5 text-[11px] text-text-tertiary">连续点亮，完成本轮</p>
            </div>
          </div>
          <span className="flex-none rounded-pill bg-reward-subtle px-2.5 py-1 text-[11px] font-bold text-reward-text">
            {completedDays} / {CHECKIN_CYCLE_TARGET}
          </span>
        </header>

        <div className="relative mt-4">
          <ProgressIndicator
            value={completedDays}
            max={CHECKIN_CYCLE_TARGET}
            label={`7 天签到挑战进度 ${completedDays} / ${CHECKIN_CYCLE_TARGET}`}
            className="[&>div]:h-2 [&>div]:bg-surface-subtle [&>div>div]:bg-[image:var(--gradient-bubble)]"
          />
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="font-medium text-text-secondary">本轮进度</span>
            <span className="font-semibold text-reward-text">
              {challengeComplete ? '本轮已完成' : `再签到 ${remainingDays} 天`}
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1">
          {cycleDays.map((item, index) => (
            <div key={item.day} className="min-w-0">
              <span className="mb-1 block text-center text-[10px] font-medium text-text-tertiary">
                {CHECKIN_CYCLE_WEEK_LABELS[index]}
              </span>
              <CalendarCell item={item} onMakeup={onMakeup} />
            </div>
          ))}
        </div>

        <div className="relative mt-4 flex items-center gap-3 border-t border-border-subtle pt-4">
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-reward-subtle text-reward-strong" aria-hidden>
            {challengeComplete ? <Check className="h-4 w-4" strokeWidth={3} /> : <Gift className="h-4 w-4" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-text-primary">
              {challengeComplete ? '7 天挑战完成' : `还差 ${remainingDays} 天，继续点亮`}
            </p>
            <p className="mt-0.5 text-[11px] leading-4 text-text-tertiary">
              {challengeComplete ? '本轮连续签到已达成' : '完成 7 日挑战即可解锁连续签到奖励'}
            </p>
          </div>
          <span className="flex-none text-[10px] font-semibold text-reward-text">
            {challengeComplete ? '已达成' : '冲刺中'}
          </span>
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
          夹具态：{CHECKIN_RULE_STATUS.makeup.note}
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
