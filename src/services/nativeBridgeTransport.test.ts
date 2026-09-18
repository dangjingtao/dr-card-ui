import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  NativeTransportError,
  createAndroidInjectedObjectTransport,
  createIOSMessageHandlerTransport,
  parseJsonPayload,
  serializeJsonValue,
  type NativeTransportWindow,
} from './nativeBridgeTransport'

const bridgeWindow = window as NativeTransportWindow

afterEach(() => {
  delete bridgeWindow.androidBridge
  delete bridgeWindow.webkit
  vi.useRealTimers()
})

describe('Android injected-object transport', () => {
  it('supports late injection and preserves the host receiver', async () => {
    const transport = createAndroidInjectedObjectTransport<void, unknown>({
      objectName: 'androidBridge',
      methodName: 'getLoginToken',
      serializeArgs: () => [],
    })

    expect(transport.resolve(bridgeWindow, undefined)).toMatchObject({
      supported: false,
      code: 'bridge-unsupported',
    })

    const injectedBridge = {
      marker: 'native-host',
      getLoginToken() {
        expect(this).toBe(injectedBridge)
        return this.marker
      },
    }
    bridgeWindow.androidBridge = injectedBridge

    const resolution = transport.resolve(bridgeWindow, undefined)
    expect(resolution.supported).toBe(true)
    if (!resolution.supported) throw new Error('Expected Android transport to resolve.')

    await expect(Promise.resolve(resolution.invoke())).resolves.toBe('native-host')
  })

  it('normalizes method lookup failure without inventing a host capability', () => {
    bridgeWindow.androidBridge = {}
    const transport = createAndroidInjectedObjectTransport<void, unknown>({
      objectName: 'androidBridge',
      methodName: 'missingMethod',
      serializeArgs: () => [],
    })

    expect(transport.resolve(bridgeWindow, undefined)).toMatchObject({
      supported: false,
      code: 'capability-unsupported',
    })
  })

  it('keeps a synchronous Native throw observable to the capability runtime', () => {
    const nativeFailure = new Error('native exploded')
    bridgeWindow.androidBridge = {
      explode() {
        throw nativeFailure
      },
    }

    const transport = createAndroidInjectedObjectTransport<void, unknown>({
      objectName: 'androidBridge',
      methodName: 'explode',
      serializeArgs: () => [],
    })
    const resolution = transport.resolve(bridgeWindow, undefined)
    if (!resolution.supported) throw new Error('Expected Android transport to resolve.')

    expect(() => resolution.invoke()).toThrow(nativeFailure)
  })

  it('adapts object arguments to JSON strings and parses JSON string results', async () => {
    const received: unknown[] = []
    bridgeWindow.androidBridge = {
      submit(payload: unknown) {
        received.push(payload)
        return '{"accepted":true}'
      },
    }

    const transport = createAndroidInjectedObjectTransport<
      { orderId: number },
      { accepted: boolean }
    >({
      objectName: 'androidBridge',
      methodName: 'submit',
      serializeArgs: (input) => [serializeJsonValue(input)],
      parseResult: parseJsonPayload,
    })
    const resolution = transport.resolve(bridgeWindow, { orderId: 42 })
    if (!resolution.supported) throw new Error('Expected Android transport to resolve.')

    await expect(Promise.resolve(resolution.invoke())).resolves.toEqual({ accepted: true })
    expect(received).toEqual(['{"orderId":42}'])
  })
})

