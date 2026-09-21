import { runtimePolicy } from '../app/config/runtime'
import {
  createInjectedObjectTransport,
  NativeTransportError,
  parseJsonStringPayload,
  type NativeTransportResolution,
  type NativeTransportWindow,
} from './nativeBridgeTransport'

export type NativeHost = 'android' | 'ios' | 'browser'
export type NativeCapabilityPlatform = Exclude<NativeHost, 'browser'>
export type NativeBridgeErrorCode =
  | 'bridge-disabled'
  | 'bridge-unsupported'
  | 'capability-unsupported'
  | 'invocation-failed'
  | 'invocation-timeout'

type NativeInvocationOptions = {
  timeoutMs?: number
}

type UnsupportedCapabilityResolution = Extract<
  NativeTransportResolution<never>,
  { supported: false }
>

type SupportedCapabilityResolution<TInput, TResult> = {
  supported: true
  invoke: (input: TInput) => TResult | PromiseLike<TResult>
}

type NativeCapabilityResolution<TInput, TResult> =
  | UnsupportedCapabilityResolution
  | SupportedCapabilityResolution<TInput, TResult>

interface NativeCapabilityDescriptor<TName extends string, TInput, TResult> {
  name: TName
  description: string
  /** Platforms with a confirmed production implementation for this capability. */
  platforms: readonly NativeCapabilityPlatform[]
  sensitiveResult?: boolean
  resolve: (
    hostWindow: NativeTransportWindow | undefined,
  ) => NativeCapabilityResolution<TInput, TResult>
}

function defineCapability<TName extends string, TInput, TResult>(
  descriptor: NativeCapabilityDescriptor<TName, TInput, TResult>,
): NativeCapabilityDescriptor<TName, TInput, TResult> {
  return descriptor
}

function unsupportedCapability(
  code: UnsupportedCapabilityResolution['code'],
  message: string,
): UnsupportedCapabilityResolution {
  return { supported: false, code, message }
}

function supportedCapability<TInput, TResult>(
  invoke: SupportedCapabilityResolution<TInput, TResult>['invoke'],
): SupportedCapabilityResolution<TInput, TResult> {
  return { supported: true, invoke }
}

export interface NativeLoginToken {
  token: string
}

function parseLoginTokenPayload(payload: unknown): NativeLoginToken {
  const parsed = parseJsonStringPayload<unknown>(payload)
  if (
    parsed === null ||
    typeof parsed !== 'object' ||
    typeof (parsed as { token?: unknown }).token !== 'string'
  ) {
    throw new NativeTransportError(
      'payload-invalid',
      'Native getLoginToken() result must be a JSON string with a string token field.',
    )
  }

  return { token: (parsed as { token: string }).token }
}

const androidGetLoginTokenTransport = createInjectedObjectTransport<void, NativeLoginToken>({
  objectName: 'androidBridge',
  methodName: 'getLoginToken',
  serializeArgs: () => [],
  parseResult: parseLoginTokenPayload,
})

const iosGetLoginTokenTransport = createInjectedObjectTransport<void, NativeLoginToken>({
  objectName: 'iosBridge',
  methodName: 'getLoginToken',
  serializeArgs: () => [],
  parseResult: parseLoginTokenPayload,
})

function resolveLoginTokenTransport(
  hostWindow: NativeTransportWindow | undefined,
): NativeCapabilityResolution<void, NativeLoginToken> {
  if (hostWindow?.androidBridge) {
    const resolution = androidGetLoginTokenTransport.resolve(hostWindow, undefined)
    if (!resolution.supported) return resolution
    return supportedCapability<void, NativeLoginToken>(() => resolution.invoke())
  }

  if (hostWindow?.iosBridge) {
    const resolution = iosGetLoginTokenTransport.resolve(hostWindow, undefined)
    if (!resolution.supported) return resolution
    return supportedCapability<void, NativeLoginToken>(() => resolution.invoke())
  }

  return unsupportedCapability(
    'bridge-unsupported',
    'Neither window.androidBridge nor window.iosBridge is available in the current host.',
  )
}

const capabilityRegistry = {
  getLoginToken: defineCapability<'getLoginToken', void, NativeLoginToken>({
    name: 'getLoginToken',
    description:
      'Read the current login token from the confirmed Android/iOS injected-object bridge.',
    platforms: ['android', 'ios'],
    sensitiveResult: true,
    resolve(hostWindow) {
      return resolveLoginTokenTransport(hostWindow)
    },
  }),
  closeWebView: defineCapability<'closeWebView', void, never>({
    name: 'closeWebView',
    platforms: [],
    description:
      'H5 close intent only; the Native close-WebView protocol is intentionally still unconfirmed.',
    sensitiveResult: false,
    resolve() {
      return unsupportedCapability(
        'capability-unsupported',
        'The App host has not confirmed a close-WebView JSBridge protocol yet.',
      )
    },
  }),
} as const

