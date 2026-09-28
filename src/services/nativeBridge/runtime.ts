import { runtimePolicy } from '../../app/config/runtime'
import type { NativeTransportWindow } from '../nativeBridgeTransport'
import type { NativeCapabilityDescriptor } from './core'
import { NativeBridgeError, toInvocationBridgeError } from './errors'
import {
  capabilityRegistry,
  type NativeCapabilityCatalogItem,
  type NativeCapabilityName,
} from './registry'
import type {
  NativeHost,
  NativeInvocationOptions,
} from './types'

export interface NativeBridgeDiagnostics {
  mode: typeof runtimePolicy.bridgeMode
  host: NativeHost
  hostVersion: null
  capabilities: Record<NativeCapabilityName, boolean>
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

/**
 * H036 host identity query.
 *
 * Answers "which host is currently running this H5" using injected-object presence only: no UA
 * sniffing, no version inference, no caching, and deliberately independent of runtimePolicy
 * .bridgeMode (bridgeMode gates whether capability calls are allowed; this only reports the host).
 * Re-reading window on every call keeps late injection working, matching the capability runtime.
 */
export function getNativeHost(): NativeHost {
  return detectHost()
}

function ensureNativeMode(capability: string): void {
  if (runtimePolicy.bridgeMode === 'native') return

  throw new NativeBridgeError(
    'bridge-disabled',
    capability,
    `Native capability "${capability}" requires VITE_BRIDGE_MODE=native; current mode is ${runtimePolicy.bridgeMode}.`,
  )
}

function withTimeout<T>(
  promise: Promise<T>,
  capability: string,
  timeoutMs: number,
): Promise<T> {
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

export async function invokeNativeCapability<
  TName extends string,
  TInput,
  TResult,
>(
  descriptor: NativeCapabilityDescriptor<TName, TInput, TResult>,
  input: TInput,
  options: NativeInvocationOptions = {},
  allowDisabledBridgeMode = false,
): Promise<TResult> {
  if (!allowDisabledBridgeMode) ensureNativeMode(descriptor.name)

  let resolution
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
    throw toInvocationBridgeError(error, descriptor.name, 'threw')
  }

  try {
    return await withTimeout(
      invocation,
      descriptor.name,
      options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    )
  } catch (error) {
    throw toInvocationBridgeError(error, descriptor.name, 'rejected')
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
 * has not provided. hostVersion therefore remains null until a real version API is confirmed.
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
