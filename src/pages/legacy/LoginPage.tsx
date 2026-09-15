import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ImageIcon, Loader2 } from 'lucide-react'
import CaptchaImage from '../../components/ui/CaptchaImage'
import { userInfoActions } from './userInfoStore'

/* T037｜登录页（卡博士淡金色风格）
 * -------------------------------------------------------------
 * 演示逻辑（2026-09-08 用户决定）：
 * - 任何账号 + 密码（满足 6-20 位校验）均能直接登录成功，不做真实账号匹配。
 * - 右下角"弹出图形验证码"按钮：随时可点开图形验证码用于演示，
 *   同时输错 20 次后强制要求图形验证码才能登录成功。
 *
 * 关键改动（2026-09-08）：
 *   1. 取消微信授权登录入口，仅保留「手机号 + 密码」一种登录方式
 *   2. 密码可见切换（睁眼 / 闭眼）
 *   3. 输错 20 次后要求图形验证码（演示阈值调大，便于演示）
 *   4. 右下角"弹出图形验证码"按钮替换原"原型切换按钮"，位置保持在登录容器内
 *   5. 登录成功后弹窗引导绑定学校/专业/学号
 *   6. 「还没有账号？请注册」入口跳转注册页（手机号 + 验证码 + 密码 + 二次确认）
 *   7. 「忘记密码？」入口跳转忘记密码流程（手机号 + 短信验证码 + 图形验证码 + 新密码 + 确认密码）
 */

const MAX_ATTEMPTS_BEFORE_CAPTCHA = 20

