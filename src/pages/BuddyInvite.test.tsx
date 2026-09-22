import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  saveInvitePoster: vi.fn(),
  copyInviteLink: vi.fn(),
}))

vi.mock('../app/fixtures/useFixture', () => ({
  useFixtureNavigate: () => mocks.navigate,
  useFixtureDebug: () => false,
}))

vi.mock('../app/adapters/buddyShare', () => ({
  saveInvitePoster: mocks.saveInvitePoster,
  copyInviteLink: mocks.copyInviteLink,
}))

import BuddyInvite from './BuddyInvite'

afterEach(() => {
  mocks.navigate.mockReset()
  mocks.saveInvitePoster.mockReset()
  mocks.copyInviteLink.mockReset()
})

describe('BuddyInvite Native share outcomes', () => {
  it('routes poster failure to the existing poster-failed result state', async () => {
    mocks.saveInvitePoster.mockResolvedValue({
      outcome: 'poster-failed',
      ok: false,
      text: '海报保存失败',
    })

    render(<BuddyInvite />)
    fireEvent.click(screen.getByRole('button', { name: /保存到本地/ }))

    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith('/buddy/invite/qrcode', {
        state: 'poster-failed',
        debug: null,
      })
    })
  })

  it('routes clipboard failure to link-failed instead of the old fake success state', async () => {
    mocks.copyInviteLink.mockResolvedValue({
      outcome: 'link-failed',
      ok: false,
      text: '链接复制失败',
    })

    render(<BuddyInvite />)
    fireEvent.click(screen.getByRole('button', { name: /复制链接/ }))

    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith('/buddy/invite/qrcode', {
        state: 'link-failed',
        debug: null,
      })
    })
  })

  it('keeps successful outcomes mapped to their existing result states', async () => {
    mocks.copyInviteLink.mockResolvedValue({
      outcome: 'link-copied',
      ok: true,
      text: '复制成功',
    })

    render(<BuddyInvite />)
    fireEvent.click(screen.getByRole('button', { name: /复制链接/ }))

    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith('/buddy/invite/qrcode', {
        state: 'link-copied',
        debug: null,
      })
    })
  })
})
