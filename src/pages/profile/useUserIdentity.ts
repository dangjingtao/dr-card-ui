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
// Invalidate older network responses after account changes or authoritative updates.
let requestRevision = 0
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
    requestRevision++
    emit()
  }
  // Remount/re-enter must revalidate /detail, even if we already have a success
  // snapshot. Deduplicate simultaneous route consumers to avoid a request storm.
  if (!force && inFlight) return inFlight

  // Preserve a previously rendered identity during background revalidation.
  // The new token above still resets to loading immediately for account isolation.
  if (snapshot.state !== 'success') {
    snapshot = loading
    emit()
  }
  const revision = ++requestRevision
  const request = fetchUserProfileDetail().then(
    (data) => {
      if (requestRevision === revision && currentToken === key && tokenKey() === key) {
        snapshot = { state: 'success', data }
        emit()
      }
    },
    (error: unknown) => {
      if (requestRevision === revision && currentToken === key && tokenKey() === key) {
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
  // A pending GET may contain older data than this successful POST response.
  requestRevision++
  inFlight = undefined
  snapshot = {
    state: 'success',
    data: {
      nickname: value.nick_name.trim(),
      grade: value.student_grade?.trim() ?? '',
      avatar: value.avatar_img?.trim() || undefined,
      ...(value.birthday !== undefined
        ? { birthday: value.birthday ?? '' }
        : snapshot.state === 'success' && snapshot.data.birthday !== undefined
          ? { birthday: snapshot.data.birthday } : {}),
      ...(value.consume_password_set !== undefined
        ? { pinConfigured: value.consume_password_set }
        : snapshot.state === 'success' && snapshot.data.pinConfigured !== undefined
          ? { pinConfigured: snapshot.data.pinConfigured } : {}),
    },
  }
  emit()
}

export function clearUserIdentity() {
  currentToken = undefined
  requestRevision++
  snapshot = loading
  inFlight = undefined
  emit()
}

export function useUserIdentity() {
  const remote = useSyncExternalStore(subscribe, getSnapshot, () => loading)
  useEffect(() => {
    void refreshUserIdentity()
    const onAuthChange = () => { clearUserIdentity(); void refreshUserIdentity(true) }
    // WebViews often resume without remounting the SPA. Revalidate on foreground
    // and bfcache restore, while sharing the same in-flight request across
    // multiple identity consumers. Do not invalidate a valid snapshot meanwhile.
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refreshUserIdentity()
    }
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) void refreshUserIdentity()
    }
    window.addEventListener('dr-card-ui:auth-session-changed', onAuthChange)
    window.addEventListener('dr-card-ui:auth-session-cleared', clearUserIdentity)
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('pageshow', onPageShow)
    return () => {
      window.removeEventListener('dr-card-ui:auth-session-changed', onAuthChange)
      window.removeEventListener('dr-card-ui:auth-session-cleared', clearUserIdentity)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [])
  return { remote, reload: () => refreshUserIdentity(true) }
}
