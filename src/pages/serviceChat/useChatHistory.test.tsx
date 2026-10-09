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

  it('keeps page loading and post-send reconciliation independent and merges both results', async () => {
    let resolveOlder!: (data: ReturnType<typeof page>) => void
    let resolveLatest!: (data: ReturnType<typeof page>) => void
    mocks.fetch.mockResolvedValueOnce(page([record(3)], 1, 5, 2))
      .mockImplementationOnce(() => new Promise(resolve => { resolveOlder = resolve }))
      .mockImplementationOnce(() => new Promise(resolve => { resolveLatest = resolve }))
    const hook = renderHook(() => useChatHistory())
    await waitFor(() => expect(hook.result.current.status).toBe('ready'))
    act(() => hook.result.current.loadMore())
    expect(hook.result.current.loadingMore).toBe(true)
    const olderSignal = mocks.fetch.mock.calls[1][2] as AbortSignal
    let reconcile!: Promise<unknown>
    await act(async () => { reconcile = hook.result.current.syncLatest() })
    const latestSignal = mocks.fetch.mock.calls[2][2] as AbortSignal
    expect(olderSignal.aborted).toBe(false)
    expect(latestSignal.aborted).toBe(false)
    await act(async () => { resolveLatest(page([record(5), record(4)], 1, 5, 2)); await reconcile })
    expect(hook.result.current.loadingMore).toBe(true)
    expect(hook.result.current.messages.map(m => m.id)).toEqual(['3', '4', '5'])
    await act(async () => resolveOlder(page([record(2), record(1)], 2, 5, 2)))
    expect(hook.result.current.loadingMore).toBe(false)
    expect(hook.result.current.messages.map(m => m.id)).toEqual(['1', '2', '3', '4', '5'])
    hook.unmount()
  })

  it('does not strand pagination if a socket backfill overlaps and fails', async () => {
    let resolveOlder!: (data: ReturnType<typeof page>) => void
    mocks.fetch.mockResolvedValueOnce(page([record(4)], 1, 4, 2))
      .mockImplementationOnce(() => new Promise(resolve => { resolveOlder = resolve }))
      .mockRejectedValueOnce(new Error('temporary network failure'))
    const hook = renderHook(() => useChatHistory())
    await waitFor(() => expect(hook.result.current.status).toBe('ready'))
    act(() => hook.result.current.loadMore())
    let recovered!: boolean
    await act(async () => { recovered = await hook.result.current.syncMissed(3) })
    expect(recovered).toBe(false)
    expect(hook.result.current.loadingMore).toBe(true)
    expect((mocks.fetch.mock.calls[1][2] as AbortSignal).aborted).toBe(false)
    await act(async () => resolveOlder(page([record(2), record(1)], 2, 4, 2)))
    expect(hook.result.current.loadingMore).toBe(false)
    hook.unmount()
  })

  it('buffers live agent pushes before GET index is ready and deduplicates when history resolves', async () => {
    let finish!: (value: ReturnType<typeof page>) => void
    mocks.fetch.mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
    const hook = renderHook(() => useChatHistory())
    expect(hook.result.current.status).toBe('loading')
    act(() => {
      hook.result.current.acceptPush({ ...record(32), create_time: 1790000000 })
      hook.result.current.acceptPush({ ...record(32), create_time: 1790000000 })
      hook.result.current.acceptPush({ ...record(31), create_time: 1790000001 })
    })
    expect(hook.result.current.messages).toEqual([])
    await act(async () => finish(page([record(32), record(30)], 1, 3, 1)))
    expect(hook.result.current.status).toBe('ready')
    expect(hook.result.current.messages.map(m => m.id)).toEqual(['30', '31', '32'])
    expect(hook.result.current.messages.filter(m => m.id === '32')).toHaveLength(1)
    hook.unmount()
  })

  it('drops buffered pushes for old auth session during token rotation', async () => {
    let finishOld!: (value: ReturnType<typeof page>) => void
    mocks.fetch.mockImplementationOnce(() => new Promise(resolve => { finishOld = resolve }))
      .mockResolvedValueOnce(page([record(50)], 1, 1, 1))
    const hook = renderHook(() => useChatHistory())
    act(() => hook.result.current.acceptPush(record(99)))
    await act(async () => {
      mocks.token = 'second-token'
      window.dispatchEvent(new Event('dr-card-ui:auth-session-changed'))
    })
    await waitFor(() => expect(hook.result.current.status).toBe('ready'))
    expect(hook.result.current.messages.map(m => m.id)).toEqual(['50'])
    await act(async () => finishOld(page([record(99)])))
    expect(hook.result.current.messages.map(m => m.id)).toEqual(['50'])
    hook.unmount()
  })

  it('converts reconnect total from 100/page to the 30/page history cursor without false drift', async () => {
    mocks.fetch.mockResolvedValueOnce(page([record(30)], 1, 59, 2))
      .mockResolvedValueOnce({ ...page([record(65), record(30)], 1, 65, 1), per_page: 100 })
      .mockResolvedValueOnce(page([record(29), record(28)], 2, 65, 3))
    const hook = renderHook(() => useChatHistory())
    await waitFor(() => expect(hook.result.current.status).toBe('ready'))
    expect(hook.result.current.lastPage).toBe(2)
    let recovered = false
    await act(async () => { recovered = await hook.result.current.syncMissed(30) })
    expect(recovered).toBe(true)
    expect(hook.result.current.lastPage).toBe(3)
    expect(hook.result.current.hasMore).toBe(true)
    act(() => hook.result.current.loadMore())
    await waitFor(() => expect(hook.result.current.page).toBe(2))
    expect(hook.result.current.moreError).toBeNull()
    expect(hook.result.current.messages.map(m => m.id)).toEqual(['28', '29', '30', '65'])
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
