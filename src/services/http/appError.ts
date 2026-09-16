import axios, { type AxiosError } from 'axios'

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

function getAxiosError(error: unknown): AxiosError<unknown> | null {
  return axios.isAxiosError(error) ? (error as AxiosError<unknown>) : null
}

export function toAppError(error: unknown): AppError {
  if (isAppError(error)) return error

  const axiosError = getAxiosError(error)
  if (!axiosError) {
    return new AppError({
      kind: 'unknown',
      message: error instanceof Error ? error.message : '未知错误',
      cause: error,
    })
  }

  if (axiosError.code === 'ERR_CANCELED') {
    return new AppError({
      kind: 'cancelled',
      message: '请求已取消',
      code: axiosError.code,
      cause: error,
    })
  }

  if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
    return new AppError({
      kind: 'timeout',
      message: '请求超时',
      code: axiosError.code,
      cause: error,
    })
  }

  if (axiosError.response) {
    return new AppError({
      kind: 'http',
      message: `HTTP ${axiosError.response.status}`,
      code: axiosError.code ?? `HTTP_${axiosError.response.status}`,
      status: axiosError.response.status,
      details: axiosError.response.data,
      cause: error,
    })
  }

  return new AppError({
    kind: 'network',
    message: '网络请求失败',
    code: axiosError.code,
    cause: error,
  })
}

export function createBusinessError(message: string, options: Omit<AppErrorInit, 'kind' | 'message'> = {}) {
  return new AppError({ kind: 'business', message, ...options })
}

export function createContractError(message: string, options: Omit<AppErrorInit, 'kind' | 'message'> = {}) {
  return new AppError({ kind: 'contract', message, ...options })
}
