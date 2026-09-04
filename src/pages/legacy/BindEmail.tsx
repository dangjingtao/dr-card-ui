import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Mail, Shield } from 'lucide-react'

export default function BindEmail() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [countdown, setCountdown] = useState(0)

  const handleSendCode = () => {
    if (!email || countdown > 0) return
    setCountdown(60)
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer)
          return 0
        }
        return c - 1
      })
    }, 1000)
  }

  const handleBind = () => {
    navigate(-1)
  }

  return (
    <div className="flex min-h-full flex-col bg-[#F8F8FA]">
      {/* 顶部栏 */}
      <div className="relative shrink-0 px-4 pt-12 pb-4">
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
            绑定邮箱
          </div>
        </div>
      </div>

      {/* 表单 */}
      <div className="space-y-3 px-4 pt-2">
        {/* 邮箱输入 */}
        <div className="flex items-center gap-3 rounded-full bg-bg-secondary px-4 py-3">
          <Mail className="h-5 w-5 text-text-tertiary" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 bg-transparent text-base text-text-primary outline-none placeholder:text-text-tertiary"
            placeholder="请输入邮箱账号"
          />
        </div>

        {/* 验证码输入 */}
        <div className="flex items-center gap-3 rounded-full bg-bg-secondary px-4 py-3">
          <Shield className="h-5 w-5 text-text-tertiary" />
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 bg-transparent text-base text-text-primary outline-none placeholder:text-text-tertiary"
            placeholder="请输入邮箱验证码"
          />
          <button
            type="button"
            onClick={handleSendCode}
            disabled={countdown > 0}
            className="text-sm font-medium text-[#B8893D] disabled:text-text-tertiary"
          >
            {countdown > 0 ? `${countdown}s` : '获取验证码'}
          </button>
        </div>
      </div>

      {/* 绑定按钮 */}
      <div className="px-4 pt-6">
        <button
          type="button"
          onClick={handleBind}
          className="w-full rounded-full py-3.5 text-base font-medium text-white shadow-lg shadow-[#D4A853]/25 active:opacity-90"
          style={{ background: 'linear-gradient(135deg, #D4A853 0%, #E8C97A 100%)' }}
        >
          绑定
        </button>
      </div>
    </div>
  )
}