describe('iOS-style messageHandler transport', () => {
  it('posts a correlated request and resolves the matching async callback', async () => {
    const posted: unknown[] = []
    bridgeWindow.webkit = {
      messageHandlers: {
        bridge: {
          postMessage(payload) {
            posted.push(payload)
          },
        },
      },
    }

    let sequence = 0
    const transport = createIOSMessageHandlerTransport<{ value: number }, { value: number }>({
      handlerName: 'bridge',
      correlation: 'request-id',
      requestIdFactory: () => 'req-' + ++sequence,
      serializeRequest: ({ requestId, input }) => ({ requestId, input }),
      parseCallback: (payload) => payload as {
        requestId: string
        ok: true
        payload: unknown
      },
      parseResult: parseJsonPayload,
    })

    const resolution = transport.resolve(bridgeWindow, { value: 7 }, { timeoutMs: 1000 })
    if (!resolution.supported) throw new Error('Expected iOS transport to resolve.')

    const promise = Promise.resolve(resolution.invoke())
    expect(posted).toEqual([{ requestId: 'req-1', input: { value: 7 } }])
    expect(transport.pendingCount()).toBe(1)

    expect(
      transport.handleCallback({
        requestId: 'req-1',
        ok: true,
        payload: '{"value":8}',
      }),
    ).toBe(true)

    await expect(promise).resolves.toEqual({ value: 8 })
    expect(transport.pendingCount()).toBe(0)
    expect(
      transport.handleCallback({
        requestId: 'req-1',
        ok: true,
        payload: '{"value":99}',
      }),
    ).toBe(false)
  })

  it('correlates concurrent callbacks even when Native completes them out of order', async () => {
    const posted: Array<{ requestId: string }> = []
    bridgeWindow.webkit = {
      messageHandlers: {
        bridge: {
          postMessage(payload) {
            posted.push(payload as { requestId: string })
          },
        },
      },
    }

    let sequence = 0
    const transport = createIOSMessageHandlerTransport<number, number>({
      handlerName: 'bridge',
      correlation: 'request-id',
      requestIdFactory: () => 'req-' + ++sequence,
      serializeRequest: ({ requestId, input }) => ({ requestId, input }),
      parseCallback: (payload) => payload as {
        requestId: string
        ok: true
        payload: unknown
      },
      parseResult: (payload) => Number(payload),
    })

    const first = transport.resolve(bridgeWindow, 1)
    const second = transport.resolve(bridgeWindow, 2)
    if (!first.supported || !second.supported) throw new Error('Expected iOS transport to resolve.')

    const firstPromise = Promise.resolve(first.invoke())
    const secondPromise = Promise.resolve(second.invoke())

    expect(posted).toEqual([{ requestId: 'req-1' }, { requestId: 'req-2' }])
    expect(transport.pendingCount()).toBe(2)

    transport.handleCallback({ requestId: 'req-2', ok: true, payload: 20 })
    transport.handleCallback({ requestId: 'req-1', ok: true, payload: 10 })

    await expect(firstPromise).resolves.toBe(10)
    await expect(secondPromise).resolves.toBe(20)
    expect(transport.pendingCount()).toBe(0)
  })

  it('rejects a Native callback failure and cleans the pending request', async () => {
    bridgeWindow.webkit = {
      messageHandlers: {
        bridge: {
          postMessage() {},
        },
      },
    }

    const nativeFailure = { code: 'DENIED' }
    const transport = createIOSMessageHandlerTransport<void, unknown>({
      handlerName: 'bridge',
      correlation: 'request-id',
      requestIdFactory: () => 'req-fail',
      serializeRequest: ({ requestId }) => ({ requestId }),
      parseCallback: (payload) => payload as {
        requestId: string
        ok: false
        error: unknown
      },
    })

    const resolution = transport.resolve(bridgeWindow, undefined)
    if (!resolution.supported) throw new Error('Expected iOS transport to resolve.')
    const promise = Promise.resolve(resolution.invoke())

    const rejection = expect(promise).rejects.toMatchObject({
      name: 'NativeTransportError',
      code: 'callback-failed',
      cause: nativeFailure,
    } satisfies Partial<NativeTransportError>)

    expect(
      transport.handleCallback({
        requestId: 'req-fail',
        ok: false,
        error: nativeFailure,
      }),
    ).toBe(true)

    await rejection
    expect(transport.pendingCount()).toBe(0)
  })

  it('times out and ignores duplicate or late callbacks after cleanup', async () => {
    vi.useFakeTimers()
    bridgeWindow.webkit = {
      messageHandlers: {
        bridge: {
          postMessage() {},
        },
      },
    }

    const transport = createIOSMessageHandlerTransport<void, string>({
      handlerName: 'bridge',
      correlation: 'request-id',
      requestIdFactory: () => 'req-timeout',
      serializeRequest: ({ requestId }) => ({ requestId }),
      parseCallback: (payload) => payload as {
        requestId: string
        ok: true
        payload: unknown
      },
      parseResult: (payload) => String(payload),
    })

    const resolution = transport.resolve(bridgeWindow, undefined, { timeoutMs: 25 })
    if (!resolution.supported) throw new Error('Expected iOS transport to resolve.')
    const promise = Promise.resolve(resolution.invoke())

    expect(transport.pendingCount()).toBe(1)
    const timeoutRejection = expect(promise).rejects.toMatchObject({
      name: 'NativeTransportError',
      code: 'callback-timeout',
    } satisfies Partial<NativeTransportError>)

    await vi.advanceTimersByTimeAsync(25)
    await timeoutRejection
    expect(transport.pendingCount()).toBe(0)

    expect(
      transport.handleCallback({
        requestId: 'req-timeout',
        ok: true,
        payload: 'late',
      }),
    ).toBe(false)
    expect(
      transport.handleCallback({
        requestId: 'req-timeout',
        ok: true,
        payload: 'duplicate',
      }),
    ).toBe(false)
  })

  it('explicitly rejects concurrent use of a single-flight callback protocol', async () => {
    bridgeWindow.webkit = {
      messageHandlers: {
        legacy: {
          postMessage() {},
        },
      },
    }

    const transport = createIOSMessageHandlerTransport<number, number>({
      handlerName: 'legacy',
      correlation: 'single-flight',
      serializeRequest: ({ input }) => input,
      parseCallback: (payload) => payload as {
        ok: true
        payload: unknown
      },
      parseResult: (payload) => Number(payload),
    })

    const first = transport.resolve(bridgeWindow, 1)
    const second = transport.resolve(bridgeWindow, 2)
    if (!first.supported || !second.supported) throw new Error('Expected iOS transport to resolve.')

    const firstPromise = Promise.resolve(first.invoke())
    await expect(Promise.resolve(second.invoke())).rejects.toMatchObject({
      name: 'NativeTransportError',
      code: 'callback-concurrency-unsupported',
    } satisfies Partial<NativeTransportError>)

    expect(transport.handleCallback({ ok: true, payload: 11 })).toBe(true)
    await expect(firstPromise).resolves.toBe(11)
  })

  it('preserves messageHandler receiver binding and reports postMessage throws', async () => {
    const nativeFailure = new Error('postMessage exploded')
    const handler = {
      marker: 'ios-handler',
      postMessage() {
        expect(this).toBe(handler)
        throw nativeFailure
      },
    }
    bridgeWindow.webkit = {
      messageHandlers: {
        bridge: handler,
      },
    }

    const transport = createIOSMessageHandlerTransport<void, unknown>({
      handlerName: 'bridge',
      correlation: 'request-id',
      requestIdFactory: () => 'req-post',
      serializeRequest: ({ requestId }) => ({ requestId }),
      parseCallback: (payload) => payload as {
        requestId: string
        ok: true
        payload: unknown
      },
    })

    const resolution = transport.resolve(bridgeWindow, undefined)
    if (!resolution.supported) throw new Error('Expected iOS transport to resolve.')

    await expect(Promise.resolve(resolution.invoke())).rejects.toMatchObject({
      name: 'NativeTransportError',
      code: 'post-message-failed',
      cause: nativeFailure,
    } satisfies Partial<NativeTransportError>)
    expect(transport.pendingCount()).toBe(0)
  })
})

