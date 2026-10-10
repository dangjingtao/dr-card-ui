import { describe, expect, it } from 'vitest'

import { AppError } from './appError'
import { createHttpClient, DEFAULT_HTTP_TIMEOUT_MS } from './httpClient'

function axiosLikeError(config: unknown, overrides: Record<string, unknown> = {}) {
  const message = typeof overrides.message === 'string' ? overrides.message : 'Axios probe error'

  return Object.assign(new Error(message), {
    name: 'AxiosError',
    isAxiosError: true,
    config,
    toJSON() {
      return {}
    },
    ...overrides,
  })
}

describe('HTTP foundation', () => {
  it('returns response data and applies the default timeout', async () => {
    const client = createHttpClient({
      baseURL: 'https://api.example.test',
      adapter: async (config) => ({
        data: { ok: true, timeout: config.timeout },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      }),
    })

    await expect(client.request({ url: '/ok' })).resolves.toEqual({
      ok: true,
      timeout: DEFAULT_HTTP_TIMEOUT_MS,
    })
  })

  it('injects auth headers through the configured provider', async () => {
    const client = createHttpClient({
      baseURL: 'https://api.example.test',
      authHeadersProvider: async () => ({ 'X-H017-Auth': 'opaque-proof' }),
      adapter: async (config) => ({
        data: { authHeader: config.headers.get('X-H017-Auth') },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      }),
    })

    await expect(client.request({ url: '/auth' })).resolves.toEqual({
      authHeader: 'opaque-proof',
    })
  })

  it('normalizes timeout, HTTP, and network failures into AppError', async () => {
    const timeoutClient = createHttpClient({
      baseURL: 'https://api.example.test',
      adapter: async (config) => {
        throw axiosLikeError(config, { code: 'ECONNABORTED', message: 'timeout' })
      },
    })
    await expect(timeoutClient.request({ url: '/timeout' })).rejects.toMatchObject({
      name: 'AppError',
      kind: 'timeout',
      code: 'ECONNABORTED',
    } satisfies Partial<AppError>)

    const httpClient = createHttpClient({
      baseURL: 'https://api.example.test',
      adapter: async (config) => {
        throw axiosLikeError(config, {
          code: 'ERR_BAD_RESPONSE',
          response: {
            data: { reason: 'maintenance' },
            status: 503,
            statusText: 'Service Unavailable',
            headers: {},
            config,
          },
        })
      },
    })
    await expect(httpClient.request({ url: '/unavailable' })).rejects.toMatchObject({
      name: 'AppError',
      kind: 'http',
      status: 503,
      details: { reason: 'maintenance' },
    } satisfies Partial<AppError>)

    const networkClient = createHttpClient({
      baseURL: 'https://api.example.test',
      adapter: async (config) => {
        throw axiosLikeError(config, { code: 'ERR_NETWORK' })
      },
    })
    await expect(networkClient.request({ url: '/offline' })).rejects.toMatchObject({
      name: 'AppError',
      kind: 'network',
      code: 'ERR_NETWORK',
    } satisfies Partial<AppError>)
  })

  it('rejects relative requests when no base URL is configured', async () => {
    const client = createHttpClient()

    await expect(client.request({ url: '/relative-without-base' })).rejects.toMatchObject({
      name: 'AppError',
      kind: 'configuration',
      code: 'HTTP_BASE_URL_MISSING',
    } satisfies Partial<AppError>)
  })

  it('reauthenticates once and replays HTTP 401 requests with the updated auth header', async () => {
    let attempts = 0
    let token = 'expired'
    const client = createHttpClient({
      baseURL: 'https://api.example.test',
      authHeadersProvider: () => ({ Authorization: `Bearer ${token}` }),
      onUnauthorized: () => {
        token = 'renewed'
      },
      adapter: async (config) => {
        attempts += 1
        if (attempts === 1) {
          throw axiosLikeError(config, {
            code: 'ERR_BAD_REQUEST',
            response: {
              data: { message: 'expired' },
              status: 401,
              statusText: 'Unauthorized',
              headers: {},
              config,
            },
          })
        }
        return {
          data: { authorization: config.headers.get('Authorization') },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        }
      },
    })

    await expect(client.request({ url: '/private' })).resolves.toEqual({
      authorization: 'Bearer renewed',
    })
    expect(attempts).toBe(2)
  })

  it('recognizes a top-level business code 401 and reports terminal auth failure after one replay', async () => {
    let attempts = 0
    let renewals = 0
    let failures = 0
    const client = createHttpClient({
      baseURL: 'https://api.example.test',
      onUnauthorized: () => {
        renewals += 1
      },
      onAuthFailure: () => {
        failures += 1
      },
      adapter: async (config) => {
        attempts += 1
        return {
          data: { code: 401 },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        }
      },
    })

    await expect(client.request({ url: '/private' })).rejects.toMatchObject({
      kind: 'business',
      status: 401,
    })
    expect(attempts).toBe(2)
    expect(renewals).toBe(1)
    expect(failures).toBe(1)
  })

  it('reports a second unauthorized response without starting another login loop', async () => {
    let attempts = 0
    let renewals = 0
    let failures = 0
    const client = createHttpClient({
      baseURL: 'https://api.example.test',
      onUnauthorized: () => {
        renewals += 1
      },
      onAuthFailure: () => {
        failures += 1
      },
      adapter: async (config) => {
        attempts += 1
        throw axiosLikeError(config, {
          code: 'ERR_BAD_REQUEST',
          response: {
            data: { message: 'expired' },
            status: 401,
            statusText: 'Unauthorized',
            headers: {},
            config,
          },
        })
      },
    })

    await expect(client.request({ url: '/private' })).rejects.toMatchObject({ status: 401 })
    expect(attempts).toBe(2)
    expect(renewals).toBe(1)
    expect(failures).toBe(1)
  })

  it('does not attach auth headers to absolute requests outside the configured API origin', async () => {
    const client = createHttpClient({
      baseURL: 'https://api.example.test',
      authHeadersProvider: () => ({ Authorization: 'Bearer private' }),
      adapter: async (config) => ({
        data: { authorization: config.headers.get('Authorization') },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      }),
    })

    await expect(client.request({ url: 'https://other.example.test/resource' })).resolves.toEqual({
      authorization: undefined,
    })
  })
})
