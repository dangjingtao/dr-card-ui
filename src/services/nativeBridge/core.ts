import type {
  NativeTransportResolution,
  NativeTransportWindow,
} from '../nativeBridgeTransport'
import { NativeBridgeError } from './errors'
import type { NativeCapabilityPlatform } from './types'

export type UnsupportedCapabilityResolution = Extract<
  NativeTransportResolution<never>,
  { supported: false }
>

export type SupportedCapabilityResolution<TInput, TResult> = {
  supported: true
  invoke: (input: TInput) => TResult | PromiseLike<TResult>
}

export type NativeCapabilityResolution<TInput, TResult> =
  | UnsupportedCapabilityResolution
  | SupportedCapabilityResolution<TInput, TResult>

export interface NativeCapabilityDescriptor<
  TName extends string,
  TInput,
  TResult,
> {
  name: TName
  description: string
  /** Platforms with a confirmed production implementation for this capability. */
  platforms: readonly NativeCapabilityPlatform[]
  sensitiveResult?: boolean
  resolve: (
    hostWindow: NativeTransportWindow | undefined,
  ) => NativeCapabilityResolution<TInput, TResult>
}

export function defineCapability<TName extends string, TInput, TResult>(
  descriptor: NativeCapabilityDescriptor<TName, TInput, TResult>,
): NativeCapabilityDescriptor<TName, TInput, TResult> {
  return descriptor
}

export function unsupportedCapability(
  code: UnsupportedCapabilityResolution['code'],
  message: string,
): UnsupportedCapabilityResolution {
  return { supported: false, code, message }
}

export function supportedCapability<TInput, TResult>(
  invoke: SupportedCapabilityResolution<TInput, TResult>['invoke'],
): SupportedCapabilityResolution<TInput, TResult> {
  return { supported: true, invoke }
}

export function resolveDualInjectedCapability<TInput, TResult>(
  hostWindow: NativeTransportWindow | undefined,
  capability: string,
  sampleInput: TInput,
  resolveAndroid: (input: TInput) => NativeTransportResolution<TResult>,
  resolveIOS: (input: TInput) => NativeTransportResolution<TResult>,
): NativeCapabilityResolution<TInput, TResult> {
  if (hostWindow?.androidBridge) {
    const probe = resolveAndroid(sampleInput)
    if (!probe.supported) return probe
    return supportedCapability((input) => {
      const resolution = resolveAndroid(input)
      if (!resolution.supported) {
        throw new NativeBridgeError(
          resolution.code,
          capability,
          resolution.message,
        )
      }
      return resolution.invoke()
    })
  }

  if (hostWindow?.iosBridge) {
    const probe = resolveIOS(sampleInput)
    if (!probe.supported) return probe
    return supportedCapability((input) => {
      const resolution = resolveIOS(input)
      if (!resolution.supported) {
        throw new NativeBridgeError(
          resolution.code,
          capability,
          resolution.message,
        )
      }
      return resolution.invoke()
    })
  }

  return unsupportedCapability(
    'bridge-unsupported',
    'Neither window.androidBridge nor window.iosBridge is available in the current host.',
  )
}
