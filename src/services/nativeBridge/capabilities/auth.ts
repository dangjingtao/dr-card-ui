import {
  createInjectedObjectTransport,
  NativeTransportError,
  type NativeTransportWindow,
} from '../../nativeBridgeTransport'
import {
  defineCapability,
  supportedCapability,
  unsupportedCapability,
} from '../core'
import { parseConfirmedNativeResult } from '../protocol'
import type { NativeLoginToken } from '../types'

function parseLoginTokenPayload(payload: unknown): NativeLoginToken {
  const parsed = parseConfirmedNativeResult(payload)
  if (
    parsed === null ||
    typeof parsed !== 'object' ||
    typeof (parsed as { token?: unknown }).token !== 'string'
  ) {
    throw new NativeTransportError(
      'payload-invalid',
      'Native getLoginToken() result must be a JSON string with a string token field; salt is optional for legacy hosts.',
    )
  }

  const salt = (parsed as { salt?: unknown }).salt
  if (salt !== undefined && typeof salt !== 'string') {
    throw new NativeTransportError(
      'payload-invalid',
      'Native getLoginToken() result salt must be a string when provided.',
    )
  }

  return {
    token: (parsed as { token: string }).token,
    ...(salt !== undefined ? { salt } : {}),
  }
}

const androidTransport = createInjectedObjectTransport<void, NativeLoginToken>({
  objectName: 'androidBridge',
  methodName: 'getLoginToken',
  serializeArgs: () => [],
  parseResult: parseLoginTokenPayload,
})

const iosTransport = createInjectedObjectTransport<void, NativeLoginToken>({
  objectName: 'iosBridge',
  methodName: 'getLoginToken',
  serializeArgs: () => [],
  parseResult: parseLoginTokenPayload,
})

function resolveTransport(hostWindow: NativeTransportWindow | undefined) {
  if (hostWindow?.androidBridge) {
    const resolution = androidTransport.resolve(hostWindow, undefined)
    if (!resolution.supported) return resolution
    return supportedCapability<void, NativeLoginToken>(() => resolution.invoke())
  }

  if (hostWindow?.iosBridge) {
    const resolution = iosTransport.resolve(hostWindow, undefined)
    if (!resolution.supported) return resolution
    return supportedCapability<void, NativeLoginToken>(() => resolution.invoke())
  }

  return unsupportedCapability(
    'bridge-unsupported',
    'Neither window.androidBridge nor window.iosBridge is available in the current host.',
  )
}

export const getLoginTokenCapability = defineCapability<
  'getLoginToken',
  void,
  NativeLoginToken
>({
  name: 'getLoginToken',
  description:
    'Read the current login token from the confirmed Android/iOS injected-object bridge.',
  platforms: ['android', 'ios'],
  sensitiveResult: true,
  resolve: resolveTransport,
})
