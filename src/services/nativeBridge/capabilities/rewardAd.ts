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
  const status =
    parsed !== null && typeof parsed === 'object'
      ? ((parsed as { status?: unknown; data?: { status?: unknown } }).status
        ?? (parsed as { data?: { status?: unknown } }).data?.status)
      : undefined
  const nativeCode = (parsed as { code?: unknown })?.code
  if (typeof nativeCode === 'number' && nativeCode !== 0 && nativeCode !== 1 && nativeCode !== 7) {
    throw new NativeTransportError('native-failed', 'Native showRewardAd reported failure.')
  }

  if (!['completed', 'closed', 'failed', 'no_fill'].includes(status as string)) {
    throw new NativeTransportError(
      'payload-invalid',
      'Native showRewardAd() result requires status to be completed, closed, failed, or no_fill.',
    )
  }

  return { status: status as NativeRewardAdStatus }
}

const androidTransport = createCallbackInjectedObjectTransport<
  NativeRewardAdInput,
  NativeRewardAdResult
>({
  objectName: 'androidBridge',
  methodName: 'showRewardAd',
  serializeArgs: (input, callbackId) => [serializeJsonValue({ ...validateInput(input), callbackId })],
  parseResult,
})

const iosTransport = createCallbackInjectedObjectTransport<
  NativeRewardAdInput,
  NativeRewardAdResult
>({
  objectName: 'iosBridge',
  methodName: 'showRewardAd',
  callbackName: 'iosBridgeCallback',
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
