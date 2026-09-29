import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  fetchUserProfile,
  updateUserProfile,
  USER_GENDER_MALE,
} from './userProfile'

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
}))

vi.mock('./http', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./http')>()
  return { ...actual, httpClient: { request: mocks.request } }
})

vi.mock('./auth/session', () => ({ getAuthSession: () => undefined }))

const PROFILE_DATA = {
  couponsCount: 2,
  grade: '普通会员',
  grade_id: 1,
  nextGrade: { id: 2, name: '白银会员', min_exp_number: 100 },
  nick_name: '用户28123456',
  avatar_img: 'https://app.kbscloud.com/statics/icons/user_default_icon.png',
  country: '中国',
  city: '南宁',
  province: '广西',
  mobile: '151****2709',
  real_name: '',
  points: 128,
  kbs_id: 'K016998956',
}

describe('user profile contract', () => {
  beforeEach(() => {
    mocks.request.mockReset()
  })

  it('maps the envelope into a page-ready view model', async () => {
    mocks.request.mockResolvedValue({ code: 0, msg: 'success', status: 'succ', data: PROFILE_DATA })

    const profile = await fetchUserProfile()

    expect(mocks.request).toHaveBeenCalledWith({ method: 'GET', url: '/api/user/profile' })
    expect(profile).toEqual({
      couponsCount: 2,
      grade: '普通会员',
      gradeId: 1,
      nextGrade: { id: 2, name: '白银会员', min_exp_number: 100 },
      nickname: '用户28123456',
      avatar: 'https://app.kbscloud.com/statics/icons/user_default_icon.png',
      country: '中国',
      province: '广西',
      city: '南宁',
      mobile: '151****2709',
      realName: undefined,
      points: 128,
      kbsId: 'K016998956',
    })
  })

  it('treats nextGrade "" as no next level instead of throwing', async () => {
    mocks.request.mockResolvedValue({
      code: 0,
      msg: 'success',
      data: { ...PROFILE_DATA, grade: '钻石会员', grade_id: 5, nextGrade: '' },
    })

    await expect(fetchUserProfile()).resolves.toMatchObject({ nextGrade: undefined, grade: '钻石会员' })
  })

  it('keeps couponsCount 0 and points 0 as real values', async () => {
    mocks.request.mockResolvedValue({
      code: 0,
      msg: 'success',
      data: { ...PROFILE_DATA, couponsCount: 0, points: 0, avatar_img: '', kbs_id: '' },
    })

    await expect(fetchUserProfile()).resolves.toMatchObject({
      couponsCount: 0,
      points: 0,
      avatar: undefined,
      kbsId: undefined,
    })
  })

  it('throws a business error on failure so the page can degrade', async () => {
    mocks.request.mockResolvedValue({ code: 401, message: '请先登录', data: [] })

    await expect(fetchUserProfile()).rejects.toMatchObject({ kind: 'business', message: '请先登录' })
  })
})

describe('user update contract', () => {
  beforeEach(() => {
    mocks.request.mockReset()
  })

  it('posts only the changed fields and parses the returned user entity', async () => {
    mocks.request.mockResolvedValue({
      code: 0,
      msg: 'success',
      data: { id: 5, nick_name: '小明', gender: '1', avatar_img: '', points: 128, grade_id: 1, student_grade: '初二' },
    })

    await expect(updateUserProfile({ nick_name: '小明', gender: USER_GENDER_MALE })).resolves.toMatchObject({
      nick_name: '小明',
      gender: '1',
    })
    expect(mocks.request).toHaveBeenCalledWith({
      method: 'POST',
      url: '/api/user/update',
      data: { nick_name: '小明', gender: '1' },
    })
  })

  it('surfaces the backend message when validation fails', async () => {
    mocks.request.mockResolvedValue({ code: 500, message: '"nick_name" is required', data: [] })

    await expect(updateUserProfile({ nick_name: '' })).rejects.toMatchObject({
      kind: 'business',
      message: '"nick_name" is required',
    })
  })
})
