/* eslint-disable react-refresh/only-export-components */
/**
 * 卡数据 mock store（T031 补充）
 * -------------------------------------------------------------
 * 一张卡 = 一所学校的"实体卡/校园卡"：
 * - cardNo：卡序号（出厂编号）
 * - projectName：卡所属项目（如「卡博士库存项目」）
 * - projectId：项目编号
 * - userCardNo：用户卡号
 * - mac：MAC 地址
 * - realName / className / studentId：可被用户修改
 * - status：'normal' | 'reported'（挂失）/ 'unreported'（解挂）
 */
import { create } from './createSimpleStore'

export type CardStatus = 'normal' | 'reported' | 'unreported'

export interface CardInfo {
  id: string
  cardNo: string
  projectId: string
  projectName: string
  userCardNo: string
  mac: string
  realName: string
  className: string
  studentId: string
  status: CardStatus
  /** 卡余额（元） */
  balance: number
}

const INITIAL_CARDS: CardInfo[] = [
  {
    id: 'card-001',
    cardNo: '073249EC',
    projectId: '10003',
    projectName: '卡博士库存项目',
    userCardNo: '3249EC',
    mac: '',
    realName: '',
    className: '1',
    studentId: '1',
    status: 'normal',
    balance: 10,
  },
]

export const [useCards, cardActions] = create<CardInfo[]>(INITIAL_CARDS)

export function findCard(id: string | undefined): CardInfo | undefined {
  if (!id) return undefined
  return cardActions.get().find((c) => c.id === id)
}

export function updateCard(id: string, patch: Partial<CardInfo>) {
  const list = cardActions.get()
  cardActions.set(list.map((c) => (c.id === id ? { ...c, ...patch } : c)))
}

/**
 * 解绑指定卡：仅从卡列表中移除，**不动充值/退款记录**（T031 2026-09-08 用户口径）。
 * - 历史 TopupRecord 仍保留在 recordsActions 中，未来若需要"按账户维度"展示可继续使用。
 * - 移除后页面侧需把 demo state 切到 'unbound'（KBS_CARD_DEMO_STATE）以回到未绑卡空态。
 */
export function unbindCard(id: string) {
  const list = cardActions.get()
  cardActions.set(list.filter((c) => c.id !== id))
}

/* ============================================================
 * 充值 / 退款流水（T029 核心闭环）
 * - topupRecords：充值记录，按时间倒序
 * - refundRecords：退款记录，按时间倒序
 * - addBalance / subtractBalance：更新卡余额并写流水
 * ============================================================ */

export type TopupStatus = 'success' | 'pending' | 'failed'

export interface TopupRecord {
  id: string
  cardId: string
  /** 交易类型 */
  type: 'topup' | 'refund'
  /** 金额（元，正数） */
  amount: number
  /** 支付方式 */
  channel: 'wechat' | 'alipay'
  /** 状态 */
  status: TopupStatus
  /** 创建时间戳 */
  createdAt: number
  /** 失败原因（仅 failed 状态有值） */
  failReason?: string
}

const INITIAL_RECORDS: TopupRecord[] = [
  /* 给演示用留 2 条成功记录，方便卡详情页的"充值记录"链接看效果 */
  {
    id: 'rec-001',
    cardId: 'card-001',
    type: 'topup',
    amount: 10,
    channel: 'wechat',
    status: 'success',
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
  },
  {
    id: 'rec-002',
    cardId: 'card-001',
    type: 'topup',
    amount: 5,
    channel: 'alipay',
    status: 'success',
    createdAt: Date.now() - 1000 * 60 * 60 * 48,
  },
]

export const [useRecords, recordsActions] = create<TopupRecord[]>(INITIAL_RECORDS)

/** 给指定卡充值（成功场景）：更新余额 + 写流水 */
export function topupCard(
  cardId: string,
  amount: number,
  channel: 'wechat' | 'alipay'
): TopupRecord {
  const list = cardActions.get()
  cardActions.set(list.map((c) => (c.id === cardId ? { ...c, balance: c.balance + amount } : c)))

  const record: TopupRecord = {
    id: `rec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    cardId,
    type: 'topup',
    amount,
    channel,
    status: 'success',
    createdAt: Date.now(),
  }
  recordsActions.set([record, ...recordsActions.get()])
  return record
}

/** 写一条失败的充值记录（用于 mock 失败场景，不动余额） */
export function recordTopupFailure(
  cardId: string,
  amount: number,
  channel: 'wechat' | 'alipay',
  failReason: string
): TopupRecord {
  const record: TopupRecord = {
    id: `rec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    cardId,
    type: 'topup',
    amount,
    channel,
    status: 'failed',
    createdAt: Date.now(),
    failReason,
  }
  recordsActions.set([record, ...recordsActions.get()])
  return record
}

/** 给指定卡退款：扣减余额 + 写退款流水 */
export function refundCard(
  cardId: string,
  amount: number,
  channel: 'wechat' | 'alipay'
): TopupRecord {
  const list = cardActions.get()
  cardActions.set(
    list.map((c) =>
      c.id === cardId ? { ...c, balance: Math.max(0, c.balance - amount) } : c
    )
  )

  const record: TopupRecord = {
    id: `rec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    cardId,
    type: 'refund',
    amount,
    channel,
    status: 'success',
    createdAt: Date.now(),
  }
  recordsActions.set([record, ...recordsActions.get()])
  return record
}

/** 取某张卡的充值记录（按时间倒序） */
export function getCardTopupRecords(cardId: string): TopupRecord[] {
  return recordsActions
    .get()
    .filter((r) => r.cardId === cardId && r.type === 'topup')
    .sort((a, b) => b.createdAt - a.createdAt)
}

/** 取某张卡的退款记录（按时间倒序） */
export function getCardRefundRecords(cardId: string): TopupRecord[] {
  return recordsActions
    .get()
    .filter((r) => r.cardId === cardId && r.type === 'refund')
    .sort((a, b) => b.createdAt - a.createdAt)
}