import { useEffect, useRef, useState } from 'react'
import { Headset, MessageSquare, Send } from 'lucide-react'
import PageContainer from '../components/mobile/PageContainer'
import ChatMessageList from '../components/mobile/ChatMessageList'
import DebugPanel from '../components/mobile/DebugPanel'
import WecomQrPlaceholder from '../components/mobile/WecomQrPlaceholder'
import { BottomSheet, Button } from '../components/ui'
import { findRouteByPathname } from '../app/router/routes'
import { useFixtureState, useOverlay } from '../app/fixtures/useFixture'
import {
  CHAT_BOT,
  CHAT_BOT_FALLBACK_REPLY,
  CHAT_CONVERSATION_MESSAGES,
  CHAT_FAILED_MESSAGES,
  CHAT_HUMAN_PROMPT,
  CHAT_SEND_LATENCY_MS,
  CHAT_WELCOME_MESSAGES,
  WELFARE_OFFICER,
  isChatHumanRequest,
  resolveChatSendStatus,
  type ChatMessage,
} from '../app/fixtures'

const STATE_MESSAGES: Record<string, ChatMessage[]> = {
  conversation: CHAT_CONVERSATION_MESSAGES,
  failed: CHAT_FAILED_MESSAGES,
}

export default function ServiceChat() {
  const route = findRouteByPathname('/service/chat')
  const { state } = useFixtureState(route)
  const { overlay, open, close } = useOverlay()

  const [messages, setMessages] = useState<ChatMessage[]>(CHAT_WELCOME_MESSAGES)
  const [draft, setDraft] = useState('')
  const timers = useRef<number[]>([])
  const seq = useRef(0)

  /** `?state=` 直达：欢迎 / 有对话 / 发送失败 */
  useEffect(() => {
    setMessages(state?.key ? (STATE_MESSAGES[state.key] ?? CHAT_WELCOME_MESSAGES) : CHAT_WELCOME_MESSAGES)
  }, [state?.key])

  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), [])

  const track = (fn: () => void, delay: number) => {
    timers.current.push(window.setTimeout(fn, delay))
  }

  const patch = (id: string, next: Partial<ChatMessage>) => {
    setMessages((prev) => prev.map((item) => (item.id === id ? { ...item, ...next } : item)))
  }

  /** 发送态 → 固定时长后落到确定性结果；成功再追加小诗的兜底回答 */
  const settle = (id: string, text: string) => {
    track(() => {
      const status = resolveChatSendStatus(text)
      patch(id, { status })
      if (status !== 'sent') return
      seq.current += 1
      const replyId = `bot-reply-${seq.current}`
      setMessages((prev) => [
        ...prev,
        { id: replyId, role: 'bot', text: CHAT_BOT_FALLBACK_REPLY, status: 'sent' },
      ])
    }, CHAT_SEND_LATENCY_MS)
  }

  const send = () => {
    const text = draft.trim()
    if (!text) return
    setDraft('')

    /** 原型 §9：输入「人工客服」等同于点击页内入口，直接进入请求人工客服流程 */
    if (isChatHumanRequest(text)) {
      open('request-human')
      return
    }

    seq.current += 1
    const id = `user-${seq.current}`
    setMessages((prev) => [...prev, { id, role: 'user', text, status: 'sending' }])
    settle(id, text)
  }

  const retry = (id: string) => {
    const target = messages.find((item) => item.id === id)
    if (!target) return
    patch(id, { status: 'sending' })
    settle(id, target.text)
  }

  return (
    <PageContainer className="flex min-h-full flex-col pb-0" inset={false}>
      <div className="flex items-center justify-between gap-3 px-4 pt-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-reward-subtle text-xs font-semibold text-reward-text"
            aria-hidden
          >
            {CHAT_BOT.glyph}
          </span>
          <p className="truncate text-sm font-medium text-text-primary">
            {CHAT_BOT.role} · {CHAT_BOT.name}
          </p>
        </div>

        {/* 壳层 TitleBar 不支持自定义右上角动作，故「企微客服」入口渲染在页面体内 */}
        <button
          type="button"
          data-chat-wecom-entry
          onClick={() => open('request-human')}
          className="inline-flex min-h-8 flex-none items-center gap-1 rounded-pill bg-surface px-3 text-xs font-medium text-text-brand shadow-sm active:bg-surface-selected"
        >
          <MessageSquare className="h-3.5 w-3.5" aria-hidden />
          {CHAT_BOT.wecomEntry}
        </button>
      </div>

      <div className="flex-1 px-4 pb-4 pt-4">
        <ChatMessageList messages={messages} onRetry={retry} />
      </div>

      <div className="sticky bottom-0 border-t border-border-subtle bg-background px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3">
        <div className="flex items-end gap-2">
          <button
            type="button"
            data-chat-human-entry
            onClick={() => open('request-human')}
            className="flex h-11 w-11 flex-none flex-col items-center justify-center rounded-container bg-surface text-[10px] font-medium text-text-brand shadow-sm active:bg-surface-selected"
          >
            <Headset className="h-4 w-4" aria-hidden />
            人工
          </button>

          <div className="flex min-h-11 flex-1 items-center rounded-container border-2 border-transparent bg-surface px-3 focus-within:border-border-focused">
            <input
              type="text"
              inputMode="text"
              autoComplete="off"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  send()
                }
              }}
              placeholder={CHAT_BOT.inputPlaceholder}
              aria-label="输入你的问题"
              className="h-11 w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-placeholder"
            />
          </div>

          <button
            type="button"
            data-chat-send
            onClick={send}
            disabled={!draft.trim()}
            aria-label="发送"
            className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-primary text-text-inverse active:bg-primary-pressed disabled:bg-disabled disabled:text-text-disabled"
          >
            <Send className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>

      {/* #71 请求人工客服：原型 §10 在智能客服页上叠加企业微信引导 */}
      <BottomSheet
        open={overlay === 'request-human'}
        title={CHAT_HUMAN_PROMPT.title}
        onClose={close}
        actions={
          /* 原型 §10 弹层内只有「取消」；#71 → #70 的前进入口未确认，按项目硬规则不实现 */
          <Button variant="ghost" onClick={close}>
            {CHAT_HUMAN_PROMPT.cancelLabel}
          </Button>
        }
      >
        <div className="flex flex-col items-center pb-1 text-center" data-chat-human-sheet>
          <WecomQrPlaceholder />
          <p className="mt-3 text-sm font-medium text-text-primary">
            {WELFARE_OFFICER.brand}{WELFARE_OFFICER.role} · {WELFARE_OFFICER.name}
          </p>
          <p className="mt-1 text-xs text-text-tertiary">{WELFARE_OFFICER.qrHint}</p>
        </div>
      </BottomSheet>

      <DebugPanel route={route} />
    </PageContainer>
  )
}
