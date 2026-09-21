import { afterEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import BridgeLab from './BridgeLab'

type AndroidLabWindow = Window & {
  androidBridge?: Record<string, unknown>
  iosBridge?: Record<string, unknown>
  webkit?: {
    messageHandlers?: Record<string, { postMessage(payload: unknown): void } | undefined>
  }
  onToken?: (token: unknown) => unknown
  testFunc?: (params: unknown) => string
}

const labWindow = window as AndroidLabWindow

function usePlatform(osType?: 'android' | 'iOS' | 'ios') {
  const suffix = osType ? `?osType=${osType}` : ''
  window.history.replaceState({}, '', `/__debug/bridge-lab${suffix}`)
}

afterEach(() => {
  delete labWindow.androidBridge
  delete labWindow.iosBridge
  delete labWindow.webkit
  delete labWindow.onToken
  delete labWindow.testFunc
  usePlatform()
})

describe('Bridge Lab page', () => {
  it('uses osType to scope registered capabilities and Raw Probe to Android', () => {
    usePlatform('android')
    render(<BridgeLab />)

    expect(screen.getByRole('heading', { name: 'Bridge Lab' })).toBeTruthy()
    expect(document.querySelector('[data-capability-name="getLoginToken"]')).not.toBeNull()
    expect(document.querySelector('[data-capability-name="closeWebView"]')).not.toBeNull()
    expect(document.querySelector('[data-capability-name="scanCode"]')).not.toBeNull()
    expect(document.querySelector('[data-android-raw-probe]')).not.toBeNull()
    expect(document.querySelector('[data-ios-raw-probe]')).toBeNull()
    expect(screen.getByLabelText('input JSON')).toBeTruthy()
  })

  it('keeps bridge-branch Android calls as editable Raw Probe presets', () => {
    usePlatform('android')
    render(<BridgeLab />)

    fireEvent.click(screen.getByRole('button', { name: 'Android preset submitOrder' }))

    expect((screen.getByLabelText('Android object') as HTMLInputElement).value).toBe('androidBridge')
    expect((screen.getByLabelText('Android method') as HTMLInputElement).value).toBe('submitOrder')
    expect((screen.getByLabelText('Android 参数模式') as HTMLSelectElement).value).toBe('string')
    expect((screen.getByLabelText('Android 参数') as HTMLTextAreaElement).value).toBe(
      '{"orderId":1001,"money":99}',
    )
  })

  it('accepts lowercase osType=ios and shows the iOS registered capability and Raw Probe', () => {
    usePlatform('ios')
    render(<BridgeLab />)

    expect(document.querySelector('[data-android-raw-probe]')).toBeNull()
    expect(document.querySelector('[data-ios-raw-probe]')).not.toBeNull()
    expect(document.querySelector('[data-capability-name="getLoginToken"]')).not.toBeNull()
    expect(document.querySelector('[data-capability-name="getAuthorizationInfo"]')).toBeNull()
    expect(document.querySelector('[data-capability-name="closeWebView"]')).not.toBeNull()
    expect(document.querySelector('[data-capability-name="scanCode"]')).not.toBeNull()
    expect(screen.getByLabelText('input JSON')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'iOS preset getAuthorizationInfo' }))
    expect((screen.getByLabelText('iOS message handler') as HTMLInputElement).value).toBe(
      'getAuthorizationInfo',
    )
    expect((screen.getByLabelText('iOS payload 模式') as HTMLSelectElement).value).toBe(
      'empty-object',
    )
    expect((screen.getByLabelText('iOS callback') as HTMLInputElement).value).toBe('onToken')
  })

  it('lets Bridge Lab invoke the confirmed iosBridge.getLoginToken host even when preview business bridge mode is disabled', async () => {
    usePlatform('ios')
    labWindow.iosBridge = {
      getLoginToken() {
        return '{"token":"ios-preview-token"}'
      },
    }

    render(<BridgeLab />)

    const capability = document.querySelector(
      '[data-capability-name="getLoginToken"]',
    ) as HTMLButtonElement
    expect(capability).not.toBeNull()
    fireEvent.click(capability)

    const invokeButton = screen.getByRole('button', { name: '调用 getLoginToken' })
    expect((invokeButton as HTMLButtonElement).disabled).toBe(false)
    fireEvent.click(invokeButton)

    await waitFor(() => {
      expect(screen.getByText('[REDACTED]')).toBeTruthy()
    })
    expect(screen.queryByText('ios-preview-token')).toBeNull()
  })

  it('can run registered scanCode with editable JSON input on Android', async () => {
    usePlatform('android')
    labWindow.androidBridge = {
      scanCode(payload: unknown) {
        expect(payload).toBe('{"scanType":"all"}')
        return '{"code":"bridge-lab-scan"}'
      },
    }

    render(<BridgeLab />)

    fireEvent.click(
      document.querySelector('[data-capability-name="scanCode"]') as HTMLButtonElement,
    )
    fireEvent.change(screen.getByLabelText('input JSON'), {
      target: { value: '{"scanType":"all"}' },
    })
    fireEvent.click(screen.getByRole('button', { name: '调用 scanCode' }))

    await waitFor(() => {
      expect(screen.getByText(/bridge-lab-scan/)).toBeTruthy()
    })
  })

  it('shows neither Native Raw Probe when osType is not selected', () => {
    usePlatform()
    render(<BridgeLab />)

    expect(document.querySelector('[data-android-raw-probe]')).toBeNull()
    expect(document.querySelector('[data-ios-raw-probe]')).toBeNull()
    expect(document.querySelector('[data-web-platform-hint]')).not.toBeNull()
  })

  it('restores the legacy Native-to-H5 testFunc endpoint on Native lab modes', async () => {
    usePlatform('android')
    render(<BridgeLab />)

    expect(document.querySelector('[data-h5-callback-endpoints]')).not.toBeNull()
    expect(typeof labWindow.testFunc).toBe('function')
    expect(labWindow.testFunc?.({ from: 'native', value: 1 })).toBe('h5 处理完成')

    await waitFor(() => {
      expect(screen.getByText('window.testFunc(params)')).toBeTruthy()
      expect(screen.getByText(/"from": "native"/)).toBeTruthy()
    })
  })

  it('redacts a sensitive Android Raw Probe result until explicit reveal', async () => {
    usePlatform('android')
    labWindow.androidBridge = {
      getLoginToken() {
        return 'super-secret-token'
      },
    }

    render(<BridgeLab />)
    fireEvent.click(screen.getByRole('button', { name: 'Android preset getLoginToken' }))
    fireEvent.click(screen.getByRole('button', { name: 'Run Android Probe' }))

    await waitFor(() => {
      expect(screen.getByText('[REDACTED]')).toBeTruthy()
    })
    expect(screen.queryByText('super-secret-token')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: '显式显示原始结果' }))
    expect(screen.getByText('super-secret-token')).toBeTruthy()
  })

  it('shows browser/host absence as an explicit error instead of fake success', async () => {
    usePlatform('android')
    render(<BridgeLab />)
    fireEvent.change(screen.getByLabelText('Android method'), {
      target: { value: 'missingMethod' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Run Android Probe' }))

    await waitFor(() => {
      expect(screen.getByText(/window\.androidBridge is not available/i)).toBeTruthy()
    })
  })
})
