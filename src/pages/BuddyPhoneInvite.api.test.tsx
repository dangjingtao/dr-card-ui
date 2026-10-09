import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

const api = vi.hoisted(() => ({
  sendBuddyPhoneInvite: vi.fn(),
  searchBuddyByPhone: vi.fn(),
  acceptBuddyPhoneInvitation: vi.fn(),
}))

vi.mock('../services/buddyPhoneGateway', () => ({
  ...api, buddyPhoneContractReady: false, buddyPhoneDirectSendReady: true,
}))
vi.mock('../app/fixtures/useFixture', () => ({
  useFixtureQueryControls: () => ({ get: () => null }),
}))
vi.mock('../components/mobile/DebugPanel', () => ({ default: () => null }))

import BuddyPhoneInvite from './BuddyPhoneInvite'
afterEach(() => Object.values(api).forEach(x => x.mockReset()))

describe('real backend phone application H5 mode', () => {
  it('offers explicit direct application, never tries a non-existent phone search or fabricates identity', async () => {
    api.sendBuddyPhoneInvite.mockResolvedValue(undefined)
    render(<BuddyPhoneInvite />)
    expect(screen.getByText(/暂未提供手机号只读搜索/)).toBeTruthy()
    expect(screen.queryByRole('button', { name: '搜索' })).toBeNull()
    expect(screen.queryByText('演示搭子')).toBeNull()
    const send = screen.getByRole('button', { name: '发送申请' })
    expect(send.hasAttribute('disabled')).toBe(true)
    fireEvent.change(screen.getByRole('textbox', { name: '输入完整手机号发送好友申请' }), {
      target: { value: '13800000000' },
    })
    fireEvent.click(send)
    await waitFor(() => expect(screen.getByText(/等待对方在通知中心确认/)).toBeTruthy())
    expect(api.sendBuddyPhoneInvite).toHaveBeenCalledExactlyOnceWith('13800000000')
    expect(api.searchBuddyByPhone).not.toHaveBeenCalled()
    expect(screen.queryByText(/未发送到真实用户通知中心/)).toBeNull()
  })

  it('surfaces backend business failures without reporting a successful invitation', async () => {
    api.sendBuddyPhoneInvite.mockRejectedValue(new Error('好友申请已发送，等待对方确认'))
    render(<BuddyPhoneInvite />)
    fireEvent.change(screen.getByRole('textbox', { name: '输入完整手机号发送好友申请' }), {
      target: { value: '13800000000' },
    })
    fireEvent.click(screen.getByRole('button', { name: '发送申请' }))
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('好友申请已发送'))
    expect(screen.queryByText(/申请已发送，等待对方在通知中心确认/)).toBeNull()
  })
})