describe('serializer / parser contract', () => {
  it('can preserve a raw string protocol through a capability serializer', async () => {
    const received: unknown[] = []
    bridgeWindow.androidBridge = {
      echo(payload: unknown) {
        received.push(payload)
        return payload
      },
    }

    const transport = createAndroidInjectedObjectTransport<string, string>({
      objectName: 'androidBridge',
      methodName: 'echo',
      serializeArgs: (input) => [input],
      parseResult: (payload) => String(payload),
    })
    const resolution = transport.resolve(bridgeWindow, 'raw-token')
    if (!resolution.supported) throw new Error('Expected Android transport to resolve.')

    await expect(Promise.resolve(resolution.invoke())).resolves.toBe('raw-token')
    expect(received).toEqual(['raw-token'])
  })

  it('serializes object payloads as JSON strings', () => {
    expect(serializeJsonValue({ hello: 'world' })).toBe('{"hello":"world"}')
  })

  it('accepts object results directly and parses JSON string results', () => {
    expect(parseJsonPayload<{ ok: boolean }>({ ok: true })).toEqual({ ok: true })
    expect(parseJsonPayload<{ ok: boolean }>('{"ok":true}')).toEqual({ ok: true })
  })

  it('turns malformed JSON results into a stable transport error', () => {
    expect(() => parseJsonPayload('{broken')).toThrowError(
      expect.objectContaining({
        name: 'NativeTransportError',
        code: 'payload-invalid',
      }),
    )
  })
})
