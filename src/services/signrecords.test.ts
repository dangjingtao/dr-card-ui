import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  SIGN_ACTIVITY_LIST_PATH,
  SIGN_ACTIVITY_STATUS_ACTIVE,
  SIGN_RECORDS_ADD_PATH,
  SIGN_RECORDS_INDEX_PATH,
  SIGN_RECORDS_MAKEUP_PATH,
  SIGN_RECORD_STATUS_MAKEUP,
  buildSignRecordDayMap,
  fetchSignActivities,
  fetchSignRecords,
  fetchSignStatus,
  submitMakeup,
  submitSignIn,
} from './signrecords'

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
}))

vi.mock('./http', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./http')>()
  return { ...actual, httpClient: { request: mocks.request } }
})

describe('sign status contract', () => {
  beforeEach(() => {
    mocks.request.mockReset()
  })

  it('reads unsigned status with the upcoming reward text and day/month/year', async () => {
    mocks.request.mockResolvedValue({
      code: 0,
      msg: 'success',
      status: 'succ',
      data: {
        signed: false,
        consecutive_days: 5,
        points: 10,
        reward_desc: '连续签到 5 天奖励 10 泡泡值',
        day: '29',
        month: '09',
        year: '2026',
      },
    })

    await expect(fetchSignStatus()).resolves.toMatchObject({
      signed: false,
      consecutive_days: 5,
      points: 10,
      reward_desc: '连续签到 5 天奖励 10 泡泡值',
      day: '29',
      month: '09',
      year: '2026',
    })
    expect(mocks.request).toHaveBeenCalledWith({ method: 'GET', url: '/api/signrecords/status' })
  })

  it('reads signed status with the empty reward text and the current day/month/year', async () => {
    mocks.request.mockResolvedValue({
      code: 0,
      msg: 'success',
      status: 'succ',
      data: {
        signed: true,
        consecutive_days: 1,
        points: 10,
        reward_desc: '',
        day: '29',
        month: '09',
        year: '2026',
      },
    })

    await expect(fetchSignStatus()).resolves.toMatchObject({
      signed: true,
      consecutive_days: 1,
      points: 10,
      reward_desc: '',
      day: '29',
      month: '09',
      year: '2026',
    })
  })

  it('tolerates a status payload without day/month/year', async () => {
    mocks.request.mockResolvedValue({
      code: 0,
      msg: 'success',
      status: 'succ',
      data: { signed: true, consecutive_days: 1, points: 10, reward_desc: '' },
    })

    const status = await fetchSignStatus()
    expect(status.signed).toBe(true)
    expect(status.day).toBeUndefined()
  })

  it('throws a business error on 401 so the page can render as unsigned', async () => {
    mocks.request.mockResolvedValue({ code: 401, message: '请先登录', data: [] })

    await expect(fetchSignStatus()).rejects.toMatchObject({ kind: 'business', message: '请先登录' })
  })
})

