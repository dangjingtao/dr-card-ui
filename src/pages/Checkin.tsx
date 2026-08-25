import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowUpRight, CalendarDays, Check, CheckCircle2, ChevronRight, Gift, ListTodo, Sparkles, X } from 'lucide-react'
import DebugPanel from '../components/mobile/DebugPanel'
import PageContainer from '../components/mobile/PageContainer'
import PromptOverlay from '../components/mobile/PromptOverlay'
import { Button, ProgressIndicator } from '../components/ui'
import { useFixtureState, useOverlay } from '../app/fixtures/useFixture'
import { findRouteByPathname } from '../app/router/routes'
import {
  CHECKIN_CALENDAR,
  CHECKIN_CYCLE_LABEL,
  CHECKIN_DAILY_TASK,
  CHECKIN_FIRST_WEEKDAY,
  CHECKIN_MAKEUP_SUCCESS,
  CHECKIN_PICKS,
  CHECKIN_REMINDER,
  CHECKIN_REWARDS,
  CHECKIN_RULE_STATUS,
  CHECKIN_STATUS_TEXT,
  CHECKIN_STREAK,
  CHECKIN_WEEK_LABELS,
  type CheckinDay,
} from '../app/fixtures'
import checkinRitualHero from '../assets/brand/bubble/checkin-ritual-hero-v2.webp'
import pickShampooA from '../assets/brand/exchange/exchange-pick-shampoo-a.webp'
import pickShampooB from '../assets/brand/exchange/exchange-pick-shampoo-b.webp'

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

/**
 * 打卡日历（#21）/ 打卡成功（#8）/ 打卡提示弹窗（#4）/ 补打卡成功弹窗（#22）
 * -------------------------------------------------------------
 * 事实源：docs/prototype/02-membership-and-checkin.md §4 §5 §6 §7
 * 已确认：顶部「今日已签到」+ 当前周期连续签到天数；当月月历（已签到 ✅、漏签显示「补签」）；
 *        活动周期 2026.06.01 - 2026.06.30；连续签到奖励（连续 3 天获得 10 泡泡值）；
 *        底部「为你精选」洗护兑换商品；补签 → 补打卡成功弹窗；推荐商品 → 洗护兑换专区。
 * ⚠️ 与 reference 的差异：历史稿 D-007 为「每日签到领福利」7 天签到条式 + 任务列表，
 *    与原型的月历式打卡日历不一致，故按原型口径重做，不照搬历史稿的任务模块与配色。
 * ⚠️ 未决规则一律隔离在 fixtures 的 CHECKIN_RULE_STATUS（B-019 月份切换 / B-020 补签消耗与
 *    不可补签判定 / B-021 弹窗广告位与倒计时），页面不自持规则常量。
 * 可复现状态：?state=success；?overlay=reminder / make-up-success
 */
export default function Checkin() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const route = findRouteByPathname('/checkin')
  const { state } = useFixtureState(route)
  const { overlay, open, close } = useOverlay()

  const isSuccess = state?.key === 'success'
  const debug = searchParams.get('debug') === '1'
  const completedDays = CHECKIN_CALENDAR.filter((item) => item.state === 'done' || item.state === 'today').length
  const rewardRailPercent = getRewardRailPercent()

  return (
    <PageContainer className="pb-24" inset={false}>
      <section
        className="relative mx-4 mt-2 min-h-[180px] overflow-hidden rounded-feature px-5 pb-5 pt-4 shadow-bubble"
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
            <CalendarCell key={item.day} item={item} onMakeup={() => open('make-up-success')} />
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

      <PromptOverlay open={overlay === 'reminder'} label="每日打卡提示" onDismiss={close} className="overflow-hidden rounded-feature bg-surface px-6 pb-6 pt-5 text-center shadow-modal">
        <button type="button" aria-label="关闭打卡提示" onClick={close} className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-text-tertiary active:bg-surface-pressed"><X className="h-5 w-5" aria-hidden /></button>
        <img src={checkinRitualHero} alt="" aria-hidden className="mx-auto h-32 w-32 object-contain" />
        <h2 className="mt-1 text-xl font-bold text-text-primary">{CHECKIN_REMINDER.title}</h2>
        <p className="mt-2 text-sm leading-6 text-text-secondary">TIPS：{CHECKIN_REMINDER.tips}</p>
        <Button className="mt-5 w-full rounded-pill" size="large" onClick={() => { close(); navigate('/checkin?state=success') }}>{CHECKIN_REMINDER.action}</Button>
      </PromptOverlay>

      <PromptOverlay open={overlay === 'make-up-success'} label="补打卡成功" onDismiss={close} className="rounded-feature bg-surface px-6 pb-6 pt-7 text-center shadow-modal">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-reward-subtle text-reward-strong"><CheckCircle2 className="h-9 w-9" aria-hidden /></span>
        <h2 className="mt-4 text-xl font-bold text-text-primary">{CHECKIN_MAKEUP_SUCCESS.title}</h2>
        <p className="mt-2 text-sm leading-6 text-text-secondary">已为你补上当日签到，连续签到进度继续累计。</p>
        {debug && <p className="mt-2 text-xs leading-5 text-text-tertiary">夹具态：{CHECKIN_RULE_STATUS.makeupAd.note}</p>}
        <Button className="mt-5 w-full rounded-pill" size="large" onClick={close}>{CHECKIN_MAKEUP_SUCCESS.action}</Button>
      </PromptOverlay>

      <DebugPanel route={route} />
    </PageContainer>
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
