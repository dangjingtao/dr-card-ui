import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { UserUpdateResult } from '../../services/userProfile'

const mocks = vi.hoisted(() => ({
  token: 'account-A',
  fetchDetail: vi.fn(),
}))

vi.mock('../../services/auth/session', () => ({
  getAuthSession: () => ({ accessToken: mocks.token }),
}))
vi.mock('../../services/userProfile', () => ({
  fetchUserProfileDetail: mocks.fetchDetail,
}))

import { acceptUserIdentityUpdate, clearUserIdentity, useUserIdentity } from './useUserIdentity'

function IdentityConsumer() {
  const { remote } = useUserIdentity()
  return <div data-testid="identity">{remote.state === 'success' ? remote.data.nickname : remote.state}</div>
}

beforeEach(() => {
  clearUserIdentity()
  mocks.token = 'account-A'
  mocks.fetchDetail.mockReset()
})
afterEach(() => {
  cleanup()
  clearUserIdentity()
  Reflect.deleteProperty(document, 'visibilityState')
})

describe('H044 user identity re-entry and stale response guards', () => {
  it('revalidates /detail on route remount despite an existing successful snapshot', async () => {
    mocks.fetchDetail
      .mockResolvedValueOnce({ nickname: '旧昵称', grade: '', avatar: undefined })
      .mockResolvedValueOnce({ nickname: '另一设备已修改', grade: '', avatar: undefined })

    const first = render(<IdentityConsumer />)
    await waitFor(() => expect(screen.getByTestId('identity').textContent).toBe('旧昵称'))
    first.unmount()

    render(<IdentityConsumer />)
    await waitFor(() => expect(mocks.fetchDetail).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(screen.getByTestId('identity').textContent).toBe('另一设备已修改'))
  })

  it('refreshes on visible WebView resume without remounting the SPA', async () => {
    mocks.fetchDetail
      .mockResolvedValueOnce({ nickname: '切后台前', grade: '', avatar: undefined })
      .mockResolvedValueOnce({ nickname: '后台更新后', grade: '', avatar: undefined })

    render(<IdentityConsumer />)
    await waitFor(() => expect(screen.getByTestId('identity').textContent).toBe('切后台前'))

    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' })
    act(() => document.dispatchEvent(new Event('visibilitychange')))
    expect(mocks.fetchDetail).toHaveBeenCalledTimes(1)

    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
    act(() => document.dispatchEvent(new Event('visibilitychange')))
    await waitFor(() => expect(mocks.fetchDetail).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(screen.getByTestId('identity').textContent).toBe('后台更新后'))
  })

  it('revalidates bfcache restoration without a route remount', async () => {
    mocks.fetchDetail
      .mockResolvedValueOnce({ nickname: '缓存昵称', grade: '' })
      .mockResolvedValueOnce({ nickname: '恢复后昵称', grade: '' })
    render(<IdentityConsumer />)
    await waitFor(() => expect(screen.getByTestId('identity').textContent).toBe('缓存昵称'))
    const restored = new Event('pageshow')
    Object.defineProperty(restored, 'persisted', { value: true })
    act(() => window.dispatchEvent(restored))
    await waitFor(() => expect(mocks.fetchDetail).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(screen.getByTestId('identity').textContent).toBe('恢复后昵称'))
  })

  it('keeps the authoritative POST update when an older GET resolves later', async () => {
    let completeOldRead!: (value: { nickname: string; grade: string }) => void
    mocks.fetchDetail.mockImplementation(() => new Promise((resolve) => { completeOldRead = resolve }))
    render(<IdentityConsumer />)
    await waitFor(() => expect(mocks.fetchDetail).toHaveBeenCalledTimes(1))

    act(() => acceptUserIdentityUpdate({
      nick_name: '新昵称', student_grade: '大二', avatar_img: '',
    } as UserUpdateResult))
    expect(screen.getByTestId('identity').textContent).toBe('新昵称')

    await act(async () => completeOldRead({ nickname: '旧昵称', grade: '大一' }))
    expect(screen.getByTestId('identity').textContent).toBe('新昵称')
  })

  it('never renders a previous account identity after the token changes', async () => {
    mocks.fetchDetail.mockResolvedValueOnce({ nickname: '账号A', grade: '' })
    const first = render(<IdentityConsumer />)
    await waitFor(() => expect(screen.getByTestId('identity').textContent).toBe('账号A'))
    first.unmount()

    mocks.token = 'account-B'
    let resolveNew!: (value: { nickname: string; grade: string }) => void
    mocks.fetchDetail.mockImplementation(() => new Promise(resolve => { resolveNew = resolve }))
    render(<IdentityConsumer />)
    expect(screen.getByTestId('identity').textContent).not.toBe('账号A')
    await act(async () => resolveNew({ nickname: '账号B', grade: '' }))
    await waitFor(() => expect(screen.getByTestId('identity').textContent).toBe('账号B'))
  })
})
