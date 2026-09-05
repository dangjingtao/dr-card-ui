import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft, MessageCircle, Copy, Check } from 'lucide-react'

/* ---- Mock：公众号信息 ---- */
const PUBLIC_ACCOUNT_NAME = '卡博士校园服务'

/**
 * T028｜退款引导页
 * -------------------------------------------------------------
 * 流程说明：
 * 1. 用户在「我的小票」详情页申请退款
 * 2. 进入本引导页，按提示关注公众号「卡博士校园服务」
 * 3. 公众号内回复「退款 + 小票编号」，客服人工推款（1-3 个工作日）
 *
 * 不在 APP 内做原生退款（任务卡明确：不修改退款后端逻辑）
 */
export default function RefundGuidePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const receiptId = searchParams.get('receipt')
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(receiptId ? `XP${receiptId}` : 'XP202608150001')
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* 浏览器拒绝时仍给出反馈 */
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
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
            申请退款
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-3 px-4 pb-8 pt-4">
        {/* 退款进度卡 */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="border-b border-divider px-5 py-3">
            <div className="text-sm font-semibold text-text-primary">退款进度</div>
          </div>
          <div className="px-5 py-4">
            <StepList />
          </div>
        </div>

        {/* 二维码 + 公众号名 */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold text-text-primary">第一步 · 关注公众号</div>
          <div className="mt-1 text-xs text-text-secondary">
            使用微信扫一扫下方二维码，关注「卡博士校园服务」公众号
          </div>
          <div className="mt-4 flex flex-col items-center">
            {/* Mock 二维码（棋盘格占位） */}
            <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-divider">
              <div className="h-40 w-40 grid grid-cols-12 grid-rows-12 gap-px">
                {Array.from({ length: 144 }).map((_, i) => {
                  const row = Math.floor(i / 12)
                  const col = i % 12
                  const filled = (row * 7 + col * 13 + row * col) % 3 !== 0
                  const isCorner =
                    (row < 2 && col < 2) ||
                    (row < 2 && col > 9) ||
                    (row > 9 && col < 2)
                  return (
                    <div
                      key={i}
                      className={`${isCorner || filled ? 'bg-gray-900' : 'bg-white'}`}
                    />
                  )
                })}
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm font-medium text-text-primary">
              <MessageCircle className="h-4 w-4 text-[#B8893D]" />
              {PUBLIC_ACCOUNT_NAME}
            </div>
          </div>
        </div>

        {/* 提交工单步骤 */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold text-text-primary">第二步 · 提交退款申请</div>
          <div className="mt-3 space-y-3 text-sm text-text-secondary">
            <Row
              no={1}
              text={
                <>
                  在公众号底部菜单选择「<span className="text-text-primary">我的服务</span>
                  」→「<span className="text-text-primary">退款申请</span>」
                </>
              }
            />
            <Row
              no={2}
              text={
                <>
                  回复关键词「<span className="text-text-primary">退款</span>
                  」,按提示输入您要退款的<span className="text-text-primary">小票编号</span>
                </>
              }
            />
            <Row
              no={3}
              text={
                <>
                  客服人员将在 <span className="text-[#B8893D]">1-3 个工作日</span>
                  内完成退款审核与推款
                </>
              }
            />
          </div>

          {/* 小票编号 + 复制按钮 */}
          {receiptId && (
            <div className="mt-4 flex items-center justify-between rounded-xl bg-[#FFF8E8] px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-tertiary">小票编号</span>
                <span className="text-sm font-medium text-text-primary">
                  {receiptId.startsWith('XP') ? receiptId : `XP${receiptId}`}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs text-[#B8893D] shadow-sm active:opacity-70"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? '已复制' : '复制'}
              </button>
            </div>
          )}
        </div>

        {/* 常见问题 */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold text-text-primary">常见问题</div>
          <div className="mt-3 space-y-3 text-sm text-text-secondary">
            <FaqItem q="退款会扣手续费吗？" a="退款金额会原路退回至您的充值账户，不额外收取手续费。" />
            <FaqItem q="退款到账时间？" a="客服审核通过后 1-3 个工作日内到账，最快当日到账。" />
            <FaqItem q="小票编号在哪里？" a="在小票详情页顶部即可看到，以 XP 开头的字符串。" />
          </div>
        </div>

        {/* 联系人工客服 */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-text-primary">还有问题？</div>
          <div className="mt-2 text-xs text-text-secondary">
            点击下方按钮进入在线客服，由我们的人工客服为您解答。
          </div>
          <button
            type="button"
            onClick={() => navigate('/legacy-profile/customer-service')}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#D4A853] to-[#E8C97A] py-3 text-sm font-medium text-white shadow-md active:opacity-90"
          >
            <MessageCircle className="h-4 w-4" />
            联系在线客服
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---- 子组件 ---- */
function StepList() {
  const steps = [
    { label: '提交退款申请', desc: '在小票详情页点击申请', done: true },
    { label: '关注公众号并回复', desc: '按提示提交退款信息', done: false },
    { label: '客服审核', desc: '1-3 个工作日', done: false },
    { label: '退款到账', desc: '原路返回至充值账户', done: false },
  ]
  return (
    <div className="space-y-3">
      {steps.map((s, i) => (
        <div key={i} className="flex items-start gap-3">
          <div
            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
              s.done
                ? 'bg-gradient-to-br from-[#D4A853] to-[#E8C97A] text-white'
                : 'bg-bg-secondary text-text-tertiary'
            }`}
          >
            {s.done ? '✓' : i + 1}
          </div>
          <div className="flex-1">
            <div className={s.done ? 'text-sm font-medium text-text-primary' : 'text-sm text-text-primary'}>
              {s.label}
            </div>
            <div className="mt-0.5 text-xs text-text-tertiary">{s.desc}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function Row({ no, text }: { no: number; text: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FFF8E8] text-xs font-medium text-[#B8893D]">
        {no}
      </span>
      <span className="leading-relaxed">{text}</span>
    </div>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div>
      <div className="text-sm font-medium text-text-primary">{q}</div>
      <div className="mt-1 text-xs leading-relaxed text-text-secondary">{a}</div>
    </div>
  )
}