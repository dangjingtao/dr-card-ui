import { useCallback, useEffect, useRef, useState } from 'react'
import { getAuthSession } from '../../services/auth/session'
import { fetchChatHistoryPage, mapChatRecord, mergeChatHistory, type ChatHistoryMessage } from '../../services/chatMessages'

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
  const pending = useRef<AbortController | null>(null)
  const update = useCallback((next: Snapshot) => { current.current = next; setSnapshot(next) }, [])

  const reload = useCallback(() => {
    pending.current?.abort()
    const controller = new AbortController()
    pending.current = controller
    const key = sessionToken()
    const requestRevision = ++revision.current
    update({ token: key, data: loading })
    if (!key) {
      update({ token: key, data: { ...loading, status: 'error', message: '请先登录后查看客服记录' } })
      return
    }
    void fetchChatHistoryPage(1, undefined, controller.signal).then(
      page => {
        if (controller.signal.aborted || revision.current !== requestRevision || sessionToken() !== key) return
        update({ token: key, data: {
          status: 'ready', messages: mergeChatHistory([], page.data.map(mapChatRecord)),
          page: page.current_page, lastPage: page.last_page, loadingMore: false, moreError: null,
        } })
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
    pending.current?.abort()
    const controller = new AbortController()
    pending.current = controller
    const requestRevision = ++revision.current
    const requestedPage = ready.page + 1
    update({ token: key, data: { ...ready, loadingMore: true, moreError: null } })
    void fetchChatHistoryPage(requestedPage, undefined, controller.signal).then(
      page => {
        if (controller.signal.aborted || revision.current !== requestRevision || sessionToken() !== key) return
        if (page.current_page !== requestedPage || page.last_page !== ready.lastPage) {
          update({ token: key, data: { ...ready, loadingMore: false, moreError: '客服历史分页已变化，请重新加载' } })
          return
        }
        update({ token: key, data: {
          ...ready, messages: mergeChatHistory(ready.messages, page.data.map(mapChatRecord)),
          page: page.current_page, lastPage: page.last_page, loadingMore: false, moreError: null,
        } })
      },
      error => {
        if (controller.signal.aborted || revision.current !== requestRevision || sessionToken() !== key) return
        update({ token: key, data: { ...ready, loadingMore: false, moreError: errorText(error) } })
      },
    )
  }, [update])

  useEffect(() => {
    reload()
    const onSessionChanged = () => reload()
    window.addEventListener('dr-card-ui:auth-session-changed', onSessionChanged)
    window.addEventListener('dr-card-ui:auth-session-cleared', onSessionChanged)
    return () => {
      window.removeEventListener('dr-card-ui:auth-session-changed', onSessionChanged)
      window.removeEventListener('dr-card-ui:auth-session-cleared', onSessionChanged)
      revision.current++
      pending.current?.abort()
    }
  }, [reload])

  return { ...data, hasMore: data.status === 'ready' && data.page < data.lastPage, reload, loadMore }
}
