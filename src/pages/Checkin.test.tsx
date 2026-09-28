import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'

const mocks = vi.hoisted(() => ({
  showRewardAd: vi.fn(),
  open: vi.fn(),
  close: vi.fn(),
  patch: vi.fn(),
}))

vi.mock('../services/nativeBridge', () => {
  class NativeBridgeError extends Error {
    constructor(
      readonly code: string,
      readonly capability = 'showRewardAd',
    ) {
      super(code)
    }
  }

  return {
    NativeBridgeError,
    showRewardAd: mocks.showRewardAd,
  }
})

vi.mock('../app/fixtures/useFixture', () => ({
  useFixtureState: () => ({ state: null }),
  useFixtureQueryControls: () => ({ patch: mocks.patch }),
  useOverlay: () => ({
    overlay: null,
    open: mocks.open,
    close: mocks.close,
  }),
  useFixtureDebug: () => false,
}))

vi.mock('../app/router/routes', () => ({
  findRouteByPathname: () => ({ path: '/checkin' }),
}))

vi.mock('./checkin/components/CheckinBoard', () => ({
  default: ({ onMakeup }: { onMakeup: () => void }) => (
    <button type="button" onClick={onMakeup}>
      补签
    </button>
  ),
}))

vi.mock('../components/mobile/CheckinMakeupSuccessOverlay', () => ({
  default: () => null,
}))

vi.mock('../components/mobile/DebugPanel', () => ({
  default: () => null,
}))

vi.mock('../components/mobile/PageContainer', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock('../components/mobile/PromptOverlay', () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

import Checkin from './Checkin'

afterEach(() => {
  mocks.showRewardAd.mockReset()
  mocks.open.mockReset()
  mocks.close.mockReset()
  mocks.patch.mockReset()
})

describe('Checkin H033 rewarded-ad flow', () => {
  it('opens makeup success only after Native returns completed', async () => {
    mocks.showRewardAd.mockResolvedValue({ status: 'completed' })

    render(<Checkin />)
    fireEvent.click(screen.getByRole('button', { name: '补签' }))

    await waitFor(() => {
      expect(mocks.showRewardAd).toHaveBeenCalledWith({
        scene: 'h5CheckinResign',
      })
    })
    expect(mocks.open).toHaveBeenCalledWith('make-up-success')
  })

  it.each([
    ['closed', '广告未完整观看，补签未完成'],
    ['failed', '广告播放失败，请重试'],
    ['no_fill', '暂无可用广告，请稍后再试'],
  ] as const)('does not reward when Native returns %s', async (status, message) => {
    mocks.showRewardAd.mockResolvedValue({ status })

    render(<Checkin />)
    fireEvent.click(screen.getByRole('button', { name: '补签' }))

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain(message)
    })
    expect(mocks.open).not.toHaveBeenCalledWith('make-up-success')
  })

  it('keeps unsupported Native hosts fail-closed', async () => {
    const { NativeBridgeError } = await import('../services/nativeBridge')
    mocks.showRewardAd.mockRejectedValue(
      new NativeBridgeError(
        'capability-unsupported',
        'showRewardAd',
        'showRewardAd is unavailable in this host.',
      ),
    )

    render(<Checkin />)
    fireEvent.click(screen.getByRole('button', { name: '补签' }))

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain(
        '当前 App 版本暂不支持激励广告补签',
      )
    })
    expect(mocks.open).not.toHaveBeenCalledWith('make-up-success')
  })

  it('does not start a second reward ad while one invocation is pending', async () => {
    let resolveAd: ((value: { status: 'closed' }) => void) | undefined
    mocks.showRewardAd.mockImplementation(
      () =>
        new Promise<{ status: 'closed' }>((resolve) => {
          resolveAd = resolve
        }),
    )

    render(<Checkin />)
    const button = screen.getByRole('button', { name: '补签' })
    fireEvent.click(button)
    fireEvent.click(button)

    expect(mocks.showRewardAd).toHaveBeenCalledTimes(1)

    resolveAd?.({ status: 'closed' })
    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain('补签未完成')
    })
  })
})
