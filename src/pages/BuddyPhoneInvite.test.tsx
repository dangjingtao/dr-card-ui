import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

const gateway = vi.hoisted(() => ({
  searchBuddyByPhone: vi.fn(),
  sendBuddyPhoneInvite: vi.fn(),
  acceptBuddyPhoneInvitation: vi.fn(),
}))

vi.mock('../services/buddyPhoneGateway', () => ({
  ...gateway, buddyPhoneContractReady: true, buddyPhoneDirectSendReady: false,
}))
const fixture = vi.hoisted(() => ({ state: null as string | null }))

vi.mock('../app/fixtures/useFixture', () => ({
  useFixtureQueryControls: () => ({
    get: (key: string) => key === 'state' ? fixture.state : null,
  }),
}))
vi.mock('../components/mobile/DebugPanel', () => ({ default: () => null }))
import BuddyPhoneInvite from './BuddyPhoneInvite'

const example = { id: 'mock-123', nickname: '演示搭子', avatarUrl: null }

afterEach(() => {
  Object.values(gateway).forEach(x => x.mockReset())
  fixture.state = null
})

describe('buddy phone H5 invitation UI', () => {
  it('accepts only complete numbers and displays returned identity instead of a fixed avatar/name', async () => {
    gateway.searchBuddyByPhone.mockResolvedValue({ outcome: 'invitable', user: example })
    render(<BuddyPhoneInvite />)
    expect(screen.getByRole('button', { name: '搜索' }).hasAttribute('disabled')).toBe(true)
    fireEvent.change(screen.getByRole('textbox', { name: '输入完整手机号搜索搭子' }), { target: { value: '13800000004' } })
    fireEvent.click(screen.getByRole('button', { name: '搜索' }))
    await waitFor(() => expect(screen.getByText('演示搭子')).toBeTruthy())
    expect(gateway.searchBuddyByPhone).toHaveBeenCalledWith('13800000004')
    expect(screen.queryByText('小美')).toBeNull()
  })

  it('sends one invite only after clicking, then shows a clearly marked demo confirmation', async () => {
    gateway.searchBuddyByPhone.mockResolvedValue({ outcome: 'invitable', user: example })
    gateway.sendBuddyPhoneInvite.mockResolvedValue(undefined)
    render(<BuddyPhoneInvite />)
    fireEvent.change(screen.getByRole('textbox', { name: '输入完整手机号搜索搭子' }), { target: { value: '13900000000' } })
    fireEvent.click(screen.getByRole('button', { name: '搜索' }))
    await waitFor(() => expect(screen.getByRole('button', { name: '发送邀请' })).toBeTruthy())
    expect(gateway.sendBuddyPhoneInvite).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '发送邀请' }))
    await waitFor(() => expect(screen.getByText(/未发送到真实用户通知中心/)).toBeTruthy())
    expect(gateway.sendBuddyPhoneInvite).toHaveBeenCalledTimes(1)
  })

  it('resynchronizes displayed prototype states without remounting', async () => {
    fixture.state = 'invitable'
    const { rerender } = render(<BuddyPhoneInvite />)
    expect(screen.getByRole('button', { name: '发送邀请' })).toBeTruthy()
    expect(screen.getByText('演示搭子')).toBeTruthy()

    fixture.state = 'not-found'
    rerender(<BuddyPhoneInvite />)
    await waitFor(() => expect(screen.getByText(/没有找到已注册用户/)).toBeTruthy())
    expect(screen.queryByRole('button', { name: '发送邀请' })).toBeNull()

    fixture.state = 'success'
    rerender(<BuddyPhoneInvite />)
    await waitFor(() => expect(screen.getByText(/未发送到真实用户通知中心/)).toBeTruthy())

    fixture.state = 'invited'
    rerender(<BuddyPhoneInvite />)
    await waitFor(() => expect(screen.getByText('已发送邀请，等待对方确认')).toBeTruthy())
    expect(screen.queryByText(/未发送到真实用户通知中心/)).toBeNull()
  })

  it('never automatically accepts an incoming invitation; cancel is not rejection', async () => {
    gateway.searchBuddyByPhone.mockResolvedValue({
      outcome: 'incoming-pending', user: example, invitationId: 'mock-incoming-1',
    })
    gateway.acceptBuddyPhoneInvitation.mockResolvedValue('accepted')
    render(<BuddyPhoneInvite />)
    fireEvent.change(screen.getByRole('textbox', { name: '输入完整手机号搜索搭子' }), { target: { value: '13800000004' } })
    fireEvent.click(screen.getByRole('button', { name: '搜索' }))
    await waitFor(() => expect(screen.getByRole('button', { name: '确认成为搭子' })).toBeTruthy())
    expect(gateway.acceptBuddyPhoneInvitation).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '确认成为搭子' }))
    expect(screen.getByText(/取消不会拒绝邀请/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '取消' }))
    expect(gateway.acceptBuddyPhoneInvitation).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '确认成为搭子' }))
    const confirms = screen.getAllByRole('button', { name: '确认成为搭子' })
    fireEvent.click(confirms[confirms.length - 1])
    await waitFor(() => expect(gateway.acceptBuddyPhoneInvitation).toHaveBeenCalledWith('mock-incoming-1'))
    expect(screen.getByText(/真实搭子关系仍待后台接入/)).toBeTruthy()
  })
})
