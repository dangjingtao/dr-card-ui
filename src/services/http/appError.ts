import axios, { type AxiosError } from 'axios'

import { AppError, isAppError } from '../../lib/appError'

export {
  AppError,
  createBusinessError,
  createContractError,
  isAppError,
  type AppErrorInit,
  type AppErrorKind,
} from '../../lib/appError'

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
