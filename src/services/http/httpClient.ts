import axios, {
  AxiosHeaders,
  type AxiosAdapter,
  type AxiosRequestConfig,
  type AxiosResponse,
} from 'axios'
import { runtimePolicy } from '../../app/config/runtime'
import { AppError, toAppError } from './appError'

export const DEFAULT_HTTP_TIMEOUT_MS = 10_000

/**
 * Browser-only synthetic origin used when dev/preview runs in API Mock mode without a confirmed
 * backend base URL. MSW intercepts matched requests before they leave the browser. API mode never
 * receives this fallback, so test/prod still fail closed when VITE_API_BASE_URL is absent.
 */
export const MOCK_API_BASE_URL = 'https://mock-api.dr-card.invalid'

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

function getDefaultBaseURL() {
  return getConfiguredBaseURL() ?? (runtimePolicy.dataMode === 'mock' ? MOCK_API_BASE_URL : undefined)
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
  baseURL: getDefaultBaseURL(),
  authHeadersProvider: () => defaultAuthHeadersProvider?.(),
})
