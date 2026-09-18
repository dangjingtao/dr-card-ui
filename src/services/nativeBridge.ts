import { runtimePolicy } from '../app/config/runtime'

export type NativeHost = 'android' | 'ios' | 'browser'
export type NativeBridgeErrorCode =
  | 'bridge-disabled'
  | 'bridge-unsupported'
  | 'capability-unsupported'
  | 'invocation-failed'
  | 'invocation-timeout'

type AndroidBridge = {
  getLoginToken?: () => unknown
}

type IOSMessageHandler = {
  postMessage: (payload: unknown) => void
}

type NativeBridgeWindow = Window & {
  androidBridge?: AndroidBridge
  webkit?: {
    messageHandlers?: Record<string, IOSMessageHandler | undefined>
  }
}

type NativeInvocationOptions = {
  timeoutMs?: number
}

type UnsupportedCapabilityResolution = {
  supported: false
  code: Extract<NativeBridgeErrorCode, 'bridge-unsupported' | 'capability-unsupported'>
  message: string
}

type SupportedCapabilityResolution<TResult> = {
  supported: true
  invoke: () => TResult | PromiseLike<TResult>
}

type NativeCapabilityResolution<TResult> =
  | UnsupportedCapabilityResolution
  | SupportedCapabilityResolution<TResult>

interface NativeCapabilityDescriptor<TName extends string, TResult> {
  name: TName
  description: string
  resolve: (hostWindow: NativeBridgeWindow | undefined) => NativeCapabilityResolution<TResult>
}

function defineCapability<TName extends string, TResult>(
  descriptor: NativeCapabilityDescriptor<TName, TResult>,
): NativeCapabilityDescriptor<TName, TResult> {
  return descriptor
}

function unsupportedCapability(
  code: UnsupportedCapabilityResolution['code'],
  message: string,
): UnsupportedCapabilityResolution {
  return { supported: false, code, message }
}

function supportedCapability<TResult>(
  invoke: SupportedCapabilityResolution<TResult>['invoke'],
): SupportedCapabilityResolution<TResult> {
  return { supported: true, invoke }
}

const capabilityRegistry = {
  getLoginToken: defineCapability<'getLoginToken', unknown>({
    name: 'getLoginToken',
    description: 'Read the current login token from the confirmed Android host bridge.',
    resolve(hostWindow) {
      const bridge = hostWindow?.androidBridge
      if (!bridge) {
        return unsupportedCapability(
          'bridge-unsupported',
          'window.androidBridge is not available in the current host.',
        )
      }

      const method = bridge.getLoginToken
      if (typeof method !== 'function') {
        return unsupportedCapability(
          'capability-unsupported',
          'androidBridge.getLoginToken is not available in the current host.',
        )
      }

      // Resolve the bridge for each invocation and keep the injected object as the receiver.
      // Both details are required by the real Android WebView integration evidence.
      return supportedCapability(() => method.call(bridge))
    },
  }),
  closeWebView: defineCapability<'closeWebView', never>({
    name: 'closeWebView',
    description:
      'H5 close intent only; the Native close-WebView protocol is intentionally still unconfirmed.',
    resolve() {
      return unsupportedCapability(
        'capability-unsupported',
        'The App host has not confirmed a close-WebView JSBridge protocol yet.',
      )
    },
  }),
} as const

export type NativeCapabilityName = keyof typeof capabilityRegistry

export interface NativeBridgeDiagnostics {
  mode: typeof runtimePolicy.bridgeMode
  host: NativeHost
  hostVersion: null
  capabilities: Record<NativeCapabilityName, boolean>
}

export class NativeBridgeError extends Error {
  readonly name = 'NativeBridgeError'

  constructor(
    readonly code: NativeBridgeErrorCode,
    readonly capability: string,
    message: string,
    readonly cause?: unknown,
  ) {
    super(message)
  }
}

const DEFAULT_TIMEOUT_MS = 5_000

function getHostWindow(): NativeBridgeWindow | undefined {
  if (typeof window === 'undefined') return undefined
  return window as NativeBridgeWindow
}

function detectHost(hostWindow = getHostWindow()): NativeHost {
  if (hostWindow?.androidBridge) return 'android'
  if (hostWindow?.webkit?.messageHandlers) return 'ios'
  return 'browser'
}

