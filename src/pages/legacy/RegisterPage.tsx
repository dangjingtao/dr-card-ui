import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Eye, EyeOff, Loader2 } from 'lucide-react'
import { userInfoActions, isValidPhone } from './userInfoStore'

/* T037｜注册页
 * -------------------------------------------------------------
 * 流程：手机号 → 验证码 → 设置密码 → 二次确认密码 → 提交
 * - 通过 userInfoActions.update 写入账号、密码相关状态，并将 isRegistered 设为 true
 * - 注册成功后弹窗「完善账号信息」引导绑定学校 / 专业 / 学号
 * - 复用登录页的金色品牌色，视觉与 LoginPage 一致
 */

const COUNTDOWN_SECONDS = 60

export default function RegisterPage() {
  const navigate = useNavigate()

  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [phoneErr, setPhoneErr] = useState('')
  const [codeErr, setCodeErr] = useState('')
  const [passwordErr, setPasswordErr] = useState('')
  const [confirmErr, setConfirmErr] = useState('')
  const [agreeErr, setAgreeErr] = useState('')

  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [bindDialogOpen, setBindDialogOpen] = useState(false)

  const [countdown, setCountdown] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const startCountdown = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setCountdown(COUNTDOWN_SECONDS)
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          return 0
        }
        return c - 1
      })
    }, 1000)
  }

  const handleSendCode = () => {
    if (!phone) {
      setPhoneErr('请输入手机号')
      return
    }
    if (!isValidPhone(phone)) {
      setPhoneErr('手机号格式不正确')
      return
    }
    setPhoneErr('')
    startCountdown()
  }

  const handleSubmit = async () => {
    setPhoneErr('')
    setCodeErr('')
    setPasswordErr('')
    setConfirmErr('')
    setAgreeErr('')

    let ok = true
    if (!phone) {
      setPhoneErr('请输入手机号')
      ok = false
    } else if (!isValidPhone(phone)) {
      setPhoneErr('手机号格式不正确')
      ok = false
    }
    if (!/^\d{4,6}$/.test(code)) {
      setCodeErr('请输入 4-6 位验证码')
      ok = false
    }
    if (password.length < 6 || password.length > 20) {
      setPasswordErr('密码需为 6-20 位')
      ok = false
    }
    if (!confirmPassword) {
      setConfirmErr('请再次输入密码')
      ok = false
    } else if (password !== confirmPassword) {
      setConfirmErr('两次输入的密码不一致')
      ok = false
    }
    if (!agreed) {
      setAgreeErr('请先勾选并同意《用户协议》与《隐私政策》')
      ok = false
    }
    if (!ok) return

    setSubmitting(true)
    /* 模拟注册请求：700ms 异步以展示 loading */
    await new Promise((resolve) => setTimeout(resolve, 700))
    userInfoActions.update({
      account: phone,
      phone,
      isRegistered: true,
    })
    setSubmitting(false)
    setBindDialogOpen(true)
  }

  const handleBindLater = () => {
    setBindDialogOpen(false)
    navigate('/legacy-profile', { replace: true })
  }

  const handleBindNow = () => {
    setBindDialogOpen(false)
    navigate('/legacy-profile/bind-school', { replace: true })
  }

  return (
    <div
      className="mx-auto flex min-h-full max-w-[480px] flex-col"
      style={{
        background:
          'radial-gradient(ellipse 90% 34% at 68% 0%, rgba(248, 203, 111, .36) 0%, rgba(255, 230, 180, .18) 42%, transparent 72%), radial-gradient(ellipse 72% 30% at 4% 44%, rgba(255, 237, 207, .32) 0%, transparent 74%), linear-gradient(180deg, #FFF9EE 0%, #FFFCF7 42%, #FFF8EF 100%)',
      }}
    >
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
            注册账号
          </div>
        </div>
      </div>

      {/* 标题文案 */}
      <div className="px-8 pt-8 pb-6 text-center">
        <h1 className="text-2xl font-medium text-text-primary">创建你的卡博士账号</h1>
        <p className="mt-2 text-sm text-text-secondary">验证手机号，设置密码即可使用</p>
      </div>

      {/* 表单 */}
      <div className="flex-1 px-8 pb-6">
        <div className="space-y-3.5">
          {/* 手机号 + 验证码 */}
          <div className="flex gap-2">
            <div
              className={`flex h-12 flex-1 items-center gap-2 rounded-full border bg-white px-5 shadow-sm ${
                phoneErr ? 'border-danger' : 'border-[#E8D9B8]'
              }`}
            >
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="请输入手机号"
                inputMode="numeric"
                autoComplete="tel"
                className="h-full flex-1 bg-transparent text-base text-text-primary outline-none placeholder:text-[#B8893D]"
              />
            </div>
            <button
              type="button"
              onClick={handleSendCode}
              disabled={countdown > 0}
              className="flex h-12 w-[112px] shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#D4A853] to-[#E8C97A] px-3 text-sm font-medium text-white shadow-sm active:opacity-90 disabled:opacity-60"
            >
              {countdown > 0 ? `${countdown}s 后重发` : '获取验证码'}
            </button>
          </div>
          {phoneErr && <span className="text-xs text-danger-text">{phoneErr}</span>}

          {/* 验证码 */}
          <div
            className={`flex h-12 items-center gap-2 rounded-full border bg-white px-5 shadow-sm ${
              codeErr ? 'border-danger' : 'border-[#E8D9B8]'
            }`}
          >
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="请输入验证码"
              inputMode="numeric"
              maxLength={6}
              className="h-full flex-1 bg-transparent text-base tracking-widest text-text-primary outline-none placeholder:text-[#B8893D]"
            />
          </div>
          {codeErr && <span className="text-xs text-danger-text">{codeErr}</span>}

          {/* 密码 */}
          <div
            className={`flex h-12 items-center gap-2 rounded-full border bg-white px-5 shadow-sm ${
              passwordErr ? 'border-danger' : 'border-[#E8D9B8]'
            }`}
          >
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请设置密码（6-20 位）"
              autoComplete="new-password"
              className="h-full flex-1 bg-transparent text-base text-text-primary outline-none placeholder:text-[#B8893D]"
            />
            <button
              type="button"
              aria-label={showPassword ? '隐藏密码' : '显示密码'}
              onClick={() => setShowPassword(!showPassword)}
              className="flex h-8 w-8 items-center justify-center text-[#B8893D] active:opacity-70"
            >
              {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
            </button>
          </div>
          {passwordErr && <span className="text-xs text-danger-text">{passwordErr}</span>}

          {/* 二次确认密码 */}
          <div
            className={`flex h-12 items-center gap-2 rounded-full border bg-white px-5 shadow-sm ${
              confirmErr ? 'border-danger' : 'border-[#E8D9B8]'
            }`}
          >
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="请再次输入密码"
              autoComplete="new-password"
              className="h-full flex-1 bg-transparent text-base text-text-primary outline-none placeholder:text-[#B8893D]"
            />
            <button
              type="button"
              aria-label={showConfirm ? '隐藏密码' : '显示密码'}
              onClick={() => setShowConfirm(!showConfirm)}
              className="flex h-8 w-8 items-center justify-center text-[#B8893D] active:opacity-70"
            >
              {showConfirm ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
            </button>
          </div>
          {confirmErr && <span className="text-xs text-danger-text">{confirmErr}</span>}
        </div>

        {/* 协议勾选（整行居中） */}
        <div className="mt-5 flex justify-center">
          <label className="flex items-start gap-2 text-xs text-text-secondary">
            <button
              type="button"
              aria-label={agreed ? '取消同意' : '同意协议'}
              onClick={() => {
                setAgreed(!agreed)
                setAgreeErr('')
              }}
              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition ${
                agreed ? 'border-[#D4A853] bg-gradient-to-br from-[#D4A853] to-[#E8C97A]' : 'border-text-tertiary bg-white'
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
          {agreeErr && <span className="mt-1 block text-xs text-danger-text">{agreeErr}</span>}
        </div>

        {/* 主操作 */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#D4A853] to-[#E8C97A] text-base font-semibold text-white shadow-md active:opacity-90 disabled:opacity-60"
        >
          {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
          {submitting ? '注册中' : '注册并登录'}
        </button>

        {/* 返回登录入口 */}
        <div className="mt-5 text-center text-sm">
          <span className="text-text-secondary">已有账号？</span>
          <button
            type="button"
            onClick={() => navigate('/legacy-profile/login')}
            className="ml-1 font-medium text-[#B8893D] active:opacity-70"
          >
            去登录
          </button>
        </div>
      </div>

      {/* 注册成功 → 绑定学校引导弹窗 */}
      {bindDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim px-6">
          <div className="w-full max-w-[327px] overflow-hidden rounded-2xl bg-surface shadow-modal">
            <div className="px-6 pt-6 pb-3 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF3D9]">
                <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#B8893D]" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  <path d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-text-primary">完善账号信息</h2>
              <p className="mt-2 text-sm text-text-secondary">
                请补充学校、专业和学号，便于享受校园卡权益与专属服务。
              </p>
            </div>
            <div className="flex border-t border-border-subtle">
              <button
                type="button"
                onClick={handleBindLater}
                className="flex-1 py-3 text-sm text-text-secondary active:bg-surface-pressed"
              >
                稍后再说
              </button>
              <div className="w-px bg-border-subtle" />
              <button
                type="button"
                onClick={handleBindNow}
                className="flex-1 py-3 text-sm font-semibold text-[#B8893D] active:bg-surface-pressed"
              >
                去绑定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}