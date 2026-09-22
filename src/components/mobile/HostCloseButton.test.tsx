import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

const bridgeMocks = vi.hoisted(() => ({
  closeWebView: vi.fn(() => Promise.resolve()),
  getNativeBridgeDiagnostics: vi.fn(),
}))

vi.mock('../../services/nativeBridge', () => bridgeMocks)

import HostCloseButton from './HostCloseButton'

afterEach(() => {
  bridgeMocks.closeWebView.mockClear()
  bridgeMocks.getNativeBridgeDiagnostics.mockReset()
})

describe('HostCloseButton', () => {
  it('stays visibly unsupported when the current App build has no closeWebView method', () => {
    bridgeMocks.getNativeBridgeDiagnostics.mockReturnValue({
      capabilities: { closeWebView: false },
    })

    render(<HostCloseButton />)

    const button = screen.getByRole('button', { name: '关闭' }) as HTMLButtonElement
    expect(button.disabled).toBe(true)
    expect(button.dataset.hostCloseSupported).toBe('false')
    expect(button.title).toBe('当前 App 版本暂不支持关闭 WebView')
  })

  it('invokes the shared closeWebView capability when supported', async () => {
    bridgeMocks.getNativeBridgeDiagnostics.mockReturnValue({
      capabilities: { closeWebView: true },
    })

    render(<HostCloseButton />)

    const button = screen.getByRole('button', { name: '关闭' }) as HTMLButtonElement
    expect(button.disabled).toBe(false)
    expect(button.dataset.hostCloseSupported).toBe('true')

    fireEvent.click(button)

    await waitFor(() => {
      expect(bridgeMocks.closeWebView).toHaveBeenCalledTimes(1)
    })
  })
})
