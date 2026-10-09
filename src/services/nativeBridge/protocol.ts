import {
  NativeTransportError,
  parseJsonPayload,
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

/**
 * Parse an asynchronous injected-object result.
 *
 * Async target contract:
 *   { code: number, message: string, data: unknown }
 *
 * H5 also accepts the previous bare JSON result during migration. Sync-only
 * capabilities keep using parseConfirmedNativeResult() so their contract stays strict.
 */
export function parseConfirmedNativeAsyncResult(payload: unknown): unknown {
  const parsed = parseJsonPayload<unknown>(payload)

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

  if (parsed !== null && typeof parsed === 'object') {
    const code = (parsed as { code?: unknown }).code
    if (typeof code === 'number') {
      if (code === 0) return (parsed as { data?: unknown }).data
      if (code === 1) {
        throw new NativeTransportError(
          'native-cancelled',
          'Native asynchronous invocation was cancelled by the user.',
        )
      }
      if (code === 2 || code === 3) {
        throw new NativeTransportError(
          'native-permission-denied',
          'Native asynchronous invocation was denied by system permission.',
        )
      }
      throw new NativeTransportError(
        'native-failed',
        'Native asynchronous invocation reported failure.',
      )
    }
  }

  return parsed
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}