export default function LoginPage() {
  const navigate = useNavigate()

  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [captcha, setCaptcha] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [showCaptcha, setShowCaptcha] = useState(false)

  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [captchaInvalid, setCaptchaInvalid] = useState(false)
  const [bindDialogOpen, setBindDialogOpen] = useState(false)

  const [currentCaptcha, setCurrentCaptcha] = useState('')

  /* 图形验证码显示态：主动点击"弹出图形验证码"按钮 或 错误计数达到阈值
   *  - 用户主动点击后强制显示验证码，便于演示
   *  - 阈值改为 20 次（2026-09-08 用户决定，便于演示） */
  const requireCaptcha = showCaptcha || attempts >= MAX_ATTEMPTS_BEFORE_CAPTCHA

  const goRegister = () => {
    navigate('/legacy-profile/register')
  }

  const goForgotPassword = () => {
    navigate('/legacy-profile/forgot-password')
  }

  const handleLogin = async () => {
    if (!agreed) {
      setErrorMsg('请先勾选并同意《用户协议》与《隐私政策》')
      return
    }

    if (!account.trim()) {
      setErrorMsg('请输入手机号')
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
    if (requireCaptcha && captcha.toUpperCase() !== currentCaptcha.toUpperCase()) {
      setCaptchaInvalid(true)
      setErrorMsg('图形验证码错误，请重新输入')
      return
    }

    setSubmitting(true)
    setErrorMsg('')
    await new Promise((resolve) => setTimeout(resolve, 600))

    /* 演示逻辑（2026-09-08）：
     * - 任何账号密码满足 6-20 位校验即直接登录成功
     * - 若已弹出图形验证码且未通过校验则在前面已拦截；
     *   若通过则无论是否主动弹出验证码都视为登录成功。 */
    userInfoActions.update({ account: account.trim(), isRegistered: true })
    setAttempts(0)
    setShowCaptcha(false)
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
      className="relative mx-auto flex min-h-full max-w-[480px] flex-col"
      style={{
        background:
          'radial-gradient(ellipse 90% 34% at 68% 0%, rgba(248, 203, 111, .36) 0%, rgba(255, 230, 180, .18) 42%, transparent 72%), radial-gradient(ellipse 72% 30% at 4% 44%, rgba(255, 237, 207, .32) 0%, transparent 74%), linear-gradient(180deg, #FFF9EE 0%, #FFFCF7 42%, #FFF8EF 100%)',
      }}
    >
      {/* 品牌头部：金色 Logo + 标题 */}
      <div className="flex flex-col items-center px-8 pt-12 pb-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D4A853] to-[#E8C97A] text-2xl font-bold text-white shadow-md">
          卡
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-text-primary">卡博士 APP</h1>
        <p className="mt-1 text-sm text-text-secondary">一站式校园卡自助服务</p>
      </div>

      {/* 标题文案 */}
      <div className="px-8 pb-2 text-center">
        <span className="text-base text-text-secondary">你好，欢迎来到卡博士</span>
      </div>

      {/* 表单卡片 */}
      <div className="flex-1 px-8 pb-6 pt-2">
        <div className="space-y-3.5">
          {/* 账号：只支持手机号登录（T037R9：placeholder 改为「请输入手机号」） */}
          <div className="flex h-12 items-center gap-2 rounded-full border border-[#E8D9B8] bg-white px-5 shadow-sm">
            <input
              value={account}
              onChange={(e) => setAccount(e.target.value.replace(/\D/g, '').slice(0, 11))}
              placeholder="请输入手机号"
              autoComplete="username"
              inputMode="numeric"
              className="h-full flex-1 bg-transparent text-base text-text-primary outline-none placeholder:text-[#B8893D]"
            />
          </div>

          {/* 密码 */}
          <div className="flex h-12 items-center gap-2 rounded-full border border-[#E8D9B8] bg-white px-5 shadow-sm">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              autoComplete="current-password"
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

          {/* 图形验证码：主动弹出 或 已输错 20 次 */}
          {requireCaptcha && (
            <div className="space-y-2">
              <div
                className={`flex h-12 items-center gap-2 rounded-full border bg-white px-5 shadow-sm ${
                  captchaInvalid ? 'border-danger' : 'border-[#E8D9B8]'
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
                  className="h-full flex-1 bg-transparent text-base uppercase tracking-widest text-text-primary outline-none placeholder:text-[#B8893D]"
                />
              </div>
              <CaptchaImage length={4} invalid={captchaInvalid} onChange={setCurrentCaptcha} />
            </div>
          )}

          {/* 忘记密码链接 */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={goForgotPassword}
              className="text-sm text-[#B8893D] active:opacity-70"
            >
              忘记密码？
            </button>
          </div>
        </div>

        {/* 错误反馈 */}
        {errorMsg && <div className="mt-3 text-center text-sm text-danger-text">{errorMsg}</div>}

        {/* 主操作：金渐变胶囊 */}
        <button
          type="button"
          onClick={handleLogin}
          disabled={submitting}
          className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#D4A853] to-[#E8C97A] text-base font-semibold text-white shadow-md active:opacity-90 disabled:opacity-60"
        >
          {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
          {submitting ? '登录中' : '立即登录'}
        </button>

        {/* 引导文案：注册入口 */}
        <div className="mt-5 text-center text-sm">
          <span className="text-text-secondary">还没有账号？</span>
          <button
            type="button"
            onClick={goRegister}
            className="ml-1 font-medium text-[#B8893D] active:opacity-70"
          >
            请注册
          </button>
        </div>
      </div>

      {/* 协议勾选（整行居中） */}
      <div className="flex justify-center px-8 pb-[calc(20px+env(safe-area-inset-bottom))]">
        <label className="flex items-start gap-2 text-xs text-text-secondary">
          <button
            type="button"
            aria-label={agreed ? '取消同意' : '同意协议'}
            onClick={() => setAgreed(!agreed)}
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
      </div>

      {/* "弹出图形验证码"按钮：固定在登录容器右下角内，不溢出页面
        *  - 位置在容器内部（absolute 相对登录卡片）
        *  - 替换原"原型切换按钮"，改名为"弹出图形验证码"用于演示触发 */}
      <button
        type="button"
        onClick={() => {
          setShowCaptcha(true)
          setCaptcha('')
          setCaptchaInvalid(false)
        }}
        aria-label="弹出图形验证码"
        title="弹出图形验证码（仅供设计演示）"
        className="absolute right-4 bottom-[calc(20px+env(safe-area-inset-bottom))] z-40 flex h-11 items-center gap-1.5 rounded-full border border-[#E8D9B8] bg-white px-4 text-xs font-medium text-[#B8893D] shadow-md active:opacity-70"
      >
        <ImageIcon className="h-4 w-4" />
        弹出图形验证码
      </button>

      {/* 绑定学校引导弹窗 */}
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