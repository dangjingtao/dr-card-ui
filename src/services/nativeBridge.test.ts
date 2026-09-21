import { afterEach, describe, expect, it, vi } from 'vitest'

type InjectedBridgeProbe = {
  marker?: string
  getLoginToken?: () => unknown
  closeWebView?: () => unknown
  scanCode?: (payload: unknown) => unknown
}

type BridgeProbeWindow = Window & {
  androidBridge?: InjectedBridgeProbe
  iosBridge?: InjectedBridgeProbe
  webkit?: {
    messageHandlers?: Record<string, { postMessage(payload: unknown): void } | undefined>
  }
}

const bridgeWindow = window as BridgeProbeWindow

async function loadBridge(mode: 'disabled' | 'native' = 'native') {
  vi.stubEnv('VITE_BRIDGE_MODE', mode)
  vi.resetModules()
  return import('./nativeBridge')
}

afterEach(() => {
  delete bridgeWindow.androidBridge
  delete bridgeWindow.iosBridge
  delete bridgeWindow.webkit
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('JSBridge capability runtime', () => {
  it('supports late Android bridge injection and parses the confirmed JSON-string token DTO', async () => {
    const { getLoginToken, NativeBridgeError } = await loadBridge()

    await expect(getLoginToken()).rejects.toMatchObject({
      name: 'NativeBridgeError',
      code: 'bridge-unsupported',
      capability: 'getLoginToken',
    } satisfies Partial<InstanceType<typeof NativeBridgeError>>)

    bridgeWindow.androidBridge = {
      getLoginToken() {
        return '{"token":"late-token"}'
      },
    }

    await expect(getLoginToken()).resolves.toEqual({ token: 'late-token' })
  })

  it('uses the confirmed iOS iosBridge.getLoginToken() contract', async () => {
    const { getLoginToken } = await loadBridge()
    const iosBridge = {
      marker: 'ios-host',
      getLoginToken() {
        expect(this).toBe(iosBridge)
        return '{"token":"ios-token"}'
      },
    }
    bridgeWindow.iosBridge = iosBridge

    await expect(getLoginToken()).resolves.toEqual({ token: 'ios-token' })
  })

  it('resolves replacement injected-object instances on later invocations', async () => {
    const { getLoginToken } = await loadBridge()
    const firstBridge = {
      getLoginToken() {
        return '{"token":"first-token"}'
      },
    }
    const secondBridge = {
      getLoginToken() {
        return '{"token":"second-token"}'
      },
    }

    bridgeWindow.androidBridge = firstBridge
    await expect(getLoginToken()).resolves.toEqual({ token: 'first-token' })

    bridgeWindow.androidBridge = secondBridge
    await expect(getLoginToken()).resolves.toEqual({ token: 'second-token' })
  })

  it('preserves receiver binding for Android injected-object methods', async () => {
    const { getLoginToken } = await loadBridge()
    const injectedBridge = {
      marker: 'bound-host',
      getLoginToken() {
        expect(this).toBe(injectedBridge)
        return JSON.stringify({ token: this.marker })
      },
    }

    bridgeWindow.androidBridge = injectedBridge

    await expect(getLoginToken()).resolves.toEqual({ token: 'bound-host' })
  })

  it('rejects malformed JSON and invalid token DTOs instead of passing opaque Native results through', async () => {
    const { getLoginToken } = await loadBridge()

    bridgeWindow.androidBridge = {
      getLoginToken() {
        return '{broken'
      },
    }
    await expect(getLoginToken()).rejects.toMatchObject({
      name: 'NativeBridgeError',
      code: 'invocation-failed',
      capability: 'getLoginToken',
      cause: expect.objectContaining({
        name: 'NativeTransportError',
        code: 'payload-invalid',
      }),
    })

    bridgeWindow.androidBridge = {
      getLoginToken() {
        return '{"token":123}'
      },
    }
    await expect(getLoginToken()).rejects.toMatchObject({
      name: 'NativeBridgeError',
      code: 'invocation-failed',
      capability: 'getLoginToken',
      cause: expect.objectContaining({
        name: 'NativeTransportError',
        code: 'payload-invalid',
      }),
    })

    bridgeWindow.androidBridge = {
      getLoginToken() {
        return { token: 'object-is-not-the-contract' }
      },
    }
    await expect(getLoginToken()).rejects.toMatchObject({
      name: 'NativeBridgeError',
      code: 'invocation-failed',
      capability: 'getLoginToken',
      cause: expect.objectContaining({
        name: 'NativeTransportError',
        code: 'payload-invalid',
      }),
    })
  })

  it('distinguishes a missing method from a missing bridge', async () => {
    const { getLoginToken } = await loadBridge()
    bridgeWindow.androidBridge = {}

    await expect(getLoginToken()).rejects.toMatchObject({
      name: 'NativeBridgeError',
      code: 'capability-unsupported',
      capability: 'getLoginToken',
    })

    delete bridgeWindow.androidBridge
    await expect(getLoginToken()).rejects.toMatchObject({
      name: 'NativeBridgeError',
      code: 'bridge-unsupported',
      capability: 'getLoginToken',
    })
  })

  it('normalizes synchronous Native throws', async () => {
    const { getLoginToken } = await loadBridge()
    const thrown = new Error('native threw')
    bridgeWindow.iosBridge = {
      getLoginToken() {
        throw thrown
      },
    }

    await expect(getLoginToken()).rejects.toMatchObject({
      name: 'NativeBridgeError',
      code: 'invocation-failed',
      capability: 'getLoginToken',
      cause: thrown,
    })
  })

  it('keeps business bridge disabled while allowing Bridge Lab debug invocation in non-prod', async () => {
    const bridge = await loadBridge('disabled')
    bridgeWindow.iosBridge = {
      getLoginToken() {
        return '{"token":"ios-debug-token"}'
      },
    }

    await expect(bridge.getLoginToken()).rejects.toMatchObject({
      name: 'NativeBridgeError',
      code: 'bridge-disabled',
      capability: 'getLoginToken',
    })

    expect(
      bridge.getNativeBridgeCapabilityCatalog().find((item) => item.name === 'getLoginToken'),
    ).toMatchObject({
      platforms: ['android', 'ios'],
      supported: true,
      sensitiveResult: true,
    })

    await expect(
      bridge.invokeRegisteredNativeCapabilityForDebug('getLoginToken'),
    ).resolves.toEqual({ token: 'ios-debug-token' })
  })

  it('derives diagnostics from the confirmed Android and iOS injected objects', async () => {
    const { getNativeBridgeDiagnostics } = await loadBridge()

    bridgeWindow.androidBridge = {
      getLoginToken() {
        return '{"token":"android-token"}'
      },
    }
    expect(getNativeBridgeDiagnostics()).toEqual({
      mode: 'native',
      host: 'android',
      hostVersion: null,
      capabilities: {
        getLoginToken: true,
        closeWebView: false,
        scanCode: false,
      },
    })

    delete bridgeWindow.androidBridge
    bridgeWindow.iosBridge = {
      getLoginToken() {
        return '{"token":"ios-token"}'
      },
    }
    expect(getNativeBridgeDiagnostics()).toEqual({
      mode: 'native',
      host: 'ios',
      hostVersion: null,
      capabilities: {
        getLoginToken: true,
        closeWebView: false,
        scanCode: false,
      },
    })
  })

  it('keeps legacy iOS messageHandlers as host diagnostics without promoting the old auth method', async () => {
    const { getLoginToken, getNativeBridgeDiagnostics } = await loadBridge()
    bridgeWindow.webkit = {
      messageHandlers: {
        getAuthorizationInfo: {
          postMessage() {},
        },
      },
    }

    expect(getNativeBridgeDiagnostics()).toEqual({
      mode: 'native',
      host: 'ios',
      hostVersion: null,
      capabilities: {
        getLoginToken: false,
        closeWebView: false,
        scanCode: false,
      },
    })
    await expect(getLoginToken()).rejects.toMatchObject({
      name: 'NativeBridgeError',
      code: 'bridge-unsupported',
      capability: 'getLoginToken',
    })
  })

  it('keeps disabled mode distinct from a browser without a Native bridge', async () => {
    bridgeWindow.androidBridge = {
      getLoginToken() {
        return '{"token":"must-not-run"}'
      },
    }
    const disabledBridge = await loadBridge('disabled')

    await expect(disabledBridge.getLoginToken()).rejects.toMatchObject({
      name: 'NativeBridgeError',
      code: 'bridge-disabled',
      capability: 'getLoginToken',
    })
    expect(disabledBridge.getNativeBridgeDiagnostics()).toMatchObject({
      mode: 'disabled',
      capabilities: {
        getLoginToken: false,
        closeWebView: false,
        scanCode: false,
      },
    })

    delete bridgeWindow.androidBridge
    const nativeBridge = await loadBridge('native')
    await expect(nativeBridge.getLoginToken()).rejects.toMatchObject({
      name: 'NativeBridgeError',
      code: 'bridge-unsupported',
      capability: 'getLoginToken',
    })
  })

  it('invokes Android closeWebView with the injected object as receiver', async () => {
    const { closeWebView, getNativeBridgeDiagnostics } = await loadBridge()
    let calls = 0
    const androidBridge = {
      marker: 'android-host',
      closeWebView() {
        expect(this).toBe(androidBridge)
        calls += 1
      },
    }
    bridgeWindow.androidBridge = androidBridge

    expect(getNativeBridgeDiagnostics().capabilities.closeWebView).toBe(true)
    await expect(closeWebView()).resolves.toBeUndefined()
    expect(calls).toBe(1)
  })

  it('invokes iOS closeWebView through iosBridge with no arguments', async () => {
    const { closeWebView, getNativeBridgeDiagnostics } = await loadBridge()
    const received: unknown[][] = []
    const iosBridge = {
      closeWebView(...args: unknown[]) {
        expect(this).toBe(iosBridge)
        received.push(args)
      },
    }
    bridgeWindow.iosBridge = iosBridge

    expect(getNativeBridgeDiagnostics().capabilities.closeWebView).toBe(true)
    await expect(closeWebView()).resolves.toBeUndefined()
    expect(received).toEqual([[]])
  })

  it('keeps closeWebView fail-closed when the current host has not implemented the method', async () => {
    const { closeWebView, getNativeBridgeDiagnostics } = await loadBridge()
    bridgeWindow.androidBridge = {
      getLoginToken() {
        return '{"token":"android-token"}'
      },
    }

    expect(getNativeBridgeDiagnostics().capabilities.closeWebView).toBe(false)
    await expect(closeWebView()).rejects.toMatchObject({
      name: 'NativeBridgeError',
      code: 'capability-unsupported',
      capability: 'closeWebView',
    })
  })


  it('serializes Android scanCode input as the confirmed JSON string and parses the code result', async () => {
    const { scanCode, getNativeBridgeDiagnostics } = await loadBridge()
    const received: unknown[] = []
    const androidBridge = {
      scanCode(payload: unknown) {
        expect(this).toBe(androidBridge)
        received.push(payload)
        return '{"code":"QR-ANDROID-001"}'
      },
    }
    bridgeWindow.androidBridge = androidBridge

    expect(getNativeBridgeDiagnostics().capabilities.scanCode).toBe(true)
    await expect(scanCode({ scanType: 'all' })).resolves.toEqual({
      code: 'QR-ANDROID-001',
    })
    expect(received).toEqual(['{"scanType":"all"}'])
  })

  it('supports qr/bar/all scanType values on iOS without changing the field name', async () => {
    const { scanCode } = await loadBridge()
    const received: unknown[] = []
    bridgeWindow.iosBridge = {
      scanCode(payload: unknown) {
        received.push(payload)
        return '{"code":"IOS-CODE"}'
      },
    }

    await expect(scanCode({ scanType: 'qr' })).resolves.toEqual({ code: 'IOS-CODE' })
    await expect(scanCode({ scanType: 'bar' })).resolves.toEqual({ code: 'IOS-CODE' })
    await expect(scanCode({ scanType: 'all' })).resolves.toEqual({ code: 'IOS-CODE' })
    expect(received).toEqual([
      '{"scanType":"qr"}',
      '{"scanType":"bar"}',
      '{"scanType":"all"}',
    ])
  })

  it('keeps scanCode fail-closed for missing method and invalid Native results', async () => {
    const { scanCode } = await loadBridge()

    bridgeWindow.androidBridge = {}
    await expect(scanCode({ scanType: 'all' })).rejects.toMatchObject({
      name: 'NativeBridgeError',
      code: 'capability-unsupported',
      capability: 'scanCode',
    })

    bridgeWindow.androidBridge = {
      scanCode() {
        return '{broken'
      },
    }
    await expect(scanCode({ scanType: 'all' })).rejects.toMatchObject({
      name: 'NativeBridgeError',
      code: 'invocation-failed',
      capability: 'scanCode',
      cause: expect.objectContaining({
        name: 'NativeTransportError',
        code: 'payload-invalid',
      }),
    })

    bridgeWindow.androidBridge = {
      scanCode() {
        return '{"code":123}'
      },
    }
    await expect(scanCode({ scanType: 'all' })).rejects.toMatchObject({
      name: 'NativeBridgeError',
      code: 'invocation-failed',
      capability: 'scanCode',
      cause: expect.objectContaining({
        name: 'NativeTransportError',
        code: 'payload-invalid',
      }),
    })
  })

  it('rejects invalid debug scanType instead of forwarding an invented Native request', async () => {
    const bridge = await loadBridge('disabled')
    const received: unknown[] = []
    bridgeWindow.androidBridge = {
      scanCode(payload: unknown) {
        received.push(payload)
        return '{"code":"should-not-run"}'
      },
    }

    await expect(
      bridge.invokeRegisteredNativeCapabilityForDebug('scanCode', { scanType: 'camera' }),
    ).rejects.toMatchObject({
      name: 'NativeBridgeError',
      code: 'invocation-failed',
      capability: 'scanCode',
      cause: expect.objectContaining({
        name: 'NativeTransportError',
        code: 'payload-invalid',
      }),
    })
    expect(received).toEqual([])
  })
})
