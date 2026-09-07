import { useNavigate, useSearchParams } from 'react-router-dom'
import { XCircle, ChevronLeft } from 'lucide-react'

/**
 * T029｜充值失败反馈页
 * -------------------------------------------------------------
 * URL 形如：/legacy-profile/my-cards/:id/topup/fail?amount=10&channel=wechat&reason=...
 *
 * 视觉：
 * - 顶部淡金渐变 + 返回
 * - 中部白卡：红色大圆叉 + "充值失败" + 金额 + 失败原因
 * - 底部双按钮：「重新充值」（回充值页）+「返回卡详情」
 */
const DEFAULT_REASONS = [
  '支付通道繁忙，请稍后重试',
  '账户余额不足',
  '网络异常，请检查网络后重试',
  '支付已取消',
]

export default function CardTopupFailPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const amount = params.get('amount') || '0'
  const channel = params.get('channel') === 'alipay' ? '支付宝' : '微信支付'
  const reason = params.get('reason') || DEFAULT_REASONS[0]
  const cardId = params.get('cardId') || ''

  const handleRetry = () => {
    /* 回到充值页（保留原金额 + 渠道） */
    navigate(`/legacy-profile/my-cards/${cardId}/topup`)
  }

  const handleBack = () => {
    navigate(`/legacy-profile/my-cards/${cardId}`)
  }

  return (
    <div className="mx-auto flex min-h-full max-w-[480px] flex-col bg-[#F8F8FA]">
      {/* 顶部淡金渐变 + 返回 */}
      <div
        className="relative shrink-0 px-4 pt-3 pb-5"
        style={{ background: 'linear-gradient(135deg, #D4A853 0%, #E8C97A 50%, #F0D68E 100%)' }}
      >
        <button
          type="button"
          aria-label="返回"
          onClick={handleBack}
          className="flex h-10 w-10 items-center justify-center text-white active:opacity-80"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div className="absolute left-1/2 top-3 -translate-x-1/2 text-lg font-semibold text-white">
          充值结果
        </div>
      </div>

      {/* 中部白卡 */}
      <div className="mx-4 mt-6 rounded-2xl bg-white px-6 py-10 shadow-sm">
        <div className="flex flex-col items-center">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full"
            style={{ background: 'linear-gradient(135deg, #F87171 0%, #DC2626 100%)' }}
          >
            <XCircle className="h-12 w-12 text-white" strokeWidth={2.5} />
          </div>

          <h2 className="mt-5 text-xl font-semibold text-text-primary">充值失败</h2>

          <div className="mt-3 flex items-baseline">
            <span className="text-sm text-text-secondary">¥</span>
            <span className="text-4xl font-bold text-text-primary">{amount}</span>
            <span className="ml-1 text-base text-text-secondary">元</span>
          </div>

          <div className="mt-6 text-center text-sm leading-relaxed text-[#DC2626]">{reason}</div>

          <div className="mt-3 text-xs text-text-tertiary">支付方式：{channel}</div>
        </div>
      </div>

      {/* 提示文案 */}
      <p className="mx-6 mt-4 text-center text-xs leading-relaxed text-text-tertiary">
        如有问题请联系平台客服协助解决；
        <br />
        平台售后电话：4006-444-996
      </p>

      {/* 底部双按钮 */}
      <div className="mt-auto space-y-3 px-4 pb-6 pt-8">
        <button
          type="button"
          onClick={handleRetry}
          className="w-full rounded-full bg-[#D4A853] py-3.5 text-base font-semibold text-white shadow-sm active:opacity-90"
        >
          重新充值
        </button>
        <button
          type="button"
          onClick={handleBack}
          className="w-full rounded-full bg-white py-3.5 text-base font-semibold text-[#B8893D] shadow-sm active:opacity-90"
        >
          返回卡详情
        </button>
      </div>
    </div>
  )
}
