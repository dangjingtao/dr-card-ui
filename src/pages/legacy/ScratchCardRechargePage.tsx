import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, Loader2, ScanLine } from 'lucide-react'

/* T038｜刮刮充值卡补全（卡博士淡金色风格）
 * -------------------------------------------------------------
 * 2026-09-07 用户决定：
 * - 只保留输入 + 充值；去掉"充值记录"、"温馨提示"、"协议勾选"三块
 * - 扫码按钮点击进入 `/legacy-home/scan?from=scratch-card`（已有扫一扫，仅在
 *   该来源下展示「模拟扫码完成」按钮）；点击模拟按钮立即返回本页并弹"充值成功"
 *
 * Mock 校验：必须 10 位数字。
 */

const SCAN_REDIRECT_PATH = '/legacy-home/scan?from=scratch-card'

export default function ScratchCardRechargePage() {
  const navigate = useNavigate()
  const location = useLocation()

  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successOpen, setSuccessOpen] = useState(false)

  /* 监听 location.key 递增 = 用户从扫一扫返回（点"模拟扫码完成"按钮触发）。
   * - 仅当 handleScan 主动跳转到扫一扫时打 pendingReturnRef 标记，
   *   避免用户首次进入 / 浏览器后退等场景误弹 */
  const lastKeyRef = useRef<string>(location.key)
  const pendingReturnRef = useRef(false)

  useEffect(() => {
    if (lastKeyRef.current === location.key) return
    lastKeyRef.current = location.key
    if (pendingReturnRef.current) {
      pendingReturnRef.current = false
      setSuccessOpen(true)
    }
  }, [location.key])

  const handleScan = () => {
    pendingReturnRef.current = true
    navigate(SCAN_REDIRECT_PATH)
  }

  const handleRecharge = async () => {
    setErrorMsg('')
    if (code.length !== 10 || !/^\d{10}$/.test(code)) {
      setErrorMsg('请输入 10 位数字充值码')
      return
    }

    setSubmitting(true)
    /* 模拟请求：600ms */
    await new Promise((resolve) => setTimeout(resolve, 600))
    setSubmitting(false)
    setSuccessOpen(true)
  }

  return (
    <div className="mx-auto flex min-h-full max-w-[480px] flex-col bg-[#F8F8FA]">
      {/* 顶部栏：淡金渐变 + 返回 + 居中标题 */}
      <div
        className="relative shrink-0 px-4 pt-3 pb-4"
        style={{ background: 'linear-gradient(135deg, #D4A853 0%, #E8C97A 50%, #F0D68E 100%)' }}
      >
        <div className="relative flex items-center">
          <button
            type="button"
            aria-label="返回"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center text-white active:opacity-80"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold text-white">
            刮刮充值卡
          </div>
        </div>
      </div>

      {/* 输入区：10 位充值码 + 扫码按钮 */}
      <div className="mx-4 mt-5 flex items-center gap-2">
        <div
          className={`flex h-12 flex-1 items-center gap-2 rounded-full border bg-white px-5 shadow-sm ${
            errorMsg && code.length > 0 ? 'border-danger' : 'border-[#E8D9B8]'
          }`}
        >
          <input
            value={code}
            onChange={(e) => {
              const next = e.target.value.replace(/\D/g, '').slice(0, 10)
              setCode(next)
              setErrorMsg('')
            }}
            inputMode="numeric"
            placeholder="请输入10位刮刮充值卡充值码"
            className="h-full flex-1 bg-transparent text-base text-text-primary outline-none placeholder:text-[#B8893D]"
          />
        </div>
        <button
          type="button"
          onClick={handleScan}
          aria-label="扫码"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#E8D9B8] bg-white text-[#B8893D] shadow-sm active:opacity-70"
        >
          <ScanLine className="h-5 w-5" />
        </button>
      </div>
      {errorMsg && <div className="mx-4 mt-2 text-xs text-danger-text">{errorMsg}</div>}

      {/* 主操作：充值按钮（金渐变） */}
      <div className="mx-4 mt-5">
        <button
          type="button"
          onClick={handleRecharge}
          disabled={submitting}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#D4A853] to-[#E8C97A] text-base font-semibold text-white shadow-md active:opacity-90 disabled:opacity-60"
        >
          {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
          {submitting ? '充值中' : '充值'}
        </button>
      </div>

      {/* 充值成功弹窗 */}
      {successOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim px-6">
          <div className="w-full max-w-[327px] overflow-hidden rounded-2xl bg-surface shadow-modal">
            <div className="px-6 pt-6 pb-3 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF3D9]">
                <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#B8893D]" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-text-primary">充值成功</h2>
              <p className="mt-2 text-sm text-text-secondary">
                刮刮充值卡已到账，可在「我的卡」查看最新余额。
              </p>
            </div>
            <div className="flex border-t border-border-subtle">
              <button
                type="button"
                onClick={() => {
                  setSuccessOpen(false)
                  navigate('/legacy-profile')
                }}
                className="flex-1 py-3 text-sm text-text-secondary active:bg-surface-pressed"
              >
                返回我的
              </button>
              <div className="w-px bg-border-subtle" />
              <button
                type="button"
                onClick={() => {
                  setSuccessOpen(false)
                  setCode('')
                }}
                className="flex-1 py-3 text-sm font-semibold text-[#B8893D] active:bg-surface-pressed"
              >
                继续充值
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}