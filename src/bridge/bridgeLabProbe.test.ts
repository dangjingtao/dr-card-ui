import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  BridgeLabProbeError,
  redactBridgeValue,
  resetIOSRawProbeChannel,
  runAndroidRawProbe,
  runIOSRawProbe,
} from './bridgeLabProbe'

type LabWindow = Window & Record<string, unknown> & {
  webkit?: {
    messageHandlers?: Record<string, { postMessage(payload: unknown): void } | undefined>
  }
}

const labWindow = window as unknown as LabWindow

afterEach(() => {
  try {
    resetIOSRawProbeChannel('labCallback')
  } catch {
    // Individual tests await their probe; this is only a best-effort test isolation fallback.
  }
  delete labWindow.androidBridge
  delete labWindow.webkit
  delete labWindow.labCallback
  vi.useRealTimers()
})

describe('Bridge Lab Android Raw Probe', () => {
  it('resolves the live injected object, preserves receiver, and supports JSON args', async () => {
    const calls: unknown[] = []
    const bridge = {
      marker: 'host',
      submit(payload: unknown, count: unknown) {
        expect(this).toBe(bridge)
        calls.push(payload, count)
        return { token: 'secret-token', ok: true }
      },
    }
    labWindow.androidBridge = bridge

    await expect(
      runAndroidRawProbe({
        objectName: 'androidBridge',
        methodName: 'submit',
        argumentMode: 'json-args',
        argumentText: '[{"orderId":1},2]',
      }),
    ).resolves.toEqual({ token: 'secret-token', ok: true })
    expect(calls).toEqual([{ orderId: 1 }, 2])
  })

  it('reports a missing browser host instead of faking success', async () => {
    await expect(
      runAndroidRawProbe({
        objectName: 'androidBridge',
        methodName: 'missing',
        argumentMode: 'none',
        argumentText: '',
      }),
    ).rejects.toMatchObject({
      name: 'BridgeLabProbeError',
      code: 'bridge-unavailable',
    } satisfies Partial<BridgeLabProbeError>)
  })
})

