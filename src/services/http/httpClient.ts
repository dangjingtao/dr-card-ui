import axios, {
  AxiosHeaders,
  type AxiosAdapter,
  type AxiosRequestConfig,
  type AxiosResponse,
} from 'axios'
import { runtimePolicy } from '../../app/config/runtime'
import { AppError, toAppError } from './appError'

export const DEFAULT_HTTP_TIMEOUT_MS = 10_000

type Awaitable<T> = T | Promise<T>

export type HttpAuthHeadersProvider = () => Awaitable<Record<string, string> | undefined>

export interface HttpClientOptions {
  baseURL?: string
  timeoutMs?: number
  authHeadersProvider?: HttpAuthHeadersProvider
  adapter?: AxiosAdapter
}

export interface HttpClient {
  request<TResponse>(config: AxiosRequestConfig): Promise<TResponse>
}

let defaultAuthHeadersProvider: HttpAuthHeadersProvider | undefined

export function setHttpAuthHeadersProvider(provider: HttpAuthHeadersProvider | undefined) {
  defaultAuthHeadersProvider = provider
}

function normalizeBaseURL(value: string | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function isAbsoluteHttpUrl(url: string | undefined) {
  return Boolean(url && /^https?:\/\//i.test(url))
}

function createConfigurationError() {
  return new AppError({
    kind: 'configuration',
    code: 'HTTP_BASE_URL_MISSING',
    message: 'HTTP base URL 未配置',
  })
}

function getConfiguredBaseURL() {
  return normalizeBaseURL(import.meta.env.VITE_API_BASE_URL)
}

function getRuntimeBaseURL() {
  const configured = getConfiguredBaseURL()
  if (configured) return configured

  // H013/H014: browser Mock still crosses a real HTTP boundary. In dev/preview Mock mode,
  // use the current H5 origin so MSW can intercept relative business requests. API mode keeps
  // the H007 missing-base failure instead of silently falling back to the H5 origin.
  if (runtimePolicy.dataMode === 'mock' && typeof window !== 'undefined') {
    return window.location.origin
  }

  return undefined
}

export function createHttpClient(options: HttpClientOptions = {}): HttpClient {
  const instance = axios.create({
    baseURL: normalizeBaseURL(options.baseURL),
    timeout: options.timeoutMs ?? DEFAULT_HTTP_TIMEOUT_MS,
    adapter: options.adapter,
    headers: {
      Accept: 'application/json',
    },
  })

  instance.interceptors.request.use(async (config) => {
    const effectiveBaseURL = normalizeBaseURL(config.baseURL ?? instance.defaults.baseURL)
    if (!effectiveBaseURL && !isAbsoluteHttpUrl(config.url)) {
      throw createConfigurationError()
    }

    const authHeaders = await options.authHeadersProvider?.()
    if (authHeaders) {
      const headers = AxiosHeaders.from(config.headers)
      for (const [name, value] of Object.entries(authHeaders)) {
        headers.set(name, value)
      }
      config.headers = headers
    }

    return config
  })

  instance.interceptors.response.use(
    (response) => response,
    (error: unknown) => Promise.reject(toAppError(error)),
  )

  return {
    async request<TResponse>(config: AxiosRequestConfig) {
      try {
        const response: AxiosResponse<TResponse> = await instance.request<TResponse>(config)
        return response.data
      } catch (error) {
        throw toAppError(error)
      }
    },
  }
}

export const httpClient = createHttpClient({
  baseURL: getRuntimeBaseURL(),
  authHeadersProvider: () => defaultAuthHeadersProvider?.(),
})
