import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchMemberGrades, MEMBER_GRADES_PATH } from './memberGrades'

const mocks = vi.hoisted(() => ({ request: vi.fn() }))
vi.mock('./http', async (importOriginal) => {
  const original = await importOriginal<typeof import('./http')>()
  return { ...original, httpClient: { request: mocks.request } }
})

const grade = (id: number) => ({
  id,
  name: `等级${id}`,
  icon_image: null,
  min_exp_number: (id - 1) * 100,
  benefit_desc: '',
  sort_number: id,
  is_default_switch: id === 1 ? 1 : 0,
  status: 10,
})

const envelope = (data: unknown[], current_page = 1, last_page = 1) => ({
  code: 0, msg: 'success', status: 'succ',
  data: { data, current_page, last_page, total: data.length, per_page: 100 },
})

describe('memberGrades API', () => {
  beforeEach(() => mocks.request.mockReset())

  it('queries the documented active-grade endpoint and preserves business fields', async () => {
    mocks.request.mockResolvedValue(envelope([grade(2), grade(1)]))
    await expect(fetchMemberGrades()).resolves.toEqual([grade(1), grade(2)])
    expect(mocks.request).toHaveBeenCalledWith({
      method: 'GET', url: MEMBER_GRADES_PATH,
      params: { status: 10, page: 1, pageSize: 100, 'orderBy[sort_number]': 'ASC' },
    })
  })

  it('fetches all pages rather than presenting an incomplete grade list', async () => {
    mocks.request
      .mockResolvedValueOnce(envelope([grade(1)], 1, 2))
      .mockResolvedValueOnce(envelope([grade(2)], 2, 2))
    await expect(fetchMemberGrades()).resolves.toHaveLength(2)
    expect(mocks.request).toHaveBeenCalledTimes(2)
  })

  it('accepts a truly empty grade list', async () => {
    mocks.request.mockResolvedValue(envelope([]))
    await expect(fetchMemberGrades()).resolves.toEqual([])
  })

  it('propagates backend business failures instead of inventing levels', async () => {
    mocks.request.mockResolvedValue({ code: 500, message: '配置暂不可用', data: [] })
    await expect(fetchMemberGrades()).rejects.toThrow('配置暂不可用')
  })

  it('rejects incomplete/invalid grade contracts', async () => {
    mocks.request.mockResolvedValue(envelope([{ id: 1, name: '缺少经验门槛' }]))
    await expect(fetchMemberGrades()).rejects.toThrow()
  })

  it('rejects inconsistent pagination instead of silently returning partial grades', async () => {
    mocks.request.mockResolvedValue(envelope([], 1, 2))
    await expect(fetchMemberGrades()).rejects.toThrow('会员等级分页异常')
  })
})
