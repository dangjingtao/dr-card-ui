import { useEffect, useSyncExternalStore } from 'react'
import { getAuthSession } from '../../services/auth/session'
import { fetchUserProfileDetail, type UserProfileDetail, type UserUpdateResult } from '../../services/userProfile'

type IdentityState =
  | { state: 'loading' }
  | { state: 'success'; data: UserProfileDetail }
  | { state: 'error'; message: string }

const loading: IdentityState = { state: 'loading' }
let currentToken: string | undefined
let snapshot: IdentityState = loading
let inFlight: Promise<void> | undefined
const listeners = new Set<() => void>()

function tokenKey() {
  return getAuthSession()?.accessToken ?? ''
}

function emit() {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

function getSnapshot(): IdentityState {
  // A new token must never see the previous account's identity, even for one render.
  return currentToken === tokenKey() ? snapshot : loading
}

/** GET /detail reads the database; /profile contains a login-time Redis snapshot. */
export async function refreshUserIdentity(force = false): Promise<void> {
  const key = tokenKey()
  if (key !== currentToken) {
    currentToken = key
    snapshot = loading
    inFlight = undefined
    emit()
  }
  if (!force && inFlight) return inFlight
  if (!force && snapshot.state === 'success') return

  snapshot = loading
  emit()
  const request = fetchUserProfileDetail().then(
    (data) => {
      if (currentToken === key && tokenKey() === key) {
        snapshot = { state: 'success', data }
        emit()
      }
    },
    (error: unknown) => {
      if (currentToken === key && tokenKey() === key) {
        snapshot = { state: 'error', message: error instanceof Error ? error.message : '用户资料加载失败' }
        emit()
      }
    },
  )
  inFlight = request
  try { await request } finally { if (currentToken === key && inFlight === request) inFlight = undefined }
}

/** POST /update returns database-backed values, unlike the stale /profile login snapshot. */
export function acceptUserIdentityUpdate(value: UserUpdateResult) {
  if (currentToken !== tokenKey()) return
  snapshot = {
    state: 'success',
    data: {
      nickname: value.nick_name.trim(),
      grade: value.student_grade?.trim() ?? '',
      avatar: value.avatar_img?.trim() || undefined,
    },
  }
  emit()
}

export function clearUserIdentity() {
  currentToken = undefined
  snapshot = loading
  inFlight = undefined
  emit()
}

export function useUserIdentity() {
  const remote = useSyncExternalStore(subscribe, getSnapshot, () => loading)
  useEffect(() => {
    void refreshUserIdentity()
    const onAuthChange = () => { clearUserIdentity(); void refreshUserIdentity(true) }
    window.addEventListener('dr-card-ui:auth-session-changed', onAuthChange)
    return () => window.removeEventListener('dr-card-ui:auth-session-changed', onAuthChange)
  }, [])
  return { remote, reload: () => refreshUserIdentity(true) }
}