export type NativeCapabilityName = keyof typeof capabilityRegistry

export interface NativeCapabilityCatalogItem {
  name: NativeCapabilityName
  description: string
  platforms: readonly NativeCapabilityPlatform[]
  supported: boolean
  sensitiveResult: boolean
}

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

function getHostWindow(): NativeTransportWindow | undefined {
  if (typeof window === 'undefined') return undefined
  return window as NativeTransportWindow
}

function detectHost(hostWindow = getHostWindow()): NativeHost {
  if (hostWindow?.androidBridge) return 'android'
  if (hostWindow?.iosBridge || hostWindow?.webkit?.messageHandlers) return 'ios'
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

async function invokeNativeCapability<TName extends string, TInput, TResult>(
  descriptor: NativeCapabilityDescriptor<TName, TInput, TResult>,
  input: TInput,
  options: NativeInvocationOptions = {},
  allowDisabledBridgeMode = false,
): Promise<TResult> {
  if (!allowDisabledBridgeMode) ensureNativeMode(descriptor.name)

  let resolution: NativeCapabilityResolution<TInput, TResult>
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
    invocation = Promise.resolve(resolution.invoke(input))
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
  descriptor: NativeCapabilityDescriptor<string, never, unknown>,
  hostWindow: NativeTransportWindow | undefined,
  allowDisabledBridgeMode = false,
): boolean {
  if (!allowDisabledBridgeMode && runtimePolicy.bridgeMode !== 'native') return false

  try {
    return descriptor.resolve(hostWindow).supported
  } catch {
    return false
  }
}

/** Registry-backed metadata for Bridge Lab; this does not promote unsupported host protocols. */
export function getNativeBridgeCapabilityCatalog(): NativeCapabilityCatalogItem[] {
  const hostWindow = getHostWindow()

  return Object.values(capabilityRegistry).map((descriptor) => ({
    name: descriptor.name,
    description: descriptor.description,
    platforms: descriptor.platforms,
    supported: isCapabilitySupported(
      descriptor as NativeCapabilityDescriptor<string, never, unknown>,
      hostWindow,
      runtimePolicy.bridgeLabEnabled,
    ),
    sensitiveResult: descriptor.sensitiveResult === true,
  })) as NativeCapabilityCatalogItem[]
}

/**
 * Bridge Lab-only generic invocation seam.
 *
 * Business pages should continue using typed capability facades such as getLoginToken(). This
 * function exists so the debug Lab can enumerate and invoke the registry without hard-coding one
 * top-level button per capability.
 */
export function invokeRegisteredNativeCapabilityForDebug(
  name: NativeCapabilityName,
  input: unknown = undefined,
  options: NativeInvocationOptions = {},
): Promise<unknown> {
  if (!runtimePolicy.bridgeLabEnabled) {
    return Promise.reject(
      new NativeBridgeError(
        'bridge-disabled',
        name,
        `Native capability debug invocation is disabled in ${runtimePolicy.appEnvironment} runtime.`,
      ),
    )
  }

  const descriptor = capabilityRegistry[name] as NativeCapabilityDescriptor<
    NativeCapabilityName,
    unknown,
    unknown
  >
  return invokeNativeCapability(descriptor, input, options, true)
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
        descriptor as NativeCapabilityDescriptor<string, never, unknown>,
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
 * H029 confirmed production login boundary, executed through the shared capability runtime.
 *
 * Android uses `window.androidBridge.getLoginToken()`; iOS uses
 * `window.iosBridge.getLoginToken()`. Both take no arguments and synchronously return a JSON
 * string with a `token` field. H5 normalizes the synchronous host return to a Promise and validates
 * the returned payload before exposing it to callers.
 */
export function getLoginToken(
  options: NativeInvocationOptions = {},
): Promise<NativeLoginToken> {
  return invokeNativeCapability(capabilityRegistry.getLoginToken, undefined, options)
}

/**
 * H5-facing close intent.
 *
 * H021 needs a stable App-title-bar contract before the Native close protocol exists. The capability
 * is registered so detection/invocation share the same runtime lifecycle, but its resolver remains
 * explicitly unsupported until the host team confirms a real Android/iOS protocol.
 */
export function closeWebView(): Promise<never> {
  return invokeNativeCapability(capabilityRegistry.closeWebView, undefined)
}
