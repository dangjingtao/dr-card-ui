export type NativeTransportUnsupportedCode = 'bridge-unsupported' | 'capability-unsupported'

export type NativeTransportResolution<TResult> =
  | {
      supported: false
      code: NativeTransportUnsupportedCode
      message: string
    }
  | {
      supported: true
      invoke: () => TResult | PromiseLike<TResult>
    }

export type IOSMessageHandler = {
  postMessage: (payload: unknown) => void
}

export type NativeTransportWindow = Window & {
  androidBridge?: Record<string, unknown>
  webkit?: {
    messageHandlers?: Record<string, IOSMessageHandler | undefined>
  }
}

export type NativeTransportErrorCode =
  | 'serialization-failed'
  | 'payload-invalid'
  | 'callback-timeout'
  | 'callback-failed'
  | 'callback-concurrency-unsupported'
  | 'post-message-failed'

export class NativeTransportError extends Error {
  readonly name = 'NativeTransportError'

  constructor(
    readonly code: NativeTransportErrorCode,
    message: string,
    readonly cause?: unknown,
  ) {
    super(message)
  }
}

export type NativeTransportInvocationOptions = {
  timeoutMs?: number
}

export type NativeArgumentSerializer<TInput> = (input: TInput) => readonly unknown[]
export type NativeResultParser<TResult> = (payload: unknown) => TResult

export function identityResultParser<TResult = unknown>(payload: unknown): TResult {
  return payload as TResult
}

export function serializeJsonValue(value: unknown): string {
  try {
    const serialized = JSON.stringify(value)
    if (typeof serialized !== 'string') {
      throw new TypeError('JSON.stringify did not produce a string payload.')
    }
    return serialized
  } catch (error) {
    if (error instanceof NativeTransportError) throw error
    throw new NativeTransportError(
      'serialization-failed',
      'Native transport could not serialize the payload as JSON.',
      error,
    )
  }
}

export function parseJsonPayload<TResult = unknown>(payload: unknown): TResult {
  if (typeof payload === 'string') {
    try {
      return JSON.parse(payload) as TResult
    } catch (error) {
      throw new NativeTransportError(
        'payload-invalid',
        'Native transport received a malformed JSON string result.',
        error,
      )
    }
  }

  if (payload !== null && typeof payload === 'object') {
    return payload as TResult
  }

  throw new NativeTransportError(
    'payload-invalid',
    'Native transport expected a JSON string or object result.',
  )
}

function resolveHostObject(
  hostWindow: NativeTransportWindow | undefined,
  objectName: string,
): Record<string, unknown> | undefined {
  if (!hostWindow) return undefined

  const candidate = (hostWindow as unknown as Record<string, unknown>)[objectName]
  if (candidate === null || (typeof candidate !== 'object' && typeof candidate !== 'function')) {
    return undefined
  }

  return candidate as Record<string, unknown>
}

export interface AndroidInjectedObjectTransportConfig<TInput, TResult> {
  objectName: string
  methodName: string
  serializeArgs: NativeArgumentSerializer<TInput>
  parseResult?: NativeResultParser<TResult>
}

