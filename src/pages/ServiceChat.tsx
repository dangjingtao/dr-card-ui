import { useEffect, useRef, useState } from 'react'
import { Headset, MessageSquare, Send } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PageContainer from '../components/mobile/PageContainer'
import ChatMessageList from '../components/mobile/ChatMessageList'
import DebugPanel from '../components/mobile/DebugPanel'
import { findRouteByPathname } from '../app/router/routes'
import { useFixtureState } from '../app/fixtures/useFixture'
import {
  CHAT_BOT,
  CHAT_BOT_FALLBACK_REPLY,
  CHAT_CONVERSATION_MESSAGES,
  CHAT_FAILED_MESSAGES,
  CHAT_SEND_LATENCY_MS,
  CHAT_WELCOME_MESSAGES,
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
  const navigate = useNavigate()

  const [messages, setMessages] = useState<ChatMessage[]>(CHAT_WELCOME_MESSAGES)
  const [draft, setDraft] = useState('')
  const timers = useRef<number[]>([])
  const seq = useRef(0)

  /** T013R1+R2：「人工」入口与顶部「企微客服」pill 统一跳 /service/chat/human */
  const gotoHuman = () => navigate('/service/chat/human')

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

    /** T013R1+R2：输入「人工客服」等同于点击页内入口，直接跳转排队/对话页 */
    if (isChatHumanRequest(text)) {
      gotoHuman()
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
      {/* T013R2：顶部区重组 —— 第一行：诗字头像 + 「智能客服」标题 + 「企微客服」pill（同右侧）；
        * 第二行小字：AI 客服 小诗 为您服务 */}
      <div className="px-4 pt-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-reward-subtle text-xs font-semibold text-reward-text"
              aria-hidden
            >
              {CHAT_BOT.glyph}
            </span>
            <h2 className="truncate text-base font-semibold text-text-primary">
              智能客服
            </h2>
          </div>

          {/* 「企微客服」pill 移到顶部标题右侧（T013R2）；
            * 点击行为与底部「人工」一致，跳 /service/chat/human。 */}
          <button
            type="button"
            data-chat-wecom-entry
            onClick={gotoHuman}
            className="inline-flex min-h-8 flex-none items-center gap-1 rounded-pill bg-surface px-3 text-xs font-medium text-text-brand shadow-sm active:bg-surface-selected"
          >
            <MessageSquare className="h-3.5 w-3.5" aria-hidden />
            {CHAT_BOT.wecomEntry}
          </button>
        </div>
        <p className="mt-1 text-xs text-text-tertiary">
          AI 客服 {CHAT_BOT.name} 为您服务
        </p>
      </div>

      <div className="flex-1 px-4 pb-4 pt-4">
        <ChatMessageList messages={messages} onRetry={retry} />
      </div>

      <div className="sticky bottom-0 border-t border-border-subtle bg-background px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3">
        <div className="flex items-end gap-2">
          <button
            type="button"
            data-chat-human-entry
            onClick={gotoHuman}
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

      {/* T013R1+R2：原 #71 企微二维码 BottomSheet 已下线；
        * 「人工」入口、顶部「企微客服」pill、输入「人工客服」关键词均直接跳
        * /service/chat/human（排队 → 接入对话）。
        * `?overlay=request-human` 路由项仍保留以兼容回归脚本，但不渲染。 */}

      <DebugPanel route={route} />
    </PageContainer>
  )
}