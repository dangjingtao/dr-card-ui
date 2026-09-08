import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, KeyRound, Loader2, ShieldCheck, FlaskConical, Trash2, Pencil } from 'lucide-react'
import { userInfoActions, useUserInfo } from './userInfoStore'

/* T039｜设置消费密码（卡博士淡金色风格）
 * ------------------------------------------------------------- - 用户决策（2026-09-07）：
 *   - 未设置状态：进入「请设置消费密码」二步式流程（输入 → 二次确认 → 写入 → 成功弹窗）
 *   - 已设置状态：先验证当前密码 → 功能选择（修改 / 删除）→ 修改走二步式、删除直接清空 pin
 *   - 同一页内部 phase 切换；右上角"原型状态切换"按钮支持未设置 / 已设置演示态切换
 * - 复用 PasswordVerify 的 6 格方框视觉与卡博士淡金色品牌色
 */

const PIN_LEN = 6

type Phase = 'set' | 'verify' | 'menu' | 'change' | 'delete'
type Step = 1 | 2

const DEMO_KEY = 'KBS_CONSUME_PIN_DEMO'

function readDemo(): 'unset' | 'set' {
  try {
    const v = sessionStorage.getItem(DEMO_KEY)
    return v === 'unset' ? 'unset' : 'set'
  } catch {
    return 'set'
  }
}

function writeDemo(v: 'unset' | 'set') {
  try {
    sessionStorage.setItem(DEMO_KEY, v)
  } catch {
    /* ignore */
  }
}

