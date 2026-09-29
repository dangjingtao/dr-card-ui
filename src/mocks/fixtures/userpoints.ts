import { USER_POINTS_TYPE_EXPENSE, USER_POINTS_TYPE_INCOME } from '../../services/userpoints'

/**
 * 泡泡值接口 Mock 数据（契约来源：2026-09-28《泡泡值（积分）页面接口接入文档》）。
 *
 * 字段名与真实接口保持一致；取值明确可识别为 Mock（金额取整、时间集中、operator 用 sign），
 * 不伪装成真实线上数据。由 handler 依据 type / page / pageSize 真实过滤与分页，
 * 让页面在 Mock 与真实 API 下走完全相同的代码路径。
 */
export const USER_POINTS_STAT_MOCK = {
  code: 0,
  msg: 'success',
  status: 'succ',
  data: {
    points: 128,
    income: 300,
    expense: 172,
  },
} as const

interface UserPointsRecordMock {
  id: number
  create_time: string
  update_time: string
  delete_time: null
  user_id: number
  points: number
  before_points: number
  after_points: number
  type: number
  object: number
  object_type: string
  operator: string
}

/** 倒序（最新在前）的确定性流水，15 条收入 + 8 条消费，共 23 条，便于验证分页与末页。 */
export const USER_POINTS_RECORDS_MOCK: UserPointsRecordMock[] = [
  { id: 23, type: USER_POINTS_TYPE_INCOME, points: 5, object: 1, object_type: 'task', operator: 'sign', create_time: '2026-09-28 11:40:14' },
  { id: 22, type: USER_POINTS_TYPE_INCOME, points: 50, object: 1, object_type: 'task', operator: 'sign', create_time: '2026-09-27 09:12:03' },
  { id: 21, type: USER_POINTS_TYPE_EXPENSE, points: 200, object: 3, object_type: 'order', operator: 'sign', create_time: '2026-09-26 16:08:41' },
  { id: 20, type: USER_POINTS_TYPE_INCOME, points: 5, object: 1, object_type: 'task', operator: 'sign', create_time: '2026-09-26 08:30:22' },
  { id: 19, type: USER_POINTS_TYPE_INCOME, points: 100, object: 1, object_type: 'task', operator: 'sign', create_time: '2026-09-25 09:00:11' },
  { id: 18, type: USER_POINTS_TYPE_EXPENSE, points: 80, object: 2, object_type: 'order', operator: 'sign', create_time: '2026-09-24 14:22:57' },
  { id: 17, type: USER_POINTS_TYPE_INCOME, points: 20, object: 1, object_type: 'task', operator: 'sign', create_time: '2026-09-23 20:05:36' },
  { id: 16, type: USER_POINTS_TYPE_INCOME, points: 100, object: 1, object_type: 'task', operator: 'sign', create_time: '2026-09-23 09:00:09' },
  { id: 15, type: USER_POINTS_TYPE_EXPENSE, points: 120, object: 2, object_type: 'order', operator: 'sign', create_time: '2026-09-22 19:44:18' },
  { id: 14, type: USER_POINTS_TYPE_INCOME, points: 5, object: 1, object_type: 'task', operator: 'sign', create_time: '2026-09-22 12:30:44' },
  { id: 13, type: USER_POINTS_TYPE_INCOME, points: 50, object: 1, object_type: 'task', operator: 'sign', create_time: '2026-09-21 09:12:31' },
  { id: 12, type: USER_POINTS_TYPE_EXPENSE, points: 60, object: 3, object_type: 'order', operator: 'sign', create_time: '2026-09-20 10:33:05' },
  { id: 11, type: USER_POINTS_TYPE_INCOME, points: 100, object: 1, object_type: 'task', operator: 'sign', create_time: '2026-09-19 09:00:27' },
  { id: 10, type: USER_POINTS_TYPE_EXPENSE, points: 90, object: 2, object_type: 'order', operator: 'sign', create_time: '2026-09-18 18:20:52' },
  { id: 9, type: USER_POINTS_TYPE_INCOME, points: 20, object: 1, object_type: 'task', operator: 'sign', create_time: '2026-09-18 10:11:14' },
  { id: 8, type: USER_POINTS_TYPE_INCOME, points: 100, object: 1, object_type: 'task', operator: 'sign', create_time: '2026-09-17 09:00:03' },
  { id: 7, type: USER_POINTS_TYPE_EXPENSE, points: 45, object: 3, object_type: 'order', operator: 'sign', create_time: '2026-09-16 15:47:29' },
  { id: 6, type: USER_POINTS_TYPE_INCOME, points: 5, object: 1, object_type: 'task', operator: 'sign', create_time: '2026-09-16 08:20:40' },
  { id: 5, type: USER_POINTS_TYPE_INCOME, points: 50, object: 1, object_type: 'task', operator: 'sign', create_time: '2026-09-15 09:13:58' },
  { id: 4, type: USER_POINTS_TYPE_EXPENSE, points: 30, object: 2, object_type: 'order', operator: 'sign', create_time: '2026-09-14 11:05:20' },
  { id: 3, type: USER_POINTS_TYPE_INCOME, points: 100, object: 1, object_type: 'task', operator: 'sign', create_time: '2026-09-14 09:00:17' },
  { id: 2, type: USER_POINTS_TYPE_INCOME, points: 20, object: 1, object_type: 'task', operator: 'sign', create_time: '2026-09-13 09:01:46' },
  { id: 1, type: USER_POINTS_TYPE_INCOME, points: 100, object: 1, object_type: 'task', operator: 'sign', create_time: '2026-09-12 09:00:00' },
].map((record) => ({
  ...record,
  update_time: record.create_time,
  delete_time: null,
  user_id: 1,
  before_points: 0,
  after_points: record.points,
}))
