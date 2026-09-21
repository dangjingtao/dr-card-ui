import {
  createInjectedObjectTransport,
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
  const parsed = parseConfirmedNativeResult(payload)
  const status =
    parsed !== null && typeof parsed === 'object'
      ? (parsed as { status?: unknown }).status
      : undefined

  if (!['completed', 'closed', 'failed', 'no_fill'].includes(status as string)) {
    throw new NativeTransportError(
      'payload-invalid',
      'Native showRewardAd() result requires status to be completed, closed, failed, or no_fill.',
    )
  }

  return { status: status as NativeRewardAdStatus }
}

const androidTransport = createInjectedObjectTransport<
  NativeRewardAdInput,
  NativeRewardAdResult
>({
  objectName: 'androidBridge',
  methodName: 'showRewardAd',
  serializeArgs: (input) => [serializeJsonValue(validateInput(input))],
  parseResult,
})

const iosTransport = createInjectedObjectTransport<
  NativeRewardAdInput,
  NativeRewardAdResult
>({
  objectName: 'iosBridge',
  methodName: 'showRewardAd',
  serializeArgs: (input) => [serializeJsonValue(validateInput(input))],
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
