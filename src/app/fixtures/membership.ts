/* 会员、泡泡值、打卡与澡运 fixture。业务值由原 index.ts 原样迁移。 */

export interface LuckFixture {
  key: 'great' | 'good' | 'minor'
  name: string
  gradient: string
  desc: string
}

export const LUCK_FIXTURES: LuckFixture[] = [
  { key: 'great', name: '大吉', gradient: 'var(--gradient-luck-great)', desc: '好运已签收，愿今天顺利。' },
  { key: 'good', name: '中吉', gradient: 'var(--gradient-luck-good)', desc: '顺心顺意，保持好心情。' },
  { key: 'minor', name: '小吉', gradient: 'var(--gradient-luck-minor)', desc: '平稳度过，积蓄好运。' },
]

const LUCK_ORDER = LUCK_FIXTURES.map((item) => item.key)

export function resolveLuck(key: string | null): LuckFixture {
  const found = LUCK_FIXTURES.find((item) => item.key === key)
  return found ?? LUCK_FIXTURES[0]
}

export function nextLuck(current: LuckFixture['key']): LuckFixture {
  const index = LUCK_ORDER.indexOf(current)
  return LUCK_FIXTURES[(index + 1) % LUCK_ORDER.length]
}

export const LUCK_RULE_STATUS = {
  confirmed: false,
  blocker: 'B-003',
  isolatedNote: '签运档位、重抽与结果持久化规则未确认，此处仅为隔离演示，不作定稿。',
} as const

export const LUCK_DRAW = {
  action: '抽取今日澡运',
  hint: '点击即可抽取今日澡运',
} as const

export const LUCK_REWARD_BUBBLE = 50

export const LUCK_PLACEHOLDER = {
  tag: '玩法待定',
  entrySubtitle: '玩法待定',
  note: '澡运玩法与签运档位仍在确认中，当前入口与结果页为占位演示。',
  headline: '敬请期待',
  subline: '澡运玩法筹备中，抽签规则确认后再开放。',
} as const

export const BUBBLE_BALANCE = 1280

export type BubbleFlowKind = 'income' | 'expense'

export interface BubbleRecord {
  id: string
  title: string
  time: string
  amount: number
  kind: BubbleFlowKind
}

export const BUBBLE_RECORDS: BubbleRecord[] = [
  { id: 'b1', title: '每日打卡', time: '2026-06-12 09:00', amount: 100, kind: 'income' },
  { id: 'b2', title: '连续签到 7 天奖励', time: '2026-06-12 09:00', amount: 50, kind: 'income' },
  { id: 'b3', title: '观看视频任务', time: '2026-06-11 21:12', amount: 5, kind: 'income' },
  { id: 'b4', title: '邀请好友成为搭子', time: '2026-06-11 12:30', amount: 50, kind: 'income' },
  { id: 'b5', title: '每日打卡', time: '2026-06-11 09:00', amount: 100, kind: 'income' },
  { id: 'b6', title: '完成成就任务', time: '2026-06-10 20:05', amount: 20, kind: 'income' },
  { id: 'b7', title: '兑换样包', time: '2026-06-10 14:22', amount: 200, kind: 'expense' },
  { id: 'b8', title: '每日打卡', time: '2026-06-10 09:00', amount: 100, kind: 'income' },
  { id: 'b9', title: '看视频获取泡泡值', time: '2026-06-09 19:44', amount: 5, kind: 'income' },
  { id: 'b10', title: '每日打卡', time: '2026-06-09 09:00', amount: 100, kind: 'income' },
  { id: 'b11', title: '兑换现金减免券', time: '2026-06-08 16:08', amount: 80, kind: 'expense' },
  { id: 'b12', title: '挑战任务完成', time: '2026-06-08 10:33', amount: 20, kind: 'income' },
  { id: 'b13', title: '每日打卡', time: '2026-06-08 09:00', amount: 100, kind: 'income' },
  { id: 'b14', title: '每日打卡', time: '2026-06-07 09:00', amount: 100, kind: 'income' },
  { id: 'b15', title: '新人注册奖励', time: '2026-06-07 08:20', amount: 100, kind: 'income' },
]

