/* eslint-disable react-refresh/only-export-components */
/**
 * 学校账户 mock store（T028 重构）
 * -------------------------------------------------------------
 * 按学校维度组织余额：
 * - 小票余额：充值的实际金额
 * - 可退款金额：当前账户里能退的部分（=小票余额）
 * - 赠送金额：系统赠送/活动奖励的金额（不可退）
 *
 * 充值：累加小票余额
 * 退款：从可退款金额里扣减（受最大可退限制）
 */
import { create } from './createSimpleStore'

export interface SchoolAccount {
  id: string
  schoolName: string
  accountNo: string
  ticketBalance: number /* 小票余额（实际充值，可退） */
  refundableBalance: number /* 可退款金额（≤ ticketBalance） */
  giftBalance: number /* 赠送金额（不可退） */
}

const INITIAL_SCHOOL_ACCOUNTS: SchoolAccount[] = [
  {
    id: 'kbs-001',
    schoolName: '肇庆市商务技工学校',
    accountNo: 'K016778212',
    ticketBalance: 22.69,
    refundableBalance: 22.69,
    giftBalance: 0.0,
  },
  {
    id: 'kbs-002',
    schoolName: '卡博士展厅（骏盈大厦）',
    accountNo: 'K016778213',
    ticketBalance: 88.5,
    refundableBalance: 88.5,
    giftBalance: 5.0,
  },
]

export const [useSchoolAccounts, schoolAccountActions] =
  create<SchoolAccount[]>(INITIAL_SCHOOL_ACCOUNTS)

/** 按 id 查找学校 */
export function findSchool(id: string | undefined): SchoolAccount | undefined {
  if (!id) return undefined
  const list = schoolAccountActions.get()
  return list.find((s) => s.id === id)
}