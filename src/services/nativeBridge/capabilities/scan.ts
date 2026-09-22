import {
  createInjectedObjectTransport,
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
  const parsed = parseConfirmedNativeResult(payload)
  if (
    parsed === null ||
    typeof parsed !== 'object' ||
    typeof (parsed as { code?: unknown }).code !== 'string'
  ) {
    throw new NativeTransportError(
      'payload-invalid',
      'Native scanCode() result must be a JSON string with a string code field.',
    )
  }

  return { code: (parsed as { code: string }).code }
}

const androidTransport = createInjectedObjectTransport<
  NativeScanCodeInput,
  NativeScanCodeResult
>({
  objectName: 'androidBridge',
  methodName: 'scanCode',
  serializeArgs: (input) => [serializeJsonValue(validateInput(input))],
  parseResult,
})

const iosTransport = createInjectedObjectTransport<
  NativeScanCodeInput,
  NativeScanCodeResult
>({
  objectName: 'iosBridge',
  methodName: 'scanCode',
  serializeArgs: (input) => [serializeJsonValue(validateInput(input))],
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
