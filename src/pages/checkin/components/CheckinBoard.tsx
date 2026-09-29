import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarCheck, CalendarDays, Check, CheckCircle2, ChevronRight, Gift, Sparkles, X } from 'lucide-react'
import { BottomSheet, Button, ProgressIndicator, Skeleton } from '../../../components/ui'
import {
  CHECKIN_DAILY_TASK,
  CHECKIN_RULE_STATUS,
  CHECKIN_STATUS_TEXT,
  type CheckinDayState,
} from '../../../app/fixtures'
import { buildSignRecordDayMap, SIGN_RECORD_STATUS_MAKEUP, type SignRecord } from '../../../services/signrecords'
import checkinRitualHero from '../../../assets/brand/bubble/checkin-ritual-hero-v2.webp'
import exchangePromoShampoo from '../../../assets/brand/exchange/exchange-promo-shampoo.webp'

const CHECKIN_CYCLE_TARGET = 7
const CHECKIN_WEEK_LABELS = ['日', '一', '二', '三', '四', '五', '六'] as const
const CHECKIN_MONTH_WEEK_LABELS = ['日', '一', '二', '三', '四', '五', '六'] as const

/** 一个月的天数（本地时区）。 */
function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate()
}

/** 组装 `YYYY-MM-DD`（本地时区，不经过 UTC，避免跨日漂移）。 */
function toLocalDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function toDateKey(year: number, monthIndex: number, day: number): string {
  return toLocalDateKey(new Date(year, monthIndex, day))
}

/**
 * 一个日历格。`state` 沿用原语义：done=已签 / today=今天未签 / makeup=过往漏签可补 / upcoming=未来。
 * `dateKey` 为本地 `YYYY-MM-DD`；`makeup` 标记该格来自补签记录（接口 status=20）；
 * `makeupApplied` 标记该格由本次会话补签乐观点亮（接口刷新返回前的即时反馈）。
 */
export interface CheckinCalendarDay {
  day: number
  dateKey: string
  state: CheckinDayState
  /** 该格是否已点亮（接口记录或会话内补签）。与 state 独立，今天已签时 state 仍是 today。 */
  signed: boolean
  /** 该格来自补签记录（接口 status=20）。 */
  makeup: boolean
  /** 由本次会话补签乐观点亮（接口刷新返回前的即时反馈，标记以区分）。 */
  makeupApplied: boolean
}

export interface CheckinCalendarModel {
  year: number
  monthIndex: number
  /** 「2026 年 9 月」 */
  monthLabel: string
  /** 该月首日对应的星期（0=周日），用于前置空格。 */
  startOffset: number
  days: CheckinCalendarDay[]
  /** 该月已点亮（已签 + 补签）天数。 */
  litDays: number
  /** 今天在该月内。 */
  todayInMonth: boolean
  /** 今天已正常签到；补签操作记录不会冒充今日签到。 */
  todaySigned: boolean
}

export interface BuildCalendarOptions {
  /** 参照「今天」，默认取系统本地时间。 */
  today?: Date
  /** 接口签到记录。 */
  records?: SignRecord[] | null
  /** 本次会话补签乐观点亮的日期（`YYYY-MM-DD`）。 */
  optimisticMakeupDays?: string[]
}

/**
 * 构建某月的打卡日历（UI 事实源：原型 §6 月历 + 已确认的 10 格视觉）。
 *
 * 数据口径（2026-09-29《签到页面接口文档》+ `index` 实测）：
 * - 月份与「今天」取**本地系统时间**（本次约定：今日暂用本地时间）；
 * - 正常签到（status=10）与补签（status=20）都按记录的**业务日期**（`year`/`month`/`day`）
 *   归属日历格；`create_time` 是操作时刻，不参与归属，业务日期缺失时该记录直接跳过；
 * - 过往未签且允许补签的格子显示「补签」入口（补签资格判定仍属未决 B-020）；
 * - `optimisticMakeupDays` 在接口刷新返回前对本次补签格做即时点亮。
 */
