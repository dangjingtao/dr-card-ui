import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

/* ---- 微信授权登录页 ---- */
export default function LoginPage() {
  const navigate = useNavigate()
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleWechatLogin = () => {
    if (!agreed) {
      alert('请先勾选并同意《用户协议》与《隐私政策》')
      return
    }
    setLoading(true)
    // 模拟微信授权 → 登录成功
    setTimeout(() => {
      setLoading(false)
      alert('微信授权登录成功')
      navigate(-1)
    }, 800)
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
            登录
          </div>
        </div>
      </div>

      {/* Logo + 标题 */}
      <div className="flex flex-col items-center px-4 pt-12">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D4A853] to-[#E8C97A] text-2xl font-bold text-white shadow-md">
          卡
        </div>
        <div className="mt-4 text-xl font-semibold text-text-primary">卡博士 APP</div>
        <div className="mt-1 text-sm text-text-secondary">一站式校园卡自助服务</div>
      </div>

      {/* 微信登录按钮 */}
      <div className="flex-1" />
      <div className="space-y-4 px-8 pb-8">
        <button
          type="button"
          onClick={handleWechatLogin}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#D4A853] to-[#E8C97A] py-3.5 text-base font-semibold text-white shadow-md active:opacity-90 disabled:opacity-60"
        >
          {/* 微信图标（简化） */}
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
            <path d="M9.5 4C5.36 4 2 6.69 2 10c0 1.81 1 3.44 2.59 4.53L4 17l2.71-1.41c.88.21 1.81.34 2.79.36-.07-.34-.1-.7-.1-1.06 0-3.31 3.13-6 7-6 .36 0 .72.02 1.06.07C16.95 6.06 13.55 4 9.5 4zm-2.4 4.5a.9.9 0 110 1.8.9.9 0 010-1.8zm4.8 0a.9.9 0 110 1.8.9.9 0 010-1.8zM16.4 10c-3.31 0-6 2.13-6 4.75 0 1.5.85 2.85 2.18 3.74L12 20l1.99-1.04c.71.16 1.46.27 2.24.29.21 0 .42-.01.62-.02L19 20l-.43-1.85C20.32 17.18 22 15.45 22 13.5c0-2.62-2.69-4.75-6-4.75zm-2 3.2a.7.7 0 110 1.4.7.7 0 010-1.4zm4 0a.7.7 0 110 1.4.7.7 0 010-1.4z" />
          </svg>
          {loading ? '授权中…' : '微信授权登录'}
        </button>

        {/* 其他登录方式（占位） */}
        <div className="flex items-center justify-center gap-4 text-xs text-text-tertiary">
          <span className="opacity-50">手机号登录</span>
          <span className="h-3 w-px bg-bg-secondary" />
          <span className="opacity-50">学号登录</span>
        </div>

        {/* 协议 */}
        <label className="flex items-start gap-2 pt-2 text-xs text-text-secondary">
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
            登录即表示已阅读并同意
            <span className="text-[#B8893D]">《用户协议》</span>
            与
            <span className="text-[#B8893D]">《隐私政策》</span>
          </span>
        </label>
      </div>
    </div>
  )
}
