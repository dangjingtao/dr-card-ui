import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  createCallbackInjectedObjectTransport,
  type NativeTransportResolution,
  type NativeTransportWindow,
} from './nativeBridgeTransport'

type CallbackRequest = {
  value: string
  callbackId: string
}

const hostWindow = window as NativeTransportWindow

function createProbeTransport(methodName: string, timeoutMs = 1_000) {
  return createCallbackInjectedObjectTransport<string, string>({
    objectName: 'androidBridge',
    methodName,
    callbackName: 'nativeBridgeCallback',
    callbackAliases: ['androidBridgeCallback'],
    timeoutMs,
    serializeArgs: (value, callbackId) => [JSON.stringify({ value, callbackId })],
    parseResult: (payload) => {
      if (!payload || typeof payload !== 'object' || typeof (payload as { value?: unknown }).value !== 'string') {
        throw new TypeError('probe payload requires a string value')
      }
      return (payload as { value: string }).value
    },
  })
}

function invoke(
  resolution: NativeTransportResolution<string>,
): Promise<string> {
  if (!resolution.supported) {
    throw new Error(`expected supported transport, got ${resolution.code}`)
  }
  return Promise.resolve(resolution.invoke())
}

afterEach(() => {
  delete hostWindow.androidBridge
  delete hostWindow.nativeBridgeCallback
  delete hostWindow.androidBridgeCallback
  delete hostWindow.iosBridge
  vi.useRealTimers()
})

describe('Android injected callback dispatcher', () => {
  it('keeps same-capability concurrent requests independently correlated', async () => {
    const requests: CallbackRequest[] = []
    hostWindow.androidBridge = {
      scanCode(payload: unknown) {
        requests.push(JSON.parse(payload as string) as CallbackRequest)
      },
    }
    const transport = createProbeTransport('scanCode')

    const first = invoke(transport.resolve(hostWindow, 'first'))
    const second = invoke(transport.resolve(hostWindow, 'second'))

    expect(requests).toHaveLength(2)
    expect(requests[0].callbackId).not.toBe(requests[1].callbackId)

    hostWindow.nativeBridgeCallback?.(requests[0].callbackId, { value: 'first-result' })
    hostWindow.nativeBridgeCallback?.(requests[1].callbackId, { value: 'second-result' })

    await expect(first).resolves.toBe('first-result')
    await expect(second).resolves.toBe('second-result')
  })

  it('shares one callback channel across different capabilities', async () => {
    const scanRequests: CallbackRequest[] = []
    const adRequests: CallbackRequest[] = []
    hostWindow.androidBridge = {
      scanCode(payload: unknown) {
        scanRequests.push(JSON.parse(payload as string) as CallbackRequest)
      },
      showRewardAd(payload: unknown) {
        adRequests.push(JSON.parse(payload as string) as CallbackRequest)
      },
    }

    const scanTransport = createProbeTransport('scanCode')
    const adTransport = createProbeTransport('showRewardAd')
    const scan = invoke(scanTransport.resolve(hostWindow, 'scan'))
    const ad = invoke(adTransport.resolve(hostWindow, 'ad'))

    hostWindow.androidBridgeCallback?.(adRequests[0].callbackId, { value: 'ad-result' })
    hostWindow.androidBridgeCallback?.(scanRequests[0].callbackId, { value: 'scan-result' })

    await expect(scan).resolves.toBe('scan-result')
    await expect(ad).resolves.toBe('ad-result')
  })

  it('resolves out-of-order callbacks by callbackId instead of invocation order', async () => {
    const requests: CallbackRequest[] = []
    hostWindow.androidBridge = {
      scanCode(payload: unknown) {
        requests.push(JSON.parse(payload as string) as CallbackRequest)
      },
    }
    const transport = createProbeTransport('scanCode')

    const first = invoke(transport.resolve(hostWindow, 'one'))
    const second = invoke(transport.resolve(hostWindow, 'two'))
    const third = invoke(transport.resolve(hostWindow, 'three'))

    hostWindow.androidBridgeCallback?.(requests[2].callbackId, { value: 'three-result' })
    hostWindow.androidBridgeCallback?.(requests[0].callbackId, { value: 'one-result' })
    hostWindow.androidBridgeCallback?.(requests[1].callbackId, { value: 'two-result' })

    await expect(Promise.all([first, second, third])).resolves.toEqual([
      'one-result',
      'two-result',
      'three-result',
    ])
  })

  it('uses the same callbackId correlation model for iOS injected-object methods', async () => {
    const requests: CallbackRequest[] = []
    hostWindow.iosBridge = {
      scanCode(payload: unknown) {
        const request = JSON.parse(payload as string) as CallbackRequest
        requests.push(request)
        queueMicrotask(() => {
          hostWindow.nativeBridgeCallback?.(request.callbackId, { value: 'ios-result' })
        })
      },
    }
    const transport = createCallbackInjectedObjectTransport<string, string>({
      objectName: 'iosBridge',
      methodName: 'scanCode',
      callbackName: 'nativeBridgeCallback',
      serializeArgs: (value, callbackId) => [JSON.stringify({ value, callbackId })],
      parseResult: (payload) => (payload as { value: string }).value,
    })

    const resolution = transport.resolve(hostWindow, 'ios')
    if (!resolution.supported) throw new Error('Expected iOS callback transport to resolve.')

    await expect(Promise.resolve(resolution.invoke())).resolves.toBe('ios-result')
    expect(requests).toEqual([
      { value: 'ios', callbackId: expect.any(String) },
    ])
  })

  it('removes timed-out requests so stale callbacks cannot settle a newer invocation', async () => {
    vi.useFakeTimers()

    const fallback = vi.fn()
    hostWindow.androidBridgeCallback = fallback
    const requests: CallbackRequest[] = []
    hostWindow.androidBridge = {
      scanCode(payload: unknown) {
        requests.push(JSON.parse(payload as string) as CallbackRequest)
      },
    }
    const transport = createProbeTransport('scanCode', 25)

    const first = invoke(transport.resolve(hostWindow, 'first'))
    const firstResult = expect(first).rejects.toMatchObject({ code: 'callback-timeout' })
    await vi.advanceTimersByTimeAsync(25)
    await firstResult

    const firstId = requests[0].callbackId
    const second = invoke(transport.resolve(hostWindow, 'second'))
    const secondId = requests[1].callbackId

    hostWindow.androidBridgeCallback?.(firstId, { value: 'stale-result' })
    expect(fallback).toHaveBeenCalledWith(firstId, { value: 'stale-result' })

    hostWindow.androidBridgeCallback?.(secondId, { value: 'second-result' })
    await expect(second).resolves.toBe('second-result')
  })
})
