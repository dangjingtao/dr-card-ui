import { runtimePolicy } from '../app/config/runtime'
import {
  createIOSMessageHandlerTransport,
  type NativeTransportWindow,
} from '../services/nativeBridgeTransport'

export type AndroidArgumentMode = 'none' | 'string' | 'json-value' | 'json-args'
export type IOSPayloadMode = 'empty-object' | 'string' | 'json'
export type IOSReceiveMode = 'none' | 'global-callback'

export type BridgeLabProbeErrorCode =
  | 'lab-disabled'
  | 'invalid-name'
  | 'bridge-unavailable'
  | 'method-unavailable'
  | 'handler-unavailable'
  | 'invalid-payload'
  | 'callback-conflict'
  | 'invocation-failed'

export class BridgeLabProbeError extends Error {
  readonly name = 'BridgeLabProbeError'

  constructor(
    readonly code: BridgeLabProbeErrorCode,
    message: string,
    readonly cause?: unknown,
  ) {
    super(message)
  }
}

export interface AndroidRawProbeRequest {
  objectName: string
  methodName: string
  argumentMode: AndroidArgumentMode
  argumentText: string
}

export interface IOSRawProbeRequest {
  handlerName: string
  payloadMode: IOSPayloadMode
  payloadText: string
  receiveMode: IOSReceiveMode
  callbackName?: string
  timeoutMs: number
}

const SAFE_PROPERTY_NAME = /^[A-Za-z_$][A-Za-z0-9_$]*$/
const BLOCKED_PROPERTY_NAMES = new Set(['__proto__', 'prototype', 'constructor'])
const SENSITIVE_NAME = /(token|authorization|cookie|password|secret|session|credential)/i

type ProbeWindow = NativeTransportWindow & Record<string, unknown>

function ensureBridgeLabEnabled(): void {
  if (runtimePolicy.bridgeLabEnabled) return
  throw new BridgeLabProbeError(
    'lab-disabled',
    'Bridge Lab raw probes are available only in dev/test runtime.',
  )
}

function getProbeWindow(): ProbeWindow {
  if (typeof window === 'undefined') {
    throw new BridgeLabProbeError('bridge-unavailable', 'window is not available in this runtime.')
  }
  return window as ProbeWindow
}

function assertPropertyName(value: string, label: string): string {
  const name = value.trim()
  if (!SAFE_PROPERTY_NAME.test(name) || BLOCKED_PROPERTY_NAMES.has(name)) {
    throw new BridgeLabProbeError(
      'invalid-name',
      `${label} must be a plain JavaScript property name.`,
    )
  }
  return name
}

function parseJson(text: string, label: string): unknown {
  try {
    return JSON.parse(text)
  } catch (error) {
    throw new BridgeLabProbeError(
      'invalid-payload',
      `${label} must contain valid JSON.`,
      error,
    )
  }
}

function parseAndroidArguments(request: AndroidRawProbeRequest): readonly unknown[] {
  if (request.argumentMode === 'none') return []
  if (request.argumentMode === 'string') return [request.argumentText]
  if (request.argumentMode === 'json-value') {
    return [parseJson(request.argumentText, 'Android JSON value')]
  }

  const parsed = parseJson(request.argumentText, 'Android JSON args')
  if (!Array.isArray(parsed)) {
    throw new BridgeLabProbeError(
      'invalid-payload',
      'Android JSON args mode requires a JSON array.',
    )
  }
  return parsed
}

function parseIOSPayload(request: IOSRawProbeRequest): unknown {
  if (request.payloadMode === 'empty-object') return {}
  if (request.payloadMode === 'string') return request.payloadText
  return parseJson(request.payloadText, 'iOS payload')
}

function resolveAndroidObject(hostWindow: ProbeWindow, objectName: string): Record<string, unknown> {
  const candidate = hostWindow[objectName]
  if (
    candidate === null ||
    (typeof candidate !== 'object' && typeof candidate !== 'function')
  ) {
    throw new BridgeLabProbeError(
      'bridge-unavailable',
      `window.${objectName} is not available in the current host.`,
    )
  }
  return candidate as Record<string, unknown>
}

