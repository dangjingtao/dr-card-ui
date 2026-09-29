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

describe('home sign status contract', () => {
  beforeEach(() => {
    mocks.request.mockReset()
  })

  it('reads unsigned status with the upcoming reward text', async () => {
    mocks.request.mockResolvedValue({
      code: 0,
      msg: 'success',
      status: 'succ',
      data: { signed: false, consecutive_days: 3, points: 5, reward_desc: '连续签到3天' },
    })

    await expect(fetchSignStatus()).resolves.toEqual({
      signed: false,
      consecutive_days: 3,
      points: 5,
      reward_desc: '连续签到3天',
    })
    expect(mocks.request).toHaveBeenCalledWith({ method: 'GET', url: '/api/signrecords/status' })
  })

  it('reads signed status with the empty reward text', async () => {
    mocks.request.mockResolvedValue({
      code: 0,
      msg: 'success',
      status: 'succ',
      data: { signed: true, consecutive_days: 3, points: 5, reward_desc: '' },
    })

    await expect(fetchSignStatus()).resolves.toMatchObject({ signed: true, reward_desc: '' })
  })

  it('throws a business error on 401 so the page can render as unsigned', async () => {
    mocks.request.mockResolvedValue({ code: 401, message: '请先登录', data: [] })

    await expect(fetchSignStatus()).rejects.toMatchObject({ kind: 'business', message: '请先登录' })
  })
})

/** 2026-09-28 对 7002 实测补齐的签到 / 补签 / 记录契约。 */
describe('checkin records, sign-in and makeup contract', () => {
  beforeEach(() => {
    mocks.request.mockReset()
  })

  it('reads raw record array from index', async () => {
    mocks.request.mockResolvedValue({
      code: 0,
      msg: 'success',
      status: 'succ',
      data: [
        { id: 5, create_time: '2026-09-28 15:23:06', user_id: 3, points: 0, consecutive_days: 1, status: 10 },
      ],
    })

    const records = await fetchSignRecords()
    expect(records).toHaveLength(1)
    expect(records[0]).toMatchObject({ id: 5, status: 10 })
    expect(mocks.request).toHaveBeenCalledWith({
      method: 'GET',
      url: SIGN_RECORDS_INDEX_PATH,
      params: { page: 1, pageSize: 100 },
    })
  })

  it('also accepts a paginated envelope for index', async () => {
    mocks.request.mockResolvedValue({
      code: 0,
      data: { data: [{ id: 1, create_time: '2026-09-01 09:00:00', user_id: 3, points: 0, consecutive_days: 1, status: 10 }] },
    })

    await expect(fetchSignRecords()).resolves.toHaveLength(1)
  })

  it('posts an empty body to sign in', async () => {
    mocks.request.mockResolvedValue({
      code: 0,
      data: { id: 5, create_time: '2026-09-28 15:23:06', user_id: 3, points: 0, consecutive_days: 1, status: 10 },
    })

    await expect(submitSignIn()).resolves.toMatchObject({ id: 5 })
    expect(mocks.request).toHaveBeenCalledWith({ method: 'POST', url: SIGN_RECORDS_ADD_PATH, data: {} })
  })

  it('surfaces the duplicated sign-in business error', async () => {
    mocks.request.mockResolvedValue({ code: 400, message: '今日已签到', data: [] })

    await expect(submitSignIn()).rejects.toMatchObject({ kind: 'business', message: '今日已签到' })
  })

  it('posts day to makeup and rejects bad format before the network', async () => {
    mocks.request.mockResolvedValue({
      code: 0,
      data: { id: 6, create_time: '2026-09-28 15:23:27', user_id: 3, points: 0, consecutive_days: 0, status: 20 },
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
  it('maps records by local create_time date and keeps the latest id', () => {
    const map = buildSignRecordDayMap([
      { id: 5, create_time: '2026-09-28 15:23:06', user_id: 3, points: 0, consecutive_days: 1, status: 10 },
      { id: 9, create_time: '2026-09-28 18:00:00', user_id: 3, points: 0, consecutive_days: 2, status: 20 },
      { id: 6, create_time: '2026-09-20 15:23:27', user_id: 3, points: 0, consecutive_days: 0, status: 20 },
    ])

    expect(map.get('2026-09-28')?.id).toBe(9)
    expect(map.get('2026-09-20')?.status).toBe(20)
    expect(map.keys().sort()).toEqual(['2026-09-20', '2026-09-28'])
  })

  it('skips records whose create_time is not a date', () => {
    const map = buildSignRecordDayMap([
      { id: 1, create_time: '', user_id: 3, points: 0, consecutive_days: 0, status: 10 },
    ])

    expect(map.keys()).toEqual([])
  })
})