/** 契约来源：最新《签到页面接口文档》。 */
describe('sign records and sign-in contract', () => {
  beforeEach(() => {
    mocks.request.mockReset()
  })

  it('requests the current month by default and reads the raw record array', async () => {
    mocks.request.mockResolvedValue({
      code: 0,
      msg: 'success',
      status: 'succ',
      data: [
        { id: 18, create_time: '2026-09-29 09:30:00', user_id: 1, points: 10, consecutive_days: 5, status: 10 },
      ],
    })

    const records = await fetchSignRecords()
    expect(records).toHaveLength(1)
    expect(records[0]).toMatchObject({ id: 18, status: 10 })
    expect(mocks.request).toHaveBeenCalledWith({
      method: 'GET',
      url: SIGN_RECORDS_INDEX_PATH,
      params: { range: 'month' },
    })
  })

  it('passes an explicit range when provided', async () => {
    mocks.request.mockResolvedValue({ code: 0, data: [] })

    await fetchSignRecords({ range: 'week' })

    expect(mocks.request).toHaveBeenCalledWith({
      method: 'GET',
      url: SIGN_RECORDS_INDEX_PATH,
      params: { range: 'week' },
    })
  })

  it('also accepts a paginated envelope for index', async () => {
    mocks.request.mockResolvedValue({
      code: 0,
      data: { data: [{ id: 1, create_time: '2026-09-20 00:00:00', user_id: 1, points: 0, consecutive_days: 0, status: 20 }] },
    })

    await expect(fetchSignRecords()).resolves.toHaveLength(1)
  })

  it('posts an empty body to sign in and returns reward_desc', async () => {
    mocks.request.mockResolvedValue({
      code: 0,
      data: {
        id: 18,
        create_time: '2026-09-29 09:30:00',
        user_id: 1,
        points: 10,
        consecutive_days: 5,
        status: 10,
        reward_desc: '连续签到 5 天奖励 10 泡泡值',
      },
    })

    await expect(submitSignIn()).resolves.toMatchObject({
      id: 18,
      reward_desc: '连续签到 5 天奖励 10 泡泡值',
    })
    expect(mocks.request).toHaveBeenCalledWith({ method: 'POST', url: SIGN_RECORDS_ADD_PATH, data: {} })
  })

  it('accepts the real sign-in response that omits create_time', async () => {
    mocks.request.mockResolvedValue({
      code: 0,
      msg: 'success',
      status: 'succ',
      data: {
        id: 52,
        user_id: 3,
        points: 10,
        consecutive_days: 1,
        status: 10,
        reward_desc: '111',
        delete_time: null,
        is_delete: 0,
      },
    })

    await expect(submitSignIn()).resolves.toMatchObject({
      id: 52,
      user_id: 3,
      points: 10,
      consecutive_days: 1,
      status: 10,
      reward_desc: '111',
    })
  })

  it('surfaces the duplicated sign-in business error', async () => {
    mocks.request.mockResolvedValue({ code: 400, message: '今日已签到', data: [] })

    await expect(submitSignIn()).rejects.toMatchObject({ kind: 'business', message: '今日已签到' })
  })

  it('posts day to makeup and rejects bad format before the network', async () => {
    mocks.request.mockResolvedValue({
      code: 0,
      data: { id: 17, create_time: '2026-09-20 00:00:00', user_id: 1, points: 0, consecutive_days: 0, status: 20 },
    })

    await expect(submitMakeup('2026-09-20')).resolves.toMatchObject({ status: SIGN_RECORD_STATUS_MAKEUP })
    expect(mocks.request).toHaveBeenCalledWith({
      method: 'POST',
      url: SIGN_RECORDS_MAKEUP_PATH,
      data: { day: '2026-09-20' },
    })

    mocks.request.mockClear()
    await expect(submitMakeup('2026/09/20')).rejects.toThrow('补签日期格式需为 YYYY-MM-DD')
    expect(mocks.request).not.toHaveBeenCalled()
  })

  it('surfaces the makeup date-range business error', async () => {
    mocks.request.mockResolvedValue({ code: 400, message: '只能补签今天之前的日期', data: [] })

    await expect(submitMakeup('2026-12-31')).rejects.toMatchObject({
      kind: 'business',
      message: '只能补签今天之前的日期',
    })
  })
})

