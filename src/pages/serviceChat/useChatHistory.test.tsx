import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useChatHistory } from './useChatHistory'

const mocks = vi.hoisted(() => ({ token: 'first-token', fetch: vi.fn() }))
vi.mock('../../services/auth/session', () => ({
  getAuthSession: () => mocks.token ? { accessToken: mocks.token, userInfo: null } : undefined,
}))
vi.mock('../../services/chatMessages', async original => {
  const real = await original<typeof import('../../services/chatMessages')>()
  return { ...real, fetchChatHistoryPage: mocks.fetch }
})
const record = (id: number, sender_id: string | number = 0) => ({
  id, user_id: '7', sender_id, content: 'msg-' + id,
  msg_type: 1, create_time: '2026-10-09 10:00:00',
})
const page = (rows: ReturnType<typeof record>[], current_page = 1, total = rows.length, last_page = 1) =>
  ({ data: rows, current_page, per_page: 30, total, last_page })

describe('#135 chat history lifecycle and account isolation', () => {
  beforeEach(() => { mocks.token = 'first-token'; mocks.fetch.mockReset() })
  afterEach(() => mocks.fetch.mockReset())

  it('loads newest history, prepends older page and drops duplicate ids', async () => {
    mocks.fetch.mockResolvedValueOnce(page([record(3), record(2)], 1, 3, 2))
      .mockResolvedValueOnce(page([record(2), record(1)], 2, 3, 2))
    const hook = renderHook(() => useChatHistory())
    await waitFor(() => expect(hook.result.current.status).toBe('ready'))
    expect(hook.result.current.messages.map(m => m.id)).toEqual(['2', '3'])
    expect(hook.result.current.hasMore).toBe(true)
    act(() => hook.result.current.loadMore())
    await waitFor(() => expect(hook.result.current.hasMore).toBe(false))
    expect(hook.result.current.messages.map(m => m.id)).toEqual(['1', '2', '3'])
    expect(mocks.fetch).toHaveBeenCalledWith(2, undefined, expect.any(AbortSignal))
    hook.unmount()
  })

  it('keeps current messages on load-more error and permits retry', async () => {
    mocks.fetch.mockResolvedValueOnce(page([record(3)], 1, 2, 2))
      .mockRejectedValueOnce(new Error('网络断开'))
      .mockResolvedValueOnce(page([record(1)], 2, 2, 2))
    const hook = renderHook(() => useChatHistory())
    await waitFor(() => expect(hook.result.current.status).toBe('ready'))
    act(() => hook.result.current.loadMore())
    await waitFor(() => expect(hook.result.current.moreError).toBe('网络断开'))
    expect(hook.result.current.messages.map(m => m.id)).toEqual(['3'])
    act(() => hook.result.current.loadMore())
    await waitFor(() => expect(hook.result.current.page).toBe(2))
    expect(hook.result.current.messages.map(m => m.id)).toEqual(['1', '3'])
    hook.unmount()
  })

  it('drops previous account history on token change before delayed old request can complete', async () => {
    let completeOld!: (value: ReturnType<typeof page>) => void
    mocks.fetch.mockImplementationOnce(() => new Promise(resolve => { completeOld = resolve }))
      .mockResolvedValueOnce(page([record(41, '0')]))
    const hook = renderHook(() => useChatHistory())
    const oldSignal = mocks.fetch.mock.calls[0][2] as AbortSignal
    await act(async () => {
      mocks.token = 'second-token'
      window.dispatchEvent(new Event('dr-card-ui:auth-session-changed'))
    })
    await waitFor(() => expect(hook.result.current.messages.map(m => m.id)).toEqual(['41']))
    expect(oldSignal.aborted).toBe(true)
    await act(async () => completeOld(page([record(8)])))
    expect(hook.result.current.messages.map(m => m.id)).toEqual(['41'])
    hook.unmount()
  })

  it('prevents late requests and old messages after clearing auth or unmount', async () => {
    let resolveFirst!: (value: ReturnType<typeof page>) => void
    mocks.fetch.mockImplementationOnce(() => new Promise(resolve => { resolveFirst = resolve }))
    const hook = renderHook(() => useChatHistory())
    await act(async () => {
      mocks.token = ''
      window.dispatchEvent(new Event('dr-card-ui:auth-session-cleared'))
    })
    expect(hook.result.current.status).toBe('error')
    expect(hook.result.current.messages).toEqual([])
    await act(async () => resolveFirst(page([record(10)])))
    expect(hook.result.current.messages).toEqual([])
    hook.unmount()
  })

  it('re-entering page fetches again and an empty page is a real empty state', async () => {
    mocks.fetch.mockResolvedValue(page([]))
    const first = renderHook(() => useChatHistory())
    await waitFor(() => expect(first.result.current.status).toBe('ready'))
    expect(first.result.current.hasMore).toBe(false)
    first.unmount()
    const second = renderHook(() => useChatHistory())
    await waitFor(() => expect(second.result.current.status).toBe('ready'))
    expect(mocks.fetch).toHaveBeenCalledTimes(2)
    second.unmount()
  })
})
