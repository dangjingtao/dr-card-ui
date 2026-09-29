import {
  createCallbackInjectedObjectTransport,
  parseJsonPayload,
  NativeTransportError,
  serializeJsonValue,
  type NativeTransportWindow,
} from '../../nativeBridgeTransport'
import { defineCapability, resolveDualInjectedCapability } from '../core'
import { parseConfirmedNativeResult } from '../protocol'
import type {
  NativeRewardAdInput,
  NativeRewardAdResult,
  NativeRewardAdStatus,
} from '../types'

function validateInput(input: NativeRewardAdInput): NativeRewardAdInput {
  if (
    input === null ||
    typeof input !== 'object' ||
    (input as { scene?: unknown }).scene !== 'h5CheckinResign'
  ) {
    throw new NativeTransportError(
      'payload-invalid',
      'Native showRewardAd() input requires scene to be h5CheckinResign.',
    )
  }

  return input
}

function parseResult(payload: unknown): NativeRewardAdResult {
  let parsed: unknown
  try {
    parsed = parseConfirmedNativeResult(payload)
  } catch (error) {
    if (error instanceof NativeTransportError && error.code !== 'payload-invalid') throw error
    parsed = parseJsonPayload(payload)
  }

  const nativeCode =
    parsed !== null && typeof parsed === 'object'
      ? (parsed as { code?: unknown }).code
      : undefined

  // H037 current Android contract: Native owns completion semantics and numeric code is the
  // authoritative final result. Migration-era status must not override a confirmed current code.
  if (typeof nativeCode === 'number') {
    if (nativeCode === 0) return { status: 'completed' }
    if (nativeCode === 1) return { status: 'closed' }
    if (nativeCode === 7) return { status: 'no_fill' }
    if (nativeCode === 5 || nativeCode === 6) return { status: 'failed' }

    throw new NativeTransportError(
      'native-failed',
      `Native showRewardAd reported unsupported code ${nativeCode}.`,
    )
  }

  const status =
    parsed !== null && typeof parsed === 'object'
      ? ((parsed as { status?: unknown; data?: { status?: unknown } }).status
        ?? (parsed as { data?: { status?: unknown } }).data?.status)
      : undefined

  // Legacy status is accepted only when the current numeric-code contract is absent.
  if (['completed', 'closed', 'failed', 'no_fill'].includes(status as string)) {
    return { status: status as NativeRewardAdStatus }
  }

  if (status !== undefined) {
    throw new NativeTransportError(
      'payload-invalid',
      'Native showRewardAd() returned an unknown legacy status.',
    )
  }

  throw new NativeTransportError(
    'payload-invalid',
    'Native showRewardAd() result requires a confirmed Native code or legacy status.',
  )
}

const androidTransport = createCallbackInjectedObjectTransport<
  NativeRewardAdInput,
  NativeRewardAdResult
>({
  objectName: 'androidBridge',
  methodName: 'showRewardAd',
  callbackName: 'nativeBridgeCallback',
  callbackAliases: ['androidBridgeCallback'],
  serializeArgs: (input, callbackId) => [serializeJsonValue({ ...validateInput(input), callbackId })],
  parseResult,
})

const iosTransport = createCallbackInjectedObjectTransport<
  NativeRewardAdInput,
  NativeRewardAdResult
>({
  objectName: 'iosBridge',
  methodName: 'showRewardAd',
  callbackName: 'nativeBridgeCallback',
  serializeArgs: (input, callbackId) => [serializeJsonValue({ ...validateInput(input), callbackId })],
  parseResult,
})

export const showRewardAdCapability = defineCapability<
  'showRewardAd',
  NativeRewardAdInput,
  NativeRewardAdResult
>({
  name: 'showRewardAd',
  platforms: ['android', 'ios'],
  description:
    'Show the check-in resign rewarded ad through the confirmed Android/iOS injected-object contract.',
  sensitiveResult: false,
  resolve(hostWindow: NativeTransportWindow | undefined) {
    const sample: NativeRewardAdInput = { scene: 'h5CheckinResign' }
    return resolveDualInjectedCapability(
      hostWindow,
      'showRewardAd',
      sample,
      (input) => androidTransport.resolve(hostWindow!, input),
      (input) => iosTransport.resolve(hostWindow!, input),
    )
  },
})
