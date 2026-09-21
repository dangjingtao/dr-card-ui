import { afterEach, describe, expect, it, vi } from 'vitest'

type AndroidBridgeProbe = {
  getLoginToken?: () => unknown
}

type BridgeProbeWindow = Window & {
  androidBridge?: AndroidBridgeProbe
  webkit?: {
    messageHandlers?: Record<string, { postMessage(payload: unknown): void } | undefined>
  }
  onToken?: (token: unknown) => unknown
}

const bridgeWindow = window as BridgeProbeWindow

async function loadBridge(mode: 'disabled' | 'native' = 'native') {
  vi.stubEnv('VITE_BRIDGE_MODE', mode)
  vi.resetModules()
  return import('./nativeBridge')
}

afterEach(() => {
  delete bridgeWindow.androidBridge
  delete bridgeWindow.webkit
  delete bridgeWindow.onToken
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('JSBridge capability runtime', () => {
  it('supports late Android bridge injection', async () => {
    const { getLoginToken, NativeBridgeError } = await loadBridge()

    await expect(getLoginToken()).rejects.toMatchObject({
      name: 'NativeBridgeError',
      code: 'bridge-unsupported',
      capability: 'getLoginToken',
    } satisfies Partial<InstanceType<typeof NativeBridgeError>>)

    bridgeWindow.androidBridge = {
      getLoginToken() {
        return 'late-token'
      },
    }

    await expect(getLoginToken()).resolves.toBe('late-token')
  })

  it('resolves a replacement bridge instance for the next invocation', async () => {
    const { getLoginToken } = await loadBridge()
    const firstBridge = {
      getLoginToken() {
        return 'first-token'
      },
    }
    const secondBridge = {
      getLoginToken() {
        return 'second-token'
      },
    }

    bridgeWindow.androidBridge = firstBridge
    await expect(getLoginToken()).resolves.toBe('first-token')

    bridgeWindow.androidBridge = secondBridge
    await expect(getLoginToken()).resolves.toBe('second-token')
  })

  it('preserves receiver binding for confirmed Android methods', async () => {
    const { getLoginToken } = await loadBridge()
    const injectedBridge = {
      marker: 'bound-host',
      getLoginToken() {
        expect(this).toBe(injectedBridge)
        return this.marker
      },
    }

    bridgeWindow.androidBridge = injectedBridge

    await expect(getLoginToken()).resolves.toBe('bound-host')
  })

  it('normalizes a synchronous host return to a Promise', async () => {
    const { getLoginToken } = await loadBridge()
    bridgeWindow.androidBridge = {
      getLoginToken() {
        return { opaque: true }
      },
    }

    const invocation = getLoginToken()

    expect(invocation).toBeInstanceOf(Promise)
    await expect(invocation).resolves.toEqual({ opaque: true })
  })

  it('distinguishes a missing capability from a missing bridge', async () => {
    const { getLoginToken } = await loadBridge()
    bridgeWindow.androidBridge = {}

    await expect(getLoginToken()).rejects.toMatchObject({
      name: 'NativeBridgeError',
      code: 'capability-unsupported',
      capability: 'getLoginToken',
    })
  })

  it('normalizes synchronous throws and async rejections', async () => {
    const { getLoginToken } = await loadBridge()
    const thrown = new Error('native threw')
    bridgeWindow.androidBridge = {
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

    const rejected = new Error('native rejected')
    bridgeWindow.androidBridge = {
      getLoginToken() {
        return Promise.reject(rejected)
      },
    }

    await expect(getLoginToken()).rejects.toMatchObject({
      name: 'NativeBridgeError',
      code: 'invocation-failed',
      capability: 'getLoginToken',
      cause: rejected,
    })
  })

  it('times out an invocation through the shared lifecycle', async () => {
    const { getLoginToken } = await loadBridge()
    bridgeWindow.androidBridge = {
      getLoginToken() {
        return new Promise(() => {})
      },
    }

    await expect(getLoginToken({ timeoutMs: 10 })).rejects.toMatchObject({
      name: 'NativeBridgeError',
      code: 'invocation-timeout',
      capability: 'getLoginToken',
    })
  })

  it('keeps disabled mode distinct from a browser without a Native bridge', async () => {
    bridgeWindow.androidBridge = {
      getLoginToken() {
        return 'must-not-run'
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
        getAuthorizationInfo: false,
        closeWebView: false,
      },
    })

    delete bridgeWindow.androidBridge
    const nativeBridge = await loadBridge('native')

    await expect(nativeBridge.getLoginToken()).rejects.toMatchObject({
      name: 'NativeBridgeError',
      code: 'bridge-unsupported',
      capability: 'getLoginToken',
    })
    expect(nativeBridge.getNativeBridgeDiagnostics()).toEqual({
      mode: 'native',
      host: 'browser',
      hostVersion: null,
      capabilities: {
        getLoginToken: false,
        getAuthorizationInfo: false,
        closeWebView: false,
      },
    })
  })

  it('derives diagnostics from the capability registry without promoting iOS debug evidence', async () => {
    const { getNativeBridgeDiagnostics } = await loadBridge()
    bridgeWindow.androidBridge = {
      getLoginToken() {
        return 'android-token'
      },
    }

    expect(getNativeBridgeDiagnostics()).toEqual({
      mode: 'native',
      host: 'android',
      hostVersion: null,
      capabilities: {
        getLoginToken: true,
        getAuthorizationInfo: false,
        closeWebView: false,
      },
    })

    delete bridgeWindow.androidBridge
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
        getAuthorizationInfo: false,
        closeWebView: false,
      },
    })
  })

  it('uses the confirmed iOS getAuthorizationInfo/onToken protocol and restores the callback', async () => {
    const { getAuthorizationInfo } = await loadBridge()
    const observed: unknown[] = []
    const previousOnToken = (token: unknown) => {
      observed.push(token)
    }
    bridgeWindow.onToken = previousOnToken
    bridgeWindow.webkit = {
      messageHandlers: {
        getAuthorizationInfo: {
          postMessage(payload) {
            expect(payload).toEqual({})
            setTimeout(() => bridgeWindow.onToken?.('ios-token'), 0)
          },
        },
      },
    }

    await expect(getAuthorizationInfo()).resolves.toBe('ios-token')
    expect(observed).toEqual(['ios-token'])
    expect(bridgeWindow.onToken).toBe(previousOnToken)
  })

  it('keeps closeWebView explicitly unsupported until Native confirms a protocol', async () => {
    const { closeWebView } = await loadBridge()
    bridgeWindow.androidBridge = {
      getLoginToken() {
        return 'android-token'
      },
    }

    await expect(closeWebView()).rejects.toMatchObject({
      name: 'NativeBridgeError',
      code: 'capability-unsupported',
      capability: 'closeWebView',
    })
  })
})
