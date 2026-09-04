import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Smartphone, Shield, Loader2 } from 'lucide-react'
import { useUserInfo, userInfoActions, isValidPhone } from './userInfoStore'

/* ---- 步骤文案对齐 routes.ts owner 描述：「原号验证 → 新号验证 → 换绑成功」 ---- */
const STEPS = [
  { idx: 1, label: '原号验证' },
  { idx: 2, label: '新号验证' },
  { idx: 3, label: '换绑成功' },
] as const

type StepIdx = 1 | 2 | 3

export default function PhoneChangePage() {
  const navigate = useNavigate()
  const currentPhone = useUserInfo().phone

  const [step, setStep] = useState<StepIdx>(1)

  /* 步骤 1：原手机号验证 */
  const [oldPhone, setOldPhone] = useState(currentPhone)
  const [oldCode, setOldCode] = useState('')
  const [oldCountdown, setOldCountdown] = useState(0)

  /* 步骤 2：新手机号验证 */
  const [newPhone, setNewPhone] = useState('')
  const [newCode, setNewCode] = useState('')
  const [newCountdown, setNewCountdown] = useState(0)

  /* 异步请求状态 */
  const [submitting, setSubmitting] = useState(false)

  /* 错误提示：每个输入框独立显示 */
  const [oldPhoneErr, setOldPhoneErr] = useState('')
  const [oldCodeErr, setOldCodeErr] = useState('')
  const [newPhoneErr, setNewPhoneErr] = useState('')
  const [newCodeErr, setNewCodeErr] = useState('')

  const timersRef = useRef<Record<string, ReturnType<typeof setInterval>>>({})

  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach(clearInterval)
    }
  }, [])

  const startCountdown = (key: 'old' | 'new', setter: typeof setOldCountdown) => {
    if (timersRef.current[key]) clearInterval(timersRef.current[key])
    setter(60)
    timersRef.current[key] = setInterval(() => {
      setter((c) => {
        if (c <= 1) {
          clearInterval(timersRef.current[key])
          return 0
        }
        return c - 1
      })
    }, 1000)
  }

  const handleSendOldCode = () => {
    if (!oldPhone) {
      setOldPhoneErr('请填写原手机号')
      return
    }
    if (!isValidPhone(oldPhone)) {
      setOldPhoneErr('原手机号格式不正确')
      return
    }
    setOldPhoneErr('')
    startCountdown('old', setOldCountdown)
  }

  const handleSendNewCode = () => {
    if (!newPhone) {
      setNewPhoneErr('请填写新手机号')
      return
    }
    if (!isValidPhone(newPhone)) {
      setNewPhoneErr('新手机号格式不正确')
      return
    }
    if (newPhone === oldPhone) {
      setNewPhoneErr('新手机号不能与原手机号相同')
      return
    }
    setNewPhoneErr('')
    startCountdown('new', setNewCountdown)
  }

  /* 模拟请求：异步 + 1 秒延迟 + 偶发失败以演示错误态 */
  const fakeRequest = (failRate = 0): Promise<void> =>
    new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() < failRate) reject(new Error('网络异常，请稍后重试'))
        else resolve()
      }, 800)
    })

  const handleNext = async () => {
    if (submitting) return
    if (step === 1) {
      setOldPhoneErr('')
      setOldCodeErr('')
      if (!oldPhone) {
        setOldPhoneErr('请填写原手机号')
        return
      }
      if (!isValidPhone(oldPhone)) {
        setOldPhoneErr('原手机号格式不正确')
        return
      }
      if (oldPhone !== currentPhone) {
        setOldPhoneErr('与当前绑定手机号不一致')
        return
      }
      if (oldCode.length < 4) {
        setOldCodeErr('请填写 4-6 位验证码')
        return
      }
      try {
        setSubmitting(true)
        await fakeRequest()
        setStep(2)
      } catch (e) {
        setOldCodeErr(e instanceof Error ? e.message : '验证失败')
      } finally {
        setSubmitting(false)
      }
      return
    }
    if (step === 2) {
      setNewPhoneErr('')
      setNewCodeErr('')
      if (!newPhone) {
        setNewPhoneErr('请填写新手机号')
        return
      }
      if (!isValidPhone(newPhone)) {
        setNewPhoneErr('新手机号格式不正确')
        return
      }
      if (newPhone === currentPhone) {
        setNewPhoneErr('新手机号不能与原手机号相同')
        return
      }
      if (newCode.length < 4) {
        setNewCodeErr('请填写 4-6 位验证码')
        return
      }
      try {
        setSubmitting(true)
        await fakeRequest(0.15)
        /* 成功 → 回写个人信息 + 跳到步骤 3 */
        userInfoActions.update({ phone: newPhone })
        setStep(3)
      } catch (e) {
        setNewCodeErr(e instanceof Error ? e.message : '换绑失败')
      } finally {
        setSubmitting(false)
      }
    }
  }

  const handleBackToInfo = () => {
    navigate('/legacy-profile/info')
  }

  return (
    <div className="mx-auto flex min-h-full max-w-[480px] flex-col bg-[#F8F8FA]">
      {/* 顶部栏 */}
      <div className="relative shrink-0 px-4 pt-3 pb-3">
        <div className="relative flex items-center">
          <button
            type="button"
            aria-label="返回"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center text-text-primary"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold text-text-primary">
            换绑手机号
          </div>
        </div>
      </div>

      {/* 步骤条 */}
      <div className="px-4 pt-2">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => (
              <div key={s.idx} className="flex flex-1 items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition ${
                      step >= s.idx
                        ? 'bg-gradient-to-br from-[#D4A853] to-[#E8C97A] text-white'
                        : 'bg-bg-secondary text-text-tertiary'
                    }`}
                  >
                    {step > s.idx ? '✓' : s.idx}
                  </div>
                  <div
                    className={`mt-1.5 text-xs ${
                      step >= s.idx ? 'font-medium text-[#B8893D]' : 'text-text-tertiary'
                    }`}
                  >
                    {s.label}
                  </div>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="mx-1 mb-5 h-px flex-1 bg-bg-secondary">
                    <div
                      className={`h-full ${
                        step > s.idx ? 'bg-gradient-to-r from-[#D4A853] to-[#E8C97A]' : ''
                      }`}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 步骤 1：原号验证 */}
      {step === 1 && (
        <div className="space-y-3 px-4 pt-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="mb-2 text-sm text-text-secondary">
              当前手机号：<span className="font-medium text-text-primary">{currentPhone}</span>
            </div>
            <div className="space-y-3 pt-2">
              {/* 原手机号（自动带入，只读） */}
              <div className="flex items-center gap-3 rounded-full bg-bg-secondary px-4 py-3">
                <Smartphone className="h-5 w-5 text-text-tertiary" />
                <input
                  type="tel"
                  value={oldPhone}
                  readOnly
                  className="flex-1 cursor-not-allowed bg-transparent text-base text-text-primary outline-none"
                />
                <span className="text-xs text-text-tertiary">已自动带入</span>
              </div>
              {oldPhoneErr && <div className="px-2 text-xs text-red-500">{oldPhoneErr}</div>}

              {/* 验证码 */}
              <div className="flex items-center gap-3 rounded-full bg-bg-secondary px-4 py-3">
                <Shield className="h-5 w-5 text-text-tertiary" />
                <input
                  type="text"
                  value={oldCode}
                  onChange={(e) => {
                    setOldCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                    setOldCodeErr('')
                  }}
                  maxLength={6}
                  inputMode="numeric"
                  className="flex-1 bg-transparent text-base text-text-primary outline-none placeholder:text-text-tertiary"
                  placeholder="请输入 6 位验证码"
                />
                <button
                  type="button"
                  onClick={handleSendOldCode}
                  disabled={oldCountdown > 0}
                  className="text-sm font-medium text-[#B8893D] disabled:text-text-tertiary"
                >
                  {oldCountdown > 0 ? `${oldCountdown}s 后重发` : '获取验证码'}
                </button>
              </div>
              {oldCodeErr && <div className="px-2 text-xs text-red-500">{oldCodeErr}</div>}
            </div>
          </div>

          <p className="px-2 text-xs leading-relaxed text-text-tertiary">
            为了你的账号安全，验证原手机号后才能绑定新手机号。验证码将以短信形式发送。
          </p>
        </div>
      )}

      {/* 步骤 2：新号验证 */}
      {step === 2 && (
        <div className="space-y-3 px-4 pt-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="mb-2 text-sm text-text-secondary">请输入要绑定的新手机号</div>
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 rounded-full bg-bg-secondary px-4 py-3">
                <Smartphone className="h-5 w-5 text-text-tertiary" />
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => {
                    setNewPhone(e.target.value.replace(/\D/g, '').slice(0, 11))
                    setNewPhoneErr('')
                  }}
                  maxLength={11}
                  inputMode="numeric"
                  className="flex-1 bg-transparent text-base text-text-primary outline-none placeholder:text-text-tertiary"
                  placeholder="请输入 11 位新手机号"
                />
              </div>
              {newPhoneErr && <div className="px-2 text-xs text-red-500">{newPhoneErr}</div>}

              <div className="flex items-center gap-3 rounded-full bg-bg-secondary px-4 py-3">
                <Shield className="h-5 w-5 text-text-tertiary" />
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => {
                    setNewCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                    setNewCodeErr('')
                  }}
                  maxLength={6}
                  inputMode="numeric"
                  className="flex-1 bg-transparent text-base text-text-primary outline-none placeholder:text-text-tertiary"
                  placeholder="请输入 6 位验证码"
                />
                <button
                  type="button"
                  onClick={handleSendNewCode}
                  disabled={newCountdown > 0}
                  className="text-sm font-medium text-[#B8893D] disabled:text-text-tertiary"
                >
                  {newCountdown > 0 ? `${newCountdown}s 后重发` : '获取验证码'}
                </button>
              </div>
              {newCodeErr && <div className="px-2 text-xs text-red-500">{newCodeErr}</div>}
            </div>
          </div>

          <p className="px-2 text-xs leading-relaxed text-text-tertiary">
            新手机号绑定成功后，将作为你下次登录及找回账号的主要凭证。
          </p>
        </div>
      )}

      {/* 步骤 3：换绑成功 */}
      {step === 3 && (
        <div className="flex flex-1 flex-col items-center px-4 pt-12">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#D4A853] to-[#E8C97A] text-white shadow-md">
            <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="5 12 10 17 19 7" />
            </svg>
          </div>
          <div className="mt-4 text-lg font-semibold text-text-primary">换绑成功</div>
          <div className="mt-1 text-center text-sm text-text-secondary">
            新手机号 <span className="font-medium text-text-primary">{newPhone}</span> 已绑定
          </div>
          <div className="mt-1 text-center text-xs text-text-tertiary">
            原手机号 {currentPhone} 已解绑
          </div>
        </div>
      )}

      {/* 底部按钮 */}
      <div className="flex-1" />
      <div className="px-4 pb-6 pt-6">
        {step !== 3 ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#D4A853] to-[#E8C97A] py-3.5 text-base font-semibold text-white shadow-md active:opacity-90 disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {step === 1 ? (submitting ? '验证中…' : '下一步') : submitting ? '提交中…' : '确认换绑'}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleBackToInfo}
            className="w-full rounded-full bg-gradient-to-r from-[#D4A853] to-[#E8C97A] py-3.5 text-base font-semibold text-white shadow-md active:opacity-90"
          >
            返回个人中心
          </button>
        )}
      </div>
    </div>
  )
}