function ensureNativeMode(capability: string): void {
  if (runtimePolicy.bridgeMode === 'native') return

  throw new NativeBridgeError(
    'bridge-disabled',
    capability,
    `Native capability "${capability}" requires VITE_BRIDGE_MODE=native; current mode is ${runtimePolicy.bridgeMode}.`,
  )
}

function withTimeout<T>(promise: Promise<T>, capability: string, timeoutMs: number): Promise<T> {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return Promise.reject(
      new NativeBridgeError(
        'invocation-failed',
        capability,
        `Native capability "${capability}" requires a positive finite timeout.`,
      ),
    )
  }

  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(
        new NativeBridgeError(
          'invocation-timeout',
          capability,
          `Native capability "${capability}" timed out after ${timeoutMs}ms.`,
        ),
      )
    }, timeoutMs)

    promise.then(
      (value) => {
        clearTimeout(timeoutId)
        resolve(value)
      },
      (error) => {
        clearTimeout(timeoutId)
        reject(error)
      },
    )
  })
}

async function invokeNativeCapability<TName extends string, TResult>(
  descriptor: NativeCapabilityDescriptor<TName, TResult>,
  options: NativeInvocationOptions = {},
): Promise<TResult> {
  ensureNativeMode(descriptor.name)

  let resolution: NativeCapabilityResolution<TResult>
  try {
    resolution = descriptor.resolve(getHostWindow())
  } catch (error) {
    throw new NativeBridgeError(
      'invocation-failed',
      descriptor.name,
      `Native capability "${descriptor.name}" failed during capability resolution.`,
      error,
    )
  }

  if (!resolution.supported) {
    throw new NativeBridgeError(
      resolution.code,
      descriptor.name,
      resolution.message,
    )
  }

  let invocation: Promise<TResult>
  try {
    invocation = Promise.resolve(resolution.invoke())
  } catch (error) {
    throw new NativeBridgeError(
      'invocation-failed',
      descriptor.name,
      `Native capability "${descriptor.name}" threw during invocation.`,
      error,
    )
  }

  try {
    return await withTimeout(
      invocation,
      descriptor.name,
      options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    )
  } catch (error) {
    if (error instanceof NativeBridgeError) throw error

    throw new NativeBridgeError(
      'invocation-failed',
      descriptor.name,
      `Native capability "${descriptor.name}" rejected during invocation.`,
      error,
    )
  }
}

function isCapabilitySupported(
  descriptor: NativeCapabilityDescriptor<string, unknown>,
  hostWindow: NativeBridgeWindow | undefined,
): boolean {
  if (runtimePolicy.bridgeMode !== 'native') return false

  try {
    return descriptor.resolve(hostWindow).supported
  } catch {
    return false
  }
}

/**
 * Returns runtime-observable Bridge state without claiming a Native version contract that the host
 * has not provided. `hostVersion` therefore remains null until a real version API is confirmed.
 */
export function getNativeBridgeDiagnostics(): NativeBridgeDiagnostics {
  const hostWindow = getHostWindow()
  const capabilities = Object.fromEntries(
    Object.entries(capabilityRegistry).map(([name, descriptor]) => [
      name,
      isCapabilitySupported(
        descriptor as NativeCapabilityDescriptor<string, unknown>,
        hostWindow,
      ),
    ]),
  ) as Record<NativeCapabilityName, boolean>

  return {
    mode: runtimePolicy.bridgeMode,
    host: detectHost(hostWindow),
    hostVersion: null,
    capabilities,
  }
}

/**
 * H015's first confirmed production boundary, now executed through the shared capability runtime.
 *
 * The real Android WebView probe uses `window.androidBridge.getLoginToken()` with no arguments and
 * a synchronous host return. The adapter deliberately normalizes that return to a Promise so pages
 * never depend on Android's synchronous JavaScriptInterface behavior. The raw result remains
 * `unknown` until the Native response schema is explicitly confirmed.
 */
export function getLoginToken(options: NativeInvocationOptions = {}): Promise<unknown> {
  return invokeNativeCapability(capabilityRegistry.getLoginToken, options)
}

/**
 * H5-facing close intent.
 *
 * H021 needs a stable App-title-bar contract before the Native close protocol exists. The capability
 * is registered so detection/invocation share the same runtime lifecycle, but its resolver remains
 * explicitly unsupported until the host team confirms a real Android/iOS protocol.
 */
export function closeWebView(): Promise<never> {
  return invokeNativeCapability(capabilityRegistry.closeWebView)
}