export function buildCheckinCalendar(options: BuildCalendarOptions = {}): CheckinCalendarModel {
  const today = options.today ?? new Date()
  const year = today.getFullYear()
  const monthIndex = today.getMonth()
  const todayKey = toLocalDateKey(today)

  const dayMap = buildSignRecordDayMap(options.records ?? [])
  const optimistic = new Set(options.optimisticMakeupDays ?? [])

  const total = daysInMonth(year, monthIndex)
  const startOffset = new Date(year, monthIndex, 1).getDay()

  const days: CheckinCalendarDay[] = Array.from({ length: total }, (_, index) => {
    const day = index + 1
    const dateKey = toDateKey(year, monthIndex, day)

    const record = dayMap.get(dateKey)
    const isOptimistic = optimistic.has(dateKey)
    const signed = Boolean(record) || isOptimistic
    const makeup = record?.status === SIGN_RECORD_STATUS_MAKEUP || isOptimistic

    let state: CheckinDayState
    if (dateKey === todayKey) state = 'today'
    else if (signed) state = 'done'
    else if (dateKey < todayKey) state = 'makeup'
    else state = 'upcoming'

    return { day, dateKey, state, signed, makeup, makeupApplied: isOptimistic && !record }
  })

  return {
    year,
    monthIndex,
    monthLabel: `${year} 年 ${monthIndex + 1} 月`,
    startOffset,
    days,
    litDays: days.filter((item) => item.signed).length,
    todayInMonth: true,
    // `today` 表示「今天未签」的视觉态，因此今天是否已签要读独立的 signed 标志。
    todaySigned: days.some((item) => item.dateKey === todayKey && item.signed),
  }
}

/** 7 天签到挑战轨道：展示过去 6 天 + 今天，不把未来日期当成可累计进度。 */
export function buildCycleDays(
  records: SignRecord[] | null | undefined,
  today: Date,
  optimisticMakeupDays: string[] = [],
): CheckinCalendarDay[] {
  const dayMap = buildSignRecordDayMap(records ?? [])
  const optimistic = new Set(optimisticMakeupDays)
  const todayKey = toLocalDateKey(today)

  return Array.from({ length: CHECKIN_CYCLE_TARGET }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (CHECKIN_CYCLE_TARGET - 1 - index))
    const dateKey = toLocalDateKey(date)

    const record = dayMap.get(dateKey)
    const isOptimistic = optimistic.has(dateKey)
    const signed = Boolean(record) || isOptimistic
    const state: CheckinDayState = dateKey === todayKey ? 'today' : signed ? 'done' : 'makeup'

    return {
      day: date.getDate(),
      dateKey,
      state,
      signed,
      makeup: record?.status === SIGN_RECORD_STATUS_MAKEUP || isOptimistic,
      makeupApplied: isOptimistic && !record,
    }
  })
}

/** 是日任务进度条比例：解析夹具里既有的「1 / 1」文案，不额外引入进度字段。 */
const CHECKIN_DAILY_TASK_PERCENT = (() => {
  const [done, total] = CHECKIN_DAILY_TASK.progress.split('/').map((part) => Number(part.trim()))
  if (!Number.isFinite(done) || !Number.isFinite(total) || total <= 0) return 0
  return Math.min(100, Math.max(0, (done / total) * 100))
})()

/** 是日任务进度文案：直接取夹具的「1 / 1」，不在组件里另算一套口径。 */
const CHECKIN_DAILY_TASK_PROGRESS_LABEL = `${CHECKIN_DAILY_TASK.progress}`

/** 首页签到状态视图（来自 `/api/signrecords/status`，由宿主页面归一化后传入）。 */
export interface HomeSignStatusView {
  signed: boolean
  consecutiveDays: number
  points: number
  rewardDesc: string
}

/**
 * 7 天挑战累计值优先使用 status 接口的连续签到口径。
 * 未签到时后端 consecutive_days 表示「今天签到后将达到的值」，因此当前值减 1。
 */
