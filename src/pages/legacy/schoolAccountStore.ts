/* eslint-disable react-refresh/only-export-components */
/**
 * 学校账户 mock store（T028 重构 v2）
 * -------------------------------------------------------------
 * 两层模型：
 * - School：账号 + 总余额（聚合下面所有 Project 的小票余额）
 * - Project：每个地点（项目）的余额细分（小票余额 / 可退款金额 / 赠送金额）
 *
 * 操作：
 * - 充值：在指定 Project 上累加小票余额 + 可退款金额（赠送不变）
 * - 退款：从指定 Project 的可退款金额里扣减
 */
import { create } from './createSimpleStore'

export interface School {
  id: string
  accountNo: string
  /** 由项目小票余额自动聚合而成；这里缓存一份便于一次性读 */
  totalBalance: number
}

export interface Project {
  id: string
  schoolId: string
  projectName: string
  ticketBalance: number
  refundableBalance: number
  giftBalance: number
}

const INITIAL_SCHOOLS: School[] = [
  {
    id: 'kbs-school-001',
    accountNo: 'K016778212',
    totalBalance: 22.69,
  },
]

const INITIAL_PROJECTS: Project[] = [
  {
    id: 'kbs-proj-001',
    schoolId: 'kbs-school-001',
    projectName: '肇庆市商务技工学校',
    ticketBalance: 22.69,
    refundableBalance: 22.69,
    giftBalance: 0.0,
  },
  {
    id: 'kbs-proj-002',
    schoolId: 'kbs-school-001',
    projectName: '卡博士展厅（骏盈大厦）',
    ticketBalance: 0,
    refundableBalance: 0,
    giftBalance: 0,
  },
]

export const [useSchools, schoolActions] = create<School[]>(INITIAL_SCHOOLS)
export const [useProjects, projectActions] = create<Project[]>(INITIAL_PROJECTS)

/** 聚合：把项目里的小票余额汇总成 School.totalBalance */
export function recomputeSchoolTotals() {
  const schools = schoolActions.get()
  const projects = projectActions.get()
  const next = schools.map((s) => ({
    ...s,
    totalBalance: Number(
      projects
        .filter((p) => p.schoolId === s.id)
        .reduce((sum, p) => sum + p.ticketBalance, 0)
        .toFixed(2),
    ),
  }))
  schoolActions.set(next)
}

/** 按 id 查找项目 */
export function findProject(id: string | undefined): Project | undefined {
  if (!id) return undefined
  return projectActions.get().find((p) => p.id === id)
}

/** 按 id 查找学校 */
export function findSchool(id: string | undefined): School | undefined {
  if (!id) return undefined
  return schoolActions.get().find((s) => s.id === id)
}

/** 按 schoolId 获取项目列表 */
export function projectsOf(schoolId: string): Project[] {
  return projectActions.get().filter((p) => p.schoolId === schoolId)
}