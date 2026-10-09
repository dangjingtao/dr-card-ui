import { useCallback, useEffect, useRef, useState } from 'react'
import { getAuthSession } from '../../services/auth/session'
import { fetchChatHistoryPage, mapChatRecord, mergeChatHistory, chatRecordSchema, CHAT_HISTORY_PAGE_SIZE, type ChatHistoryMessage } from '../../services/chatMessages'

export type ChatHistoryState =
  | { status: 'loading'; messages: ChatHistoryMessage[]; page: number; lastPage: number; loadingMore: false; moreError: null }
  | { status: 'error'; message: string; messages: ChatHistoryMessage[]; page: number; lastPage: number; loadingMore: false; moreError: null }
  | { status: 'ready'; messages: ChatHistoryMessage[]; page: number; lastPage: number; loadingMore: boolean; moreError: string | null }

type Snapshot = { token: string; data: ChatHistoryState }
const loading: Extract<ChatHistoryState, { status: 'loading' }> = { status: 'loading', messages: [], page: 0, lastPage: 1, loadingMore: false, moreError: null }
const errorText = (error: unknown) => error instanceof Error && error.message ? error.message : '客服历史加载失败'
const sessionToken = () => getAuthSession()?.accessToken ?? ''

/** Page 1 is newest; older pages merge by ID. Never persist messages or account identity. */
export function useChatHistory() {
  const [snapshot, setSnapshot] = useState<Snapshot>(() => ({ token: sessionToken(), data: loading }))
  const token = sessionToken()
  // Previous account's messages cannot render while the auth change effect is pending.
  const data = snapshot.token === token ? snapshot.data : loading
  const current = useRef(snapshot)
  const revision = useRef(0)
  // Distinct request scopes: pagination must not abort send reconciliation,
  // and a reconnect backfill must not strand the older-page loader.
  const pending = useRef<AbortController | null>(null) // initial reload
  const pagePending = useRef<AbortController | null>(null)
  const latestPending = useRef<AbortController | null>(null)
  const missedPending = useRef<AbortController | null>(null)
  const pageRevision = useRef(0)
  const latestRevision = useRef(0)
  const missedRevision = useRef(0)
  // Socket can become ready before GET index; hold validated pushes by session
  // until the first successful history load instead of silently dropping them.
  const queuedPushes = useRef({ token: sessionToken(), messages: new Map<string, ChatHistoryMessage>() })
  const update = useCallback((next: Snapshot) => { current.current = next; setSnapshot(next) }, [])

  const reload = useCallback(() => {
    pending.current?.abort()
    pagePending.current?.abort()
    latestPending.current?.abort()
    missedPending.current?.abort()
    pageRevision.current++
    latestRevision.current++
    missedRevision.current++
    const controller = new AbortController()
    pending.current = controller
    const key = sessionToken()
    if (queuedPushes.current.token !== key) {
      queuedPushes.current = { token: key, messages: new Map() }
    }
    const requestRevision = ++revision.current
    update({ token: key, data: loading })
    if (!key) {
      update({ token: key, data: { ...loading, status: 'error', message: '请先登录后查看客服记录' } })
      return
    }
    void fetchChatHistoryPage(1, undefined, controller.signal).then(
      page => {
        if (controller.signal.aborted || revision.current !== requestRevision || sessionToken() !== key) return
        // Drain pushes received while history was loading/error, and dedup by server ID.
        // Keep the queue if an earlier request failed; never carry it across accounts.
        const staged = queuedPushes.current.token === key
          ? [...queuedPushes.current.messages.values()] : []
        update({ token: key, data: {
          status: 'ready', messages: mergeChatHistory(page.data.map(mapChatRecord), staged),
          page: page.current_page, lastPage: page.last_page, loadingMore: false, moreError: null,
        } })
        if (queuedPushes.current.token === key) queuedPushes.current.messages.clear()
      },
      error => {
        if (controller.signal.aborted || revision.current !== requestRevision || sessionToken() !== key) return
        update({ token: key, data: { ...loading, status: 'error', message: errorText(error) } })
      },
    )
  }, [update])

  const loadMore = useCallback(() => {
    const state = current.current
    const key = sessionToken()
    if (!key || state.token !== key || state.data.status !== 'ready'
      || state.data.loadingMore || state.data.page >= state.data.lastPage) return
    const ready = state.data
    pagePending.current?.abort()
    const controller = new AbortController()
    pagePending.current = controller
    const requestRevision = ++pageRevision.current
    const requestedPage = ready.page + 1
    update({ token: key, data: { ...ready, loadingMore: true, moreError: null } })
    void fetchChatHistoryPage(requestedPage, undefined, controller.signal).then(
      page => {
        if (controller.signal.aborted || pageRevision.current !== requestRevision || sessionToken() !== key) return
        const now = current.current
        if (now.token !== key || now.data.status !== 'ready') return
        if (page.current_page !== requestedPage || page.last_page !== now.data.lastPage) {
          update({ token: key, data: { ...now.data, loadingMore: false, moreError: '客服历史分页已变化，请重新加载' } })
          return
        }
        update({ token: key, data: {
          ...now.data, messages: mergeChatHistory(now.data.messages, page.data.map(mapChatRecord)),
          page: page.current_page, lastPage: page.last_page, loadingMore: false, moreError: null,
        } })
      },
      error => {
        if (controller.signal.aborted || pageRevision.current !== requestRevision || sessionToken() !== key) return
        const now = current.current
        if (now.token !== key || now.data.status !== 'ready') return
        update({ token: key, data: { ...now.data, loadingMore: false, moreError: errorText(error) } })
      },
    )
  }, [update])

  /** Reconcile persisted messages without blanking an active chat. */
  const syncLatest = useCallback(async (): Promise<ChatHistoryMessage[] | null> => {
    const state = current.current
    const key = sessionToken()
    if (state.token !== key || state.data.status !== 'ready') return null
    latestPending.current?.abort()
    const controller = new AbortController()
    latestPending.current = controller
    const requestRevision = ++latestRevision.current
    try {
      const page = await fetchChatHistoryPage(1, undefined, controller.signal)
      if (controller.signal.aborted || latestRevision.current !== requestRevision || sessionToken() !== key) return null
      const now = current.current
      if (now.token !== key || now.data.status !== 'ready') return null
      const latest = page.data.map(mapChatRecord)
      update({ token: key, data: {
        ...now.data, messages: mergeChatHistory(now.data.messages, latest),
        lastPage: page.last_page,
      } })
      return latest
    } catch {
      return null
    }
  }, [update])

  /** Socket receives only server-authenticated messages; dedup by persisted ID. */
  const acceptPush = useCallback((raw: unknown) => {
    const record = chatRecordSchema.safeParse(raw)
    if (!record.success) return
    const user = getAuthSession()?.userInfo
    if (user && typeof user === 'object' && 'id' in user && user.id != null && String(user.id) !== String(record.data.user_id)) return
    const key = sessionToken()
    const now = current.current
    if (!key || now.token !== key) return
    const mapped = mapChatRecord(record.data)
    if (now.data.status !== 'ready') {
      if (queuedPushes.current.token !== key) {
        queuedPushes.current = { token: key, messages: new Map() }
      }
      queuedPushes.current.messages.set(mapped.id, mapped)
      return
    }
    update({ token: key, data: {
      ...now.data, messages: mergeChatHistory(now.data.messages, [mapped]),
    } })
  }, [update])

  /** Catch up on reconnect: Socket.IO does not replay events missed while disconnected.
   * Walk pages until known latest ID appears, with an explicit bounded safety limit. */
  const syncMissed = useCallback(async (sinceId: number): Promise<boolean> => {
    if (sinceId <= 0) return (await syncLatest()) !== null
    const initial = current.current
    const key = sessionToken()
    if (!key || initial.token !== key || initial.data.status !== 'ready') return false
    missedPending.current?.abort()
    const controller = new AbortController()
    missedPending.current = controller
    const requestRevision = ++missedRevision.current
    const newer: ChatHistoryMessage[] = []
    try {
      for (let pageNumber = 1; pageNumber <= 20; pageNumber++) {
        const page = await fetchChatHistoryPage(pageNumber, 100, controller.signal)
        if (controller.signal.aborted || requestRevision !== missedRevision.current || sessionToken() !== key) return false
        newer.push(...page.data.map(mapChatRecord))
        if (page.data.some(item => item.id <= sinceId) || pageNumber >= page.last_page) {
          const now = current.current
          if (now.token !== key || now.data.status !== 'ready') return false
          update({ token: key, data: {
            ...now.data, messages: mergeChatHistory(now.data.messages, newer),
            // Backfill fetches 100/page; regular history uses 30/page.
            // Normalize the server total to the regular pagination unit.
            lastPage: Math.max(1, Math.ceil(page.total / CHAT_HISTORY_PAGE_SIZE)),
          } })
          return true
        }
      }
      return false
    } catch {
      return false
    }
  }, [syncLatest, update])

  useEffect(() => {
    reload()
    const onSessionChanged = () => reload()
    window.addEventListener('dr-card-ui:auth-session-changed', onSessionChanged)
    window.addEventListener('dr-card-ui:auth-session-cleared', onSessionChanged)
    return () => {
      window.removeEventListener('dr-card-ui:auth-session-changed', onSessionChanged)
      window.removeEventListener('dr-card-ui:auth-session-cleared', onSessionChanged)
      revision.current++
      pageRevision.current++
      latestRevision.current++
      missedRevision.current++
      pending.current?.abort()
      pagePending.current?.abort()
      latestPending.current?.abort()
      missedPending.current?.abort()
    }
  }, [reload])

  return { ...data, hasMore: data.status === 'ready' && data.page < data.lastPage, reload, loadMore, syncLatest, syncMissed, acceptPush }
}
