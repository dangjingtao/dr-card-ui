import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, KeyRound, Loader2, ShieldCheck } from 'lucide-react'
import { useUserInfo } from './userInfoStore'

/* T039｜机器端消费密码领取/核销（卡博士淡金色风格）
 * ------------------------------------------------------------- - 流程：手机尾号（4 位）+ 消费密码（6 位）→ 提交 → 成功弹窗
 * - 复用 `PasswordVerify` 的 6 格方框视觉与样式
 * - mock 校验：与 `userInfo.phone.slice(-4)` + 默认密码 `000000` 匹配才返回成功
 */

const PIN_LEN = 6
const TAIL_LEN = 4

export default function ConsumePinPage() {
  const navigate = useNavigate()
  const userInfo = useUserInfo()

  const [tail, setTail] = useState('')
  const [pin, setPin] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successOpen, setSuccessOpen] = useState(false)
  const [pinFocus, setPinFocus] = useState(false)

  const pinInputRef = useRef<HTMLInputElement>(null)

  const expectedTail = userInfo.phone.slice(-TAIL_LEN)
  const filledPin = pin.length

  const handleConfirm = async () => {
    setErrorMsg('')
    if (!agreed) {
      setErrorMsg('请先勾选并同意《用户协议》与《隐私政策》')
      return
    }
    if (tail.length !== TAIL_LEN) {
      setErrorMsg(`请输入手机尾号后 ${TAIL_LEN} 位`)
      return
    }
    if (tail !== expectedTail) {
      setErrorMsg('手机尾号不匹配，请确认后重试')
      return
    }
    if (pin.length !== PIN_LEN) {
      setErrorMsg(`请输入 ${PIN_LEN} 位消费密码`)
      return
    }
    if (pin !== userInfo.pin) {
      setErrorMsg('消费密码错误，请重试')
      return
    }

    setSubmitting(true)
    /* mock 请求 600ms */
    await new Promise((resolve) => setTimeout(resolve, 600))
    setSubmitting(false)
    setSuccessOpen(true)
  }

  const handleContinue = () => {
    setSuccessOpen(false)
    setTail('')
    setPin('')
    setErrorMsg('')
  }

  const handleBack = () => {
    setSuccessOpen(false)
    navigate('/legacy-profile')
  }

  return (
    <div className="mx-auto flex min-h-full max-w-[480px] flex-col bg-[#F8F8FA]">
      {/* 顶部栏：淡金渐变 + 返回 + 居中标题 */}
      <div
        className="relative shrink-0 px-4 pt-3 pb-4"
        style={{ background: 'linear-gradient(135deg, #D4A853 0%, #E8C97A 50%, #F0D68E 100%)' }}
      >
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
            消费密码
          </div>
        </div>
      </div>

      {/* 头部说明 */}
      <div className="mx-4 mt-6 flex flex-col items-center px-2 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF3D9]">
          <KeyRound className="h-6 w-6 text-[#B8893D]" />
        </div>
        <h2 className="mt-3 text-lg font-semibold text-text-primary">请输入手机尾号和消费密码</h2>
        <p className="mt-1 text-xs text-text-secondary">
          在卡博士自助机器上，学生无需打开手机，输入手机尾号 + 6 位消费密码即可领取 / 核销
        </p>
      </div>

      {/* 提示卡 */}
      <div className="mx-4 mt-4 flex items-start gap-2 rounded-xl bg-[#FFF8E8] px-4 py-3 text-xs leading-relaxed text-[#8B6F2F]">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#B8893D]" />
        <span>仅用于演示流程：当前账号尾号后 {TAIL_LEN} 位为「{expectedTail}」，消费密码默认「{userInfo.pin}」</span>
      </div>

      {/* 手机尾号输入 */}
      <div className="mx-4 mt-5">
        <label className="text-sm font-medium text-text-primary">手机尾号</label>
        <div
          className={`mt-2 flex h-12 items-center gap-2 rounded-full border bg-white px-5 shadow-sm ${
            errorMsg && tail.length > 0 && tail !== expectedTail ? 'border-danger' : 'border-[#E8D9B8]'
          }`}
        >
          <input
            value={tail}
            onChange={(e) => {
              const next = e.target.value.replace(/\D/g, '').slice(0, TAIL_LEN)
              setTail(next)
              setErrorMsg('')
            }}
            inputMode="numeric"
            autoComplete="off"
            maxLength={TAIL_LEN}
            placeholder="请输入手机尾号后 4 位"
            className="h-full flex-1 bg-transparent text-base tracking-widest text-text-primary outline-none placeholder:text-[#B8893D] placeholder:tracking-normal"
          />
        </div>
        {errorMsg && (tail.length > 0 && tail !== expectedTail) && (
          <div className="mt-1 text-xs text-danger-text">{errorMsg}</div>
        )}
      </div>

      {/* 消费密码输入（6 格方框样式，复用 PasswordVerify 视觉） */}
      <div className="mx-4 mt-5">
        <label className="text-sm font-medium text-text-primary">消费密码</label>
        <button
          type="button"
          onClick={() => pinInputRef.current?.focus()}
          aria-label="输入 6 位消费密码"
          className="mt-2 flex w-full justify-between"
        >
          {Array.from({ length: PIN_LEN }).map((_, i) => {
            const isFilled = i < filledPin
            const isFocus = i === filledPin && pinFocus
            const isError = errorMsg !== '' && pin.length >= PIN_LEN && pin !== userInfo.pin
            return (
              <span
                key={i}
                className={`flex h-12 w-12 items-center justify-center rounded-xl border text-xl font-bold shadow-sm ${
                  isFilled
                    ? isError
                      ? 'border-danger bg-surface text-text-primary'
                      : 'border-primary bg-surface text-text-primary'
                    : isFocus
                      ? 'border-primary bg-surface'
                      : 'border-border bg-surface text-transparent'
                }`}
              >
                {isFilled
                  ? '•'
                  : isFocus
                    ? '|'
                    : ''}
              </span>
            )
          })}
        </button>
        <input
          ref={pinInputRef}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={PIN_LEN}
          value={pin}
          onFocus={() => setPinFocus(true)}
          onBlur={() => setPinFocus(false)}
          onChange={(e) => {
            const next = e.target.value.replace(/\D/g, '').slice(0, PIN_LEN)
            setPin(next)
            setErrorMsg('')
          }}
          className="sr-only"
          aria-label="6 位消费密码"
        />
        <p className="mt-1 text-xs text-text-tertiary">
          {pin.length === 0 ? `共 ${PIN_LEN} 位数字` : `已输入 ${pin.length} / ${PIN_LEN} 位`}
        </p>
        {errorMsg && pin.length >= PIN_LEN && pin !== userInfo.pin && (
          <div className="mt-1 text-xs text-danger-text">{errorMsg}</div>
        )}
      </div>

      {/* 主操作 */}
      <button
        type="button"
        onClick={handleConfirm}
        disabled={submitting}
        className="mx-4 mt-6 flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#D4A853] to-[#E8C97A] text-base font-semibold text-white shadow-md active:opacity-90 disabled:opacity-60"
      >
        {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
        {submitting ? '核销中…' : '确认领取/核销'}
      </button>

      {/* 协议勾选（整行居中） */}
      <div className="mt-5 flex justify-center px-4">
        <label className="flex items-start gap-2 text-xs text-text-secondary">
          <button
            type="button"
            aria-label={agreed ? '取消同意' : '同意协议'}
            onClick={() => setAgreed(!agreed)}
            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition ${
              agreed
                ? 'border-[#D4A853] bg-gradient-to-br from-[#D4A853] to-[#E8C97A]'
                : 'border-text-tertiary bg-white'
            }`}
          >
            {agreed && (
              <svg viewBox="0 0 24 24" className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth="4">
                <polyline points="5 12 10 17 19 7" />
              </svg>
            )}
          </button>
          <span className="leading-relaxed">
            我已阅读并同意
            <span className="text-[#B8893D]">《用户协议》</span>
            和
            <span className="text-[#B8893D]">《隐私政策》</span>
          </span>
        </label>
      </div>

      {/* 底部安全区 */}
      <div className="mt-auto pb-[calc(20px+env(safe-area-inset-bottom))]" />

      {/* 成功弹窗 */}
      {successOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim px-6">
          <div className="w-full max-w-[327px] overflow-hidden rounded-2xl bg-surface shadow-modal">
            <div className="px-6 pt-6 pb-3 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF3D9]">
                <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#B8893D]" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-text-primary">领取/核销成功</h2>
              <p className="mt-2 text-sm text-text-secondary">
                机器端消费密码使用成功，可在「我的小票」查看最新流水。
              </p>
            </div>
            <div className="flex border-t border-border-subtle">
              <button
                type="button"
                onClick={handleContinue}
                className="flex-1 py-3 text-sm text-text-secondary active:bg-surface-pressed"
              >
                继续操作
              </button>
              <div className="w-px bg-border-subtle" />
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 py-3 text-sm font-semibold text-[#B8893D] active:bg-surface-pressed"
              >
                返回我的
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}