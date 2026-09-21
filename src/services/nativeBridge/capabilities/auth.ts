import {
  createInjectedObjectTransport,
  NativeTransportError,
  type NativeTransportWindow,
} from '../../nativeBridgeTransport'
import { defineCapability, resolveDualInjectedCapability } from '../core'
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
      'Native getLoginToken() result must be a JSON string with a string token field.',
    )
  }

  return { token: (parsed as { token: string }).token }
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
  return resolveDualInjectedCapability<void, NativeLoginToken>(
    hostWindow,
    'getLoginToken',
    undefined,
    (input) => androidTransport.resolve(hostWindow!, input),
    (input) => iosTransport.resolve(hostWindow!, input),
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
