import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AppError } from './http'
import { fetchUserProfileDetail, parseUserProfileDetail } from './userProfile'

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  getAuthSession: vi.fn(),
}))

vi.mock('./http', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./http')>()
  return { ...actual, httpClient: { request: mocks.request } }
})

vi.mock('./auth/session', () => ({
  getAuthSession: mocks.getAuthSession,
}))

/** 真实 7002 用户实体字段形状（实测来源：登录 `userInfo` / `usercards` 关联 `user`）。 */
const verifiedEnvelope = {
  code: 0,
  msg: 'success',
  data: {
    id: 2,
    create_time: '2026-09-24 15:13:31',
    update_time: '2026-09-24 15:13:31',
    delete_time: null,
    nick_name: '151****2709',
    gender: '0',
    platform: 'MP-WEIXIN',
    avatar_img: 0,
    balance: '0.00',
    points: 0,
    mobile: '15177272709',
    real_name: null,
    grade_id: 1,
    grade: '大二',
    status: 10,
  },
}

describe('user profile detail contract', () => {
  beforeEach(() => {
    mocks.request.mockReset()
    mocks.getAuthSession.mockReset()
  })

  it('maps confirmed fields and tolerates the rest of the user entity', () => {
    expect(parseUserProfileDetail(verifiedEnvelope)).toEqual({
      nickname: '151****2709',
      grade: '大二',
    })
  })

  it('returns empty values when the backend omits the fields', () => {
    expect(parseUserProfileDetail({ code: 0, msg: 'success', data: { id: 2 } })).toEqual({
      nickname: '',
      grade: '',
    })
  })

  it('treats a non-zero code envelope as a business error with the message', () => {
    const failure = { code: 400, message: '用户不存在！', data: [] }

    try {
      parseUserProfileDetail(failure)
      throw new Error('expected parseUserProfileDetail to throw')
    } catch (error) {
      expect(error).toBeInstanceOf(AppError)
      expect((error as AppError).kind).toBe('business')
      expect((error as AppError).message).toBe('用户不存在！')
    }
  })

  it('rejects a success envelope whose data is not the user entity', () => {
    try {
      parseUserProfileDetail({ code: 0, msg: 'success', data: [] })
      throw new Error('expected parseUserProfileDetail to throw')
    } catch (error) {
      expect(error).toBeInstanceOf(AppError)
      expect((error as AppError).kind).toBe('contract')
    }
  })

  it('rejects payloads that are not the confirmed envelope', () => {
    try {
      parseUserProfileDetail({ nick_name: 'smile' })
      throw new Error('expected parseUserProfileDetail to throw')
    } catch (error) {
      expect(error).toBeInstanceOf(AppError)
      expect((error as AppError).kind).toBe('contract')
    }
  })
})

describe('user profile detail transport', () => {
  beforeEach(() => {
    mocks.request.mockReset()
    mocks.getAuthSession.mockReset()
  })

  it('calls the confirmed path and carries the 7002-verified token header', async () => {
    mocks.getAuthSession.mockReturnValue({ accessToken: 'session-token' })
    mocks.request.mockResolvedValue(verifiedEnvelope)

    await expect(fetchUserProfileDetail()).resolves.toEqual({
      nickname: '151****2709',
      grade: '大二',
    })
    expect(mocks.request).toHaveBeenCalledWith({
      method: 'GET',
      url: '/api/user/detail',
      headers: { token: 'session-token' },
    })
  })

  it('omits the token header when no session is available', async () => {
    mocks.getAuthSession.mockReturnValue(undefined)
    mocks.request.mockResolvedValue(verifiedEnvelope)

    await fetchUserProfileDetail()
    expect(mocks.request).toHaveBeenCalledWith({
      method: 'GET',
      url: '/api/user/detail',
      headers: undefined,
    })
  })
})