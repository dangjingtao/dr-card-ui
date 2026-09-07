import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, KeyRound, Loader2, ShieldCheck } from 'lucide-react'
import { userInfoActions, useUserInfo } from './userInfoStore'

/* T039｜设置消费密码（卡博士淡金色风格）
 * ------------------------------------------------------------- - 用户决策（2026-09-07）：APP 上只需要进行"设置消费密码"这一流程，
 *   不再做"输入尾号 + 密码"那种机器端核销交互。
 * - 流程：步骤1 输入 6 位新密码 → 步骤2 二次确认 → 一致后 mock 600ms 写入
 *   userInfoStore.pin → 弹"设置成功"弹窗。
 * - 复用 PasswordVerify 的 6 格方框视觉与卡博士淡金色品牌色。
 */

const PIN_LEN = 6

type Step = 1 | 2

export default function ConsumePinPage() {
  const navigate = useNavigate()
  const userInfo = useUserInfo()

  const [step, setStep] = useState<Step>(1)
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [pinFocus, setPinFocus] = useState(false)
  const [confirmFocus, setConfirmFocus] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)

  /* 6 格方框底层 input ref：点击方框聚焦 */
  const newPinRef = useRef<HTMLInputElement>(null)
  const confirmPinRef = useRef<HTMLInputElement>(null)

  /* 顶部步骤指示 */
  const steps = [
    { idx: 1 as const, label: '输入密码' },
    { idx: 2 as const, label: '确认密码' },
  ]

  const focusNew = () => newPinRef.current?.focus()
  const focusConfirm = () => confirmPinRef.current?.focus()

  /** 步骤 1 → 2 的过渡 */
  const handleNext = () => {
    setErrorMsg('')
    if (newPin.length !== PIN_LEN) {
      setErrorMsg(`请输入 ${PIN_LEN} 位数字密码`)
      return
    }
    if (!agreed) {
      setErrorMsg('请先勾选并同意《用户协议》与《隐私政策》')
      return
    }
    setStep(2)
    /* 自动聚焦到第二步输入框，提升演示连贯性 */
    setTimeout(() => focusConfirm(), 50)
  }

  /** 步骤 2 提交：mock 600ms → 写入 userInfoStore.pin */
  const handleConfirm = async () => {
    setErrorMsg('')
    if (confirmPin.length !== PIN_LEN) {
      setErrorMsg(`请输入 ${PIN_LEN} 位数字密码`)
      return
    }
    if (confirmPin !== newPin) {
      setErrorMsg('两次输入的密码不一致，请重新输入')
      return
    }
    setSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 600))
    userInfoActions.update({ pin: newPin })
    setSubmitting(false)
    setSuccessOpen(true)
  }

  /** 成功弹窗：继续修改（清空状态回到步骤 1） */
  const handleContinue = () => {
    setSuccessOpen(false)
    setStep(1)
    setNewPin('')
    setConfirmPin('')
    setErrorMsg('')
    setTimeout(() => focusNew(), 50)
  }

  /** 成功弹窗：返回我的 */
  const handleBack = () => {
    setSuccessOpen(false)
    navigate('/legacy-profile')
  }

  /** 顶部提示卡：根据 step 切换提示文案 */
  const tipText =
    step === 1
      ? `请输入 ${PIN_LEN} 位数字作为新的消费密码，用于校园消费/核销时的身份验证`
      : '请再次输入刚才设置的密码以确认无误'

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
            设置消费密码
          </div>
        </div>
      </div>

      {/* 步骤指示器 */}
      <div className="mx-4 mt-5 flex items-center justify-center gap-3">
        {steps.map((s, i) => {
          const active = step === s.idx
          const done = step > s.idx
          return (
            <div key={s.idx} className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition ${
                    active || done
                      ? 'bg-gradient-to-br from-[#D4A853] to-[#E8C97A] text-white'
                      : 'bg-gray-100 text-text-tertiary'
                  }`}
                >
                  {s.idx}
                </span>
                <span
                  className={`text-sm ${
                    active || done ? 'font-medium text-text-primary' : 'text-text-tertiary'
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <span
                  className={`h-px w-10 ${done ? 'bg-[#D4A853]' : 'bg-gray-200'}`}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* 当前状态卡 */}
      <div className="mx-4 mt-4 rounded-xl bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-[#B8893D]" />
            <span className="text-sm text-text-secondary">当前消费密码</span>
          </div>
          <span className="text-sm font-semibold text-text-primary">
            {userInfo.pin ? `${userInfo.pin.slice(0, 2)}****` : '未设置'}
          </span>
        </div>
      </div>

      {/* 步骤说明 */}
      <div className="mx-4 mt-4 flex items-start gap-2 rounded-xl bg-[#FFF8E8] px-4 py-3 text-xs leading-relaxed text-[#8B6F2F]">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#B8893D]" />
        <span>{tipText}</span>
      </div>

      {/* 步骤 1：输入新密码 */}
      {step === 1 && (
        <div className="mx-4 mt-5">
          <label className="text-sm font-medium text-text-primary">新密码</label>
          <button
            type="button"
            onClick={focusNew}
            aria-label="输入 6 位消费密码"
            className="mt-2 flex w-full justify-between"
          >
            {Array.from({ length: PIN_LEN }).map((_, i) => {
              const isFilled = i < newPin.length
              const isFocus = i === newPin.length && pinFocus
              return (
                <span
                  key={i}
                  className={`flex h-12 w-12 items-center justify-center rounded-xl border text-xl font-bold shadow-sm transition ${
                    isFilled
                      ? 'border-[#D4A853] bg-surface text-text-primary'
                      : isFocus
                        ? 'border-[#D4A853] bg-surface'
                        : 'border-border bg-surface text-transparent'
                  }`}
                >
                  {isFilled ? '•' : isFocus ? '|' : ''}
                </span>
              )
            })}
          </button>
          <input
            ref={newPinRef}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            maxLength={PIN_LEN}
            value={newPin}
            onFocus={() => setPinFocus(true)}
            onBlur={() => setPinFocus(false)}
            onChange={(e) => {
              const next = e.target.value.replace(/\D/g, '').slice(0, PIN_LEN)
              setNewPin(next)
              setErrorMsg('')
            }}
            className="sr-only"
            aria-label="6 位新消费密码"
          />
          <p className="mt-1 text-xs text-text-tertiary">
            {newPin.length === 0 ? `共 ${PIN_LEN} 位数字` : `已输入 ${newPin.length} / ${PIN_LEN} 位`}
          </p>

          {/* 协议勾选（整行居中） */}
          <div className="mt-5 flex justify-center">
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

          {/* 下一步 */}
          <button
            type="button"
            onClick={handleNext}
            disabled={newPin.length !== PIN_LEN}
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#D4A853] to-[#E8C97A] text-base font-semibold text-white shadow-md active:opacity-90 disabled:opacity-50"
          >
            下一步
          </button>
          {errorMsg && step === 1 && (
            <div className="mt-2 text-center text-xs text-danger-text">{errorMsg}</div>
          )}
        </div>
      )}

      {/* 步骤 2：二次确认 */}
      {step === 2 && (
        <div className="mx-4 mt-5">
          <label className="text-sm font-medium text-text-primary">再次输入密码</label>
          <button
            type="button"
            onClick={focusConfirm}
            aria-label="再次输入 6 位消费密码"
            className="mt-2 flex w-full justify-between"
          >
            {Array.from({ length: PIN_LEN }).map((_, i) => {
              const isFilled = i < confirmPin.length
              const isFocus = i === confirmPin.length && confirmFocus
              return (
                <span
                  key={i}
                  className={`flex h-12 w-12 items-center justify-center rounded-xl border text-xl font-bold shadow-sm transition ${
                    isFilled
                      ? 'border-[#D4A853] bg-surface text-text-primary'
                      : isFocus
                        ? 'border-[#D4A853] bg-surface'
                        : 'border-border bg-surface text-transparent'
                  }`}
                >
                  {isFilled ? '•' : isFocus ? '|' : ''}
                </span>
              )
            })}
          </button>
          <input
            ref={confirmPinRef}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            maxLength={PIN_LEN}
            value={confirmPin}
            onFocus={() => setConfirmFocus(true)}
            onBlur={() => setConfirmFocus(false)}
            onChange={(e) => {
              const next = e.target.value.replace(/\D/g, '').slice(0, PIN_LEN)
              setConfirmPin(next)
              setErrorMsg('')
            }}
            className="sr-only"
            aria-label="6 位再次确认消费密码"
          />
          <p className="mt-1 text-xs text-text-tertiary">
            {confirmPin.length === 0
              ? `共 ${PIN_LEN} 位数字`
              : `已输入 ${confirmPin.length} / ${PIN_LEN} 位`}
          </p>
          {errorMsg && (
            <div className="mt-1 text-xs text-danger-text">{errorMsg}</div>
          )}

          {/* 提交 */}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting || confirmPin.length !== PIN_LEN}
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#D4A853] to-[#E8C97A] text-base font-semibold text-white shadow-md active:opacity-90 disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
            {submitting ? '保存中…' : '确认保存'}
          </button>

          {/* 返回上一步 */}
          <button
            type="button"
            onClick={() => {
              setStep(1)
              setConfirmPin('')
              setErrorMsg('')
            }}
            className="mt-3 block w-full text-center text-sm text-text-secondary active:opacity-70"
          >
            返回上一步
          </button>
        </div>
      )}

      {/* 底部安全区 */}
      <div className="mt-auto pb-[calc(20px+env(safe-area-inset-bottom))]" />

      {/* 设置成功弹窗 */}
      {successOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim px-6">
          <div className="w-full max-w-[327px] overflow-hidden rounded-2xl bg-surface shadow-modal">
            <div className="px-6 pt-6 pb-3 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF3D9]">
                <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#B8893D]" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-text-primary">设置成功</h2>
              <p className="mt-2 text-sm text-text-secondary">
                新的消费密码已生效，可在校园自助机器上使用。
              </p>
            </div>
            <div className="flex border-t border-border-subtle">
              <button
                type="button"
                onClick={handleContinue}
                className="flex-1 py-3 text-sm text-text-secondary active:bg-surface-pressed"
              >
                继续修改
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