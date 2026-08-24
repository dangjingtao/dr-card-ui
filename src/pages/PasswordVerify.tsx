import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound } from 'lucide-react'
import PageContainer from '../components/mobile/PageContainer'

const LEN = 6

export default function PasswordVerify() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)

  const filled = value.length

  // 二级页不显示底部导航，底部只需自带安全区，不再按 TabBar 高度预留
  return (
    <PageContainer className="pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <div className="mt-6 flex flex-col items-center text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-reward-subtle text-reward-text">
          <KeyRound className="h-7 w-7" />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-text-primary">请输入消费密码</h2>
        <p className="mt-1 text-sm text-text-tertiary">由店员确认后完成核销</p>
      </div>

      <button
        type="button"
        className="mx-auto mt-8 flex w-full max-w-[343px] justify-between"
        onClick={() => inputRef.current?.focus()}
        aria-label="输入 6 位消费密码"
      >
        {Array.from({ length: LEN }).map((_, i) => {
          const isFilled = i < filled
          const isFocus = i === filled && focused
          return (
            <span
              key={i}
              className={`flex h-12 w-12 items-center justify-center rounded-xl border text-xl font-bold ${
                isFilled
                  ? 'border-primary bg-surface text-text-primary'
                  : isFocus
                    ? 'border-primary bg-surface'
                    : 'border-border bg-surface text-transparent'
              }`}
            >
              {isFilled ? '•' : isFocus ? '|' : ''}
            </span>
          )
        })}
      </button>

      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        maxLength={LEN}
        value={value}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => setValue(e.target.value.replace(/\D/g, '').slice(0, LEN))}
        className="sr-only"
        aria-label="6 位消费密码"
      />

      <p className="mt-4 text-center text-xs text-text-tertiary">6 位数字 · 用于门店消费核验</p>

      <button
        type="button"
        disabled={filled < LEN}
        onClick={() => navigate('/card/verify/confirm')}
        className="mx-auto mt-8 block h-12 w-full max-w-[343px] rounded-2xl bg-primary text-sm font-medium text-white active:bg-primary-pressed disabled:bg-disabled disabled:text-text-disabled"
      >
        确认核销
      </button>
    </PageContainer>
  )
}
