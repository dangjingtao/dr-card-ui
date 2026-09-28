import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fetchHomeSettings, parseHomeSettings } from './settings'

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
}))

vi.mock('./http', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./http')>()
  return { ...actual, httpClient: { request: mocks.request } }
})

describe('home settings contract', () => {
  beforeEach(() => {
    mocks.request.mockReset()
  })

  it('reads the alias fields while the confirmed schema is pending', () => {
    expect(
      parseHomeSettings({
        code: 0,
        msg: 'success',
        status: 'succ',
        data: { brand_culture: '品牌描述', cause: '公益描述' },
      }),
    ).toEqual({ brandCultureText: '品牌描述', causeText: '公益描述' })
  })

  it('treats empty data shapes as no configuration', () => {
    expect(parseHomeSettings({ code: 0, msg: 'success', data: [] })).toEqual({})
    expect(parseHomeSettings({ code: 0, msg: 'success', data: null })).toEqual({})
  })

  it('throws a business error when code is not 0', () => {
    expect(() => parseHomeSettings({ code: 500, message: '参数错误', data: [] })).toThrowError('参数错误')
  })

  it('fetches the settings detail path', async () => {
    mocks.request.mockResolvedValue({ code: 0, msg: 'success', data: { cause: '公益描述' } })

    await expect(fetchHomeSettings()).resolves.toEqual({ causeText: '公益描述' })
    expect(mocks.request).toHaveBeenCalledWith({ method: 'GET', url: '/api/settings/detail' })
  })
})