export function createAndroidInjectedObjectTransport<TInput, TResult>(
  config: AndroidInjectedObjectTransportConfig<TInput, TResult>,
) {
  const parseResult = config.parseResult ?? identityResultParser<TResult>

  return {
    resolve(
      hostWindow: NativeTransportWindow | undefined,
      input: TInput,
    ): NativeTransportResolution<TResult> {
      const bridge = resolveHostObject(hostWindow, config.objectName)
      if (!bridge) {
        return {
          supported: false,
          code: 'bridge-unsupported',
          message: 'window.' + config.objectName + ' is not available in the current host.',
        }
      }

      const method = bridge[config.methodName]
      if (typeof method !== 'function') {
        return {
          supported: false,
          code: 'capability-unsupported',
          message:
            config.objectName +
            '.' +
            config.methodName +
            ' is not available in the current host.',
        }
      }

      return {
        supported: true,
        invoke: () => {
          let args: readonly unknown[]
          try {
            args = config.serializeArgs(input)
          } catch (error) {
            if (error instanceof NativeTransportError) throw error
            throw new NativeTransportError(
              'serialization-failed',
              'Android injected-object transport could not serialize method arguments.',
              error,
            )
          }

          const rawResult = method.call(bridge, ...args)
          if (
            rawResult !== null &&
            (typeof rawResult === 'object' || typeof rawResult === 'function') &&
            typeof (rawResult as PromiseLike<unknown>).then === 'function'
          ) {
            return Promise.resolve(rawResult).then((payload) => parseResult(payload))
          }

          return parseResult(rawResult)
        },
      }
    },
  }
}

type IOSCallbackSuccess = {
  ok: true
  payload: unknown
}

type IOSCallbackFailure = {
  ok: false
  error?: unknown
}

export type IOSCallbackOutcome = IOSCallbackSuccess | IOSCallbackFailure

export type IOSRequestIdCallbackOutcome = IOSCallbackOutcome & {
  requestId: string
}

type IOSMessageHandlerTransportBase<TResult> = {
  handlerName: string
  timeoutMs?: number
  parseResult?: NativeResultParser<TResult>
}

export type IOSRequestIdTransportConfig<TInput, TResult> =
  IOSMessageHandlerTransportBase<TResult> & {
    correlation: 'request-id'
    serializeRequest: (context: { requestId: string; input: TInput }) => unknown
    parseCallback: (payload: unknown) => IOSRequestIdCallbackOutcome
    requestIdFactory?: () => string
  }

export type IOSSingleFlightTransportConfig<TInput, TResult> =
  IOSMessageHandlerTransportBase<TResult> & {
    correlation: 'single-flight'
    serializeRequest: (context: { input: TInput }) => unknown
    parseCallback: (payload: unknown) => IOSCallbackOutcome
  }

export type IOSMessageHandlerTransportConfig<TInput, TResult> =
  | IOSRequestIdTransportConfig<TInput, TResult>
  | IOSSingleFlightTransportConfig<TInput, TResult>

type PendingCallback<TResult> = {
  resolve: (value: TResult) => void
  reject: (reason: unknown) => void
  timeoutId: ReturnType<typeof setTimeout>
}

const DEFAULT_CALLBACK_TIMEOUT_MS = 5_000
let requestSequence = 0

function defaultRequestIdFactory(): string {
  requestSequence += 1
  return 'h5-' + Date.now().toString(36) + '-' + requestSequence.toString(36)
}

function ensurePositiveTimeout(timeoutMs: number): void {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new NativeTransportError(
      'callback-timeout',
      'iOS callback transport requires a positive finite timeout.',
    )
  }
}

