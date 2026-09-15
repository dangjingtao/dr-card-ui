/* eslint-disable react-refresh/only-export-components */
/**
 * 积分 / 泡泡值 共用 store（T025）
 * -------------------------------------------------------------
 * 卡博士 APP 叫"积分"，诗得丽品牌专栏叫"泡泡值"，本质同一份余额同一份流水。
 * 单一事实源：SignInPage / PointsPage / PointsDetail / DearseedColumn 都从这里读写。
 * 真实场景下应替换为后端 API + 全局状态管理。
 */
import { create } from './createSimpleStore'

export type PointsRecordKind = 'income' | 'expense'

export interface PointsRecord {
  id: string
  title: string
  amount: number
  kind: PointsRecordKind
  time: string
  /** 收入来源 / 消耗去向的简短标签，用于筛选或展示 */
  category?: 'checkin' | 'video' | 'exchange' | 'other'
}

export interface PointsState {
  /** 积分余额（= 泡泡值余额，两边共用） */
  balance: number
  /** 积分流水，按时间倒序排列 */
  records: PointsRecord[]
  /** 今日是否已签到 */
  todayCheckedIn: boolean
  /** 今日已看视频次数（每日限制用，mock 不做强限制，仅用于展示） */
  todayVideoCount: number
}

const INITIAL_RECORDS: PointsRecord[] = [
  { id: 'r1', title: '洗护体验券兑换', amount: 500, kind: 'expense', time: '09-05 14:32', category: 'exchange' },
  { id: 'r2', title: '看视频得积分', amount: 20, kind: 'income', time: '09-05 10:15', category: 'video' },
  { id: 'r3', title: '每日签到', amount: 10, kind: 'income', time: '09-05 08:00', category: 'checkin' },
  { id: 'r4', title: '每日签到', amount: 10, kind: 'income', time: '09-04 08:12', category: 'checkin' },
  { id: 'r5', title: '看视频得积分', amount: 20, kind: 'income', time: '09-04 20:33', category: 'video' },
  { id: 'r6', title: '好物兑换', amount: 120, kind: 'expense', time: '09-03 16:20', category: 'exchange' },
  { id: 'r7', title: '每日签到', amount: 10, kind: 'income', time: '09-03 07:58', category: 'checkin' },
  { id: 'r8', title: '每日签到', amount: 10, kind: 'income', time: '09-02 09:05', category: 'checkin' },
  { id: 'r9', title: '每日签到', amount: 10, kind: 'income', time: '09-01 08:30', category: 'checkin' },
  { id: 'r10', title: '新人注册奖励', amount: 1000, kind: 'income', time: '08-30 12:00', category: 'other' },
]

const INITIAL_STATE: PointsState = {
  balance: 1280,
  records: INITIAL_RECORDS,
  todayCheckedIn: false,
  todayVideoCount: 0,
}

export const [usePoints, pointsActions] = create<PointsState>(INITIAL_STATE)

/** 增加积分（同时插入一条收入流水） */
export function addPoints(amount: number, title: string, category: PointsRecord['category'] = 'other') {
  const state = pointsActions.get()
  const now = new Date()
  const time = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const newRecord: PointsRecord = {
    id: `r-${Date.now()}`,
    title,
    amount,
    kind: 'income',
    time,
    category,
  }
  pointsActions.set({
    ...state,
    balance: state.balance + amount,
    records: [newRecord, ...state.records],
  })
}

/** 扣减积分（同时插入一条消耗流水）；余额不足返回 false */
export function deductPoints(amount: number, title: string, category: PointsRecord['category'] = 'exchange'): boolean {
  const state = pointsActions.get()
  if (state.balance < amount) return false
  const now = new Date()
  const time = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const newRecord: PointsRecord = {
    id: `r-${Date.now()}`,
    title,
    amount,
    kind: 'expense',
    time,
    category,
  }
  pointsActions.set({
    ...state,
    balance: state.balance - amount,
    records: [newRecord, ...state.records],
  })
  return true
}

/** 每日签到：标记已签到 + 发放积分 */
export function dailyCheckIn(reward: number = 10) {
  const state = pointsActions.get()
  if (state.todayCheckedIn) return false
  addPoints(reward, '每日签到', 'checkin')
  pointsActions.update({ todayCheckedIn: true })
  return true
}

/** 看视频得积分：计数 +1 + 发放积分 */
export function watchVideoReward(reward: number = 20) {
  const state = pointsActions.get()
  addPoints(reward, '看视频得积分', 'video')
  pointsActions.update({ todayVideoCount: state.todayVideoCount + 1 })
}
