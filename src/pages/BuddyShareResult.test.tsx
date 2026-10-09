import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('./BuddyInvite', () => ({
  default: () => <div data-testid="buddy-invite-page" />,
}))
vi.mock('../components/mobile/DebugPanel', () => ({
  default: () => null,
}))
vi.mock('../app/fixtures/useFixture', async () => {
  const actual = await vi.importActual<typeof import('../app/fixtures/useFixture')>('../app/fixtures/useFixture')
  return {
    ...actual,
    useFixtureQueryControls: () => ({ get: (key: string) => key === 'state' ? 'saved' : null }),
    useFixtureDebug: () => false,
  }
})
import BuddyShareResult from './BuddyShareResult'

describe('BuddyShareResult poster preview truth', () => {
  it('displays the exact saved poster from in-app navigation, not a success icon', () => {
    const poster = 'data:image/png;base64,cG9zdGVyLWJ5dGVz'
    render(
      <MemoryRouter initialEntries={[{
        pathname: '/buddy/invite/qrcode',
        state: { buddyPosterPreview: poster },
      }]}>
        <BuddyShareResult />
      </MemoryRouter>,
    )
    const image = screen.getByRole('img', { name: '刚保存的洗头搭子邀请海报' })
    expect(image.getAttribute('src')).toBe(poster)
    expect(screen.getByText('已保存到本地，快分享给好友吧！')).toBeTruthy()
    expect(screen.getByText('请在「卡博士APP」中扫码')).toBeTruthy()
  })

  it('does not fabricate an image when opening a historical fixture success URL directly', () => {
    render(
      <MemoryRouter initialEntries={['/buddy/invite/qrcode?state=saved']}>
        <BuddyShareResult />
      </MemoryRouter>,
    )
    expect(screen.queryByRole('img', { name: '刚保存的洗头搭子邀请海报' })).toBeNull()
  })
})