export default function ConsumePinPage() {
  const navigate = useNavigate()
  const userInfo = useUserInfo()

  /* 演示态：未设置 / 已设置（默认按 store 决定，sessionStorage 仅用于演示按钮切换） */
  const [demo, setDemo] = useState<'unset' | 'set'>(() => readDemo())
  const isSet = demo === 'set' ? userInfo.pin.length >= PIN_LEN : false

  /* phase：未设置 → set；已设置 → verify → menu → (change | delete) */
  const [phase, setPhase] = useState<Phase>(isSet ? 'verify' : 'set')

  /* 通用输入：用于 verify / set step1 / set step2 / change step1 / change step2 */
  const [verifyPin, setVerifyPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [step, setStep] = useState<Step>(1)

  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [verifyFocus, setVerifyFocus] = useState(false)
  const [pinFocus, setPinFocus] = useState(false)
  const [confirmFocus, setConfirmFocus] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)
  const [successTitle, setSuccessTitle] = useState('设置成功')
  const [successDesc, setSuccessDesc] = useState('新的消费密码已生效，可在校园自助机器上使用。')

  /* 6 格方框底层 input ref：点击方框聚焦 */
  const verifyRef = useRef<HTMLInputElement>(null)
  const newPinRef = useRef<HTMLInputElement>(null)
  const confirmPinRef = useRef<HTMLInputElement>(null)

  /* 切换演示态按钮 */
  const toggleDemo = () => {
    const next = demo === 'set' ? 'unset' : 'set'
    setDemo(next)
    writeDemo(next)
    /* 状态切换后重置所有状态回到新 phase 入口 */
    setVerifyPin('')
    setNewPin('')
    setConfirmPin('')
    setStep(1)
    setErrorMsg('')
    setSuccessOpen(false)
    setPhase(next === 'set' ? 'set' : 'verify')
  }

  /* —— 验证当前密码（已设置 → verify → menu） —— */
  const handleVerify = () => {
    setErrorMsg('')
    if (verifyPin.length !== PIN_LEN) {
      setErrorMsg(`请输入 ${PIN_LEN} 位数字密码`)
      return
    }
    if (verifyPin !== userInfo.pin) {
      setErrorMsg('消费密码错误，请重试')
      return
    }
    setVerifyPin('')
    setPhase('menu')
  }

  /* —— 设置流程（未设置 → set；修改 → change）共用 —— */
  const handleSetNext = () => {
    setErrorMsg('')
    if (newPin.length !== PIN_LEN) {
      setErrorMsg(`请输入 ${PIN_LEN} 位数字密码`)
      return
    }
    setStep(2)
    setTimeout(() => confirmPinRef.current?.focus(), 50)
  }

  const handleSetConfirm = async () => {
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
    setSuccessTitle(phase === 'change' ? '修改成功' : '设置成功')
    setSuccessDesc('新的消费密码已生效，可在校园自助机器上使用。')
    setSuccessOpen(true)
  }

  /* —— 删除流程（已验证 → delete） —— */
  const handleDelete = async () => {
    setSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 600))
    userInfoActions.update({ pin: '' })
    setSubmitting(false)
    setSuccessTitle('已删除')
    setSuccessDesc('消费密码已清空，下次使用请先设置。')
    setSuccessOpen(true)
  }

  /* —— 成功弹窗：继续操作 / 返回我的 —— */
  const handleSuccessContinue = () => {
    setSuccessOpen(false)
    if (phase === 'change') {
      /* 修改完成：回到验证页（已设置状态） */
      setPhase('verify')
      setNewPin('')
      setConfirmPin('')
      setStep(1)
      setDemo('set')
      writeDemo('set')
      setTimeout(() => verifyRef.current?.focus(), 50)
    } else if (phase === 'delete') {
      /* 删除完成：切到未设置 demo 态，回到 set 流程 */
      setPhase('set')
      setDemo('unset')
      writeDemo('unset')
    } else {
      /* set 完成：切到已设置 demo 态，回到 verify 流程 */
      setPhase('verify')
      setNewPin('')
      setConfirmPin('')
      setStep(1)
      setDemo('set')
      writeDemo('set')
      setTimeout(() => verifyRef.current?.focus(), 50)
    }
  }

  const handleSuccessBack = () => {
    setSuccessOpen(false)
    navigate('/legacy-profile')
  }

  /* —— 功能选择：进入修改 / 删除 —— */
  const enterChange = () => {
    setPhase('change')
    setStep(1)
    setNewPin('')
    setConfirmPin('')
    setErrorMsg('')
    setTimeout(() => newPinRef.current?.focus(), 50)
  }

  const enterDelete = () => {
    setPhase('delete')
    setErrorMsg('')
  }

  const backToMenu = () => {
    setPhase('menu')
    setNewPin('')
    setConfirmPin('')
    setStep(1)
    setErrorMsg('')
  }

  const backToVerify = () => {
    setPhase('verify')
    setErrorMsg('')
  }

  /* —— 顶部文案 —— */
  const titleMap: Record<Phase, string> = {
    set: '请设置消费密码',
    change: '修改消费密码',
    verify: '请输入消费密码',
    menu: '消费密码管理',
    delete: '确认删除',
  }

  const tipMap: Record<Phase, string> = {
    set: '请输入 6 位数字作为新的消费密码，用于校园消费/核销时的身份验证',
    change: '请输入 6 位数字新密码，旧密码将在保存成功后失效',
    verify: '请输入当前 6 位消费密码以继续',
    menu: '已通过验证。请选择修改或删除消费密码。',
    delete: '删除后需要重新设置才能继续使用，确认删除？',
  }

  return (
    <div className="relative mx-auto flex min-h-full max-w-[480px] flex-col bg-[#F8F8FA]">
      {/* 顶部栏：淡金渐变 + 返回 + 居中标题 */}
      <div
        className="relative shrink-0 px-4 pt-3 pb-4"
        style={{ background: 'linear-gradient(135deg, #D4A853 0%, #E8C97A 50%, #F0D68E 100%)' }}
      >
        <div className="relative flex items-center">
          <button
            type="button"
            aria-label="返回"
            onClick={() => {
              if (phase === 'menu' || phase === 'change') {
                backToVerify()
              } else if (phase === 'delete') {
                backToMenu()
              } else if (phase === 'set' || phase === 'verify') {
                navigate(-1)
              } else {
                navigate(-1)
              }
            }}
            className="flex h-10 w-10 items-center justify-center text-white active:opacity-80"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold text-white">
            {titleMap[phase]}
          </div>
        </div>
      </div>

      {/* 当前状态卡（除 set / delete 外都展示：未设置密码时不展示，避免显示「未设置」语义错） */}
      {phase !== 'set' && phase !== 'delete' && (
        <div className="mx-4 mt-4 flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-[#B8893D]" />
            <span className="text-sm text-text-secondary">当前消费密码</span>
          </div>
          <span className="text-sm font-semibold text-text-primary">
            {userInfo.pin ? `${userInfo.pin.slice(0, 2)}****` : '未设置'}
          </span>
        </div>
      )}

      {/* 步骤说明卡 */}
      <div className="mx-4 mt-4 flex items-start gap-2 rounded-xl bg-[#FFF8E8] px-4 py-3 text-xs leading-relaxed text-[#8B6F2F]">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#B8893D]" />
        <span>{tipMap[phase]}</span>
      </div>

      {/* —— verify 阶段：验证当前密码 —— */}
      {phase === 'verify' && (
        <div className="mx-4 mt-5">
          <label className="text-sm font-medium text-text-primary">当前消费密码</label>
          <button
            type="button"
            onClick={() => verifyRef.current?.focus()}
            aria-label="输入 6 位消费密码"
            className="mt-2 flex w-full justify-between"
          >
            {Array.from({ length: PIN_LEN }).map((_, i) => {
              const isFilled = i < verifyPin.length
              const isFocus = i === verifyPin.length && verifyFocus
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
            ref={verifyRef}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            maxLength={PIN_LEN}
            value={verifyPin}
            onFocus={() => setVerifyFocus(true)}
            onBlur={() => setVerifyFocus(false)}
            onChange={(e) => {
              const next = e.target.value.replace(/\D/g, '').slice(0, PIN_LEN)
              setVerifyPin(next)
              setErrorMsg('')
            }}
            className="sr-only"
            aria-label="6 位当前消费密码"
          />
          <p className="mt-1 text-xs text-text-tertiary">
            {verifyPin.length === 0 ? `共 ${PIN_LEN} 位数字` : `已输入 ${verifyPin.length} / ${PIN_LEN} 位`}
          </p>
          {errorMsg && (
            <div className="mt-1 text-xs text-danger-text">{errorMsg}</div>
          )}
          <button
            type="button"
            onClick={handleVerify}
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#D4A853] to-[#E8C97A] text-base font-semibold text-white shadow-md active:opacity-90"
          >
            确认
          </button>
        </div>
      )}

      {/* —— menu 阶段：修改 / 删除 —— */}
      {phase === 'menu' && (
        <div className="mx-4 mt-5 space-y-3">
          <button
            type="button"
            onClick={enterChange}
            className="flex w-full items-center justify-between rounded-2xl bg-white px-5 py-4 shadow-sm active:bg-[#F8F8FA]"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF3D9] text-[#B8893D]">
                <Pencil className="h-5 w-5" />
              </span>
              <div className="flex flex-col items-start">
                <span className="text-sm font-semibold text-text-primary">修改消费密码</span>
                <span className="text-xs text-text-tertiary">输入新密码并二次确认</span>
              </div>
            </div>
            <ChevronLeft className="h-4 w-4 rotate-180 text-text-tertiary" />
          </button>
          <button
            type="button"
            onClick={enterDelete}
            className="flex w-full items-center justify-between rounded-2xl bg-white px-5 py-4 shadow-sm active:bg-[#F8F8FA]"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FEE2E2] text-[#D63E50]">
                <Trash2 className="h-5 w-5" />
              </span>
              <div className="flex flex-col items-start">
                <span className="text-sm font-semibold text-text-primary">删除消费密码</span>
                <span className="text-xs text-text-tertiary">删除后需要重新设置</span>
              </div>
            </div>
            <ChevronLeft className="h-4 w-4 rotate-180 text-text-tertiary" />
          </button>
        </div>
      )}

      {/* —— set / change 阶段：二步式设密 —— */}
      {(phase === 'set' || phase === 'change') && (
        <PinSteps
          step={step}
          newPin={newPin}
          setNewPin={setNewPin}
          confirmPin={confirmPin}
          setConfirmPin={setConfirmPin}
          newPinRef={newPinRef}
          confirmPinRef={confirmPinRef}
          pinFocus={pinFocus}
          setPinFocus={setPinFocus}
          confirmFocus={confirmFocus}
          setConfirmFocus={setConfirmFocus}
          errorMsg={errorMsg}
          setErrorMsg={setErrorMsg}
          submitting={submitting}
          onNext={handleSetNext}
          onConfirm={handleSetConfirm}
          onBackToPrev={() => {
            if (phase === 'change') {
              backToMenu()
            } else {
              /* set 流程没有上一步，回到 set 第一步清空输入 */
              setStep(1)
              setConfirmPin('')
              setErrorMsg('')
            }
          }}
          backLabel={phase === 'change' ? '返回上一步' : '返回上一步'}
        />
      )}

      {/* —— delete 阶段：确认删除 —— */}
      {phase === 'delete' && (
        <div className="mx-4 mt-6 rounded-2xl bg-white p-5 shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FEE2E2]">
            <Trash2 className="h-7 w-7 text-[#D63E50]" />
          </div>
          <h3 className="mt-3 text-center text-lg font-semibold text-text-primary">确认删除消费密码？</h3>
          <p className="mt-1 text-center text-sm text-text-secondary">
            删除后下次进入需要重新设置；建议删除前确认已记住当前密码。
          </p>
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={backToMenu}
              className="flex-1 h-11 rounded-full border border-border bg-white text-sm font-medium text-text-secondary active:bg-surface-pressed"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={submitting}
              className="flex-1 h-11 rounded-full bg-[#D63E50] text-sm font-semibold text-white shadow-sm active:bg-[#A92939] disabled:opacity-60"
            >
              {submitting && <Loader2 className="mr-1 inline h-4 w-4 animate-spin" />}
              {submitting ? '删除中' : '确认删除'}
            </button>
          </div>
        </div>
      )}

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
              <h2 className="text-lg font-semibold text-text-primary">{successTitle}</h2>
              <p className="mt-2 text-sm text-text-secondary">{successDesc}</p>
            </div>
            <div className="flex border-t border-border-subtle">
              <button
                type="button"
                onClick={handleSuccessContinue}
                className="flex-1 py-3 text-sm text-text-secondary active:bg-surface-pressed"
              >
                继续操作
              </button>
              <div className="w-px bg-border-subtle" />
              <button
                type="button"
                onClick={handleSuccessBack}
                className="flex-1 py-3 text-sm font-semibold text-[#B8893D] active:bg-surface-pressed"
              >
                返回我的
              </button>
            </div>
          </div>
        </div>
      )}

      {/* T039：演示态切换按钮（右下角浮动） */}
      <button
        type="button"
        onClick={toggleDemo}
        title="切换消费密码演示态（仅供设计演示）"
        className="absolute right-4 bottom-[calc(80px+env(safe-area-inset-bottom))] z-40 flex h-11 items-center gap-1.5 rounded-full border border-[#E8D9B8] bg-white px-4 text-xs font-medium text-[#B8893D] shadow-md active:opacity-70"
      >
        <FlaskConical className="h-4 w-4" />
        {demo === 'set' ? '已设置密码' : '未设置密码'}
      </button>
    </div>
  )
}

