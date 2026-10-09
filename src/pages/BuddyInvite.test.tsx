import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  saveInvitePoster: vi.fn(),
}))

vi.mock('../app/fixtures/useFixture', () => ({
  useFixtureNavigate: () => mocks.navigate,
  useFixtureDebug: () => false,
}))

vi.mock('../app/adapters/buddyShare', () => ({
  saveInvitePoster: mocks.saveInvitePoster,
}))

import BuddyInvite from './BuddyInvite'

afterEach(() => {
  mocks.navigate.mockReset()
  mocks.saveInvitePoster.mockReset()
})

describe('BuddyInvite #102 QR-only product contract', () => {
  it('only offers poster saving, never copy-link', () => {
    render(<BuddyInvite />)

    expect(screen.getByRole('button', { name: /保存到本地/ })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /复制链接/ })).toBeNull()
    expect(screen.getByText('二维码正在接入后台，暂不可扫码')).toBeTruthy()
    expect(mocks.saveInvitePoster).not.toHaveBeenCalled()
  })

  it('routes poster failure to the existing poster-failed result state', async () => {
    mocks.saveInvitePoster.mockResolvedValue({
      outcome: 'poster-failed',
      ok: false,
      text: '海报保存失败',
    })

    render(<BuddyInvite />)
    fireEvent.click(screen.getByRole('button', { name: /保存到本地/ }))

    await waitFor(() => {
      expect(mocks.saveInvitePoster).toHaveBeenCalledTimes(1)
      expect(mocks.navigate).toHaveBeenCalledWith('/buddy/invite/qrcode', {
        state: 'poster-failed',
        debug: null,
      })
    })
  })

  it('keeps poster success feedback mapped to the saved result state without a link action', async () => {
    mocks.saveInvitePoster.mockResolvedValue({
      outcome: 'poster-saved',
      ok: true,
      text: '已保存到本地',
    })

    render(<BuddyInvite />)
    fireEvent.click(screen.getByRole('button', { name: /保存到本地/ }))

    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith('/buddy/invite/qrcode', {
        state: 'saved',
        debug: null,
      })
    })
    expect(screen.queryByRole('button', { name: /复制链接/ })).toBeNull()
  })
})