export async function runAndroidRawProbe(request: AndroidRawProbeRequest): Promise<unknown> {
  ensureBridgeLabEnabled()
  const hostWindow = getProbeWindow()
  const objectName = assertPropertyName(request.objectName, 'Android object name')
  const methodName = assertPropertyName(request.methodName, 'Android method name')
  const bridge = resolveAndroidObject(hostWindow, objectName)
  const method = bridge[methodName]

  if (typeof method !== 'function') {
    throw new BridgeLabProbeError(
      'method-unavailable',
      `${objectName}.${methodName} is not available in the current host.`,
    )
  }

  const args = parseAndroidArguments(request)

  try {
    return await Promise.resolve(method.call(bridge, ...args))
  } catch (error) {
    throw new BridgeLabProbeError(
      'invocation-failed',
      `${objectName}.${methodName} threw during Raw Probe invocation.`,
      error,
    )
  }
}

export async function runIOSRawProbe(request: IOSRawProbeRequest): Promise<unknown> {
  ensureBridgeLabEnabled()
  const hostWindow = getProbeWindow()
  const handlerName = assertPropertyName(request.handlerName, 'iOS handler name')
  const payload = parseIOSPayload(request)
  const handler = hostWindow.webkit?.messageHandlers?.[handlerName]

  if (!handler || typeof handler.postMessage !== 'function') {
    throw new BridgeLabProbeError(
      'handler-unavailable',
      `webkit.messageHandlers.${handlerName} is not available in the current host.`,
    )
  }

  if (request.receiveMode === 'none') {
    try {
      handler.postMessage.call(handler, payload)
      return { sent: true }
    } catch (error) {
      throw new BridgeLabProbeError(
        'invocation-failed',
        `webkit.messageHandlers.${handlerName}.postMessage threw during Raw Probe invocation.`,
        error,
      )
    }
  }

  const callbackName = assertPropertyName(request.callbackName ?? '', 'H5 callback name')
  const callbackHost = hostWindow as Record<string, unknown>
  if (typeof callbackHost[callbackName] !== 'undefined') {
    throw new BridgeLabProbeError(
      'callback-conflict',
      `window.${callbackName} already exists; Bridge Lab will not overwrite a host/application callback.`,
    )
  }

  const transport = createIOSMessageHandlerTransport<unknown, unknown>({
    handlerName,
    correlation: 'single-flight',
    callbackCardinality: 'at-most-one',
    timeoutMs: request.timeoutMs,
    serializeRequest: () => payload,
    parseCallback: (callbackPayload) => ({
      ok: true,
      payload: callbackPayload,
    }),
  })

  const resolution = transport.resolve(hostWindow, payload, { timeoutMs: request.timeoutMs })
  if (!resolution.supported) {
    throw new BridgeLabProbeError(
      resolution.code === 'bridge-unsupported' ? 'bridge-unavailable' : 'handler-unavailable',
      resolution.message,
    )
  }

  const callback = (...args: unknown[]) => {
    const callbackPayload = args.length <= 1 ? args[0] : args
    return transport.handleCallback({ ok: true, payload: callbackPayload })
  }

  callbackHost[callbackName] = callback

  try {
    return await Promise.resolve(resolution.invoke())
  } finally {
    if (callbackHost[callbackName] === callback) delete callbackHost[callbackName]
  }
}

export function isSensitiveBridgeName(value: string): boolean {
  return SENSITIVE_NAME.test(value)
}

export interface RedactedBridgeValue {
  value: unknown
  redacted: boolean
}

export function redactBridgeValue(
  value: unknown,
  forceSensitive = false,
): RedactedBridgeValue {
  if (forceSensitive) return { value: '[REDACTED]', redacted: true }

  let redacted = false
  const seen = new WeakSet<object>()

  const visit = (current: unknown, key?: string): unknown => {
    if (key && SENSITIVE_NAME.test(key)) {
      redacted = true
      return '[REDACTED]'
    }

    if (current === null || typeof current !== 'object') return current
    if (current instanceof Error) {
      return { name: current.name, message: current.message }
    }
    if (seen.has(current)) return '[Circular]'
    seen.add(current)

    if (Array.isArray(current)) return current.map((item) => visit(item))

    return Object.fromEntries(
      Object.entries(current as Record<string, unknown>).map(([entryKey, entryValue]) => [
        entryKey,
        visit(entryValue, entryKey),
      ]),
    )
  }

  return { value: visit(value), redacted }
}
