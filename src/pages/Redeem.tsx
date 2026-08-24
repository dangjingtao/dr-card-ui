import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Loader2, Ticket, XCircle } from 'lucide-react'
import DebugPanel from '../components/mobile/DebugPanel'
import PageContainer from '../components/mobile/PageContainer'
import { useFixtureState } from '../app/fixtures/useFixture'
import { findRouteByPathname } from '../app/router/routes'
import {
  REDEEM_CODE_RULE,
  REDEEM_FEEDBACK,
  REDEEM_SAMPLE_CODES,
  resolveRedeemOutcome,
  type RedeemOutcome,
} from '../app/fixtures'

/**
 * 兑换卡券（#68 输入与失败态 / #69 兑换成功）
 * -------------------------------------------------------------
 * 视觉与交互取自 reference/兑换卡券.html：ticket 前缀图标、56 高输入框、聚焦描边、
 * 清除按钮仅在有输入时出现、48 高圆角主按钮、居中 toast（成功绿 / 失败红）。
 * ⚠️ 未定稿（B-009）：摹客原型分别出现「8 位」「11 位」，reference 与历史稿为 12 位。
 *    页面不自持任何位数常量，位数 / 字符集 / 提示文案全部读 REDEEM_CODE_RULE，
 *    定稿时只改夹具一处。规则未定期间提交按钮只在「空输入」时禁用（照 reference syncState），
 *    不用位数提前拦截，避免把未确认的位数表现成最终校验规则。
 * 失败分支（无效 / 已使用 / 网络异常）通过 REDEEM_CODE_OUTCOMES 的确定性演示码触发，
 * 也可用 `?state=invalid` 等直达截图。
 */
export default function Redeem() {
  const navigate = useNavigate()
  const route = findRouteByPathname('/redeem')
  const { state } = useFixtureState(route)

  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [outcome, setOutcome] = useState<RedeemOutcome | null>(null)
  const timers = useRef<number[]>([])

  const trimmed = code.replace(/\s/g, '')
  const feedback = outcome ? REDEEM_FEEDBACK[outcome] : null
  const done = outcome === 'success'

  /** `?state=` 直达：回填该分支的演示码并落到对应反馈，便于逐节点截图 */
  useEffect(() => {
    const key = state?.key as RedeemOutcome | undefined
    if (!key || !(key in REDEEM_SAMPLE_CODES)) return
    setCode(REDEEM_SAMPLE_CODES[key])
    setOutcome(key)
    setSubmitting(false)
  }, [state?.key])

  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), [])

  const track = (fn: () => void, delay: number) => {
    timers.current.push(window.setTimeout(fn, delay))
  }

  const clear = () => {
    setCode('')
    setOutcome(null)
  }

  const submit = () => {
    if (!trimmed || submitting) return
    setOutcome(null)
    setSubmitting(true)
    /** 提交中态：夹具环境下用固定时长模拟一次请求往返，非随机 */
    track(() => {
      setSubmitting(false)
      const next = resolveRedeemOutcome(trimmed)
      setOutcome(next)
      if (next !== 'success') track(() => setOutcome(null), 2000)
    }, 700)
  }

  if (done) {
    return (
      <PageContainer className="flex min-h-full flex-col pb-6" inset>
        <div className="flex flex-col items-center gap-3 px-5 pb-4 pt-14 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success-bg" aria-hidden>
            <CheckCircle2 className="h-8 w-8 text-success" />
          </span>
          <h1 className="text-lg font-semibold text-text-primary">兑换成功</h1>
          <p className="max-w-[260px] text-sm leading-6 text-text-secondary">{REDEEM_FEEDBACK.success.text}</p>
        </div>

        <section className="mx-4 mt-5 flex items-center gap-3 rounded-container bg-surface p-3 shadow-sm">
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-surface-selected text-text-brand"
            aria-hidden
          >
            <Ticket className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-text-tertiary">兑换码</p>
            <p className="mt-0.5 truncate text-base font-semibold tracking-[0.08em] text-text-primary">{trimmed}</p>
          </div>
        </section>

        <div className="mt-auto flex flex-col items-center gap-2 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-5">
          <button
            type="button"
            onClick={() => navigate('/card')}
            className="h-12 w-full rounded-full bg-primary text-base font-medium text-text-inverse active:bg-primary-pressed"
          >
            查看我的卡包
          </button>
          <button type="button" onClick={clear} className="h-9 text-sm font-medium text-text-secondary">
            再兑换一张
          </button>
        </div>

        <DebugPanel route={route} />
      </PageContainer>
    )
  }

  return (
    <PageContainer className="pb-24">
      <div className="mt-2 flex h-14 items-center gap-2 rounded-container border-2 border-transparent bg-surface px-4 focus-within:border-border-focused">
        <Ticket className="h-5 w-5 flex-none text-text-tertiary" aria-hidden />
        <input
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={REDEEM_CODE_RULE.length}
          value={code}
          onChange={(event) => {
            setCode(event.target.value.toUpperCase())
            setOutcome(null)
          }}
          placeholder="请输入兑换码"
          aria-label="兑换码"
          className="min-w-0 flex-1 bg-transparent text-base tracking-[0.08em] text-text-primary outline-none placeholder:tracking-normal placeholder:text-text-placeholder"
        />
        {code && (
          <button type="button" aria-label="清空" onClick={clear} className="flex-none text-text-tertiary">
            <XCircle className="h-5 w-5" />
          </button>
        )}
      </div>

      <p className="mt-3 text-center text-xs text-text-tertiary">{REDEEM_CODE_RULE.hint}</p>

      <button
        type="button"
        disabled={!trimmed || submitting}
        onClick={submit}
        className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-base font-medium text-text-inverse active:bg-primary-pressed disabled:bg-disabled disabled:text-text-disabled"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            提交中
          </>
        ) : (
          '确认兑换'
        )}
      </button>

      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed left-1/2 top-1/2 z-50 flex w-fit -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-control px-5 py-3 text-sm text-text-inverse shadow-floating ${
            feedback.ok ? 'bg-success' : 'bg-danger'
          }`}
        >
          {feedback.ok ? <CheckCircle2 className="h-[18px] w-[18px]" /> : <AlertCircle className="h-[18px] w-[18px]" />}
          {feedback.text}
        </div>
      )}

      <DebugPanel route={route} />
    </PageContainer>
  )
}