export const BUBBLE_FILTERS = [
  { value: 'all', label: '全部' },
  { value: 'income', label: '收入' },
  { value: 'expense', label: '消耗' },
] as const

export type BubbleFilter = (typeof BUBBLE_FILTERS)[number]['value']

export function isBubbleFilter(value: string | null): value is BubbleFilter {
  return BUBBLE_FILTERS.some((item) => item.value === value)
}

export function filterBubbleRecords(filter: BubbleFilter): BubbleRecord[] {
  if (filter === 'all') return BUBBLE_RECORDS
  return BUBBLE_RECORDS.filter((record) => record.kind === filter)
}

export function sumBubbleRecords(kind: BubbleFlowKind): number {
  return BUBBLE_RECORDS.filter((record) => record.kind === kind).reduce((total, record) => total + record.amount, 0)
}

export const BUBBLE_LIST_END = '暂时没有更多记录啦'

export const POINTS_TASK_PLACEHOLDER_NOTE = '任务体系未定稿，以下为占位任务卡，进度与奖励不参与真实结算。'

export type PointsTaskPlaceholderState = 'done' | 'active' | 'todo'

export interface PointsTaskPlaceholder {
  id: string
  title: string
  description: string
  rewardBubble: number
  current: number
  target: number
  state: PointsTaskPlaceholderState
  stateLabel: string
}

export const POINTS_TASK_PLACEHOLDERS: PointsTaskPlaceholder[] = [
  { id: 'daily-checkin', title: '每日打卡', description: '每天签到一次即可领取泡泡值', rewardBubble: 100, current: 1, target: 1, state: 'done', stateLabel: '已完成' },
  { id: 'streak-checkin', title: '连续签到', description: '连续签到 7 天再领一次额外奖励', rewardBubble: 50, current: 5, target: 7, state: 'active', stateLabel: '进行中' },
  { id: 'watch-video', title: '观看视频', description: '看完品牌短视频获取泡泡值', rewardBubble: 5, current: 0, target: 1, state: 'todo', stateLabel: '未开始' },
  { id: 'invite-buddy', title: '邀请好友', description: '邀请好友成为洗头搭子', rewardBubble: 50, current: 0, target: 1, state: 'todo', stateLabel: '未开始' },
]

export function pointsTaskPercent(task: PointsTaskPlaceholder): number {
  if (task.target <= 0) return 0
  return Math.min(100, Math.round((task.current / task.target) * 100))
}

/**
 * 打卡日历状态语义（仍被通用类型消费）。
 *
 * 2026-09-28 接口接入后，`CHECKIN_CYCLE_LABEL` / `CHECKIN_TODAY` / `CHECKIN_MONTH_DAYS` /
 * `CHECKIN_CALENDAR` / `CHECKIN_STREAK` 等**固定月份夹具已废弃并删除**：月份、今天与
 * 已签/补签状态改由本地时间 + `GET /api/signrecords/index` 真实记录推导
 * （见 `src/pages/checkin/components/CheckinBoard.tsx` 的 `buildCheckinCalendar`）。
 */
export type CheckinDayState = 'done' | 'today' | 'makeup' | 'upcoming'

export const CHECKIN_STATUS_TEXT = '今日未签到'
export const CHECKIN_DAILY_TASK = {
  title: '每日打卡',
  description: '完成今日签到',
  rewardBubble: 100,
  progress: '1 / 1',
} as const

export const CHECKIN_REMINDER = {
  title: '每日打卡',
  tips: '坚持每日打卡可获得泡泡值，并领取洗护体验样包。',
  action: '打卡',
} as const

export const CHECKIN_MAKEUP_SUCCESS = {
  title: '补打卡成功',
  action: '确认',
} as const

