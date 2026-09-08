import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Eye, EyeOff, Loader2 } from 'lucide-react'
import CaptchaImage from '../../components/ui/CaptchaImage'
import { isValidPhone } from './userInfoStore'

/* T037｜忘记密码页（卡博士淡金色风格）
 * -------------------------------------------------------------
 * 完整流程：
 *   1) 输入手机号
 *   2) 接收短信验证码（演示默认 123456）
 *   3) 图形验证码（固定显示，不走输错阈值）
 *   4) 输入新密码（带小眼睛）
 *   5) 确认新密码（带小眼睛）
 *   6) 点击"确定修改" → 弹窗"修改成功" → 自动跳回登录页
 *
 * 关键点：
 *   - 短信验证码固定为 123456（演示态，便于回归）
 *   - 图形验证码固定展示，便于演示且与登录页阈值逻辑解耦
 *   - 新密码 / 确认新密码输入框右侧均有小眼睛图标，明密文切换
 */

const SMS_CODE = '123456'
const COUNTDOWN_SECONDS = 60

export default function ForgotPasswordPage() {
  const navigate = useNavigate()

  const [phone, setPhone] = useState('')
  const [smsCode, setSmsCode] = useState('')
  const [captcha, setCaptcha] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [phoneErr, setPhoneErr] = useState('')
  const [smsErr, setSmsErr] = useState('')
  const [captchaErr, setCaptchaErr] = useState('')
  const [newPasswordErr, setNewPasswordErr] = useState('')
  const [confirmErr, setConfirmErr] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)

  const [currentCaptcha, setCurrentCaptcha] = useState('')
  const [captchaInvalid, setCaptchaInvalid] = useState(false)

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
    setSmsErr('')
    setCaptchaErr('')
    setNewPasswordErr('')
    setConfirmErr('')

    let ok = true
    if (!phone) {
      setPhoneErr('请输入手机号')
      ok = false
    } else if (!isValidPhone(phone)) {
      setPhoneErr('手机号格式不正确')
      ok = false
    }
    if (smsCode !== SMS_CODE) {
      setSmsErr(`验证码不正确（演示固定为 ${SMS_CODE}）`)
      ok = false
    }
    if (captcha.toUpperCase() !== currentCaptcha.toUpperCase()) {
      setCaptchaInvalid(true)
      setCaptchaErr('图形验证码错误，请重新输入')
      ok = false
    }
    if (newPassword.length < 6 || newPassword.length > 20) {
      setNewPasswordErr('密码需为 6-20 位')
      ok = false
    }
    if (!confirmPassword) {
      setConfirmErr('请再次输入密码')
      ok = false
    } else if (newPassword !== confirmPassword) {
      setConfirmErr('两次输入的密码不一致')
      ok = false
    }
    if (!ok) return

    setSubmitting(true)
    /* 模拟请求 600ms */
    await new Promise((resolve) => setTimeout(resolve, 600))
    setSubmitting(false)
    setSuccessOpen(true)
  }

  /* 修改成功弹窗关闭后跳转回登录页 */
  const handleSuccessClose = () => {
    setSuccessOpen(false)
    navigate('/legacy-profile/login', { replace: true })
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
            忘记密码
          </div>
        </div>
      </div>

      {/* 标题文案 */}
      <div className="px-8 pt-6 pb-6">
        <h1 className="text-2xl font-medium text-text-primary">重置登录密码</h1>
        <p className="mt-2 text-sm text-text-secondary">
          验证手机号后即可设置新密码（演示短信验证码固定为 {SMS_CODE}）
        </p>
      </div>

      {/* 表单 */}
      <div className="flex-1 px-8 pb-6">
        <div className="space-y-3.5">
          {/* 手机号 + 获取验证码 */}
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

          {/* 短信验证码 */}
          <div
            className={`flex h-12 items-center gap-2 rounded-full border bg-white px-5 shadow-sm ${
              smsErr ? 'border-danger' : 'border-[#E8D9B8]'
            }`}
          >
            <input
              value={smsCode}
              onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder={`请输入短信验证码（${SMS_CODE}）`}
              inputMode="numeric"
              maxLength={6}
              className="h-full flex-1 bg-transparent text-base tracking-widest text-text-primary outline-none placeholder:text-[#B8893D]"
            />
          </div>
          {smsErr && <span className="text-xs text-danger-text">{smsErr}</span>}

          {/* 图形验证码（固定显示，不走输错阈值） */}
          <div className="space-y-2">
            <div
              className={`flex h-12 items-center gap-2 rounded-full border bg-white px-5 shadow-sm ${
                captchaInvalid || captchaErr ? 'border-danger' : 'border-[#E8D9B8]'
              }`}
            >
              <input
                value={captcha}
                onChange={(e) => {
                  setCaptcha(e.target.value)
                  setCaptchaInvalid(false)
                  setCaptchaErr('')
                }}
                placeholder="请输入图形验证码"
                maxLength={4}
                className="h-full flex-1 bg-transparent text-base uppercase tracking-widest text-text-primary outline-none placeholder:text-[#B8893D]"
              />
            </div>
            <CaptchaImage length={4} invalid={captchaInvalid} onChange={setCurrentCaptcha} />
          </div>
          {captchaErr && <span className="text-xs text-danger-text">{captchaErr}</span>}

          {/* 新密码（带小眼睛） */}
          <div
            className={`flex h-12 items-center gap-2 rounded-full border bg-white px-5 shadow-sm ${
              newPasswordErr ? 'border-danger' : 'border-[#E8D9B8]'
            }`}
          >
            <input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="请输入新密码（6-20 位）"
              autoComplete="new-password"
              className="h-full flex-1 bg-transparent text-base text-text-primary outline-none placeholder:text-[#B8893D]"
            />
            <button
              type="button"
              aria-label={showNew ? '隐藏新密码' : '显示新密码'}
              onClick={() => setShowNew(!showNew)}
              className="flex h-8 w-8 items-center justify-center text-[#B8893D] active:opacity-70"
            >
              {showNew ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
            </button>
          </div>
          {newPasswordErr && <span className="text-xs text-danger-text">{newPasswordErr}</span>}

          {/* 确认新密码（带小眼睛） */}
          <div
            className={`flex h-12 items-center gap-2 rounded-full border bg-white px-5 shadow-sm ${
              confirmErr ? 'border-danger' : 'border-[#E8D9B8]'
            }`}
          >
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="请再次输入新密码"
              autoComplete="new-password"
              className="h-full flex-1 bg-transparent text-base text-text-primary outline-none placeholder:text-[#B8893D]"
            />
            <button
              type="button"
              aria-label={showConfirm ? '隐藏确认密码' : '显示确认密码'}
              onClick={() => setShowConfirm(!showConfirm)}
              className="flex h-8 w-8 items-center justify-center text-[#B8893D] active:opacity-70"
            >
              {showConfirm ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
            </button>
          </div>
          {confirmErr && <span className="text-xs text-danger-text">{confirmErr}</span>}
        </div>

        {/* 主操作 */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#D4A853] to-[#E8C97A] text-base font-semibold text-white shadow-md active:opacity-90 disabled:opacity-60"
        >
          {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
          {submitting ? '提交中' : '确定修改'}
        </button>

        {/* 返回登录入口 */}
        <div className="mt-5 text-center text-sm">
          <span className="text-text-secondary">想起密码了？</span>
          <button
            type="button"
            onClick={() => navigate('/legacy-profile/login')}
            className="ml-1 font-medium text-[#B8893D] active:opacity-70"
          >
            去登录
          </button>
        </div>
      </div>

      {/* 修改成功弹窗 */}
      {successOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim px-6">
          <div className="w-full max-w-[327px] overflow-hidden rounded-2xl bg-surface shadow-modal">
            <div className="px-6 pt-6 pb-4 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF3D9]">
                <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#B8893D]" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="5 12 10 17 19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-text-primary">修改成功</h2>
              <p className="mt-2 text-sm text-text-secondary">
                您的登录密码已重置，即将返回登录页。
              </p>
            </div>
            <div className="flex border-t border-border-subtle">
              <button
                type="button"
                onClick={handleSuccessClose}
                className="flex-1 py-3 text-sm font-semibold text-[#B8893D] active:bg-surface-pressed"
              >
                返回登录
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}