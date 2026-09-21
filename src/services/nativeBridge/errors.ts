import { NativeTransportError } from '../nativeBridgeTransport'
import type {
  NativeBridgeErrorCode,
  NativeFailurePayloadCode,
} from './types'

export class NativeBridgeError extends Error {
  readonly name = 'NativeBridgeError'

  constructor(
    readonly code: NativeBridgeErrorCode,
    readonly capability: string,
    message: string,
    readonly cause?: unknown,
  ) {
    super(message)
  }
}

export const NATIVE_FAILURE_CODE_MAP: Record<
  NativeFailurePayloadCode,
  NativeBridgeErrorCode
> = {
  cancel: 'native-cancelled',
  permission_denied: 'native-permission-denied',
  fail: 'native-failed',
}

export function mapNativeTransportErrorCode(
  code: NativeTransportError['code'],
): NativeBridgeErrorCode | null {
  if (code === 'native-cancelled') return NATIVE_FAILURE_CODE_MAP.cancel
  if (code === 'native-permission-denied') {
    return NATIVE_FAILURE_CODE_MAP.permission_denied
  }
  if (code === 'native-failed') return NATIVE_FAILURE_CODE_MAP.fail
  return null
}

export function toInvocationBridgeError(
  error: unknown,
  capability: string,
  phase: 'threw' | 'rejected',
): NativeBridgeError {
  if (error instanceof NativeBridgeError) return error

  if (error instanceof NativeTransportError) {
    const mappedCode = mapNativeTransportErrorCode(error.code)
    if (mappedCode) {
      return new NativeBridgeError(mappedCode, capability, error.message, error)
    }
  }

  return new NativeBridgeError(
    'invocation-failed',
    capability,
    `Native capability "${capability}" ${phase} during invocation.`,
    error,
  )
}
