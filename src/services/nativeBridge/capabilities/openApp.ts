import {
  createCallbackInjectedObjectTransport,
  NativeTransportError,
  serializeJsonValue,
  type NativeTransportWindow,
} from '../../nativeBridgeTransport'
import { defineCapability, resolveDualInjectedCapability } from '../core'
import { parseConfirmedNativeAsyncResult } from '../protocol'
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
  const parsed = parseConfirmedNativeAsyncResult(payload)
  if (parsed === null || typeof parsed !== 'object') {
    throw new NativeTransportError(
      'payload-invalid',
      'Native openApp() result must be an object payload.',
    )
  }

  const legacySuccess = (parsed as { success?: unknown }).success
  const installed = (parsed as { installed?: unknown }).installed
  if (typeof legacySuccess === 'boolean' && typeof installed === 'boolean') {
    return { success: legacySuccess, installed }
  }

  if (typeof installed === 'boolean') {
    return { success: true, installed }
  }

  const action = (parsed as { action?: unknown }).action
  if (action === 'open') return { success: true, installed: true }
  if (action === 'store') return { success: true, installed: false }

  throw new NativeTransportError(
    'payload-invalid',
    'Native openApp() callback data requires installed:boolean for detect or action=open|store.',
  )
}

const androidTransport = createCallbackInjectedObjectTransport<
  NativeOpenAppInput,
  NativeOpenAppResult
>({
  objectName: 'androidBridge',
  callbackName: 'nativeBridgeCallback',
  callbackAliases: ['androidBridgeCallback'],
  methodName: 'openApp',
  serializeArgs: (input, callbackId) => [serializeJsonValue({ ...validateInput(input), callbackId })],
  parseResult,
})

const iosTransport = createCallbackInjectedObjectTransport<
  NativeOpenAppInput,
  NativeOpenAppResult
>({
  objectName: 'iosBridge',
  callbackName: 'nativeBridgeCallback',
  methodName: 'openApp',
  serializeArgs: (input, callbackId) => [serializeJsonValue({ ...validateInput(input), callbackId })],
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
