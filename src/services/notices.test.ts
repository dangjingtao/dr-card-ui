import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fetchNoticePage, fetchNoticeDetail, fetchNoticeUnreadCounts, readAllNotices,
  mapNotice, noticeText, NOTICES_INDEX_PATH, NOTICES_DETAIL_PATH,
} from './notices'

const mocks = vi.hoisted(() => ({ request: vi.fn() }))
vi.mock('./http', async importOriginal => {
  const actual = await importOriginal<typeof import('./http')>()
  return { ...actual, httpClient: { request: mocks.request } }
})

const backendNotice = {
  id: 31, title: '系统通知', content: '<p>您好 <strong>测试</strong></p><p>下一行</p>',
  type: 10, user_id: 9, sender_user: 0, send_time: 1790000300,
  extra_json: null, create_time: '2026-10-01 12:05:00',
  is_read: 0, read_time: null,
}

describe('#122 notices business API', () => {
  beforeEach(() => mocks.request.mockReset())

  it('requests paginated authenticated list without client-supplied user_id', async () => {
    mocks.request.mockResolvedValue({ code: 0, data: {
      data: [backendNotice], current_page: 1, per_page: 30, total: 1, last_page: 1,
    } })
    const result = await fetchNoticePage(1, 30)
    expect(result.data[0]?.id).toBe(31)
    expect(mocks.request).toHaveBeenCalledWith({
      method: 'GET', url: NOTICES_INDEX_PATH,
      params: { page: 1, pageSize: 30 },
    })
    expect(mocks.request.mock.calls[0]?.[0].params.user_id).toBeUndefined()
  })

  it('marks a notice read through GET detail, not generic CRUD and validates numeric ids', async () => {
    mocks.request.mockResolvedValue({ code: 0, data: { ...backendNotice, is_read: 1 } })
    expect((await fetchNoticeDetail('31')).is_read).toBe(1)
    expect(mocks.request).toHaveBeenCalledWith({
      method: 'GET', url: NOTICES_DETAIL_PATH, params: { id: 31 },
    })
    await expect(fetchNoticeDetail('other-user')).rejects.toThrow('无效通知编号')
  })

  it('uses dedicated unread count and POST read-all without sending a user id', async () => {
    mocks.request.mockResolvedValueOnce({ code: 0, data: { total: 2,
      items: [{ type: 10, name: '系统公告', unread: 2 }] } })
    expect((await fetchNoticeUnreadCounts()).total).toBe(2)
    mocks.request.mockResolvedValueOnce({ code: 0, data: { count: 2 } })
    expect(await readAllNotices()).toBe(2)
    expect(mocks.request).toHaveBeenLastCalledWith({
      method: 'POST', url: '/api/notices/read-all', data: {},
    })
  })

  it('rejects business errors, malformed paginated payloads and unavailable detail', async () => {
    mocks.request.mockResolvedValueOnce({ code: 500, message: '通知不存在', data: [] })
    await expect(fetchNoticeDetail('31')).rejects.toThrow('通知不存在')
    mocks.request.mockResolvedValueOnce({ code: 0, data: { data: [] } })
    await expect(fetchNoticePage()).rejects.toThrow()
    mocks.request.mockResolvedValueOnce({ code: 401, message: '请先登录', data: [] })
    await expect(readAllNotices()).rejects.toThrow('请先登录')
  })

  it('turns untrusted HTML into readable text, without executable markup or fixture CTA', () => {
    const dangerous = '<p>正常消息</p><img src=x onerror=alert(1)><script>alert(2)</script><a href="javascript:alert(1)">链接</a>'
    const text = noticeText(dangerous)
    expect(text).toContain('正常消息')
    expect(text).toContain('链接')
    expect(text).not.toMatch(/<|onerror|script|alert/)
    const mapped = mapNotice({ ...backendNotice, content: dangerous })
    expect(mapped.id).toBe('31')
    expect(mapped.unread).toBe(true)
    expect(mapped.paragraphs.join(' ')).not.toContain('alert')
    expect(mapped.cta).toBeUndefined()
    expect(mapNotice({ ...backendNotice, content: null }).summary).toBe('')
  })

  it('maps backend notice categories without inventing new kinds', () => {
    expect(mapNotice({ ...backendNotice, type: 20 }).cat).toBe('activity')
    expect(mapNotice({ ...backendNotice, type: 30 }).cat).toBe('reward')
    expect(mapNotice({ ...backendNotice, type: 40 }).cat).toBe('transfer')
    expect(mapNotice({ ...backendNotice, type: 50 }).cat).toBe('other')
    expect(mapNotice({ ...backendNotice, type: 60 }).cat).toBe('buddy')
  })
})
