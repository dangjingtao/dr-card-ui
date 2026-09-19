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

  it('passes object arguments through when a confirmed host protocol accepts objects', async () => {
    const received: unknown[] = []
    bridgeWindow.androidBridge = {
      acceptObject(payload: unknown) {
        received.push(payload)
        return { accepted: true }
      },
    }

    const transport = createAndroidInjectedObjectTransport<
      { orderId: number },
      { accepted: boolean }
    >({
      objectName: 'androidBridge',
      methodName: 'acceptObject',
      serializeArgs: (input) => [input],
      parseResult: (payload) => payload as { accepted: boolean },
    })
    const input = { orderId: 9 }
    const resolution = transport.resolve(bridgeWindow, input)
    if (!resolution.supported) throw new Error('Expected Android transport to resolve.')

    await expect(Promise.resolve(resolution.invoke())).resolves.toEqual({ accepted: true })
    expect(received).toEqual([input])
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

    const transport = createIOSMessageHandlerTransport<{ value: number }, { value: number }>({
      handlerName: 'bridge',
      correlation: 'request-id',
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
    expect(posted).toHaveLength(1)
    const requestId = (posted[0] as { requestId: string; input: { value: number } }).requestId
    expect(posted[0]).toEqual({ requestId, input: { value: 7 } })
    expect(transport.pendingCount()).toBe(1)

    expect(
      transport.handleCallback({
        requestId,
        ok: true,
        payload: '{"value":8}',
      }),
    ).toBe(true)

    await expect(promise).resolves.toEqual({ value: 8 })
    expect(transport.pendingCount()).toBe(0)
    expect(
      transport.handleCallback({
        requestId,
        ok: true,
        payload: '{"value":99}',
      }),
    ).toBe(false)
  })

  it('correlates concurrent callbacks even when Native completes them out of order', async () => {
    const posted: Array<{ requestId: string; input: number }> = []
    bridgeWindow.webkit = {
      messageHandlers: {
        bridge: {
          postMessage(payload) {
            posted.push(payload as { requestId: string; input: number })
          },
        },
      },
    }

    const transport = createIOSMessageHandlerTransport<number, number>({
      handlerName: 'bridge',
      correlation: 'request-id',
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

    expect(posted).toHaveLength(2)
    const firstRequestId = posted[0].requestId
    const secondRequestId = posted[1].requestId
    expect(firstRequestId).not.toBe(secondRequestId)
    expect(posted).toEqual([
      { requestId: firstRequestId, input: 1 },
      { requestId: secondRequestId, input: 2 },
    ])
    expect(transport.pendingCount()).toBe(2)

    transport.handleCallback({ requestId: secondRequestId, ok: true, payload: 20 })
    transport.handleCallback({ requestId: firstRequestId, ok: true, payload: 10 })

    await expect(firstPromise).resolves.toBe(10)
    await expect(secondPromise).resolves.toBe(20)
    expect(transport.pendingCount()).toBe(0)
  })

  it('never reuses a runtime-owned request id after timeout, so stale callbacks stay isolated', async () => {
    vi.useFakeTimers()
    const posted: Array<{ requestId: string; input: number }> = []
    bridgeWindow.webkit = {
      messageHandlers: {
        bridge: {
          postMessage(payload) {
            posted.push(payload as { requestId: string; input: number })
          },
        },
      },
    }

    const transport = createIOSMessageHandlerTransport<number, number>({
      handlerName: 'bridge',
      correlation: 'request-id',
      serializeRequest: ({ requestId, input }) => ({ requestId, input }),
      parseCallback: (payload) => payload as {
        requestId: string
        ok: true
        payload: unknown
      },
      parseResult: (payload) => Number(payload),
    })

    const first = transport.resolve(bridgeWindow, 1, { timeoutMs: 25 })
    if (!first.supported) throw new Error('Expected iOS transport to resolve.')
    const firstPromise = Promise.resolve(first.invoke())
    const firstRequestId = posted[0].requestId

    const firstTimeout = expect(firstPromise).rejects.toMatchObject({
      name: 'NativeTransportError',
      code: 'callback-timeout',
    } satisfies Partial<NativeTransportError>)
    await vi.advanceTimersByTimeAsync(25)
    await firstTimeout

    const second = transport.resolve(bridgeWindow, 2, { timeoutMs: 25 })
    if (!second.supported) throw new Error('Expected iOS transport to resolve.')
    const secondPromise = Promise.resolve(second.invoke())
    const secondRequestId = posted[1].requestId

    expect(secondRequestId).not.toBe(firstRequestId)
    expect(
      transport.handleCallback({
        requestId: firstRequestId,
        ok: true,
        payload: 10,
      }),
    ).toBe(false)
    expect(
      transport.handleCallback({
        requestId: secondRequestId,
        ok: true,
        payload: 20,
      }),
    ).toBe(true)

    await expect(secondPromise).resolves.toBe(20)
    expect(transport.pendingCount()).toBe(0)
  })

  it('rejects a Native callback failure and cleans the pending request', async () => {
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

    const nativeFailure = { code: 'DENIED' }
    const transport = createIOSMessageHandlerTransport<void, unknown>({
      handlerName: 'bridge',
      correlation: 'request-id',
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
    const requestId = (posted[0] as { requestId: string }).requestId

    const rejection = expect(promise).rejects.toMatchObject({
      name: 'NativeTransportError',
      code: 'callback-failed',
      cause: nativeFailure,
    } satisfies Partial<NativeTransportError>)

    expect(
      transport.handleCallback({
        requestId,
        ok: false,
        error: nativeFailure,
      }),
    ).toBe(true)

    await rejection
    expect(transport.pendingCount()).toBe(0)
  })

  it('times out and ignores duplicate or late callbacks after cleanup', async () => {
    vi.useFakeTimers()
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

    const transport = createIOSMessageHandlerTransport<void, string>({
      handlerName: 'bridge',
      correlation: 'request-id',
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
    const requestId = (posted[0] as { requestId: string }).requestId

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
        requestId,
        ok: true,
        payload: 'late',
      }),
    ).toBe(false)
    expect(
      transport.handleCallback({
        requestId,
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
      callbackCardinality: 'at-most-one',
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

  it('poisons a timed-out single-flight channel so a late callback cannot settle the next request', async () => {
    vi.useFakeTimers()
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
      callbackCardinality: 'at-most-one',
      serializeRequest: ({ input }) => input,
      parseCallback: (payload) => payload as {
        ok: true
        payload: unknown
      },
      parseResult: (payload) => Number(payload),
    })

    const first = transport.resolve(bridgeWindow, 1, { timeoutMs: 25 })
    if (!first.supported) throw new Error('Expected iOS transport to resolve.')
    const firstPromise = Promise.resolve(first.invoke())
    const timeoutRejection = expect(firstPromise).rejects.toMatchObject({
      name: 'NativeTransportError',
      code: 'callback-timeout',
    } satisfies Partial<NativeTransportError>)

    await vi.advanceTimersByTimeAsync(25)
    await timeoutRejection
    expect(transport.pendingCount()).toBe(0)

    const second = transport.resolve(bridgeWindow, 2)
    if (!second.supported) throw new Error('Expected iOS transport to resolve.')
    await expect(Promise.resolve(second.invoke())).rejects.toMatchObject({
      name: 'NativeTransportError',
      code: 'callback-channel-unsafe',
    } satisfies Partial<NativeTransportError>)

    expect(transport.handleCallback({ ok: true, payload: 10 })).toBe(false)

    transport.resetSingleFlightAfterHostRecovery()
    const recovered = transport.resolve(bridgeWindow, 3)
    if (!recovered.supported) throw new Error('Expected recovered iOS transport to resolve.')
    const recoveredPromise = Promise.resolve(recovered.invoke())

    expect(transport.handleCallback({ ok: true, payload: 30 })).toBe(true)
    await expect(recoveredPromise).resolves.toBe(30)
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
