import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronUp, Send as SendIcon, UserRound, Bot } from 'lucide-react'

/* ---- 热门问题（点击展开答案） ---- */
interface FAQ {
  id: string
  q: string
  a: string
}

const FAQS: FAQ[] = [
  {
    id: 'faq-1',
    q: '如何充值？',
    a: '您可以在「我的」页面点击「充值」，选择充值金额并完成支付即可。支持的支付方式有微信支付、支付宝等。',
  },
  {
    id: 'faq-2',
    q: '设备扫码后无反应怎么办？',
    a: '请检查：① 手机蓝牙是否开启；② 是否授权了 APP 的位置权限；③ 网络是否稳定。若仍无法启动，请到「服务中心 → 报修」提交工单。',
  },
  {
    id: 'faq-3',
    q: '账户余额可以退款吗？',
    a: '可以。请到「设置 → 退款」查看退款流程；目前退款需通过公众号工单推款，预计 1-3 个工作日到账。',
  },
  {
    id: 'faq-4',
    q: '小票在哪里查看？',
    a: '在「我的」页面点击「我的小票」，可按年月筛选查看历史消费明细。点击单张小票可查看详情。',
  },
  {
    id: 'faq-5',
    q: '如何换绑手机号？',
    a: '在「我的 → 个人信息 → 手机」进入换绑流程，按提示完成原手机号验证和新手机号验证即可。',
  },
  {
    id: 'faq-6',
    q: '忘记密码怎么办？',
    a: '在登录页点击「忘记密码」，按提示通过手机号验证码方式重置密码。',
  },
]

/* ---- AI 回复 mock：根据关键词给答案 ---- */
function aiReply(input: string): string {
  const text = input.trim().toLowerCase()
  if (!text) return '请告诉我您的问题～'

  // 1. 转人工客服关键词（最优先）
  if (/人工|真人|客服人员|人工服务|转人工/.test(text)) {
    return '__TRANSFER_HUMAN__'
  }

  // 2. FAQ 关键词命中
  if (/充值|付款|交钱|余额不足/.test(text)) return FAQS[0].a
  if (/扫码|无反应|扫不上|启动不了|蓝牙/.test(text)) return FAQS[1].a
  if (/退款|退钱|余额/.test(text)) return FAQS[2].a
  if (/小票|消费|明细|记录/.test(text)) return FAQS[3].a
  if (/换绑|换手机|改手机/.test(text)) return FAQS[4].a
  if (/密码|忘记|登录不上|找回/.test(text)) return FAQS[5].a

  // 3. 默认回复
  return '抱歉，我还没学会这个问题。您可以点击下方"转人工客服"，由我们的人工客服为您解答。'
}

interface ChatMsg {
  id: number
  role: 'user' | 'ai'
  content: string
}

export default function CustomerServicePage() {
  const navigate = useNavigate()
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: 0,
      role: 'ai',
      content: '您好，我是卡博士 AI 客服小卡。请点击下方热门问题查看常见解答，或直接输入您的问题，我会尽力为您解答。',
    },
  ])
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    /* 每次消息变化滚到底部 */
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const toggleFaq = (id: string) => {
    setExpandedFaq((cur) => (cur === id ? null : id))
  }

  const sendMessage = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return

    const userMsg: ChatMsg = { id: Date.now(), role: 'user', content: trimmed }
    setMessages((cur) => [...cur, userMsg])
    setInput('')

    /* mock 800ms 后 AI 回复 */
    setTimeout(() => {
      const reply = aiReply(trimmed)
      if (reply === '__TRANSFER_HUMAN__') {
        setMessages((cur) => [
          ...cur,
          { id: Date.now() + 1, role: 'ai', content: '正在为您转接人工客服，请稍候…' },
        ])
        setTimeout(() => navigate('/service/chat/human'), 600)
        return
      }
      setMessages((cur) => [...cur, { id: Date.now() + 2, role: 'ai', content: reply }])
    }, 800)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  return (
    <div className="mx-auto flex min-h-full max-w-[480px] flex-col bg-[#F8F8FA]">
      {/* 顶部栏：淡金渐变背景 */}
      <div className="relative shrink-0 bg-gradient-to-br from-[#D4A853] to-[#E8C97A] px-4 pt-3 pb-3">
        <div className="relative flex items-center">
          <button
            type="button"
            aria-label="返回"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center text-white active:opacity-80"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold text-white">
            客服中心
          </div>
        </div>
      </div>

      {/* 主体：上半热门问题 + 下半对话区 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* 热门问题（可滚动，最多展示 6 条） */}
        <div className="shrink-0 border-b border-divider bg-white px-4 pt-3 pb-2">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">热门问题</h3>
            <span className="text-xs text-text-tertiary">点击展开答案</span>
          </div>
          <div className="max-h-32 overflow-y-auto">
            {FAQS.map((faq) => {
              const expanded = expandedFaq === faq.id
              return (
                <button
                  key={faq.id}
                  type="button"
                  onClick={() => toggleFaq(faq.id)}
                  className={`flex w-full items-center justify-between border-b border-border-light py-2.5 text-left last:border-b-0 active:bg-[#F8F8FA]`}
                >
                  <span className="flex-1 pr-2 text-sm text-text-primary">{faq.q}</span>
                  <ChevronUp
                    className={`h-4 w-4 shrink-0 text-text-tertiary transition ${
                      expanded ? '' : 'rotate-180'
                    }`}
                  />
                </button>
              )
            })}
            {/* 展开的答案区 */}
            {expandedFaq && (
              <div className="mt-2 rounded-xl bg-[#FFF8E8] p-3 text-sm leading-relaxed text-text-secondary">
                {FAQS.find((f) => f.id === expandedFaq)?.a}
              </div>
            )}
          </div>
        </div>

        {/* AI 对话区 */}
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white ${
                  m.role === 'ai' ? 'bg-gradient-to-br from-[#D4A853] to-[#E8C97A]' : 'bg-[#A78BFA]'
                }`}
              >
                {m.role === 'ai' ? <Bot className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}
              </div>
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  m.role === 'ai'
                    ? 'bg-white text-text-primary shadow-sm'
                    : 'bg-gradient-to-br from-[#D4A853] to-[#E8C97A] text-white'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
        </div>

        {/* 输入区（无独立"转人工"按钮，关键词「人工客服」触发） */}
        <form
          onSubmit={handleSubmit}
          className="shrink-0 border-t border-divider bg-white px-3 py-2"
        >
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入您要咨询的问题…"
              className="flex-1 rounded-full bg-[#F5F5F7] px-4 py-2 text-sm text-text-primary outline-none focus:ring-2 focus:ring-[#D4A853]/30"
            />
            <button
              type="submit"
              aria-label="发送"
              disabled={!input.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#D4A853] to-[#E8C97A] text-white shadow-sm active:opacity-90 disabled:opacity-40"
            >
              <SendIcon className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}