export interface CheckinPick {
  id: string
  name: string
  desc: string
  cost?: number
}

export const CHECKIN_PICKS: CheckinPick[] = [
  { id: 'p1', name: '洗护组合体验券', desc: '洗发 / 护发 / 沐浴体验，限到店核销', cost: 200 },
  { id: 'p2', name: '核心洗发水体验券', desc: '限到店核销' },
]

export const CHECKIN_RULE_STATUS = {
  monthSwitch: {
    confirmed: false,
    blocker: 'B-019',
    note: '原型 §6 只画出当前活动周期的单月月历，未给出可切换范围与越界表现，故本页不提供月份切换。',
  },
  makeup: {
    confirmed: false,
    blocker: 'B-020',
    note: '原型 §6/§7 仅确认「漏签显示补签」与「补打卡成功」，补签消耗、次数上限与不可补签判定未确认，此处仅作隔离演示。',
  },
  makeupAd: {
    confirmed: true,
    blocker: null,
    note: 'H033 已接 Native showRewardAd({scene:"h5CheckinResign"})；只有 status=completed 才进入补签成功，closed/failed/no_fill 均不发放补签完成信号。',
  },
} as const

export const MEMBER_PROFILE = {
  nickname: '小鹿同学',
  brandLine: 'DEARSEED · 溱蜜传说',
  levelLabel: 'LV.4',
  levelName: '溱蜜传说',
  cardNo: 'DS·2026·008888',
  levelEntryLabel: '查看等级',
  bubbleUnit: 'Bubble Point',
} as const

export interface MemberEntry {
  id: string
  name: string
  subtitle: string
  to: string
}

export const MEMBER_ENTRIES: MemberEntry[] = [
  { id: 'luck', name: '今日澡运', subtitle: '抽专属好礼', to: '/luck' },
  { id: 'task', name: '是日任务', subtitle: '领澡运积分', to: '/checkin' },
  { id: 'coupon', name: '优惠卡包', subtitle: '专享优惠', to: '/card' },
  { id: 'buddy', name: '洗头搭子', subtitle: '好友同行礼', to: '/buddy' },
]

export const MEMBER_SECTION_LABELS = { entriesTitle: '尊享服务' } as const

export interface MemberLevel {
  label: string
  name: string
  current?: boolean
}

export const MEMBER_LEVELS: MemberLevel[] = [
  { label: 'LV.1', name: '海泡泡新生' },
  { label: 'LV.2', name: '春氧达人' },
  { label: 'LV.3', name: '头皮管理员' },
  { label: 'LV.4', name: '溱蜜传说', current: true },
]

export interface MemberCardFace {
  scene: string
  name: string
  desc: string
}

export const MEMBER_CARD_FACES: MemberCardFace[] = [
  { scene: '场景 1', name: '玫瑰粉霸卡', desc: '黑曜玫瑰 × 珠光白' },
  { scene: '场景 2', name: '露紫薰衣草卡', desc: '法国薰衣草 × 樱花白' },
  { scene: '场景 3', name: '雾蓝海蕴卡', desc: '雾蓝蓝 × 珍珠白' },
  { scene: '场景 4', name: '墨绿松石卡', desc: '墨绿 × 香槟金' },
]

export const MEMBER_LEVELS_REMARK = '本页为会员等级分级，仅开会时作展示。'

export const MEMBER_RULE_STATUS = {
  levelNaming: {
    confirmed: false,
    blocker: 'B-022',
    note: '原型 §2 未给出等级数量、命名与限定卡面清单，现有 LV.1–LV.4 与四款卡面沿用历史稿，待产品确认。',
  },
  levelProgress: {
    confirmed: false,
    blocker: 'B-023',
    note: '各等级权益、升级门槛与未解锁判定原型均未画出，故等级页不展示权益矩阵、升级进度与解锁状态。',
  },
} as const
