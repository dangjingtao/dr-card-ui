import { afterEach, describe, expect, it, vi } from 'vitest'

const bridgeMocks = vi.hoisted(() => ({
  openApp: vi.fn(),
}))

vi.mock('../../services/nativeBridge', () => ({
  openApp: bridgeMocks.openApp,
}))

import {
  detectInstalledApp,
  openInstalledApp,
  openNativeAppStore,
} from './appOpen'

afterEach(() => {
  bridgeMocks.openApp.mockReset()
})

describe('H034 appOpen adapter', () => {
  it('keeps detect/open/store as separate Native actions', async () => {
    bridgeMocks.openApp.mockResolvedValue({
      success: true,
      installed: true,
    })

    await detectInstalledApp()
    await openInstalledApp()
    await openNativeAppStore()

    expect(bridgeMocks.openApp.mock.calls).toEqual([
      [
        {
          action: 'detect',
          inviteCode: '',
          fallbackUrl: '',
        },
      ],
      [
        {
          action: 'open',
          inviteCode: '',
          fallbackUrl: '',
        },
      ],
      [
        {
          action: 'store',
          inviteCode: '',
          fallbackUrl: '',
        },
      ],
    ])
  })

  it('passes explicit inviteCode/fallbackUrl through without deriving schemes', async () => {
    bridgeMocks.openApp.mockResolvedValue({
      success: true,
      installed: false,
    })

    await openInstalledApp({
      inviteCode: 'invite-123',
      fallbackUrl: 'https://example.com/fallback',
    })

    expect(bridgeMocks.openApp).toHaveBeenCalledWith({
      action: 'open',
      inviteCode: 'invite-123',
      fallbackUrl: 'https://example.com/fallback',
    })
  })
})
