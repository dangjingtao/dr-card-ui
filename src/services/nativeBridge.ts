import { runtimePolicy } from '../app/config/runtime'

export type NativeHost = 'android' | 'ios' | 'browser'
export type NativeBridgeErrorCode =
  | 'bridge-disabled'
  | 'bridge-unsupported'
  | 'capability-unsupported'
  | 'invocation-failed'
  | 'invocation-timeout'

export interface NativeBridgeDiagnostics {
  mode: typeof runtimePolicy.bridgeMode
  host: NativeHost
  hostVersion: null
  capabilities: {
    getLoginToken: boolean
    /** H5-level capability name only. Native method/protocol is intentionally unconfirmed. */
    closeWebView: boolean
  }
}

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
const GET_LOGIN_TOKEN_CAPABILITY = 'getLoginToken'
const CLOSE_WEBVIEW_CAPABILITY = 'closeWebView'

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

function resolveAndroidBridge(capability: string): AndroidBridge {
  const bridge = getHostWindow()?.androidBridge
  if (bridge) return bridge

  throw new NativeBridgeError(
    'bridge-unsupported',
    capability,
    'window.androidBridge is not available in the current host.',
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

/**
 * Returns runtime-observable Bridge state without claiming a Native version contract that the host
 * has not provided. `hostVersion` therefore remains null until a real version API is confirmed.
 */
export function getNativeBridgeDiagnostics(): NativeBridgeDiagnostics {
  const hostWindow = getHostWindow()
  const androidBridge = hostWindow?.androidBridge

  return {
    mode: runtimePolicy.bridgeMode,
    host: detectHost(hostWindow),
    hostVersion: null,
    capabilities: {
      getLoginToken:
        runtimePolicy.bridgeMode === 'native' && typeof androidBridge?.getLoginToken === 'function',
      // H021 only models the UI intent. No Native close protocol has been confirmed yet.
      closeWebView: false,
    },
  }
}

/**
 * H015's first confirmed production boundary.
 *
 * The real Android WebView probe uses `window.androidBridge.getLoginToken()` with no arguments and
 * a synchronous host return. The adapter deliberately normalizes that return to a Promise so pages
 * never depend on Android's synchronous JavaScriptInterface behavior. The raw result remains
 * `unknown` until the Native response schema is explicitly confirmed.
 *
 * The bridge is resolved on every invocation (late injection is supported), and the method is
 * called with the injected object as its receiver. Both details were required by the real Android
 * WebView integration probe on `jsbrigge-test`.
 */
export async function getLoginToken(options: { timeoutMs?: number } = {}): Promise<unknown> {
  ensureNativeMode(GET_LOGIN_TOKEN_CAPABILITY)

  const bridge = resolveAndroidBridge(GET_LOGIN_TOKEN_CAPABILITY)
  const method = bridge.getLoginToken
  if (typeof method !== 'function') {
    throw new NativeBridgeError(
      'capability-unsupported',
      GET_LOGIN_TOKEN_CAPABILITY,
      'androidBridge.getLoginToken is not available in the current host.',
    )
  }

  let invocation: Promise<unknown>
  try {
    invocation = Promise.resolve(method.call(bridge))
  } catch (error) {
    throw new NativeBridgeError(
      'invocation-failed',
      GET_LOGIN_TOKEN_CAPABILITY,
      'androidBridge.getLoginToken threw during invocation.',
      error,
    )
  }

  try {
    return await withTimeout(
      invocation,
      GET_LOGIN_TOKEN_CAPABILITY,
      options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    )
  } catch (error) {
    if (error instanceof NativeBridgeError) throw error
    throw new NativeBridgeError(
      'invocation-failed',
      GET_LOGIN_TOKEN_CAPABILITY,
      'androidBridge.getLoginToken rejected during invocation.',
      error,
    )
  }
}


/**
 * H5-facing close intent.
 *
 * H021 needs a stable App-title-bar contract before the Native close protocol exists. This function
 * deliberately exposes the intent without guessing any Android/iOS method name. Once the host team
 * confirms the protocol, only this adapter needs a real implementation; pages and TitleBar stay
 * unchanged.
 */
export async function closeWebView(): Promise<never> {
  ensureNativeMode(CLOSE_WEBVIEW_CAPABILITY)

  throw new NativeBridgeError(
    'capability-unsupported',
    CLOSE_WEBVIEW_CAPABILITY,
    'The App host has not confirmed a close-WebView JSBridge protocol yet.',
  )
}
