import { beforeEach, describe, expect, it, vi } from 'vitest'
import { chatRecordSchema, fetchChatHistoryPage, mapChatRecord, mergeChatHistory, CHAT_MESSAGES_INDEX_PATH } from './chatMessages'

const mock = vi.hoisted(() => ({ request: vi.fn() }))
vi.mock('./http', async original => {
  const real = await original<typeof import('./http')>()
  return { ...real, httpClient: { request: mock.request } }
})

const record = (id: number, sender_id: string | number, msg_type = 1, time: string | number = '2026-10-09 10:00:00') => ({
  id, sender_id, msg_type, user_id: '7', content: '文本' + id, create_time: time,
})
const response = (rows: ReturnType<typeof record>[], page = 1, total = rows.length, lastPage = 1) => ({
  code: 0, status: 'succ', data: { data: rows, current_page: page, per_page: 30, total, last_page: lastPage },
})

describe('#135 authenticated chat history contract', () => {
  beforeEach(() => mock.request.mockReset())

  it('GET only sends page/pageSize and a cancellable signal; never user_id/sender_id', async () => {
    const controller = new AbortController()
    mock.request.mockResolvedValueOnce(response([record(2, '7'), record(1, 0)]))
    const page = await fetchChatHistoryPage(1, 30, controller.signal)
    expect(page.data.map(x => x.id)).toEqual([2, 1])
    expect(mock.request).toHaveBeenCalledWith({
      method: 'GET', url: CHAT_MESSAGES_INDEX_PATH,
      params: { page: 1, pageSize: 30 }, signal: controller.signal,
    })
    expect(JSON.stringify(mock.request.mock.calls[0][0].params)).not.toContain('user_id')
  })

  it('system msg_type 7, service sender 0 / "0", own sender all normalized correctly', () => {
    expect(mapChatRecord(record(1, 0)).role).toBe('bot')
    expect(mapChatRecord(record(2, '0')).kind).toBe('service')
    expect(mapChatRecord(record(3, '7')).role).toBe('user')
    expect(mapChatRecord(record(4, '0', 7)).kind).toBe('system')
    expect(mapChatRecord(record(4, '0', 7)).role).toBe('bot')
    expect(mapChatRecord(record(5, 0, 1, 1790000000)).createdAt).toBe(1790000000)
  })

  it('merges out-of-order pages by numeric server id, de-duplicates by id', () => {
    const older = [mapChatRecord(record(1, '7')), mapChatRecord(record(2, '7'))]
    const newer = [mapChatRecord(record(12, 0)), mapChatRecord(record(2, 0))]
    const merged = mergeChatHistory(newer, older)
    expect(merged.map(x => x.id)).toEqual(['1', '2', '12'])
    expect(merged.find(x => x.id === '2')?.role).toBe('user')
  })

  it('rejects invalid/failed envelopes, broken DTO, and unsafe page parameters', async () => {
    mock.request.mockResolvedValueOnce({ code: 401, message: '请先登录', data: [] })
    await expect(fetchChatHistoryPage()).rejects.toThrow('请先登录')
    mock.request.mockResolvedValueOnce(response([{ ...record(1, '0'), id: -2 }]))
    await expect(fetchChatHistoryPage()).rejects.toThrow()
    mock.request.mockResolvedValueOnce(response([{ ...record(1, '0'), sender_id: 'abc' }]))
    await expect(fetchChatHistoryPage()).rejects.toThrow()
    await expect(fetchChatHistoryPage(0)).rejects.toThrow('分页参数无效')
    await expect(fetchChatHistoryPage(1, 101)).rejects.toThrow('分页参数无效')
    expect(chatRecordSchema.safeParse({ ...record(1, '0'), content: null }).success).toBe(false)
  })

  it('accepts empty history with last_page = 1', async () => {
    mock.request.mockResolvedValueOnce(response([]))
    await expect(fetchChatHistoryPage()).resolves.toMatchObject({ total: 0, last_page: 1, data: [] })
  })
})
