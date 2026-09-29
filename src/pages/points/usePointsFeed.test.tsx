import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { UserPointsPage, UserPointsRecord } from '../../services/userpoints'

const mocks = vi.hoisted(() => ({
  fetchUserPointsList: vi.fn(),
}))

vi.mock('../../services/userpoints', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/userpoints')>()
  return {
    ...actual,
    fetchUserPointsList: mocks.fetchUserPointsList,
  }
})

import { useUserPointsList } from './usePointsFeed'

function record(id: number): UserPointsRecord {
  return {
    id,
    create_time: `2026-09-${String(30 - id).padStart(2, '0')} 09:00:00`,
    update_time: `2026-09-${String(30 - id).padStart(2, '0')} 09:00:00`,
    delete_time: null,
    user_id: 1,
    points: 10,
    before_points: 100,
    after_points: 110,
    type: 10,
    object: 1,
    object_type: 'task',
    operator: 'sign',
  }
}

function page(currentPage: number, ids: number[]): UserPointsPage {
  return {
    data: ids.map(record),
    current_page: currentPage,
    per_page: 1,
    total: 2,
    last_page: 2,
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('useUserPointsList pagination', () => {
  beforeEach(() => {
    mocks.fetchUserPointsList.mockReset()
  })

  it('keeps existing rows visible while loading the next page', async () => {
    const nextPage = deferred<UserPointsPage>()
    mocks.fetchUserPointsList
      .mockResolvedValueOnce(page(1, [1]))
      .mockReturnValueOnce(nextPage.promise)

    const { result } = renderHook(() => useUserPointsList({ pageSize: 1 }))

    await waitFor(() => expect(result.current.remote.state).toBe('success'))
    expect(result.current.remote.state === 'success' ? result.current.remote.data.data.map((item) => item.id) : []).toEqual([1])

    act(() => result.current.loadMore())

    expect(result.current.loadingMore).toBe(true)
    expect(result.current.remote.state).toBe('success')
    expect(result.current.remote.state === 'success' ? result.current.remote.data.data.map((item) => item.id) : []).toEqual([1])

    await act(async () => {
      nextPage.resolve(page(2, [2]))
      await nextPage.promise
    })

    await waitFor(() => expect(result.current.loadingMore).toBe(false))
    expect(result.current.remote.state === 'success' ? result.current.remote.data.data.map((item) => item.id) : []).toEqual([1, 2])
    expect(result.current.loadedPage).toBe(2)
  })

  it('keeps existing rows and exposes an inline retry error when append fails', async () => {
    const nextPage = deferred<UserPointsPage>()
    mocks.fetchUserPointsList
      .mockResolvedValueOnce(page(1, [1]))
      .mockReturnValueOnce(nextPage.promise)

    const { result } = renderHook(() => useUserPointsList({ pageSize: 1 }))

    await waitFor(() => expect(result.current.remote.state).toBe('success'))

    act(() => result.current.loadMore())
    act(() => nextPage.reject(new Error('第二页暂时不可用')))

    await waitFor(() => expect(result.current.loadingMore).toBe(false))

    expect(result.current.remote.state).toBe('success')
    expect(result.current.remote.state === 'success' ? result.current.remote.data.data.map((item) => item.id) : []).toEqual([1])
    expect(result.current.loadMoreError).toBe('第二页暂时不可用')
    expect(result.current.canLoadMore).toBe(true)
  })
})