describe('Bridge Lab iOS Raw Probe', () => {
  it('posts through a dynamic message handler and resolves a temporary global callback', async () => {
    const posted: unknown[] = []
    labWindow.webkit = {
      messageHandlers: {
        demoHandler: {
          postMessage(payload) {
            posted.push(payload)
          },
        },
      },
    }

    const invocation = runIOSRawProbe({
      handlerName: 'demoHandler',
      payloadMode: 'json',
      payloadText: '{"hello":"world"}',
      receiveMode: 'global-callback',
      callbackName: 'labCallback',
      timeoutMs: 1000,
    })

    expect(posted).toEqual([{ hello: 'world' }])
    expect(typeof labWindow.labCallback).toBe('function')

    ;(labWindow.labCallback as (...args: unknown[]) => unknown)('native-result')

    await expect(invocation).resolves.toBe('native-result')
    expect(labWindow.labCallback).toBeUndefined()
  })

  it('times out and cleans the temporary callback', async () => {
    vi.useFakeTimers()
    labWindow.webkit = {
      messageHandlers: {
        demoHandler: {
          postMessage() {},
        },
      },
    }

    const invocation = runIOSRawProbe({
      handlerName: 'demoHandler',
      payloadMode: 'empty-object',
      payloadText: '',
      receiveMode: 'global-callback',
      callbackName: 'labCallback',
      timeoutMs: 25,
    })
    const rejection = expect(invocation).rejects.toMatchObject({
      name: 'NativeTransportError',
      code: 'callback-timeout',
    })

    await vi.advanceTimersByTimeAsync(25)
    await rejection
    expect(labWindow.labCallback).toBeUndefined()
  })

  it('keeps a timed-out single-flight channel poisoned until explicit host recovery reset', async () => {
    vi.useFakeTimers()
    const posted: unknown[] = []
    labWindow.webkit = {
      messageHandlers: {
        demoHandler: {
          postMessage(payload) {
            posted.push(payload)
          },
        },
      },
    }

    const first = runIOSRawProbe({
      handlerName: 'demoHandler',
      payloadMode: 'json',
      payloadText: '{"attempt":1}',
      receiveMode: 'global-callback',
      callbackName: 'labCallback',
      timeoutMs: 25,
    })
    const firstRejection = expect(first).rejects.toMatchObject({
      name: 'NativeTransportError',
      code: 'callback-timeout',
    })
    await vi.advanceTimersByTimeAsync(25)
    await firstRejection

    await expect(
      runIOSRawProbe({
        handlerName: 'demoHandler',
        payloadMode: 'json',
        payloadText: '{"attempt":2}',
        receiveMode: 'global-callback',
        callbackName: 'labCallback',
        timeoutMs: 25,
      }),
    ).rejects.toMatchObject({
      name: 'NativeTransportError',
      code: 'callback-channel-unsafe',
    })
    expect(posted).toEqual([{ attempt: 1 }])

    expect(resetIOSRawProbeChannel('labCallback')).toBe(true)

    const recovered = runIOSRawProbe({
      handlerName: 'demoHandler',
      payloadMode: 'json',
      payloadText: '{"attempt":3}',
      receiveMode: 'global-callback',
      callbackName: 'labCallback',
      timeoutMs: 25,
    })
    expect(posted).toEqual([{ attempt: 1 }, { attempt: 3 }])
    ;(labWindow.labCallback as (...args: unknown[]) => unknown)('recovered')
    await expect(recovered).resolves.toBe('recovered')
  })

  it('can reset a poisoned callback channel after the operator changes the handler field', async () => {
    vi.useFakeTimers()
    labWindow.webkit = {
      messageHandlers: {
        firstHandler: {
          postMessage() {},
        },
        secondHandler: {
          postMessage() {},
        },
      },
    }

    const timedOut = runIOSRawProbe({
      handlerName: 'firstHandler',
      payloadMode: 'empty-object',
      payloadText: '',
      receiveMode: 'global-callback',
      callbackName: 'labCallback',
      timeoutMs: 25,
    })
    const timeoutRejection = expect(timedOut).rejects.toMatchObject({
      name: 'NativeTransportError',
      code: 'callback-timeout',
    })
    await vi.advanceTimersByTimeAsync(25)
    await timeoutRejection

    await expect(
      runIOSRawProbe({
        handlerName: 'secondHandler',
        payloadMode: 'empty-object',
        payloadText: '',
        receiveMode: 'global-callback',
        callbackName: 'labCallback',
        timeoutMs: 25,
      }),
    ).rejects.toMatchObject({
      name: 'BridgeLabProbeError',
      code: 'callback-conflict',
    })

    expect(resetIOSRawProbeChannel('labCallback')).toEqual({
      reset: true,
      handlerName: 'firstHandler',
    })

    const recovered = runIOSRawProbe({
      handlerName: 'secondHandler',
      payloadMode: 'empty-object',
      payloadText: '',
      receiveMode: 'global-callback',
      callbackName: 'labCallback',
      timeoutMs: 25,
    })
    ;(labWindow.labCallback as (...args: unknown[]) => unknown)('second-handler-result')
    await expect(recovered).resolves.toBe('second-handler-result')
  })

  it('refuses to overwrite an existing callback', async () => {
    labWindow.webkit = {
      messageHandlers: {
        demoHandler: {
          postMessage() {},
        },
      },
    }
    labWindow.labCallback = () => 'owned-by-host'

    await expect(
      runIOSRawProbe({
        handlerName: 'demoHandler',
        payloadMode: 'empty-object',
        payloadText: '',
        receiveMode: 'global-callback',
        callbackName: 'labCallback',
        timeoutMs: 100,
      }),
    ).rejects.toMatchObject({
      name: 'BridgeLabProbeError',
      code: 'callback-conflict',
    } satisfies Partial<BridgeLabProbeError>)
  })
})

describe('Bridge Lab redaction', () => {
  it('redacts sensitive keys recursively and can fully mask a sensitive capability result', () => {
    expect(
      redactBridgeValue({
        ok: true,
        nested: {
          authorization: 'Bearer abc',
          cookie: 'sid=123',
        },
      }),
    ).toEqual({
      value: {
        ok: true,
        nested: {
          authorization: '[REDACTED]',
          cookie: '[REDACTED]',
        },
      },
      redacted: true,
    })

    expect(redactBridgeValue('opaque-token', true)).toEqual({
      value: '[REDACTED]',
      redacted: true,
    })
  })
})
