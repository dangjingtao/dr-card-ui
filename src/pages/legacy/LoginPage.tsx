import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import CaptchaImage from '../../components/ui/CaptchaImage'
import { useUserInfo, userInfoActions } from './userInfoStore'

/* T037｜登录页（紫色渐变改版）
 * -------------------------------------------------------------
 * 视觉来源：用户 2026-09-07 上传的小程序原版截图。
 * 关键改动：
   1. 密码可见切换（睁眼 / 闭眼）
   2. 新注册用户显示二次确认密码
   3. 连续输错 5 次后强制图形验证码
   4. 保留微信授权登录入口
   5. 登录成功后弹窗引导绑定学校/专业/学号
 */

const MAX_ATTEMPTS = 5

export default function LoginPage() {
  const navigate = useNavigate()
  const userInfo = useUserInfo()

  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [captcha, setCaptcha] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [captchaInvalid, setCaptchaInvalid] = useState(false)
  const [bindDialogOpen, setBindDialogOpen] = useState(false)

  const [currentCaptcha, setCurrentCaptcha] = useState('')
  const requireCaptcha = attempts >= MAX_ATTEMPTS

  /* 未注册 mock：当前 userInfoStore.isRegistered = false，因此显示二次确认密码 */
  const requireConfirm = !userInfo.isRegistered

  const handleLogin = async () => {
    if (!agreed) {
      setErrorMsg('请先勾选并同意《用户协议》与《隐私政策》')
      return
    }

    if (!account.trim()) {
      setErrorMsg('请输入账号')
      return
    }
    if (!password) {
      setErrorMsg('请输入密码')
      return
    }
    if (password.length < 6 || password.length > 20) {
      setErrorMsg('密码需为 6-20 位')
      return
    }
    if (requireConfirm && password !== confirmPassword) {
      setErrorMsg('两次输入的密码不一致')
      return
    }
    if (requireCaptcha && captcha.toUpperCase() !== currentCaptcha.toUpperCase()) {
      setCaptchaInvalid(true)
      setErrorMsg('图形验证码错误，请重新输入')
      return
    }

    setSubmitting(true)
    setErrorMsg('')
    await new Promise((resolve) => setTimeout(resolve, 700))

    /* mock 校验：除「000000」外都视为密码错误，用于演示错误次数与图形验证码 */
    if (password !== '000000') {
      const nextAttempts = attempts + 1
      setAttempts(nextAttempts)
      const left = Math.max(0, MAX_ATTEMPTS - nextAttempts)
      setErrorMsg(`账号或密码错误，还可输入 ${left} 次${requireCaptcha ? '（已开启图形验证码）' : ''}`)
      setCaptchaInvalid(false)
      setSubmitting(false)
      return
    }

    /* 登录成功：写入账号与状态 */
    userInfoActions.update({ account: account.trim(), isRegistered: true })
    setSubmitting(false)
    setBindDialogOpen(true)
  }

  const handleWechatLogin = async () => {
    if (!agreed) {
      setErrorMsg('请先勾选并同意《用户协议》与《隐私政策》')
      return
    }
    setSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 800))
    setSubmitting(false)
    setBindDialogOpen(true)
  }

  const handleBindLater = () => {
    setBindDialogOpen(false)
    navigate('/legacy-profile')
  }

  const handleBindNow = () => {
    setBindDialogOpen(false)
    navigate('/legacy-profile/bind-school')
  }

  return (
    <div
      className="mx-auto flex min-h-full max-w-[480px] flex-col"
      style={{
        background: 'linear-gradient(180deg, #A6A6F5 0%, #D6D6FA 36%, #FFFFFF 78%)',
      }}
    >
      {/* 标题 */}
      <div className="px-8 pt-16 pb-6 text-center">
        <h1 className="text-2xl font-medium text-white drop-shadow-sm">你好，欢迎来到卡博士</h1>
      </div>

      {/* 表单卡片 */}
      <div className="flex-1 px-8 pb-6">
        <div className="space-y-3.5">
          {/* 账号 */}
          <div className="flex h-12 items-center gap-2 rounded-full bg-white px-5 shadow-sm">
            <input
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              placeholder="请输入账号"
              autoComplete="username"
              className="h-full flex-1 bg-transparent text-base text-text-primary outline-none placeholder:text-[#A6A6F5]"
            />
          </div>

          {/* 密码 */}
          <div className="flex h-12 items-center gap-2 rounded-full bg-white px-5 shadow-sm">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              autoComplete="current-password"
              className="h-full flex-1 bg-transparent text-base text-text-primary outline-none placeholder:text-[#A6A6F5]"
            />
            <button
              type="button"
              aria-label={showPassword ? '隐藏密码' : '显示密码'}
              onClick={() => setShowPassword(!showPassword)}
              className="flex h-8 w-8 items-center justify-center text-[#6B6BE0] active:opacity-70"
            >
              {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
            </button>
          </div>

          {/* 二次确认密码（新账号） */}
          {requireConfirm && (
            <div className="flex h-12 items-center gap-2 rounded-full bg-white px-5 shadow-sm">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入密码"
                autoComplete="new-password"
                className="h-full flex-1 bg-transparent text-base text-text-primary outline-none placeholder:text-[#A6A6F5]"
              />
              <button
                type="button"
                aria-label={showConfirm ? '隐藏密码' : '显示密码'}
                onClick={() => setShowConfirm(!showConfirm)}
                className="flex h-8 w-8 items-center justify-center text-[#6B6BE0] active:opacity-70"
              >
                {showConfirm ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
              </button>
            </div>
          )}

          {/* 图形验证码（错误次数 >= 5） */}
          {requireCaptcha && (
            <div className="space-y-2">
              <div
                className={`flex h-12 items-center gap-2 rounded-full bg-white px-5 shadow-sm ${
                  captchaInvalid ? 'ring-2 ring-danger' : ''
                }`}
              >
                <input
                  value={captcha}
                  onChange={(e) => {
                    setCaptcha(e.target.value)
                    setCaptchaInvalid(false)
                  }}
                  placeholder="请输入图形验证码"
                  maxLength={4}
                  className="h-full flex-1 bg-transparent text-base uppercase tracking-widest text-text-primary outline-none placeholder:text-[#A6A6F5]"
                />
              </div>
              <CaptchaImage length={4} invalid={captchaInvalid} onChange={setCurrentCaptcha} />
            </div>
          )}

          {/* 忘记密码链接 */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => alert('忘记密码功能施工中（T037 不展开）')}
              className="text-sm text-[#6B6BE0] active:opacity-70"
            >
              忘记密码？
            </button>
          </div>
        </div>

        {/* 错误反馈 */}
        {errorMsg && (
          <div className="mt-3 text-center text-sm text-danger-text">{errorMsg}</div>
        )}

        {/* 主操作 */}
        <button
          type="button"
          onClick={handleLogin}
          disabled={submitting}
          className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6B6BE0] to-[#8585F5] text-base font-semibold text-white shadow-md active:opacity-90 disabled:opacity-60"
        >
          {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
          {submitting ? '登录中' : '立即登录'}
        </button>

        {/* 微信授权 */}
        <button
          type="button"
          onClick={handleWechatLogin}
          disabled={submitting}
          className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#5BC275] to-[#3FB05F] text-base font-semibold text-white shadow-sm active:opacity-90 disabled:opacity-60"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
            <path d="M9.5 4C5.36 4 2 6.69 2 10c0 1.81 1 3.44 2.59 4.53L4 17l2.71-1.41c.88.21 1.81.34 2.79.36-.07-.34-.1-.7-.1-1.06 0-3.31 3.13-6 7-6 .36 0 .72.02 1.06.07C16.95 6.06 13.55 4 9.5 4zm-2.4 4.5a.9.9 0 110 1.8.9.9 0 010-1.8zm4.8 0a.9.9 0 110 1.8.9.9 0 010-1.8zM16.4 10c-3.31 0-6 2.13-6 4.75 0 1.5.85 2.85 2.18 3.74L12 20l1.99-1.04c.71.16 1.46.27 2.24.29.21 0 .42-.01.62-.02L19 20l-.43-1.85C20.32 17.18 22 15.45 22 13.5c0-2.62-2.69-4.75-6-4.75zm-2 3.2a.7.7 0 110 1.4.7.7 0 010-1.4zm4 0a.7.7 0 110 1.4.7.7 0 010-1.4z" />
          </svg>
          {submitting ? '授权中' : '微信授权登录'}
        </button>

        {/* 引导文案 */}
        <div className="mt-5 text-center text-sm">
          <span className="text-text-secondary">还没有账号？</span>
          <span className="ml-1 text-[#6B6BE0]">请在卡博士小程序中绑定手机号</span>
        </div>
      </div>

      {/* 协议勾选 */}
      <div className="px-8 pb-[calc(20px+env(safe-area-inset-bottom))]">
        <label className="flex items-start gap-2 text-xs text-text-secondary">
          <button
            type="button"
            aria-label={agreed ? '取消同意' : '同意协议'}
            onClick={() => setAgreed(!agreed)}
            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition ${
              agreed ? 'border-[#6B6BE0] bg-[#6B6BE0]' : 'border-text-tertiary bg-white'
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
            <span className="text-[#6B6BE0]">《用户协议》</span>
            和
            <span className="text-[#6B6BE0]">《隐私政策》</span>
          </span>
        </label>
      </div>

      {/* 绑定学校引导弹窗 */}
      {bindDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim px-6">
          <div className="w-full max-w-[327px] overflow-hidden rounded-2xl bg-surface shadow-modal">
            <div className="px-6 pt-6 pb-3 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#EFEEFF]">
                <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#6B6BE0]" fill="none" stroke="currentColor" strokeWidth="2">
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
                className="flex-1 py-3 text-sm font-semibold text-[#6B6BE0] active:bg-surface-pressed"
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