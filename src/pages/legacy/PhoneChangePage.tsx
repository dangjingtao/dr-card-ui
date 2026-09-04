import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Smartphone, Shield } from 'lucide-react'

/* ---- Mock 当前手机号 ---- */
const CURRENT_PHONE = '150****7139'

export default function PhoneChangePage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [oldPhone, setOldPhone] = useState('')
  const [oldCode, setOldCode] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newCode, setNewCode] = useState('')
  const [oldCountdown, setOldCountdown] = useState(0)
  const [newCountdown, setNewCountdown] = useState(0)
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
    if (!oldPhone || oldCountdown > 0) return
    startCountdown('old', setOldCountdown)
  }

  const handleSendNewCode = () => {
    if (!newPhone || newCountdown > 0) return
    startCountdown('new', setNewCountdown)
  }

  const handleNext = () => {
    if (step === 1) {
      // 校验原手机号 + 验证码
      if (!oldPhone || oldCode.length < 4) {
        alert('请填写原手机号验证码')
        return
      }
      setStep(2)
    } else if (step === 2) {
      // 校验新手机号 + 验证码
      if (!newPhone || newCode.length < 4) {
        alert('请填写新手机号验证码')
        return
      }
      setStep(3)
      // 模拟请求成功 → toast
      setTimeout(() => {
        alert('换绑成功')
        navigate(-1)
      }, 500)
    }
  }

  const steps = [
    { idx: 1, label: '原手机号验证' },
    { idx: 2, label: '绑定新手机号' },
    { idx: 3, label: '换绑成功' },
  ]

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
            {steps.map((s, i) => (
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
                {i < steps.length - 1 && (
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

      {/* 步骤 1：原手机号 */}
      {step === 1 && (
        <div className="space-y-3 px-4 pt-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="mb-2 text-sm text-text-secondary">
              当前手机号：<span className="font-medium text-text-primary">{CURRENT_PHONE}</span>
            </div>
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 rounded-full bg-bg-secondary px-4 py-3">
                <Smartphone className="h-5 w-5 text-text-tertiary" />
                <input
                  type="tel"
                  value={oldPhone}
                  onChange={(e) => setOldPhone(e.target.value)}
                  className="flex-1 bg-transparent text-base text-text-primary outline-none placeholder:text-text-tertiary"
                  placeholder="请输入原手机号"
                />
              </div>
              <div className="flex items-center gap-3 rounded-full bg-bg-secondary px-4 py-3">
                <Shield className="h-5 w-5 text-text-tertiary" />
                <input
                  type="text"
                  value={oldCode}
                  onChange={(e) => setOldCode(e.target.value)}
                  maxLength={6}
                  className="flex-1 bg-transparent text-base text-text-primary outline-none placeholder:text-text-tertiary"
                  placeholder="请输入验证码"
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
            </div>
          </div>
        </div>
      )}

      {/* 步骤 2：新手机号 */}
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
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="flex-1 bg-transparent text-base text-text-primary outline-none placeholder:text-text-tertiary"
                  placeholder="请输入新手机号"
                />
              </div>
              <div className="flex items-center gap-3 rounded-full bg-bg-secondary px-4 py-3">
                <Shield className="h-5 w-5 text-text-tertiary" />
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  maxLength={6}
                  className="flex-1 bg-transparent text-base text-text-primary outline-none placeholder:text-text-tertiary"
                  placeholder="请输入验证码"
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
            </div>
          </div>
        </div>
      )}

      {/* 步骤 3：成功 */}
      {step === 3 && (
        <div className="flex flex-1 flex-col items-center justify-center px-4 pt-8">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#D4A853] to-[#E8C97A] text-white shadow-md">
            <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="5 12 10 17 19 7" />
            </svg>
          </div>
          <div className="mt-4 text-lg font-semibold text-text-primary">换绑成功</div>
          <div className="mt-1 text-sm text-text-secondary">即将返回个人中心…</div>
        </div>
      )}

      {/* 底部按钮 */}
      {step !== 3 && (
        <div className="px-4 pb-6 pt-6">
          <button
            type="button"
            onClick={handleNext}
            className="w-full rounded-full bg-gradient-to-r from-[#D4A853] to-[#E8C97A] py-3.5 text-base font-semibold text-white shadow-md active:opacity-90"
          >
            {step === 1 ? '下一步' : '确认换绑'}
          </button>
        </div>
      )}
    </div>
  )
}
