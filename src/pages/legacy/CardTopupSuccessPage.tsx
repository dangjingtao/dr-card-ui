import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, ChevronLeft } from 'lucide-react'

/**
 * T029｜充值成功反馈页
 * -------------------------------------------------------------
 * URL 形如：/legacy-profile/my-cards/:id/topup/success?amount=10&channel=wechat&cardId=...
 * 来自 CardTopupPage 支付成功后的 redirect。
 *
 * 视觉：
 * - 顶部淡金渐变 + 返回按钮（返回卡详情）
 * - 中部白卡：绿色大圆勾 + "充值成功" + 金额 + 支付方式
 * - 底部两个按钮：「完成」（回卡详情）+ 「查看充值记录」（跳 topup-records 路由）
 */
export default function CardTopupSuccessPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const amount = params.get('amount') || '0'
  const channel = params.get('channel') === 'alipay' ? '支付宝' : '微信支付'
  const cardId = params.get('cardId') || ''

  const handleBack = () => {
    /* 返回到来源卡详情：history.back 在嵌套路由里更稳 */
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/legacy-profile/my-cards')
    }
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
            style={{ background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)' }}
          >
            <CheckCircle2 className="h-12 w-12 text-white" strokeWidth={2.5} />
          </div>

          <h2 className="mt-5 text-xl font-semibold text-text-primary">充值成功</h2>

          <div className="mt-3 flex items-baseline">
            <span className="text-sm text-text-secondary">¥</span>
            <span className="text-4xl font-bold text-text-primary">{amount}</span>
            <span className="ml-1 text-base text-text-secondary">元</span>
          </div>

          <div className="mt-6 text-xs text-text-tertiary">支付方式：{channel}</div>
        </div>
      </div>

      {/* 提示文案 */}
      <p className="mx-6 mt-4 text-center text-xs leading-relaxed text-text-tertiary">
        充值后可在小程序内使用；
        <br />
        余额变动已实时同步到卡详情页。
      </p>

      {/* 底部双按钮 */}
      <div className="mt-auto space-y-3 px-4 pb-6 pt-8">
        <button
          type="button"
          onClick={() => navigate(`/legacy-profile/my-cards/${cardId}/topup-records`)}
          className="w-full rounded-full bg-[#D4A853] py-3.5 text-base font-semibold text-white shadow-sm active:opacity-90"
        >
          查看充值记录
        </button>
        <button
          type="button"
          onClick={() => navigate(`/legacy-profile/my-cards/${cardId}`)}
          className="w-full rounded-full bg-white py-3.5 text-base font-semibold text-[#B8893D] shadow-sm active:opacity-90"
        >
          完成
        </button>
      </div>
    </div>
  )
}
