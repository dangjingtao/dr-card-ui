import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Smartphone, Shield, Lock, Eye, EyeOff } from 'lucide-react'

export default function BindPhone() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('15047757139')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const handleSendCode = () => {
    if (!phone || countdown > 0) return
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
            绑定手机
          </div>
        </div>
      </div>

      {/* 表单 */}
      <div className="space-y-3 px-4 pt-2">
        {/* 手机号 */}
        <div className="flex items-center gap-3 rounded-full bg-bg-secondary px-4 py-3">
          <Smartphone className="h-5 w-5 text-text-tertiary" />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="flex-1 bg-transparent text-base text-text-primary outline-none placeholder:text-text-tertiary"
            placeholder="请输入手机号"
          />
        </div>

        {/* 验证码 */}
        <div className="flex items-center gap-3 rounded-full bg-bg-secondary px-4 py-3">
          <Shield className="h-5 w-5 text-text-tertiary" />
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 bg-transparent text-base text-text-primary outline-none placeholder:text-text-tertiary"
            placeholder="请输入验证码"
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

        {/* 密码 */}
        <div className="flex items-center gap-3 rounded-full bg-bg-secondary px-4 py-3">
          <Lock className="h-5 w-5 text-text-tertiary" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="flex-1 bg-transparent text-base text-text-primary outline-none placeholder:text-text-tertiary"
            placeholder="请输入密码"
          />
          <button
            type="button"
            aria-label={showPassword ? '隐藏密码' : '显示密码'}
            onClick={() => setShowPassword(!showPassword)}
            className="text-text-tertiary"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        <p className="px-2 text-xs text-[#B8893D]">
          密码需含数字、字母和符号，长度不少于 8 位
        </p>
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
