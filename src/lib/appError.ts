export type AppErrorKind =
  | 'configuration'
  | 'network'
  | 'timeout'
  | 'http'
  | 'business'
  | 'contract'
  | 'cancelled'
  | 'unknown'

export interface AppErrorInit {
  kind: AppErrorKind
  message: string
  code?: string
  status?: number
  details?: unknown
  cause?: unknown
}

export class AppError extends Error {
  readonly kind: AppErrorKind
  readonly code?: string
  readonly status?: number
  readonly details?: unknown

  constructor({ kind, message, code, status, details, cause }: AppErrorInit) {
    super(message, { cause })
    this.name = 'AppError'
    this.kind = kind
    this.code = code
    this.status = status
    this.details = details
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

export function createBusinessError(
  message: string,
  options: Omit<AppErrorInit, 'kind' | 'message'> = {},
) {
  return new AppError({ kind: 'business', message, ...options })
}

export function createContractError(
  message: string,
  options: Omit<AppErrorInit, 'kind' | 'message'> = {},
) {
  return new AppError({ kind: 'contract', message, ...options })
}