export function createIOSMessageHandlerTransport<TInput, TResult>(
  config: IOSMessageHandlerTransportConfig<TInput, TResult>,
) {
  const parseResult = config.parseResult ?? identityResultParser<TResult>
  const pending = new Map<string, PendingCallback<TResult>>()
  let singleFlightRequestId: string | undefined

  function cleanup(requestId: string): PendingCallback<TResult> | undefined {
    const entry = pending.get(requestId)
    if (!entry) return undefined

    clearTimeout(entry.timeoutId)
    pending.delete(requestId)
    if (singleFlightRequestId === requestId) singleFlightRequestId = undefined
    return entry
  }

  function rejectRequest(
    requestId: string,
    code: NativeTransportErrorCode,
    message: string,
    cause?: unknown,
  ): boolean {
    const entry = cleanup(requestId)
    if (!entry) return false

    entry.reject(new NativeTransportError(code, message, cause))
    return true
  }

  function resolveRequest(requestId: string, payload: unknown): boolean {
    const entry = cleanup(requestId)
    if (!entry) return false

    try {
      entry.resolve(parseResult(payload))
    } catch (error) {
      entry.reject(
        error instanceof NativeTransportError
          ? error
          : new NativeTransportError(
              'payload-invalid',
              'iOS callback transport could not parse the callback result.',
              error,
            ),
      )
    }

    return true
  }

  function invoke(
    handler: IOSMessageHandler,
    input: TInput,
    options: NativeTransportInvocationOptions,
  ): Promise<TResult> {
    const timeoutMs = options.timeoutMs ?? config.timeoutMs ?? DEFAULT_CALLBACK_TIMEOUT_MS

    try {
      ensurePositiveTimeout(timeoutMs)
    } catch (error) {
      return Promise.reject(error)
    }

    if (config.correlation === 'single-flight' && singleFlightRequestId) {
      return Promise.reject(
        new NativeTransportError(
          'callback-concurrency-unsupported',
          'This iOS host protocol cannot safely correlate concurrent callbacks.',
        ),
      )
    }

    const requestId =
      config.correlation === 'request-id'
        ? (config.requestIdFactory ?? defaultRequestIdFactory)()
        : defaultRequestIdFactory()

    let payload: unknown
    try {
      payload =
        config.correlation === 'request-id'
          ? config.serializeRequest({ requestId, input })
          : config.serializeRequest({ input })
    } catch (error) {
      return Promise.reject(
        error instanceof NativeTransportError
          ? error
          : new NativeTransportError(
              'serialization-failed',
              'iOS message-handler transport could not serialize the request.',
              error,
            ),
      )
    }

    return new Promise<TResult>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        const entry = pending.get(requestId)
        if (!entry) return

        pending.delete(requestId)
        if (singleFlightRequestId === requestId) singleFlightRequestId = undefined
        entry.reject(
          new NativeTransportError(
            'callback-timeout',
            'iOS callback transport timed out before Native completed the request.',
          ),
        )
      }, timeoutMs)

      pending.set(requestId, { resolve, reject, timeoutId })
      if (config.correlation === 'single-flight') singleFlightRequestId = requestId

      try {
        handler.postMessage.call(handler, payload)
      } catch (error) {
        rejectRequest(
          requestId,
          'post-message-failed',
          'iOS messageHandler.postMessage threw during invocation.',
          error,
        )
      }
    })
  }

  return {
    resolve(
      hostWindow: NativeTransportWindow | undefined,
      input: TInput,
      options: NativeTransportInvocationOptions = {},
    ): NativeTransportResolution<TResult> {
      const messageHandlers = hostWindow?.webkit?.messageHandlers
      if (!messageHandlers) {
        return {
          supported: false,
          code: 'bridge-unsupported',
          message: 'window.webkit.messageHandlers is not available in the current host.',
        }
      }

      const handler = messageHandlers[config.handlerName]
      if (!handler || typeof handler.postMessage !== 'function') {
        return {
          supported: false,
          code: 'capability-unsupported',
          message:
            'webkit.messageHandlers.' +
            config.handlerName +
            ' is not available in the current host.',
        }
      }

      return {
        supported: true,
        invoke: () => invoke(handler, input, options),
      }
    },

    handleCallback(payload: unknown): boolean {
      let outcome: IOSCallbackOutcome
      let requestId: string | undefined

      try {
        if (config.correlation === 'request-id') {
          const parsed = config.parseCallback(payload)
          requestId = parsed.requestId
          outcome = parsed
        } else {
          outcome = config.parseCallback(payload)
          requestId = singleFlightRequestId
        }
      } catch {
        return false
      }

      if (!requestId) return false

      if (outcome.ok) {
        return resolveRequest(requestId, outcome.payload)
      }

      return rejectRequest(
        requestId,
        'callback-failed',
        'iOS callback reported a Native-side failure.',
        outcome.error,
      )
    },

    pendingCount(): number {
      return pending.size
    },
  }
}
