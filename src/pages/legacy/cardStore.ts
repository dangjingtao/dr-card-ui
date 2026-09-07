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