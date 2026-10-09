import { SIGN_RECORD_STATUS_MAKEUP, SIGN_RECORD_STATUS_SIGNED } from '../../services/signrecords'

/**
 * 打卡 Mock 数据（契约来源：`GET /api/signrecords/index` 实测，2026-09-29 对齐）。
 *
 * 字段名与真实接口保持一致；取值明确可识别为 Mock。
 * 记录日期以**运行时的本地当月**为基准生成，保证 mock 模式下的月历与真实本地时间一致，
 * 不伪装成某个固定月份的线上数据。
 *
 * 真实 `index` 每条记录同时带 `year` / `month` / `day`（业务日历日）与 `create_time`
 * （整条时间戳）；此处一并生成，使 mock 与真实载荷同形。
 */
export const CHECKIN_MOCK_USER_ID = 9001

export interface SignRecordMock {
  id: number
  create_time: string
  update_time: string
  user_id: number
  points: number
  consecutive_days: number
  status: number
  reward_desc?: string
  day?: string
  month?: string
  year?: string
  delete_time: number | null
}

function pad(value: number): string {
  return `${value}`.padStart(2, '0')
}

function toCreateTime(date: Date, hour = 9): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(hour)}:00:00`
}

/** 记录的业务日历日字段（与真实接口 `index` 同形）。 */
function toBusinessDateParts(date: Date): { day: string; month: string; year: string } {
  return {
    day: pad(date.getDate()),
    month: pad(date.getMonth() + 1),
    year: `${date.getFullYear()}`,
  }
}

/** 当月相对「今天」的已签位点（负偏移天数）与补签位点，构成可辨识的 Mock 状态。 */
const MOCK_SIGNED_OFFSETS = [1, 2, 3, 4, 5, 8, 9]
const MOCK_MAKEUP_OFFSETS = [6, 7]

export function buildCheckinRecordsMock(today = new Date()): SignRecordMock[] {
  const records: SignRecordMock[] = []
  let id = 1

  for (const offset of MOCK_SIGNED_OFFSETS) {
    const date = new Date(today)
    date.setDate(today.getDate() - offset)
    records.push({
      id,
      create_time: toCreateTime(date),
      update_time: toCreateTime(date),
      delete_time: null,
      user_id: CHECKIN_MOCK_USER_ID,
      points: 0,
      consecutive_days: 0,
      status: SIGN_RECORD_STATUS_SIGNED,
      ...toBusinessDateParts(date),
    })
    id += 1
  }

  for (const offset of MOCK_MAKEUP_OFFSETS) {
    const date = new Date(today)
    date.setDate(today.getDate() - offset)
    records.push({
      id,
      create_time: toCreateTime(date),
      update_time: toCreateTime(date),
      delete_time: null,
      user_id: CHECKIN_MOCK_USER_ID,
      points: 0,
      consecutive_days: 0,
      status: SIGN_RECORD_STATUS_MAKEUP,
      ...toBusinessDateParts(date),
    })
    id += 1
  }

  return records.sort((a, b) => b.id - a.id)
}

export const CHECKIN_SIGN_STATUS_MOCK = {
  code: 0,
  msg: 'success',
  status: 'succ',
  data: {
    signed: false,
    consecutive_days: 0,
    points: 100,
    reward_desc: '今日签到可得 100 泡泡值',
    day: '01',
    month: '01',
    year: '2026',
  },
}

export const CHECKIN_ACTIVITY_MOCK = {
  code: 0,
  msg: 'success',
  status: 'succ',
  data: [
    {
      id: 1,
      title: '每日签到',
      type: 10,
      image: '',
      is_makeup: 1,
      status: 20,
      sort_number: 1,
      max_days: 31,
      signed_days: MOCK_SIGNED_OFFSETS.length,
    },
  ],
}
