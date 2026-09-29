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
  NativeScanCodeInput,
  NativeScanCodeResult,
} from '../types'

function validateInput(input: NativeScanCodeInput): NativeScanCodeInput {
  if (
    input === null ||
    typeof input !== 'object' ||
    !['qr', 'bar', 'all'].includes((input as { scanType?: unknown }).scanType as string)
  ) {
    throw new NativeTransportError(
      'payload-invalid',
      'Native scanCode() input requires scanType to be qr, bar, or all.',
    )
  }

  return input
}

function parseResult(payload: unknown): NativeScanCodeResult {
  let parsed: unknown
  try {
    parsed = parseConfirmedNativeResult(payload)
  } catch (error) {
    if (error instanceof NativeTransportError && error.code !== 'payload-invalid') throw error
    parsed = parseJsonPayload(payload)
  }
  const data = parsed !== null && typeof parsed === 'object'
    ? (parsed as { data?: unknown }).data
    : undefined
  const code = typeof (parsed as { code?: unknown })?.code === 'string'
    ? (parsed as { code: string }).code
    : data !== null && typeof data === 'object'
      ? (data as { text?: unknown }).text
      : undefined
  const nativeCode = (parsed as { code?: unknown })?.code
  if (typeof nativeCode === 'number' && nativeCode !== 0) {
    const errorCode = nativeCode === 1 ? 'native-cancelled' : nativeCode === 2 || nativeCode === 3 ? 'native-permission-denied' : 'native-failed'
    throw new NativeTransportError(errorCode, 'Native scanCode reported ' + (parsed as { message?: string }).message)
  }
  if (typeof code !== 'string' || !code) {
    throw new NativeTransportError(
      'payload-invalid',
      'Native scanCode() result must be a JSON string with a string code field.',
    )
  }

  return { code }
}

const androidTransport = createCallbackInjectedObjectTransport<
  NativeScanCodeInput,
  NativeScanCodeResult
>({
  objectName: 'androidBridge',
  methodName: 'scanCode',
  callbackName: 'nativeBridgeCallback',
  callbackAliases: ['androidBridgeCallback'],
  serializeArgs: (input, callbackId) => [serializeJsonValue({ ...validateInput(input), callbackId })],
  parseResult,
})

const iosTransport = createCallbackInjectedObjectTransport<
  NativeScanCodeInput,
  NativeScanCodeResult
>({
  objectName: 'iosBridge',
  methodName: 'scanCode',
  callbackName: 'nativeBridgeCallback',
  serializeArgs: (input, callbackId) => [serializeJsonValue({ ...validateInput(input), callbackId })],
  parseResult,
})

function resolveTransport(hostWindow: NativeTransportWindow | undefined) {
  return resolveDualInjectedCapability<NativeScanCodeInput, NativeScanCodeResult>(
    hostWindow,
    'scanCode',
    { scanType: 'all' },
    (input) => androidTransport.resolve(hostWindow!, input),
    (input) => iosTransport.resolve(hostWindow!, input),
  )
}

export const scanCodeCapability = defineCapability<
  'scanCode',
  NativeScanCodeInput,
  NativeScanCodeResult
>({
  name: 'scanCode',
  platforms: ['android', 'ios'],
  description:
    'Scan a QR code, barcode, or either through the confirmed Android/iOS injected-object contract.',
  sensitiveResult: true,
  resolve: resolveTransport,
})