describe('sign activity list contract', () => {
  beforeEach(() => {
    mocks.request.mockReset()
  })

  it('reads the raw activity array with the documented fields', async () => {
    mocks.request.mockResolvedValue({
      code: 0,
      msg: 'success',
      status: 'succ',
      data: [
        {
          id: 1,
          title: '每日签到',
          type: 10,
          image: 'http://127.0.0.1:7002/storage/a.jpg',
          is_makeup: 1,
          status: SIGN_ACTIVITY_STATUS_ACTIVE,
          sort_number: 1,
          max_days: 31,
          signed_days: 2,
        },
      ],
    })

    const activities = await fetchSignActivities()

    expect(mocks.request).toHaveBeenCalledWith({
      method: 'GET',
      url: SIGN_ACTIVITY_LIST_PATH,
    })
    expect(activities[0]).toMatchObject({
      id: 1,
      title: '每日签到',
      status: SIGN_ACTIVITY_STATUS_ACTIVE,
      max_days: 31,
      signed_days: 2,
    })
  })

  it('tolerates a null image and keeps max_days 0 as a real value', async () => {
    mocks.request.mockResolvedValue({
      code: 0,
      msg: 'success',
      data: [
        {
          id: 2,
          title: '限时签到',
          type: 30,
          image: null,
          is_makeup: 0,
          status: 40,
          sort_number: 2,
          max_days: 0,
          signed_days: 0,
        },
      ],
    })

    const activities = await fetchSignActivities()

    expect(activities[0]).toMatchObject({ image: null, max_days: 0, signed_days: 0 })
  })
})

describe('buildSignRecordDayMap', () => {
  it('maps records by business date and keeps the latest id', () => {
    const map = buildSignRecordDayMap([
      { id: 5, create_time: '2026-09-28 15:23:06', user_id: 3, points: 0, consecutive_days: 1, status: 10, day: '28', month: '09', year: '2026' },
      { id: 9, create_time: '2026-09-28 18:00:00', user_id: 3, points: 0, consecutive_days: 2, status: 10, day: '28', month: '09', year: '2026' },
      { id: 6, create_time: '2026-09-20 15:23:27', user_id: 3, points: 0, consecutive_days: 1, status: 10, day: '20', month: '09', year: '2026' },
    ])

    expect(map.get('2026-09-28')?.id).toBe(9)
    expect(map.get('2026-09-20')?.status).toBe(10)
    expect(map.keys().sort()).toEqual(['2026-09-20', '2026-09-28'])
  })

  it('maps a makeup record to its business date', () => {
    const map = buildSignRecordDayMap([
      // 业务日期字段才是归属依据；create_time 是操作时刻，不参与归属。
      { id: 6, create_time: '2026-09-20 00:00:00', user_id: 1, points: 0, consecutive_days: 0, status: 20, day: '20', month: '09', year: '2026' },
    ])

    expect(map.get('2026-09-20')?.status).toBe(SIGN_RECORD_STATUS_MAKEUP)
    expect(map.keys()).toEqual(['2026-09-20'])
  })

  it('prefers the record business date over create_time when they differ', () => {
    const map = buildSignRecordDayMap([
      // 今天(9-29)补签 9-20：create_time 是操作时刻，业务日期字段才是 9-20。
      {
        id: 7,
        create_time: '2026-09-29 15:57:18',
        user_id: 3,
        points: 0,
        consecutive_days: 0,
        status: 20,
        day: '20',
        month: '09',
        year: '2026',
      },
    ])

    expect(map.get('2026-09-20')?.status).toBe(SIGN_RECORD_STATUS_MAKEUP)
    expect(map.get('2026-09-29')).toBeUndefined()
    expect(map.keys()).toEqual(['2026-09-20'])
  })

  it('zero-pads single-digit business date parts', () => {
    const map = buildSignRecordDayMap([
      {
        id: 3,
        create_time: '2026-09-29 15:57:18',
        user_id: 3,
        points: 0,
        consecutive_days: 0,
        status: 10,
        day: '5',
        month: '9',
        year: '2026',
      },
    ])

    expect(map.get('2026-09-05')?.id).toBe(3)
  })

  it('skips records without a valid business date', () => {
    const map = buildSignRecordDayMap([
      { id: 1, create_time: '2026-09-29 09:00:00', user_id: 3, points: 0, consecutive_days: 0, status: 10 },
    ])

    expect(map.keys()).toEqual([])
  })
})
