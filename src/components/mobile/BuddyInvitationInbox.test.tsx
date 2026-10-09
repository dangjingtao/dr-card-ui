import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

const gateway = vi.hoisted(() => ({
  getBuddyPhoneInvitations: vi.fn(),
  acceptBuddyPhoneInvitation: vi.fn(),
}))
vi.mock('../../services/buddyPhoneGateway', () => ({ ...gateway, buddyPhoneContractReady: true, buddyPhoneInboxReady: true }))
import BuddyInvitationInbox from './BuddyInvitationInbox'

const pending = {
  id: 'mock-incoming-1',
  inviter: { id: 'mock-user', nickname: '演示搭子', avatarUrl: null },
  status: 'pending' as const,
  createdAt: '2026-10-09T08:00:00+08:00',
}

afterEach(() => Object.values(gateway).forEach(x => x.mockReset()))

describe('notification center buddy invitation', () => {
  it('shows a persistent pending invitation but does not accept on view/cancel', async () => {
    gateway.getBuddyPhoneInvitations.mockResolvedValue([pending])
    render(<BuddyInvitationInbox />)
    await waitFor(() => expect(screen.getByRole('button', { name: '查看邀请' })).toBeTruthy())
    expect(gateway.acceptBuddyPhoneInvitation).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '查看邀请' }))
    expect(screen.getByText(/关闭通知或取消不会拒绝邀请/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '取消' }))
    expect(gateway.acceptBuddyPhoneInvitation).not.toHaveBeenCalled()
    expect(screen.getByText(/等待确认/)).toBeTruthy()
  })

  it('confirms explicitly, then re-reads backend status rather than writing local fake success', async () => {
    gateway.getBuddyPhoneInvitations.mockResolvedValueOnce([pending])
      .mockResolvedValueOnce([{ ...pending, status: 'completed' }])
    gateway.acceptBuddyPhoneInvitation.mockResolvedValue('accepted')
    render(<BuddyInvitationInbox />)
    await waitFor(() => expect(screen.getByRole('button', { name: '查看邀请' })).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: '查看邀请' }))
    fireEvent.click(screen.getByRole('button', { name: '确认成为搭子' }))
    await waitFor(() => expect(screen.getByText(/已成为搭子 · 邀请已完成/)).toBeTruthy())
    expect(gateway.acceptBuddyPhoneInvitation).toHaveBeenCalledOnce()
    expect(gateway.acceptBuddyPhoneInvitation).toHaveBeenCalledWith(pending.id)
    expect(gateway.getBuddyPhoneInvitations).toHaveBeenCalledTimes(2)
    expect(screen.queryByRole('button', { name: '查看邀请' })).toBeNull()
  })
})
