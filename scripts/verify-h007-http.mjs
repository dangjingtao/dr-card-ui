import assert from 'node:assert/strict'
import { createServer } from 'vite'

function axiosLikeError(config, overrides = {}) {
  return Object.assign(new Error(overrides.message ?? 'Axios probe error'), {
    name: 'AxiosError',
    isAxiosError: true,
    config,
    toJSON() {
      return {}
    },
    ...overrides,
  })
}

const server = await createServer({
  appType: 'custom',
  logLevel: 'error',
  server: { middlewareMode: true },
})

try {
  const { AppError } = await server.ssrLoadModule('/src/services/http/appError.ts')
  const { createHttpClient, DEFAULT_HTTP_TIMEOUT_MS } = await server.ssrLoadModule(
    '/src/services/http/httpClient.ts',
  )

  assert.equal(DEFAULT_HTTP_TIMEOUT_MS, 10_000)

  const successClient = createHttpClient({
    baseURL: 'https://api.example.test',
    adapter: async (config) => ({
      data: { ok: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }),
  })
  assert.deepEqual(await successClient.request({ url: '/ok' }), { ok: true })

  const authClient = createHttpClient({
    baseURL: 'https://api.example.test',
    authHeadersProvider: () => ({ 'X-H007-Auth': 'opaque-proof' }),
    adapter: async (config) => ({
      data: { authHeader: config.headers.get('X-H007-Auth') },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }),
  })
  assert.deepEqual(await authClient.request({ url: '/auth' }), { authHeader: 'opaque-proof' })

  const timeoutClient = createHttpClient({
    baseURL: 'https://api.example.test',
    adapter: async (config) => {
      throw axiosLikeError(config, { code: 'ECONNABORTED', message: 'timeout' })
    },
  })
  await assert.rejects(
    timeoutClient.request({ url: '/timeout' }),
    (error) => error instanceof AppError && error.kind === 'timeout' && error.code === 'ECONNABORTED',
  )

  const httpErrorClient = createHttpClient({
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
  await assert.rejects(
    httpErrorClient.request({ url: '/unavailable' }),
    (error) =>
      error instanceof AppError &&
      error.kind === 'http' &&
      error.status === 503 &&
      error.details?.reason === 'maintenance',
  )

  const networkErrorClient = createHttpClient({
    baseURL: 'https://api.example.test',
    adapter: async (config) => {
      throw axiosLikeError(config, { code: 'ERR_NETWORK' })
    },
  })
  await assert.rejects(
    networkErrorClient.request({ url: '/offline' }),
    (error) => error instanceof AppError && error.kind === 'network' && error.code === 'ERR_NETWORK',
  )

  const missingBaseClient = createHttpClient()
  await assert.rejects(
    missingBaseClient.request({ url: '/relative-without-base' }),
    (error) =>
      error instanceof AppError &&
      error.kind === 'configuration' &&
      error.code === 'HTTP_BASE_URL_MISSING',
  )

  console.log(
    'H007 HTTP PASS: success, auth hook, timeout, HTTP error, network error, and missing-base configuration are deterministic.',
  )
} finally {
  await server.close()
}
