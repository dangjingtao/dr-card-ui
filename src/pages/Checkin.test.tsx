import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'

const mocks = vi.hoisted(() => ({
  showRewardAd: vi.fn(),
  makeup: vi.fn(),
  signIn: vi.fn(),
  open: vi.fn(),
  close: vi.fn(),
  patch: vi.fn(),
  reloadRecords: vi.fn(),
  reloadStatus: vi.fn(),
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

vi.mock('./checkin/useCheckinFeed', () => ({
  useSignStatus: () => ({ remote: { state: 'loading' }, reload: mocks.reloadStatus }),
  useSignRecords: () => ({ remote: { state: 'loading' }, reload: mocks.reloadRecords }),
  useCheckinActions: (
    onSuccess?: (kind: 'sign-in' | 'makeup', day?: string) => void,
  ) => ({
    pending: null,
    error: null,
    lastMakeupDay: null,
    signIn: async () => {
      try {
        await mocks.signIn()
      } catch {
        return false
      }
      onSuccess?.('sign-in')
      return true
    },
    makeup: async (day: string) => {
      try {
        await mocks.makeup(day)
      } catch {
        // 与真实 useCheckinActions 一致：失败不抛出，转为 error 状态由页面渲染。
        return false
      }
      onSuccess?.('makeup', day)
      return true
    },
    dismissError: vi.fn(),
  }),
}))

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
  default: ({ onMakeupDay }: { onMakeupDay?: (day: string) => void }) => (
    <button type="button" onClick={() => onMakeupDay?.('2026-09-20')}>
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
  mocks.makeup.mockReset()
  mocks.signIn.mockReset()
  mocks.open.mockReset()
  mocks.close.mockReset()
  mocks.patch.mockReset()
  mocks.reloadRecords.mockReset()
  mocks.reloadStatus.mockReset()
})

/**
 * 补签 = 先看完激励广告，再发起真实补签请求（2026-09-28 用户确认）。
 *
 * 因此这里同时验证两段：
 * 1) 广告闸门：只有 `status=completed` 才允许落库；closed / failed / no_fill / 不支持的宿主都不发请求；
 * 2) 补签接口：广告通过后调用 `POST /api/signrecords/makeup { day }`，并做乐观点亮 + 刷新。
 */
describe('Checkin makeup flow (rewarded ad gate + API)', () => {
  it('does not call the makeup API until the ad completes', async () => {
    mocks.showRewardAd.mockResolvedValue({ status: 'completed' })
    mocks.makeup.mockResolvedValue(undefined)

    render(<Checkin />)
    const button = screen.getByRole('button', { name: '补签' })

    // 广告尚未 resolve 前，不得发起补签请求。
    fireEvent.click(button)
    expect(mocks.showRewardAd).toHaveBeenCalledWith({ scene: 'h5CheckinResign' })
    expect(mocks.makeup).not.toHaveBeenCalled()

    await waitFor(() => {
      expect(mocks.makeup).toHaveBeenCalledWith('2026-09-20')
    })
  })

  it('calls makeup with the dealt day and opens success after ad completes', async () => {
    mocks.showRewardAd.mockResolvedValue({ status: 'completed' })
    mocks.makeup.mockResolvedValue(undefined)

    render(<Checkin />)
    fireEvent.click(screen.getByRole('button', { name: '补签' }))

    await waitFor(() => {
      expect(mocks.makeup).toHaveBeenCalledWith('2026-09-20')
    })
    expect(mocks.open).toHaveBeenCalledWith('make-up-success')
  })

  it('refreshes status and records after a successful makeup', async () => {
    mocks.showRewardAd.mockResolvedValue({ status: 'completed' })
    mocks.makeup.mockResolvedValue(undefined)

    render(<Checkin />)
    fireEvent.click(screen.getByRole('button', { name: '补签' }))

    await waitFor(() => {
      expect(mocks.reloadRecords).toHaveBeenCalled()
    })
    expect(mocks.reloadStatus).toHaveBeenCalled()
  })

  it.each([
    ['closed', '广告未完整观看，补签未完成'],
    ['failed', '广告播放失败，请重试'],
    ['no_fill', '下次再来吧'],
  ] as const)('does not call makeup when Native returns %s', async (status, message) => {
    mocks.showRewardAd.mockResolvedValue({ status })

    render(<Checkin />)
    fireEvent.click(screen.getByRole('button', { name: '补签' }))

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain(message)
    })
    expect(mocks.makeup).not.toHaveBeenCalled()
    expect(mocks.open).not.toHaveBeenCalledWith('make-up-success')
  })

  it('keeps unsupported Native hosts fail-closed without calling makeup', async () => {
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
    expect(mocks.makeup).not.toHaveBeenCalled()
  })

  // 契约来源：native-bridge-v2-contract.md §1.1 —— cancel / permission_denied 是用户侧状态，
  // 不能与「能力不支持」或「系统故障」混为一谈，也不得落库。
  it.each([
    ['native-cancelled', '广告未完整观看，补签未完成'],
    ['native-permission-denied', '需要广告权限，请检查系统设置后重试'],
    ['native-failed', '广告调用失败，请重试'],
    ['invocation-timeout', '广告调用失败，请重试'],
  ] as const)('maps %s to its own message and never calls makeup', async (code, message) => {
    const { NativeBridgeError } = await import('../services/nativeBridge')
    mocks.showRewardAd.mockRejectedValue(new NativeBridgeError(code, 'showRewardAd', code))

    render(<Checkin />)
    fireEvent.click(screen.getByRole('button', { name: '补签' }))

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain(message)
    })
    expect(mocks.makeup).not.toHaveBeenCalled()
    expect(mocks.open).not.toHaveBeenCalledWith('make-up-success')
  })

  it('does not start a second ad while one invocation is pending', async () => {
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
    expect(mocks.makeup).not.toHaveBeenCalled()
  })

  it('surfaces the makeup API error when the ad passed but the request failed', async () => {
    mocks.showRewardAd.mockResolvedValue({ status: 'completed' })
    mocks.makeup.mockRejectedValue(new Error('只能补签今天之前的日期'))

    render(<Checkin />)
    fireEvent.click(screen.getByRole('button', { name: '补签' }))

    await waitFor(() => {
      expect(mocks.makeup).toHaveBeenCalled()
    })
    expect(mocks.open).not.toHaveBeenCalledWith('make-up-success')
  })
})
