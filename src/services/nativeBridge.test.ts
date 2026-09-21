import { afterEach, describe, expect, it, vi } from 'vitest'

type InjectedBridgeProbe = {
  marker?: string
  getLoginToken?: () => unknown
  closeWebView?: () => unknown
  scanCode?: (payload: unknown) => unknown
  takePhoto?: (payload: unknown) => unknown
  chooseImage?: (payload: unknown) => unknown
  saveImageToAlbum?: (payload: unknown) => unknown
  copyText?: (payload: unknown) => unknown
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
        takePhoto: false,
        chooseImage: false,
        saveImageToAlbum: false,
        copyText: false,
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
        takePhoto: false,
        chooseImage: false,
        saveImageToAlbum: false,
        copyText: false,
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
        takePhoto: false,
        chooseImage: false,
        saveImageToAlbum: false,
        copyText: false,
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
        takePhoto: false,
        chooseImage: false,
        saveImageToAlbum: false,
        copyText: false,
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


  it('serializes takePhoto and chooseImage as one JSON string and parses image payloads', async () => {
    const { takePhoto, chooseImage } = await loadBridge()
    const received: Array<{ method: string; payload: unknown }> = []
    bridgeWindow.androidBridge = {
      takePhoto(payload: unknown) {
        received.push({ method: 'takePhoto', payload })
        return '{"mimeType":"image/jpeg","imageBase64":"photo-base64"}'
      },
      chooseImage(payload: unknown) {
        received.push({ method: 'chooseImage', payload })
        return '{"mimeType":"image/png","imageBase64":"album-base64"}'
      },
    }

    await expect(takePhoto()).resolves.toEqual({
      mimeType: 'image/jpeg',
      imageBase64: 'photo-base64',
    })
    await expect(chooseImage()).resolves.toEqual({
      mimeType: 'image/png',
      imageBase64: 'album-base64',
    })

    expect(received).toEqual([
      {
        method: 'takePhoto',
        payload: '{"crop":true,"maxWidth":1080,"maxHeight":1080,"quality":0.8}',
      },
      {
        method: 'chooseImage',
        payload:
          '{"crop":true,"maxWidth":1080,"maxHeight":1080,"quality":0.8,"count":1}',
      },
    ])
  })

  it('supports iOS saveImageToAlbum and copyText with confirmed field names', async () => {
    const { saveImageToAlbum, copyText } = await loadBridge()
    const received: Array<{ method: string; payload: unknown }> = []
    bridgeWindow.iosBridge = {
      saveImageToAlbum(payload: unknown) {
        received.push({ method: 'saveImageToAlbum', payload })
        return '{"success":true}'
      },
      copyText(payload: unknown) {
        received.push({ method: 'copyText', payload })
        return '{"success":true}'
      },
    }

    await expect(
      saveImageToAlbum({
        imageType: 'base64',
        imageData: 'poster-base64',
        fileName: 'kaboshi-invite.png',
      }),
    ).resolves.toEqual({ success: true })
    await expect(copyText({ text: 'https://example.com/invite' })).resolves.toEqual({
      success: true,
    })

    expect(received).toEqual([
      {
        method: 'saveImageToAlbum',
        payload:
          '{"imageType":"base64","imageData":"poster-base64","fileName":"kaboshi-invite.png"}',
      },
      {
        method: 'copyText',
        payload: '{"text":"https://example.com/invite"}',
      },
    ])
  })

  it('keeps H032 capabilities fail-closed for missing methods and malformed results', async () => {
    const { takePhoto, chooseImage, saveImageToAlbum, copyText } = await loadBridge()
    bridgeWindow.androidBridge = {}

    for (const invocation of [
      () => takePhoto(),
      () => chooseImage(),
      () =>
        saveImageToAlbum({
          imageType: 'base64',
          imageData: 'poster',
          fileName: 'kaboshi-invite.png',
        }),
      () => copyText({ text: 'invite' }),
    ]) {
      await expect(invocation()).rejects.toMatchObject({
        name: 'NativeBridgeError',
        code: 'capability-unsupported',
      })
    }

    bridgeWindow.androidBridge = {
      takePhoto() {
        return '{"mimeType":"image/jpeg","imageBase64":123}'
      },
      saveImageToAlbum() {
        return '{"success":"yes"}'
      },
    }

    await expect(takePhoto()).rejects.toMatchObject({
      name: 'NativeBridgeError',
      code: 'invocation-failed',
      capability: 'takePhoto',
      cause: expect.objectContaining({ code: 'payload-invalid' }),
    })
    await expect(
      saveImageToAlbum({
        imageType: 'base64',
        imageData: 'poster',
        fileName: 'kaboshi-invite.png',
      }),
    ).rejects.toMatchObject({
      name: 'NativeBridgeError',
      code: 'invocation-failed',
      capability: 'saveImageToAlbum',
      cause: expect.objectContaining({ code: 'payload-invalid' }),
    })
  })

  it('marks photo results sensitive but keeps boolean utility results visible in Bridge Lab catalog', async () => {
    const bridge = await loadBridge('disabled')
    bridgeWindow.androidBridge = {
      takePhoto() {
        return '{"mimeType":"image/jpeg","imageBase64":"secret-image"}'
      },
      chooseImage() {
        return '{"mimeType":"image/jpeg","imageBase64":"secret-image"}'
      },
      saveImageToAlbum() {
        return '{"success":true}'
      },
      copyText() {
        return '{"success":true}'
      },
    }

    const catalog = bridge.getNativeBridgeCapabilityCatalog()
    expect(catalog.find((item) => item.name === 'takePhoto')).toMatchObject({
      supported: true,
      sensitiveResult: true,
    })
    expect(catalog.find((item) => item.name === 'chooseImage')).toMatchObject({
      supported: true,
      sensitiveResult: true,
    })
    expect(catalog.find((item) => item.name === 'saveImageToAlbum')).toMatchObject({
      supported: true,
      sensitiveResult: false,
    })
    expect(catalog.find((item) => item.name === 'copyText')).toMatchObject({
      supported: true,
      sensitiveResult: false,
    })
  })
})
