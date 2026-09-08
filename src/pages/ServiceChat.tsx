import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Headset, Send } from 'lucide-react'
import PageContainer from '../components/mobile/PageContainer'
import ChatMessageList from '../components/mobile/ChatMessageList'
import DebugPanel from '../components/mobile/DebugPanel'
import WecomQrPlaceholder from '../components/mobile/WecomQrPlaceholder'
import { BottomSheet, Button } from '../components/ui'
import { findRouteByPathname } from '../app/router/routes'
import { useFixtureState } from '../app/fixtures/useFixture'
import {
  CHAT_AGENT_GREETING,
  CHAT_BOT,
  CHAT_BOT_FALLBACK_REPLY,
  CHAT_CONVERSATION_MESSAGES,
  CHAT_FAILED_MESSAGES,
  CHAT_HUMAN_PROMPT,
  CHAT_QUEUE,
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

/** T013R4：人工客服进入状态机 —— 'idle' / 'queuing' / 'connected' */
type HumanStage = 'idle' | 'queuing' | 'connected'

export default function ServiceChat() {
  const route = findRouteByPathname('/service/chat')
  const { state } = useFixtureState(route)

  const [messages, setMessages] = useState<ChatMessage[]>(CHAT_WELCOME_MESSAGES)
  const [draft, setDraft] = useState('')
  const timers = useRef<number[]>([])
  const seq = useRef(0)

  /** 人工客服状态机：idle → queuing（→ mock 1.2s 后 connected） */
  const [humanStage, setHumanStage] = useState<HumanStage>('idle')

  /** 企微二维码弹层控制 */
  const [wecomOpen, setWecomOpen] = useState(false)
  const closeWecom = () => setWecomOpen(false)

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

  /**
   * T013R4：触发人工客服 ——不跳转路由，而是在当前对话之下插入：
   *   1) 系统提示「正在为您接入人工客服...」
   *   2) 排队位次「前面还有 2 位」
   *   3) mock 1.2s 后接入，追加坐席开场语（CHAT_AGENT_GREETING，文案使用「小霜」）
   *   4) 启用底部输入框进入 APP 内对话
   * 同一页面已接入后再次点击「人工」按钮不重复触发。
   */
  const requestHuman = () => {
    if (humanStage !== 'idle') return

    /* 1) 排队提示 */
    setMessages((prev) => [
      ...prev,
      {
        id: `human-system-${Date.now()}`,
        role: 'bot',
        text: CHAT_QUEUE.queuing.title,
        status: 'sent',
      },
      {
        id: `human-queue-${Date.now() + 1}`,
        role: 'bot',
        text: CHAT_QUEUE.queuing.aheadText,
        status: 'sent',
      },
    ])
    setHumanStage('queuing')

    /* 2) mock 1.2s 后接入 */
    track(() => {
      setMessages((prev) => [...prev, { ...CHAT_AGENT_GREETING, id: `human-greeting-${Date.now()}` }])
      setHumanStage('connected')
    }, 1200)
  }

  const send = () => {
    const text = draft.trim()
    if (!text) return
    setDraft('')

    /** T013R4：输入「人工客服」等同于点击页内「人工」按钮，触发人工客服状态机 */
    if (isChatHumanRequest(text)) {
      requestHuman()
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

  /** T013R4：人工坐席已接入后输入区可用；否则禁用并显示「正在接入...」 */
  const humanActive = humanStage === 'connected'
  const inputDisabled = !humanActive
  const inputPlaceholder = humanActive
    ? `与 ${CHAT_QUEUE.connected.agentName} 对话中…`
    : humanStage === 'queuing'
      ? '正在为您接入人工客服...'
      : CHAT_BOT.inputPlaceholder

  return (
    <PageContainer className="flex min-h-full flex-col pb-0" inset={false}>
      {/* T013R5：「企微客服」pill 移回壳层 TitleBar 右侧，页内顶部区只保留居中小字。 */}
      <div className="px-4 pt-3">
        <p className="text-center text-xs text-text-tertiary">
          AI 客服 {CHAT_BOT.name} 为您服务
        </p>
      </div>

      <div className="flex-1 px-4 pb-4 pt-4" data-human-stage={humanStage}>
        <ChatMessageList messages={messages} onRetry={retry} />
      </div>

      <div className="sticky bottom-0 border-t border-border-subtle bg-background px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3">
        <div className="flex items-end gap-2">
          <button
            type="button"
            data-chat-human-entry
            onClick={requestHuman}
            disabled={humanStage !== 'idle'}
            className="flex h-11 w-11 flex-none flex-col items-center justify-center rounded-container bg-surface text-[10px] font-medium text-text-brand shadow-sm active:bg-surface-selected disabled:opacity-50"
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
              placeholder={inputPlaceholder}
              disabled={inputDisabled}
              aria-label="输入你的问题"
              className="h-11 w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-placeholder disabled:cursor-not-allowed"
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

      {/* T013R4：企微二维码弹层恢复（R1+R2 撤掉的 #71 重新启用，但仅承担"企微客服"入口）。
        * 触发：点击壳层 TitleBar 右侧「企微客服」pill（data-chat-wecom-entry）。
        * 行为：仅展示福利官二维码 + 「取消」按钮，不承担"转人工"职责 ——「人工」走 requestHuman。
        * T013R5：「取消」按钮居中（外层 flex justify-center）。 */}
      <BottomSheet
        open={wecomOpen}
        title={CHAT_HUMAN_PROMPT.title}
        onClose={closeWecom}
        actions={
          <div className="flex justify-center">
            <Button variant="ghost" onClick={closeWecom}>
              {CHAT_HUMAN_PROMPT.cancelLabel}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col items-center pb-1 text-center" data-chat-human-sheet>
          <WecomQrPlaceholder />
          <p className="mt-3 text-sm font-medium text-text-primary">
            {WELFARE_OFFICER.brand}
            {WELFARE_OFFICER.role} · {WELFARE_OFFICER.name}
          </p>
          <p className="mt-1 text-xs text-text-tertiary">{WELFARE_OFFICER.qrHint}</p>
        </div>
      </BottomSheet>

      <DebugPanel route={route} />
    </PageContainer>
  )
}