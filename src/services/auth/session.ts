import { runtimePolicy } from '../../app/config/runtime'
import { getLoginToken } from '../nativeBridge'
import { createContractError, isAppError } from '../http/appError'
import { STORAGE_KEYS, storage } from '../../storage'
import {
  createHttpClient,
  setHttpAuthFailureHandler,
  setHttpAuthHeadersProvider,
  setHttpUnauthorizedHandler,
} from '../http/httpClient'

const AUTH_FAILURE_EVENT = 'dr-card-ui:auth-failure'
const AUTH_EXPIRED_EVENT = 'dr-card-ui:auth-expired'
const LOGIN_PATH = '/api/oauth/login'

export interface AuthSession {
  userInfo: unknown
  accessToken: string
}

interface LoginResponse {
  userInfo: unknown
  accessToken: string
}

interface LoginEnvelope {
  code?: unknown
  data?: unknown
}

const loginClient = createHttpClient({
  baseURL: runtimePolicy.apiBaseUrl ?? undefined,
  timeoutMs: 10_000,
})

let inFlightLogin: Promise<AuthSession> | undefined
let authFlowEnabled = false
let initializedForDocument = false
let volatileSession: AuthSession | undefined

function readSession(): AuthSession | undefined {
  const value = storage.read(STORAGE_KEYS.authSession)
  if (value && value.accessToken.trim()) {
    return { userInfo: volatileSession?.userInfo ?? null, accessToken: value.accessToken }
  }
  return volatileSession
}

function writeSession(session: AuthSession) {
  volatileSession = session
  storage.write(STORAGE_KEYS.authSession, { accessToken: session.accessToken })
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('dr-card-ui:auth-session-changed'))
}

export function clearAuthSession() {
  volatileSession = undefined
  storage.remove(STORAGE_KEYS.authSession)
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('dr-card-ui:auth-session-cleared'))
}

export function getAuthSession() {
  return readSession()
}

export function setAuthFlowEnabled(enabled: boolean) {
  authFlowEnabled = enabled && runtimePolicy.dataMode === 'api'
}

/** Accept the confirmed backend envelope without weakening the login contract. */
export function parseLoginResponse(result: unknown): LoginResponse {
  if (!result || typeof result !== 'object') {
    throw createContractError('登录接口返回格式无效', { code: 'AUTH_LOGIN_RESPONSE_INVALID' })
  }

  const response = result as LoginEnvelope & Partial<LoginResponse>
  const payload =
    (response.code === 0 || response.code === '0') &&
    response.data &&
    typeof response.data === 'object'
      ? (response.data as Partial<LoginResponse>)
      : (response as Partial<LoginResponse>)

  if (typeof payload.accessToken !== 'string' || !payload.accessToken.trim() || !('userInfo' in payload)) {
    throw createContractError('登录响应必须包含 userInfo 和 accessToken', {
      code: 'AUTH_LOGIN_RESPONSE_INVALID',
      details: result,
    })
  }

  return { userInfo: payload.userInfo, accessToken: payload.accessToken }
}

async function loginFromNative(): Promise<AuthSession> {
  const credentials = await getLoginToken()
  if (!credentials.token.trim() || !credentials.salt?.trim()) {
    throw createContractError('Native 登录凭据缺少 token 或 salt', {
      code: 'AUTH_NATIVE_CREDENTIALS_INVALID',
    })
  }

  const result = await loginClient.request<unknown>({
    method: 'POST',
    url: LOGIN_PATH,
    data: { salt: credentials.salt, token: credentials.token },
    skipAuth: true,
  })

  const session = parseLoginResponse(result)
  writeSession(session)
  return session
}

export function authenticate(force = false): Promise<AuthSession> {
  if (!force) {
    const current = readSession()
    if (current) return Promise.resolve(current)
  }
  if (inFlightLogin) return inFlightLogin

  clearAuthSession()
  inFlightLogin = loginFromNative().finally(() => {
    inFlightLogin = undefined
  })
  return inFlightLogin
}

export function bootstrapAuthSession(): Promise<AuthSession> {
  if (!initializedForDocument) {
    initializedForDocument = true
    return authenticate(true)
  }
  return authenticate()
}

async function reauthenticateAfterUnauthorized() {
  try {
    await authenticate(true)
  } catch (error) {
    clearAuthSession()
    if (typeof window !== 'undefined') {
      const eventName =
        isAppError(error) && error.status === 401
          ? AUTH_EXPIRED_EVENT
          : AUTH_FAILURE_EVENT
      window.dispatchEvent(new Event(eventName))
    }
    throw error
  }
}

/** Refresh the shared Native/H5 auth session after a failed non-idempotent request.
 * Caller must surface the original error; NEVER replay the chat POST automatically. */
export async function refreshChatAuthAfterUnauthorized(): Promise<void> {
  if (authFlowEnabled) await reauthenticateAfterUnauthorized()
}

setHttpAuthHeadersProvider(() => {
  if (!authFlowEnabled) return undefined
  const session = readSession()
  return session ? { Authorization: `Bearer ${session.accessToken}` } : undefined
})
setHttpUnauthorizedHandler(() => {
  if (authFlowEnabled) return reauthenticateAfterUnauthorized()
})
setHttpAuthFailureHandler(() => {
  if (authFlowEnabled && typeof window !== 'undefined') {
    clearAuthSession()
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT))
  }
})

export { AUTH_EXPIRED_EVENT, AUTH_FAILURE_EVENT }
