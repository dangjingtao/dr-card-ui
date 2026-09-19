import type { UserPointEntity } from './contracts'

export type UserPointFlowKind = 'income' | 'expense'

export interface UserPointRecordViewModel {
  id: string
  title: string
  time: string
  amount: number
  kind: UserPointFlowKind
  beforePoints: number
  afterPoints: number
}

/**
 * Frontend presentation mapping only.
 *
 * Backend facts stay in snake_case in contracts.ts. These labels are not claimed as backend
 * business copy; they are deterministic UI fallbacks derived from confirmed type/object_type
 * values until a richer business API supplies display semantics.
 */
function recordTitle(entity: UserPointEntity): string {
  if (entity.object_type === 'task') return entity.type === 10 ? '任务泡泡值' : '任务扣减'
  if (entity.object_type === 'order') return entity.type === 20 ? '兑换消耗' : '订单泡泡值'
  return entity.type === 10 ? '泡泡值增加' : '泡泡值消耗'
}

export function toUserPointRecordViewModel(entity: UserPointEntity): UserPointRecordViewModel {
  return {
    id: String(entity.id),
    title: recordTitle(entity),
    time: entity.create_time?.slice(0, 16) ?? '时间待同步',
    amount: Math.abs(entity.points),
    kind: entity.type === 10 ? 'income' : 'expense',
    beforePoints: entity.before_points,
    afterPoints: entity.after_points,
  }
}
