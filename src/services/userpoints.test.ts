import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  fetchUserPointsList,
  fetchUserPointsStat,
  USER_POINTS_TYPE_EXPENSE,
  USER_POINTS_TYPE_INCOME,
} from './userpoints'

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
}))

vi.mock('./http', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./http')>()
  return { ...actual, httpClient: { request: mocks.request } }
})

describe('userpoints stat contract', () => {
  beforeEach(() => {
    mocks.request.mockReset()
  })

  it('reads points / income / expense without deriving points from income - expense', async () => {
    mocks.request.mockResolvedValue({
      code: 0,
      msg: 'success',
      status: 'succ',
      data: { points: 128, income: 300, expense: 172 },
    })

    await expect(fetchUserPointsStat()).resolves.toEqual({ points: 128, income: 300, expense: 172 })
    expect(mocks.request).toHaveBeenCalledWith({
      method: 'GET',
      url: '/api/userpoints/stat',
    })
  })

  it('keeps zero as a real value', async () => {
    mocks.request.mockResolvedValue({ code: 0, msg: 'success', data: { points: 0, income: 0, expense: 0 } })

    await expect(fetchUserPointsStat()).resolves.toEqual({ points: 0, income: 0, expense: 0 })
  })

  it('throws a business error on failure so the page can degrade', async () => {
    mocks.request.mockResolvedValue({ code: 401, message: '请先登录', data: [] })

    await expect(fetchUserPointsStat()).rejects.toMatchObject({ kind: 'business', message: '请先登录' })
  })
})

describe('userpoints list contract', () => {
  beforeEach(() => {
    mocks.request.mockReset()
  })

  it('passes type / page / pageSize and returns the pagination envelope', async () => {
    mocks.request.mockResolvedValue({
      code: 0,
      msg: 'success',
      status: 'succ',
      data: {
        data: [
          {
            id: 5,
            create_time: '2026-09-28 11:40:14',
            update_time: '2026-09-28 11:40:14',
            delete_time: null,
            user_id: 1,
            points: 5,
            before_points: 0,
            after_points: 5,
            type: USER_POINTS_TYPE_INCOME,
            object: 1,
            object_type: 'task',
            operator: 'sign',
          },
        ],
        current_page: 1,
        per_page: 15,
        total: 1,
        last_page: 1,
      },
    })

    const page = await fetchUserPointsList({ type: USER_POINTS_TYPE_INCOME, page: 2, pageSize: 15 })

    expect(mocks.request).toHaveBeenCalledWith({
      method: 'GET',
      url: '/api/userpoints/index',
      params: { type: USER_POINTS_TYPE_INCOME, page: 2, pageSize: 15 },
    })
    expect(page.data[0]).toMatchObject({ id: 5, points: 5, type: USER_POINTS_TYPE_INCOME, object_type: 'task' })
    expect(page.last_page).toBe(1)
  })

  it('omits type when listing all and defaults page / pageSize', async () => {
    mocks.request.mockResolvedValue({
      code: 0,
      msg: 'success',
      data: { data: [], current_page: 1, per_page: 15, total: 0, last_page: 1 },
    })

    await fetchUserPointsList()

    expect(mocks.request).toHaveBeenCalledWith({
      method: 'GET',
      url: '/api/userpoints/index',
      params: { type: undefined, page: 1, pageSize: 15 },
    })
  })

  it('defaults the expense filter constant to 20', () => {
    expect(USER_POINTS_TYPE_INCOME).toBe(10)
    expect(USER_POINTS_TYPE_EXPENSE).toBe(20)
  })
})
