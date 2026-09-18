import type { UserPointEntity } from '../../services/userPoints'

/**
 * Mock payload rows use the confirmed backend UserPoints field names.
 * Values are deterministic frontend fixtures only; they are not claimed as production records.
 */
export const H024_USER_POINT_ROWS: UserPointEntity[] = [
  { id: 1, user_id: 10001, points: 100, before_points: 1180, after_points: 1280, type: 10, object: 101, object_type: 'task', operator: 'system', create_time: '2026-06-12 09:00:00' },
  { id: 2, user_id: 10001, points: 50, before_points: 1130, after_points: 1180, type: 10, object: 102, object_type: 'task', operator: 'system', create_time: '2026-06-12 08:58:00' },
  { id: 3, user_id: 10001, points: 5, before_points: 1125, after_points: 1130, type: 10, object: 103, object_type: 'task', operator: 'system', create_time: '2026-06-11 21:12:00' },
  { id: 4, user_id: 10001, points: 50, before_points: 1075, after_points: 1125, type: 10, object: 104, object_type: 'task', operator: 'system', create_time: '2026-06-11 12:30:00' },
  { id: 5, user_id: 10001, points: 100, before_points: 975, after_points: 1075, type: 10, object: 105, object_type: 'task', operator: 'system', create_time: '2026-06-11 09:00:00' },
  { id: 6, user_id: 10001, points: 20, before_points: 955, after_points: 975, type: 10, object: 106, object_type: 'task', operator: 'system', create_time: '2026-06-10 20:05:00' },
  { id: 7, user_id: 10001, points: 200, before_points: 1155, after_points: 955, type: 20, object: 201, object_type: 'order', operator: 'system', create_time: '2026-06-10 14:22:00' },
  { id: 8, user_id: 10001, points: 100, before_points: 1055, after_points: 1155, type: 10, object: 107, object_type: 'task', operator: 'system', create_time: '2026-06-10 09:00:00' },
  { id: 9, user_id: 10001, points: 5, before_points: 1050, after_points: 1055, type: 10, object: 108, object_type: 'task', operator: 'system', create_time: '2026-06-09 19:44:00' },
  { id: 10, user_id: 10001, points: 100, before_points: 950, after_points: 1050, type: 10, object: 109, object_type: 'task', operator: 'system', create_time: '2026-06-09 09:00:00' },
  { id: 11, user_id: 10001, points: 80, before_points: 1030, after_points: 950, type: 20, object: 202, object_type: 'order', operator: 'system', create_time: '2026-06-08 16:08:00' },
  { id: 12, user_id: 10001, points: 20, before_points: 1010, after_points: 1030, type: 10, object: 110, object_type: 'task', operator: 'system', create_time: '2026-06-08 10:33:00' },
  { id: 13, user_id: 10001, points: 100, before_points: 910, after_points: 1010, type: 10, object: 111, object_type: 'task', operator: 'system', create_time: '2026-06-08 09:00:00' },
  { id: 14, user_id: 10001, points: 100, before_points: 810, after_points: 910, type: 10, object: 112, object_type: 'task', operator: 'system', create_time: '2026-06-07 09:00:00' },
  { id: 15, user_id: 10001, points: 100, before_points: 710, after_points: 810, type: 10, object: 113, object_type: 'task', operator: 'system', create_time: '2026-06-07 08:20:00' },
]