export function resolveChallengeCompletedDays(
  signStatus: HomeSignStatusView | null | undefined,
  cycleDays: CheckinCalendarDay[],
): number {
  if (signStatus) {
    const current = signStatus.signed
      ? signStatus.consecutiveDays
      : Math.max(0, signStatus.consecutiveDays - 1)
    return Math.min(CHECKIN_CYCLE_TARGET, Math.max(0, current))
  }

  return Math.min(CHECKIN_CYCLE_TARGET, cycleDays.filter((item) => item.signed).length)
}

export interface CheckinBoardProps {
  /** 首页只显示紧凑 7 日轨道；签到内页显示金色 Hero + 完整当月日历。 */
  mode?: 'home' | 'full'
  /** 打卡成功态（#8）：精选模块换成「查看完整签到状态」 */
  isSuccess?: boolean
  /** 今日签到状态（接口）；缺省（加载中 / 失败 / 未登录）时不渲染状态行，保持既有夹具视觉。 */
  signStatus?: HomeSignStatusView | null
  /**
   * 首页首屏接口仍在请求中：每日任务区先渲染同尺寸骨架占位，
   * 数据返回后原地替换内容，容器高度不变（避免初始化尺寸抖动）。
   */
  loading?: boolean
  /** 接口签到记录（打卡日历依据）；缺省时不渲染任何已签格。 */
  records?: SignRecord[] | null
  /** 本次会话补签乐观点亮的日期。 */
  optimisticMakeupDays?: string[]
  /** 点击日历中的「补签」，参数为该格本地日期 `YYYY-MM-DD`；由宿主页面执行（先过广告闸门）。 */
  onMakeupDay?: (dateKey: string) => void
  /** 点击「立即签到」；由宿主页面执行签到。 */
  onSignIn?: () => void
  /** 签到 / 补签进行中。 */
  actionPending?: boolean
  /** `?debug=1` 时追加未决规则说明 */
  debug?: boolean
}

/**
 * 打卡业务内容（首页紧凑入口 / 签到内页当月日历 / 是日任务 / 为你精选）
 * -------------------------------------------------------------
 * 2026-09-29 对齐《签到页面接口文档》：
 * - 月份与「今天」用**本地系统时间**（此前固定 2026-06 / 12 日，已废弃）；
 * - 已签 / 补签状态改读 `GET /api/signrecords/index?range=month` 的真实记录；
 * - 签到 / 补签动作由宿主页面调用 service 执行，组件只负责呈现与回调。
 *
 * 补签已纳入当前签到接口文档：
 * 过往漏签格可点击「补签」，由宿主页面先过 Native 激励广告闸门再调用补签接口。
 * 补签消耗 / 次数上限与资格判定（B-020）仍未确认。
 */
