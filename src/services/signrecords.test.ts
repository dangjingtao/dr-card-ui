import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fetchSignStatus } from './signrecords'

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