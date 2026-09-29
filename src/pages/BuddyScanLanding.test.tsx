import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

const mocks = vi.hoisted(() => ({
  detectInstalledApp: vi.fn(),
  openInstalledApp: vi.fn(),
  openNativeAppStore: vi.fn(),
  getNativeBridgeDiagnostics: vi.fn(),
}))

vi.mock('../app/adapters/appOpen', () => ({
  detectInstalledApp: mocks.detectInstalledApp,
  openInstalledApp: mocks.openInstalledApp,
  openNativeAppStore: mocks.openNativeAppStore,
}))

vi.mock('../services/nativeBridge', () => ({
  getNativeBridgeDiagnostics: mocks.getNativeBridgeDiagnostics,
}))

vi.mock('../app/fixtures/useFixture', () => ({
  useFixtureDebug: () => false,
}))

vi.mock('../app/router/routes', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../app/router/routes')>()
  return {
    ...actual,
    findRouteByPathname: () => undefined,
  }
})

import BuddyScanLanding from './BuddyScanLanding'

afterEach(() => {
  mocks.detectInstalledApp.mockReset()
  mocks.openInstalledApp.mockReset()
  mocks.openNativeAppStore.mockReset()
  mocks.getNativeBridgeDiagnostics.mockReset()
})

describe('BuddyScanLanding H034 Native App handoff', () => {
  it('does not fake installed state when the Native capability is unavailable', () => {
    mocks.getNativeBridgeDiagnostics.mockReturnValue({
      capabilities: { openApp: false },
    })

    render(<BuddyScanLanding />)

    expect(screen.getByText('当前环境暂不支持 APP 唤起能力')).toBeTruthy()
    expect(
      screen.getByRole('region', { name: '应用商店 H5 承接边界' }).getAttribute(
        'data-native-installed',
      ),
    ).toBe('unknown')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(mocks.detectInstalledApp).not.toHaveBeenCalled()
  })

  it('shows the open-App dialog only when Native detect reports installed=true', async () => {
    mocks.getNativeBridgeDiagnostics.mockReturnValue({
      capabilities: { openApp: true },
    })
    mocks.detectInstalledApp.mockResolvedValue({
      success: true,
      installed: true,
    })
    mocks.openInstalledApp.mockResolvedValue({
      success: true,
      installed: true,
    })

    render(<BuddyScanLanding />)

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeTruthy()
    })
    expect(
      screen.getByRole('region', { name: '应用商店 H5 承接边界' }).getAttribute(
        'data-native-installed',
      ),
    ).toBe('true')
    expect(mocks.detectInstalledApp).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: '打开 APP' }))

    await waitFor(() => {
      expect(mocks.openInstalledApp).toHaveBeenCalledTimes(1)
    })
  })

  it('hands an uninstalled result to the Native store action instead of an H5 store URL', async () => {
    mocks.getNativeBridgeDiagnostics.mockReturnValue({
      capabilities: { openApp: true },
    })
    mocks.detectInstalledApp.mockResolvedValue({
      success: true,
      installed: false,
    })
    mocks.openNativeAppStore.mockResolvedValue({
      success: true,
      installed: false,
    })

    render(<BuddyScanLanding />)

    await waitFor(() => {
      expect(mocks.openNativeAppStore).toHaveBeenCalledTimes(1)
    })
    expect(
      screen.getByRole('region', { name: '应用商店 H5 承接边界' }).getAttribute(
        'data-native-installed',
      ),
    ).toBe('false')
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('re-detects after returning from the store without reopening the store automatically', async () => {
    mocks.getNativeBridgeDiagnostics.mockReturnValue({
      capabilities: { openApp: true },
    })
    mocks.detectInstalledApp
      .mockResolvedValueOnce({
        success: true,
        installed: false,
      })
      .mockResolvedValueOnce({
        success: true,
        installed: true,
      })
    mocks.openNativeAppStore.mockResolvedValue({
      success: true,
      installed: false,
    })

    render(<BuddyScanLanding />)

    await waitFor(() => {
      expect(mocks.openNativeAppStore).toHaveBeenCalledTimes(1)
    })

    fireEvent(window, new Event('focus'))

    await waitFor(() => {
      expect(mocks.detectInstalledApp).toHaveBeenCalledTimes(2)
      expect(screen.getByRole('dialog')).toBeTruthy()
    })
    expect(mocks.openNativeAppStore).toHaveBeenCalledTimes(1)
    expect(
      screen.getByRole('region', { name: '应用商店 H5 承接边界' }).getAttribute(
        'data-native-installed',
      ),
    ).toBe('true')
  })

  it('does not treat detect success=false as an installed-state answer', async () => {
    mocks.getNativeBridgeDiagnostics.mockReturnValue({
      capabilities: { openApp: true },
    })
    mocks.detectInstalledApp.mockResolvedValue({
      success: false,
      installed: true,
    })

    render(<BuddyScanLanding />)

    await waitFor(() => {
      expect(screen.getByText('无法确认 APP 安装状态，请稍后重试')).toBeTruthy()
    })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(mocks.openNativeAppStore).not.toHaveBeenCalled()
  })
})
