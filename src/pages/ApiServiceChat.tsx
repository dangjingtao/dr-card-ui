import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Headset, Send } from 'lucide-react'
import PageContainer from '../components/mobile/PageContainer'
import ChatMessageList from '../components/mobile/ChatMessageList'
import WecomQrPlaceholder from '../components/mobile/WecomQrPlaceholder'
import { BottomSheet, Button } from '../components/ui'
import { CHAT_BOT, CHAT_HUMAN_PROMPT, WELFARE_OFFICER } from '../app/fixtures'
import { useChatHistory } from './serviceChat/useChatHistory'
import { combineChatMessages, useAiChatSend } from './serviceChat/useAiChatSend'

/**
 * #123-C: true backend SSE AI response; temporary bubbles reconcile with stored history.
 * Human transfer and Socket.IO remain owned by #138. No timer-driven bot/agent fixtures.
 */
export default function ApiServiceChat() {
  const history = useChatHistory()
  const chat = useAiChatSend(history.syncLatest)
  const [draft, setDraft] = useState('')
  const send = () => {
    const message = draft.trim()
    if (!message || chat.busy || chat.blocked || history.status !== 'ready') return
    setDraft('')
    void chat.send(message, history.messages)
  }
  const inputDisabled = history.status !== 'ready' || chat.busy || chat.blocked
  const messages = combineChatMessages(history.messages, chat.messages)
  const location = useLocation()
  const navigate = useNavigate()
  const [wecomOpen, setWecomOpen] = useState(false)

  const closeWecom = () => {
    setWecomOpen(false)
    if (location.hash === '#wecom') {
      navigate({ pathname: location.pathname, search: location.search, hash: '' },
        { replace: true, state: location.state })
    }
  }
  useEffect(() => {
    if (location.hash === '#wecom') setWecomOpen(true)
  }, [location.hash])

  return (
    <PageContainer className="flex min-h-full flex-col pb-0" inset={false}>
      <div className="px-4 pt-3">
        <p className="text-center text-xs text-text-tertiary">AI 客服 {CHAT_BOT.name} 为您服务</p>
      </div>
      <section className="flex-1 px-4 pb-4 pt-4" aria-label="客服聊天历史" data-human-stage={chat.humanAwait ? 'pending' : 'idle'}>
        {history.status === 'loading' ? (
          <p role="status" className="py-8 text-center text-sm text-text-secondary">正在加载客服历史…</p>
        ) : history.status === 'error' ? (
          <div role="alert" className="py-8 text-center text-sm text-text-secondary">
            <p>{history.message}</p>
            <Button variant="outline" onClick={history.reload}>重新加载历史</Button>
          </div>
        ) : (
          <>
            {history.hasMore && (
              <div className="mb-4 text-center">
                <Button variant="outline" disabled={history.loadingMore} onClick={history.loadMore}>
                  {history.loadingMore ? '正在加载…' : '加载更早消息'}
                </Button>
              </div>
            )}
            {history.moreError && (
              <div role="alert" className="mb-3 text-center text-xs text-danger-text">
                {history.moreError}
                <Button variant="outline" onClick={history.moreError.includes('分页已变化')
                  ? history.reload : history.loadMore}>
                  {history.moreError.includes('分页已变化') ? '重新加载历史' : '重试加载更早消息'}
                </Button>
              </div>
            )}
            {messages.length === 0
              ? <p className="py-8 text-center text-sm text-text-secondary">暂无客服聊天记录，可以发送第一条消息</p>
              : <ChatMessageList messages={messages} />}
          </>
        )}
      </section>

      <div className="sticky bottom-0 border-t border-border-subtle bg-background px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3">
        {chat.error ? (
          <div role="alert" className="mb-3 rounded-container bg-surface px-3 py-2 text-xs text-danger-text">
            <p>{chat.error}</p>
            <Button variant="outline" onClick={() => { chat.clear(); history.reload() }}>检查最新历史记录</Button>
          </div>
        ) : (
          <div role="status" className="mb-2 text-center text-xs text-text-secondary">
            {chat.phase === 'sending' ? '正在发送消息…'
              : chat.phase === 'streaming' ? 'AI 正在流式回复…'
              : chat.phase === 'syncing' ? '正在核对服务端消息记录…'
              : chat.humanAwait ? '后台已进入人工模式；真人实时回复待接入'
              : 'AI 客服已可发送消息；人工转接功能尚未接入'}
          </div>
        )}
        <div className="flex items-end gap-2">
          <button type="button" data-chat-human-entry disabled aria-label="人工转接待接入"
            className="flex h-11 w-11 flex-none flex-col items-center justify-center rounded-container bg-surface text-[10px] font-medium text-text-brand shadow-sm disabled:opacity-50">
            <Headset className="h-4 w-4" aria-hidden />人工
          </button>
          <div className="flex min-h-11 flex-1 items-center rounded-container border-2 border-transparent bg-surface px-3 focus-within:border-border-focused">
            <input type="text" value={draft} maxLength={5000} autoComplete="off"
              onChange={event => setDraft(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter') { event.preventDefault(); send() }
              }}
              disabled={inputDisabled} aria-label="输入你的问题"
              placeholder={chat.humanAwait ? '人工客服实时通信待接入' : '请输入你的问题'}
              className="h-11 w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-placeholder disabled:cursor-not-allowed" />
          </div>
          {chat.busy ? (
            <button type="button" data-chat-cancel onClick={chat.cancel} aria-label="中止等待回复"
              className="flex h-11 items-center justify-center rounded-full bg-surface px-3 text-xs text-text-brand">
              停止
            </button>
          ) : (
            <button type="button" data-chat-send onClick={send}
              disabled={inputDisabled || !draft.trim()} aria-label="发送"
              className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-primary text-text-inverse active:bg-primary-pressed disabled:bg-disabled disabled:text-text-disabled">
              <Send className="h-5 w-5" aria-hidden />
            </button>
          )}
        </div>
      </div>
      {/* TitleBar's #wecom QR is a separate action, never a fake transfer to a human agent. */}
      <BottomSheet
        open={wecomOpen}
        title={CHAT_HUMAN_PROMPT.title}
        onClose={closeWecom}
        actions={<div className="flex justify-center"><Button variant="ghost" onClick={closeWecom}>{CHAT_HUMAN_PROMPT.cancelLabel}</Button></div>}
      >
        <div className="flex flex-col items-center pb-1 text-center" data-chat-human-sheet>
          <WecomQrPlaceholder />
          <p className="mt-3 text-sm font-medium text-text-primary">
            {WELFARE_OFFICER.brand}{WELFARE_OFFICER.role} · {WELFARE_OFFICER.name}
          </p>
          <p className="mt-1 text-xs text-text-tertiary">{WELFARE_OFFICER.qrHint}</p>
        </div>
      </BottomSheet>
    </PageContainer>
  )
}
