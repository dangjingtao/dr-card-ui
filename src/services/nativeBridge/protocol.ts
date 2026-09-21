import {
  NativeTransportError,
  parseJsonStringPayload,
} from '../nativeBridgeTransport'

export function parseConfirmedNativeResult(payload: unknown): unknown {
  const parsed = parseJsonStringPayload<unknown>(payload)

  if (parsed !== null && typeof parsed === 'object' && 'error' in parsed) {
    const error = (parsed as { error?: unknown }).error
    if (error === 'cancel') {
      throw new NativeTransportError(
        'native-cancelled',
        'Native invocation was cancelled by the user.',
      )
    }
    if (error === 'permission_denied') {
      throw new NativeTransportError(
        'native-permission-denied',
        'Native invocation was denied by system permission.',
      )
    }
    if (error === 'fail') {
      throw new NativeTransportError(
        'native-failed',
        'Native invocation reported a generic failure.',
      )
    }

    throw new NativeTransportError(
      'payload-invalid',
      'Native invocation returned an unknown error code.',
    )
  }

  return parsed
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}
