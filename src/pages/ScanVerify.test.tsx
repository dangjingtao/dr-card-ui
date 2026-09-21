import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  scanCode: vi.fn(),
  getNativeBridgeDiagnostics: vi.fn(),
  closeWebView: vi.fn(() => Promise.resolve()),
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useNavigate: () => mocks.navigate,
  }
})

vi.mock('../services/nativeBridge', () => ({
  scanCode: mocks.scanCode,
  getNativeBridgeDiagnostics: mocks.getNativeBridgeDiagnostics,
  closeWebView: mocks.closeWebView,
}))

import ScanVerify from './ScanVerify'

afterEach(() => {
  mocks.navigate.mockReset()
  mocks.scanCode.mockReset()
  mocks.getNativeBridgeDiagnostics.mockReset()
  mocks.closeWebView.mockClear()
})

describe('ScanVerify', () => {
  it('shows explicit unsupported state instead of simulated scan success', () => {
    mocks.getNativeBridgeDiagnostics.mockReturnValue({
      capabilities: {
        scanCode: false,
        closeWebView: false,
      },
    })

    render(<ScanVerify />)

    const button = screen.getByRole('button', {
      name: '当前 App 版本暂不支持扫码',
    }) as HTMLButtonElement
    expect(button.disabled).toBe(true)
    expect(button.dataset.nativeScanSupported).toBe('false')
    expect(screen.getByText('当前 App 版本暂不支持扫码')).toBeTruthy()
    expect(mocks.scanCode).not.toHaveBeenCalled()
  })

  it('calls scanCode(all) and carries the real code into the confirmation route state', async () => {
    mocks.getNativeBridgeDiagnostics.mockReturnValue({
      capabilities: {
        scanCode: true,
        closeWebView: false,
      },
    })
    mocks.scanCode.mockResolvedValue({ code: 'REAL-SCAN-CODE' })

    render(<ScanVerify />)

    fireEvent.click(screen.getByRole('button', { name: '开始扫码核销' }))

    await waitFor(() => {
      expect(mocks.scanCode).toHaveBeenCalledWith({ scanType: 'all' })
    })
    expect(mocks.navigate).toHaveBeenCalledWith('/card/verify/confirm', {
      state: { nativeScanCode: 'REAL-SCAN-CODE' },
    })
  })

  it('keeps a Native failure on the scan page without inventing cancel or permission semantics', async () => {
    mocks.getNativeBridgeDiagnostics.mockReturnValue({
      capabilities: {
        scanCode: true,
        closeWebView: false,
      },
    })
    mocks.scanCode.mockRejectedValue(new Error('native failed'))

    render(<ScanVerify />)

    fireEvent.click(screen.getByRole('button', { name: '开始扫码核销' }))

    await waitFor(() => {
      expect(screen.getByText('扫码失败，请重试')).toBeTruthy()
    })
    expect(mocks.navigate).not.toHaveBeenCalled()
  })
})
