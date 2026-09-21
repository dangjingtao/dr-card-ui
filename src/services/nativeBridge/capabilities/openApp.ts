import {
  createInjectedObjectTransport,
  NativeTransportError,
  serializeJsonValue,
  type NativeTransportWindow,
} from '../../nativeBridgeTransport'
import { defineCapability, resolveDualInjectedCapability } from '../core'
import { parseConfirmedNativeResult } from '../protocol'
import type {
  NativeOpenAppInput,
  NativeOpenAppResult,
} from '../types'

function validateInput(input: NativeOpenAppInput): NativeOpenAppInput {
  if (
    input === null ||
    typeof input !== 'object' ||
    !['open', 'store', 'detect'].includes((input as { action?: unknown }).action as string) ||
    typeof (input as { inviteCode?: unknown }).inviteCode !== 'string' ||
    typeof (input as { fallbackUrl?: unknown }).fallbackUrl !== 'string'
  ) {
    throw new NativeTransportError(
      'payload-invalid',
      'Native openApp() input requires action=open|store|detect plus string inviteCode and fallbackUrl fields.',
    )
  }

  return input
}

function parseResult(payload: unknown): NativeOpenAppResult {
  const parsed = parseConfirmedNativeResult(payload)
  if (
    parsed === null ||
    typeof parsed !== 'object' ||
    typeof (parsed as { success?: unknown }).success !== 'boolean' ||
    typeof (parsed as { installed?: unknown }).installed !== 'boolean'
  ) {
    throw new NativeTransportError(
      'payload-invalid',
      'Native openApp() result must be a JSON string with boolean success and installed fields.',
    )
  }

  return {
    success: (parsed as { success: boolean }).success,
    installed: (parsed as { installed: boolean }).installed,
  }
}

const androidTransport = createInjectedObjectTransport<
  NativeOpenAppInput,
  NativeOpenAppResult
>({
  objectName: 'androidBridge',
  methodName: 'openApp',
  serializeArgs: (input) => [serializeJsonValue(validateInput(input))],
  parseResult,
})

const iosTransport = createInjectedObjectTransport<
  NativeOpenAppInput,
  NativeOpenAppResult
>({
  objectName: 'iosBridge',
  methodName: 'openApp',
  serializeArgs: (input) => [serializeJsonValue(validateInput(input))],
  parseResult,
})

export const openAppCapability = defineCapability<
  'openApp',
  NativeOpenAppInput,
  NativeOpenAppResult
>({
  name: 'openApp',
  platforms: ['android', 'ios'],
  description:
    'Detect, open, or route to the App store through the confirmed Android/iOS injected-object contract.',
  sensitiveResult: false,
  resolve(hostWindow: NativeTransportWindow | undefined) {
    const sample: NativeOpenAppInput = {
      action: 'detect',
      inviteCode: '',
      fallbackUrl: '',
    }
    return resolveDualInjectedCapability(
      hostWindow,
      'openApp',
      sample,
      (input) => androidTransport.resolve(hostWindow!, input),
      (input) => iosTransport.resolve(hostWindow!, input),
    )
  },
})