export default function CheckinBoard({
  mode = 'home',
  isSuccess = false,
  signStatus,
  loading = false,
  records,
  optimisticMakeupDays,
  onMakeupDay,
  onSignIn,
  actionPending = false,
  debug = false,
}: CheckinBoardProps) {
  const navigate = useNavigate()
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [now, setNow] = useState(() => new Date())

  // 「今天」按本地时间计算；跨日（含从后台恢复）时刷新一次，避免停在昨天。
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') setNow(new Date())
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  const calendar = useMemo(
    () => buildCheckinCalendar({ today: now, records, optimisticMakeupDays }),
    [now, records, optimisticMakeupDays],
  )
  const cycleDays = useMemo(
    () => buildCycleDays(records, now, optimisticMakeupDays),
    [records, now, optimisticMakeupDays],
  )

  // 7 天挑战累计值以 status 接口的连续签到口径为准；接口不可用时才回退近 7 日记录。
  const completedDays = resolveChallengeCompletedDays(signStatus, cycleDays)
  const remainingDays = Math.max(0, CHECKIN_CYCLE_TARGET - completedDays)

  const handleMakeupDay = (dateKey: string) => {
    setCalendarOpen(false)
    onMakeupDay?.(dateKey)
  }

  // status 接口是「今日是否已签到」的权威来源；记录列表只在 status 不可用时兜底。
  const todaySigned = signStatus?.signed ?? calendar.todaySigned

  return (
    <>
      {mode === 'full' && (
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
              {todaySigned ? (
                <Check className="h-6 w-6" strokeWidth={2.6} aria-hidden />
              ) : (
                <X className="h-6 w-6" strokeWidth={2.6} aria-hidden />
              )}
              {todaySigned ? '今日已签到' : CHECKIN_STATUS_TEXT}
            </p>
            <p className="mt-1 text-[11px] font-medium text-bubble-on-gold-muted">7 天签到挑战</p>
            <div className="mt-3.5 flex items-end gap-2.5">
              <span className="text-[40px] font-semibold leading-none tracking-tight text-bubble-on-gold">{String(completedDays).padStart(2, '0')}</span>
              <span className="mb-0.5 border-l border-bubble-on-gold-muted/25 pl-2.5 text-xs leading-[18px] text-bubble-on-gold-muted">本轮已点亮<br />目标 07 天</span>
            </div>

            {!todaySigned && onSignIn && (
              <Button
                className="mt-4 rounded-pill"
                onClick={() => onSignIn()}
                disabled={actionPending}
              >
                {actionPending ? '签到中…' : '立即签到'}
              </Button>
            )}
          </div>
        </section>
      )}

      {mode === 'home' ? (
        <>
          <button
            type="button"
            onClick={() => navigate('/checkin')}
            aria-label={`查看 7 天签到日历，当前 ${completedDays} / ${CHECKIN_CYCLE_TARGET}`}
            className="mx-4 block w-[calc(100%-2rem)] rounded-[16px] bg-checkin-home-surface px-3.5 pb-3.5 pt-3.5 text-left shadow-bubble transition active:scale-[0.995] active:bg-surface-pressed"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2 text-[14px] font-semibold leading-5 text-text-primary">
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-[8px] bg-secondary text-reward-strong" aria-hidden>
                  <CalendarDays className="h-4 w-4" />
                </span>
                <span>7天签到</span>
                <span className="text-[12px] font-semibold text-reward-text">{completedDays}/{CHECKIN_CYCLE_TARGET}</span>
              </span>
              <span className="flex flex-none items-center gap-0.5 rounded-pill bg-surface-subtle px-2.5 py-1 text-[11px] font-medium leading-4 text-text-secondary">
                {remainingDays === 0 ? '已完成' : `还差 ${remainingDays} 天`}
                <ChevronRight className="h-3 w-3" aria-hidden />
              </span>
            </div>

            <div className="mt-3 grid grid-cols-7 gap-1" aria-hidden>
              {cycleDays.map((item) => {
                const completed = item.signed
                return (
                  <span key={item.dateKey} className="flex min-w-0 flex-col items-center gap-1.5">
                    <span className="text-[9px] leading-none text-checkin-home-muted">
                      {CHECKIN_WEEK_LABELS[new Date(`${item.dateKey}T00:00:00`).getDay()]}
                    </span>
                    <span
                      className={`flex h-7 w-7 items-center justify-center text-[10px] font-semibold ${
                        item.state === 'today' && !completed
                          ? 'flex-col rounded-[10px] bg-checkin-home-today text-checkin-home-today-text shadow-sm'
                          : completed
                            ? 'flex-col rounded-full bg-checkin-home-day-surface text-reward-strong'
                            : 'rounded-full bg-checkin-home-day-surface text-checkin-home-day-text'
                      }`}
                    >
                      {item.state === 'today' && !completed ? (
                        <>
                          <span className="text-[10px] leading-3">{item.day}</span>
                          <span className="mt-0.5 text-[8px] font-medium leading-3">今天</span>
                        </>
                      ) : completed ? (
                        <>
                          <Check className="h-2.5 w-2.5" strokeWidth={3} />
                          <span className="mt-0.5 text-[8px] leading-none">{item.day}</span>
                        </>
                      ) : (
                        item.day
                      )}
                    </span>
                  </span>
                )
              })}
            </div>

            {signStatus && (
              <span
                data-checkin-sign-status={signStatus.signed ? 'signed' : 'unsigned'}
                className={`mt-3 flex items-center gap-1 text-[11px] leading-4 ${
                  signStatus.signed ? 'text-reward-text' : 'text-text-tertiary'
                }`}
              >
                {signStatus.signed && <Check className="h-3 w-3" strokeWidth={3} aria-hidden />}
                {buildSignStatusHint(signStatus)}
              </span>
            )}
          </button>

          <BottomSheet
            open={calendarOpen}
            title="7 天签到日历"
            onClose={() => setCalendarOpen(false)}
            actions={
              <Button variant="ghost" onClick={() => setCalendarOpen(false)}>
                收起
              </Button>
            }
          >
            <div className="pb-1" data-checkin-calendar-sheet>
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-medium tracking-[0.12em] text-reward-strong">WEEKLY CHECK-IN</p>
                  <p className="mt-1 text-lg font-bold text-text-primary">
                    {remainingDays === 0 ? '本轮 7 天挑战已完成' : `再签到 ${remainingDays} 天完成本轮`}
                  </p>
                </div>
                <span className="rounded-pill bg-reward-subtle px-2.5 py-1 text-xs font-bold text-reward-text">
                  {completedDays} / {CHECKIN_CYCLE_TARGET}
                </span>
              </div>

              <ProgressIndicator
                value={completedDays}
                max={CHECKIN_CYCLE_TARGET}
                label={`7 天签到挑战进度 ${completedDays} / ${CHECKIN_CYCLE_TARGET}`}
                className="mt-3 [&>div]:h-2 [&>div]:bg-surface-subtle [&>div>div]:bg-[image:var(--gradient-bubble)]"
              />

              <div className="mt-5 grid grid-cols-7 gap-1.5">
                {cycleDays.map((item) => (
                  <div key={item.dateKey} className="min-w-0">
                    <span className="mb-1.5 block text-center text-[10px] font-medium text-text-tertiary">
                      周{CHECKIN_WEEK_LABELS[new Date(`${item.dateKey}T00:00:00`).getDay()]}
                    </span>
                    <CalendarCell item={item} onMakeup={handleMakeupDay} />
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center gap-3 border-t border-border-subtle pt-4">
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-reward-subtle text-reward-strong" aria-hidden>
                  {remainingDays === 0 ? <Check className="h-4 w-4" strokeWidth={3} /> : <Gift className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-text-primary">
                    {remainingDays === 0 ? '连续签到目标已达成' : '继续点亮，完成 7 日挑战'}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-4 text-text-tertiary">
                    {remainingDays === 0 ? '本轮签到已完成，可以继续保持节奏。' : `完整 ${calendar.monthLabel} 签到记录与补签请进入「每日打卡」内页查看。`}
                  </p>
                </div>
              </div>
            </div>
          </BottomSheet>
        </>
      ) : (
        <section className="mx-4 mt-4 rounded-feature bg-surface px-4 pb-4 pt-4 shadow-bubble" aria-label={`${calendar.monthLabel}签到日历`}>
          <header className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-app-icon bg-secondary text-text-brand">
                <CalendarDays className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-text-primary">{calendar.monthLabel}</h2>
                <p className="mt-0.5 text-[11px] text-text-tertiary">完整 {calendar.days.length} 天签到记录</p>
              </div>
            </div>
            <span className="flex-none rounded-pill bg-reward-subtle px-2.5 py-1 text-[11px] font-bold text-reward-text">
              已点亮 {calendar.litDays} 天
            </span>
          </header>

          <div className="mt-4 grid grid-cols-7 gap-1.5" aria-hidden>
            {CHECKIN_MONTH_WEEK_LABELS.map((label) => (
              <span key={label} className="text-center text-[10px] font-medium text-text-tertiary">
                {label}
              </span>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1.5">
            {Array.from({ length: calendar.startOffset }).map((_, index) => (
              <span key={`blank-${index}`} aria-hidden className="aspect-square" />
            ))}
            {calendar.days.map((item) => (
              <CalendarCell key={item.dateKey} item={item} onMakeup={handleMakeupDay} disabled={actionPending} />
            ))}
          </div>

          <div className="mt-4 flex items-center gap-3 border-t border-border-subtle pt-4">
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-reward-subtle text-reward-strong" aria-hidden>
              <Gift className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-text-primary">今日{todaySigned ? '已' : '未'}签到</p>
              <p className="mt-0.5 text-[11px] leading-4 text-text-tertiary">漏签日期若显示「补签」，可直接点击完成补签。</p>
            </div>
          </div>
        </section>
      )}

      {mode === 'home' && (
      <section className="mx-4 mt-7" aria-label="每日任务">
        <header className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.16em] text-reward-strong">DAILY MISSION</p>
            <h2 className="mt-1 text-lg font-bold leading-6 text-text-primary">每日任务</h2>
          </div>
          {loading ? (
            <Skeleton className="h-6 w-[86px] rounded-pill" />
          ) : (
            <span className="inline-flex items-center gap-1 rounded-pill bg-checkin-mission-done-bg px-2.5 py-1 text-[11px] font-semibold leading-4 text-checkin-mission-done">
              <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
              今日进度 {todaySigned ? CHECKIN_DAILY_TASK_PROGRESS_LABEL : '0 / 1'}
            </span>
          )}
        </header>

        {loading ? (
          <DailyMissionSkeleton />
        ) : (
          <article
            className="relative mt-3 overflow-hidden rounded-feature bg-surface p-4 shadow-bubble"
            aria-label={`${CHECKIN_DAILY_TASK.title} ${todaySigned ? '已完成' : '待完成'}`}
          >
            <div className="flex items-center gap-3">
              <span
                className="flex h-11 w-11 flex-none items-center justify-center rounded-pill bg-checkin-mission-icon-bg text-checkin-mission-icon"
                aria-hidden
              >
                <CalendarCheck className="h-5 w-5" strokeWidth={2.2} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold leading-5 text-text-primary">{CHECKIN_DAILY_TASK.title}</p>
                <p className="mt-1 text-xs leading-[18px] text-text-secondary">
                  {CHECKIN_DAILY_TASK.description}
                  <span className="text-checkin-mission-reward">
                    +{CHECKIN_DAILY_TASK.rewardBubble} 泡泡值
                  </span>
                </p>
              </div>
              <span className="flex flex-none flex-col items-end gap-1.5">
                <span
                  className={`inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-[11px] font-semibold leading-4 ${
                    todaySigned
                      ? 'bg-checkin-mission-done-bg text-checkin-mission-done'
                      : 'bg-surface-subtle text-text-tertiary'
                  }`}
                >
                  {todaySigned ? <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.6} aria-hidden /> : null}
                  {todaySigned ? '已完成' : '待完成'}
                </span>
              </span>
            </div>

            <ProgressIndicator
              value={todaySigned ? CHECKIN_DAILY_TASK_PERCENT : 0}
              label={`${CHECKIN_DAILY_TASK.title}进度`}
              className="mt-3.5 [&>div]:h-1.5 [&>div]:bg-checkin-mission-track [&>div>div]:bg-checkin-mission-done"
            />
          </article>
        )}
      </section>
      )}

      {mode === 'home' && (isSuccess ? (
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
          <div className="mt-3 overflow-hidden rounded-feature shadow-sm">
            <img
              src={exchangePromoShampoo}
              alt="核心洗发水系列宣传图"
              className="block w-full"
            />
          </div>
        </section>
      ))}

      {debug && (
        <p className="mx-4 mt-4 text-xs leading-5 text-text-tertiary">
          夹具态：{CHECKIN_RULE_STATUS.makeup.note}
        </p>
      )}
    </>
  )
}

/**
 * 每日任务骨架占位。结构与真实卡片逐行对齐（图标 + 两行文案 + 两个胶囊 + 进度条），
 * 尺寸与真实卡一致，用于首屏请求期间的稳定占位。
 */
function DailyMissionSkeleton() {
  return (
    <div
      aria-hidden
      data-checkin-daily-task-skeleton
      className="h5-soft-pulse mt-3 rounded-feature bg-surface p-4 shadow-bubble"
    >
      <div className="flex items-center gap-3">
        <span className="h-11 w-11 flex-none rounded-pill bg-checkin-mission-skeleton" />
        <div className="min-w-0 flex-1">
          <span className="block h-4 w-20 rounded-control bg-checkin-mission-skeleton" />
          <span className="mt-2 block h-3 w-36 rounded-control bg-checkin-mission-skeleton" />
        </div>
        <span className="h-[26px] w-16 flex-none rounded-pill bg-checkin-mission-skeleton" />
      </div>
      <span className="mt-3.5 block h-1.5 w-full rounded-pill bg-checkin-mission-track" />
    </div>
  )
}

/**
 * 首页签到状态提示文案。
 * 未签到且 points=0 时不写「+0 泡泡值」，优先展示 reward_desc（2026-09-28 首页联调文档要求）。
 */
function buildSignStatusHint(status: HomeSignStatusView): string {
  if (status.signed) return `今日已签到 · 连续签到 ${status.consecutiveDays} 天`

  const parts: string[] = []
  if (status.rewardDesc) parts.push(status.rewardDesc)
  if (status.points > 0) parts.push(`今日签到 +${status.points} 泡泡值`)
  return parts.length > 0 ? parts.join(' · ') : '今日还未签到'
}

function CalendarCell({
  item,
  onMakeup,
  disabled = false,
}: {
  item: CheckinCalendarDay
  onMakeup: (dateKey: string) => void
  disabled?: boolean
}) {
  if (item.state === 'makeup') {
    // 过往漏签：显示「补签」两字（可点击进补签流程，先过激励广告闸门）
    return (
      <button
        type="button"
        onClick={() => onMakeup(item.dateKey)}
        disabled={disabled}
        aria-label={`${item.day} 日补签`}
        className="flex aspect-square w-full items-center justify-center rounded-md bg-primary/10 text-[11px] font-semibold text-text-brand active:bg-surface-pressed disabled:opacity-60"
      >
        补签
      </button>
    )
  }

  if (item.state === 'today') {
    // 今天：已签显示 ✓+日期（暖色），未签显示 X+日期（深色矩形）。
    if (item.signed) {
      return (
        <div
          aria-label={`${item.day} 日今日已签到`}
          className="flex aspect-square w-full flex-col items-center justify-center rounded-md bg-reward-subtle text-reward-strong"
        >
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
          <span className="mt-0.5 text-[10px] font-semibold leading-none">{item.day}</span>
        </div>
      )
    }

    return (
      // 今天未签：矩形 + X + 日期（X 上 + 日期下，与 done 单元格保持 flex-col 一致）
      <div
        aria-label={`${item.day} 日 ${CHECKIN_STATUS_TEXT}`}
        className="flex aspect-square w-full flex-col items-center justify-center rounded-md bg-[#3A2E1F] text-white shadow-sm"
      >
        <X className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
        <span className="mt-0.5 text-[10px] font-semibold leading-none">{item.day}</span>
      </div>
    )
  }

  if (item.state === 'done') {
    return (
      <div
        aria-label={`${item.day} 日${item.makeup ? '补签' : '已签到'}`}
        className="flex aspect-square w-full flex-col items-center justify-center rounded-lg bg-reward-subtle text-reward-strong"
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
        <span className="mt-0.5 text-[10px] leading-none">{item.day}</span>
      </div>
    )
  }

  // 未来日期（upcoming）：透明背景 + 灰色数字
  return (
    <div
      aria-label={`${item.day} 日未到`}
      className="flex aspect-square w-full items-center justify-center text-[11px] text-text-tertiary/70"
    >
      {item.day}
    </div>
  )
}
