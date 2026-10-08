import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, renderHook, waitFor } from '@testing-library/react'

import { SIGN_RECORDS_RANGE_MONTH, SIGN_RECORDS_RANGE_WEEK } from '../../services/signrecords'
import { useSignRecords } from './useCheckinFeed'

const mocks = vi.hoisted(() => ({
  fetchSignRecords: vi.fn(),
}))

vi.mock('../../services/signrecords', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/signrecords')>()
  return { ...actual, fetchSignRecords: mocks.fetchSignRecords }
})

beforeEach(() => {
  mocks.fetchSignRecords.mockReset()
  mocks.fetchSignRecords.mockResolvedValue([])
})

afterEach(cleanup)

describe('H044 / #89: sign records are scoped to the route', () => {
  it('requests only the current week for the compact home check-in board', async () => {
    const { result, rerender } = renderHook(() => useSignRecords(SIGN_RECORDS_RANGE_WEEK))

    await waitFor(() => expect(result.current.remote.state).toBe('success'))
    expect(mocks.fetchSignRecords).toHaveBeenCalledExactlyOnceWith({ range: 'week' })

    rerender()
    expect(mocks.fetchSignRecords).toHaveBeenCalledTimes(1)
  })

  it('requests the whole current month for the check-in calendar', async () => {
    const { result } = renderHook(() => useSignRecords(SIGN_RECORDS_RANGE_MONTH))

    await waitFor(() => expect(result.current.remote.state).toBe('success'))
    expect(mocks.fetchSignRecords).toHaveBeenCalledExactlyOnceWith({ range: 'month' })
  })

  it('keeps legacy callers on month rather than changing the default', async () => {
    const { result } = renderHook(() => useSignRecords())
    await waitFor(() => expect(result.current.remote.state).toBe('success'))
    expect(mocks.fetchSignRecords).toHaveBeenCalledExactlyOnceWith({ range: 'month' })
  })

  it('refetches with the newly selected range without looping on re-render', async () => {
    const { rerender, result } = renderHook(
      ({ range }: { range: 'month' | 'week' }) => useSignRecords(range),
      { initialProps: { range: SIGN_RECORDS_RANGE_WEEK as 'month' | 'week' } },
    )

    await waitFor(() => expect(result.current.remote.state).toBe('success'))
    rerender({ range: SIGN_RECORDS_RANGE_MONTH })
    await waitFor(() => expect(mocks.fetchSignRecords).toHaveBeenCalledTimes(2))
    expect(mocks.fetchSignRecords.mock.calls).toEqual([
      [{ range: 'week' }],
      [{ range: 'month' }],
    ])
  })
})
