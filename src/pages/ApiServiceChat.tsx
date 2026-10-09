import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Headset, Send } from 'lucide-react'
import PageContainer from '../components/mobile/PageContainer'
import ChatMessageList from '../components/mobile/ChatMessageList'
import WecomQrPlaceholder from '../components/mobile/WecomQrPlaceholder'
import { BottomSheet, Button } from '../components/ui'
import { CHAT_BOT, CHAT_HUMAN_PROMPT, WELFARE_OFFICER } from '../app/fixtures'
import { useChatHistory } from './serviceChat/useChatHistory'

/**
 * #123-A API mode: real history only. Sending / human handoff is implemented in #123-C/D.
 * Never mount timer-driven demo replies or fake agent queue in api/test/prod.
 */
export default function ApiServiceChat() {
  const history = useChatHistory()
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
      <section className="flex-1 px-4 pb-4 pt-4" aria-label="客服聊天历史" data-human-stage="unavailable">
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
                <Button variant="outline" onClick={history.loadMore}>重试加载更早消息</Button>
              </div>
            )}
            {history.messages.length === 0
              ? <p className="py-8 text-center text-sm text-text-secondary">暂无客服聊天记录</p>
              : <ChatMessageList messages={history.messages} />}
          </>
        )}
      </section>

      <div className="sticky bottom-0 border-t border-border-subtle bg-background px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3">
        <p className="mb-2 text-center text-xs text-text-secondary" role="status">
          历史消息可查看，AI 发送与转人工服务正在接入
        </p>
        <div className="flex items-end gap-2">
          <button type="button" data-chat-human-entry disabled aria-label="人工客服待接入"
            className="flex h-11 w-11 flex-none flex-col items-center justify-center rounded-container bg-surface text-[10px] font-medium text-text-brand shadow-sm disabled:opacity-50">
            <Headset className="h-4 w-4" aria-hidden />人工
          </button>
          <div className="flex min-h-11 flex-1 items-center rounded-container border-2 border-transparent bg-surface px-3">
            <input type="text" disabled aria-label="输入你的问题" placeholder="AI 客服消息发送待接入"
              className="h-11 w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-placeholder disabled:cursor-not-allowed" />
          </div>
          <button type="button" data-chat-send disabled aria-label="发送待接入"
            className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-disabled text-text-disabled">
            <Send className="h-5 w-5" aria-hidden />
          </button>
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