/* —— 二步式密码设置组件（set / change 共用） —— */
function PinSteps(props: {
  step: Step
  newPin: string
  setNewPin: (v: string) => void
  confirmPin: string
  setConfirmPin: (v: string) => void
  newPinRef: React.RefObject<HTMLInputElement>
  confirmPinRef: React.RefObject<HTMLInputElement>
  pinFocus: boolean
  setPinFocus: (v: boolean) => void
  confirmFocus: boolean
  setConfirmFocus: (v: boolean) => void
  errorMsg: string
  setErrorMsg: (v: string) => void
  submitting: boolean
  onNext: () => void
  onConfirm: () => void
  onBackToPrev: () => void
  backLabel: string
}) {
  const {
    step,
    newPin,
    setNewPin,
    confirmPin,
    setConfirmPin,
    newPinRef,
    confirmPinRef,
    pinFocus,
    setPinFocus,
    confirmFocus,
    setConfirmFocus,
    errorMsg,
    setErrorMsg,
    submitting,
    onNext,
    onConfirm,
    onBackToPrev,
    backLabel,
  } = props

  const steps = [
    { idx: 1 as const, label: '输入密码' },
    { idx: 2 as const, label: '确认密码' },
  ]

  return (
    <>
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
                <span className={`h-px w-10 ${done ? 'bg-[#D4A853]' : 'bg-gray-200'}`} />
              )}
            </div>
          )
        })}
      </div>

      {/* 步骤 1 */}
      {step === 1 && (
        <div className="mx-4 mt-5">
          <label className="text-sm font-medium text-text-primary">新密码</label>
          <button
            type="button"
            onClick={() => newPinRef.current?.focus()}
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
          <button
            type="button"
            onClick={onNext}
            disabled={newPin.length !== PIN_LEN}
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#D4A853] to-[#E8C97A] text-base font-semibold text-white shadow-md active:opacity-90 disabled:opacity-50"
          >
            下一步
          </button>
          {errorMsg && (
            <div className="mt-2 text-center text-xs text-danger-text">{errorMsg}</div>
          )}
        </div>
      )}

      {/* 步骤 2 */}
      {step === 2 && (
        <div className="mx-4 mt-5">
          <label className="text-sm font-medium text-text-primary">再次输入密码</label>
          <button
            type="button"
            onClick={() => confirmPinRef.current?.focus()}
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
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting || confirmPin.length !== PIN_LEN}
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#D4A853] to-[#E8C97A] text-base font-semibold text-white shadow-md active:opacity-90 disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
            {submitting ? '保存中…' : '确认保存'}
          </button>
          <button
            type="button"
            onClick={onBackToPrev}
            className="mt-3 block w-full text-center text-sm text-text-secondary active:opacity-70"
          >
            {backLabel}
          </button>
        </div>
      )}
    </>
  )
}