import { http, HttpResponse } from 'msw'

import {
  SIGN_ACTIVITY_LIST_PATH,
  SIGN_RECORDS_ADD_PATH,
  SIGN_RECORDS_INDEX_PATH,
  SIGN_RECORDS_MAKEUP_PATH,
  SIGN_RECORDS_STATUS_PATH,
  SIGN_RECORD_STATUS_MAKEUP,
  SIGN_RECORD_STATUS_SIGNED,
} from '../../services/signrecords'
import {
  CHECKIN_ACTIVITY_MOCK,
  CHECKIN_MOCK_USER_ID,
  CHECKIN_SIGN_STATUS_MOCK,
  buildCheckinRecordsMock,
  type SignRecordMock,
} from '../fixtures/checkin'

/**
 * 打卡 Mock：与真实服务同一路径、同一信封，并复刻 7002 实测到的真实行为：
 * - `add` 幂等：当天已签返回 `400 今日已签到`；
 * - `makeup` 校验日期格式与「只能补签今天之前的日期」；
 * - `status` / `activity` 随签到与补签结果变化。
 *
 * 状态保存在模块内存中，页面刷新（MSW 重启）后回到初始 Mock 状态。
 */
const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function pad(value: number): string {
  return `${value}`.padStart(2, '0')
}

function toLocalDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function toCreateTime(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} 09:00:00`
}

let records: SignRecordMock[] = buildCheckinRecordsMock()
let nextId = records.length + 1

function findRecord(dateKey: string): SignRecordMock | undefined {
  return records.find((item) => item.create_time.slice(0, 10) === dateKey)
}

function todayKey(): string {
  return toLocalDateKey(new Date())
}

function signedToday(): boolean {
  return Boolean(findRecord(todayKey()))
}

export const checkinHandlers = [
  http.get(`*${SIGN_RECORDS_STATUS_PATH}`, () =>
    HttpResponse.json({
      ...CHECKIN_SIGN_STATUS_MOCK,
      data: { ...CHECKIN_SIGN_STATUS_MOCK.data, signed: signedToday() },
    }),
  ),

  http.get(`*${SIGN_RECORDS_INDEX_PATH}`, () =>
    HttpResponse.json({ code: 0, msg: 'success', status: 'succ', data: records }),
  ),

  http.get(`*${SIGN_ACTIVITY_LIST_PATH}`, () =>
    HttpResponse.json({
      ...CHECKIN_ACTIVITY_MOCK,
      data: CHECKIN_ACTIVITY_MOCK.data.map((item) => ({ ...item, signed_days: records.length })),
    }),
  ),

  http.post(`*${SIGN_RECORDS_ADD_PATH}`, () => {
    if (signedToday()) {
      return HttpResponse.json({ code: 400, message: '今日已签到', data: [] })
    }

    const now = new Date()
    const record: SignRecordMock = {
      id: nextId,
      create_time: toCreateTime(now),
      update_time: toCreateTime(now),
      delete_time: null,
      user_id: CHECKIN_MOCK_USER_ID,
      points: 0,
      consecutive_days: 1,
      status: SIGN_RECORD_STATUS_SIGNED,
    }
    nextId += 1
    records = [record, ...records]

    return HttpResponse.json({ code: 0, msg: 'success', status: 'succ', data: record })
  }),

  http.post(`*${SIGN_RECORDS_MAKEUP_PATH}`, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { day?: unknown }
    const day = typeof body.day === 'string' ? body.day : ''

    if (!DAY_PATTERN.test(day)) {
      return HttpResponse.json({
        code: 500,
        message: `"补签日期" with value "${day}" fails to match the required pattern: /^\\d{4}-\\d{2}-\\d{2}$/`,
        data: [],
      })
    }

    if (day >= todayKey()) {
      return HttpResponse.json({ code: 400, message: '只能补签今天之前的日期', data: [] })
    }

    const now = new Date()
    const record: SignRecordMock = {
      id: nextId,
      create_time: toCreateTime(now),
      update_time: toCreateTime(now),
      delete_time: null,
      user_id: CHECKIN_MOCK_USER_ID,
      points: 0,
      consecutive_days: 0,
      status: SIGN_RECORD_STATUS_MAKEUP,
    }
    nextId += 1
    records = [record, ...records]

    return HttpResponse.json({ code: 0, msg: 'success', status: 'succ', data: record })
  }),
]
