import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

const backend = vi.hoisted(() => ({
  getBuddyPhoneInvitations: vi.fn(),
  acceptBuddyPhoneInvitation: vi.fn(),
}))
vi.mock('../../services/buddyPhoneGateway', () => ({
  ...backend, buddyPhoneContractReady: false, buddyPhoneInboxReady: true,
}))
import BuddyInvitationInbox from './BuddyInvitationInbox'
afterEach(() => Object.values(backend).forEach(fn => fn.mockReset()))

describe('real type=60 notification flow', () => {
  it('preserves a successful acceptance if the subsequent notification refresh fails', async () => {
    backend.getBuddyPhoneInvitations
      .mockResolvedValueOnce([{
        id: '12', inviter: { id: 'notice-70', nickname: '好友申请', avatarUrl: null },
        detail: '真实昵称 申请添加你为好友', status: 'pending', createdAt: '1790000000',
      }])
      .mockRejectedValueOnce(new Error('network down'))
    backend.acceptBuddyPhoneInvitation.mockResolvedValue('accepted')

    render(<BuddyInvitationInbox />)
    await waitFor(() => expect(screen.getByRole('button', { name: '查看邀请' })).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: '查看邀请' }))
    fireEvent.click(screen.getByRole('button', { name: '确认成为搭子' }))
    await waitFor(() => expect(screen.getByText(/申请已同意，但通知列表刷新失败/)).toBeTruthy())
    expect(screen.getByText(/已同意申请。后台会移除已处理通知/)).toBeTruthy()
    expect(screen.queryByText('确认失败，请稍后重试')).toBeNull()
    expect(screen.queryByRole('button', { name: '查看邀请' })).toBeNull()
    expect(backend.acceptBuddyPhoneInvitation).toHaveBeenCalledExactlyOnceWith('12')
  })

  it('shows backend application detail, approves only on confirmation, then respects deleted history', async () => {
    backend.getBuddyPhoneInvitations.mockResolvedValueOnce([{
      id: '12', inviter: { id: 'notice-70', nickname: '好友申请', avatarUrl: null },
      detail: '真实昵称 申请添加你为好友', status: 'pending', createdAt: '1790000000',
    }]).mockResolvedValueOnce([])
    backend.acceptBuddyPhoneInvitation.mockResolvedValue('accepted')

    render(<BuddyInvitationInbox />)
    await waitFor(() => expect(screen.getByText('真实昵称 申请添加你为好友')).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: '查看邀请' }))
    expect(backend.acceptBuddyPhoneInvitation).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '取消' }))
    expect(backend.acceptBuddyPhoneInvitation).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: '查看邀请' }))
    fireEvent.click(screen.getByRole('button', { name: '确认成为搭子' }))
    await waitFor(() => expect(screen.getByText(/已同意申请。后台会移除已处理通知/)).toBeTruthy())
    expect(backend.acceptBuddyPhoneInvitation).toHaveBeenCalledExactlyOnceWith('12')
    expect(screen.getByText('暂无搭子邀请')).toBeTruthy()
    expect(screen.queryByText('已成为搭子 · 邀请已完成')).toBeNull()
  })
})
