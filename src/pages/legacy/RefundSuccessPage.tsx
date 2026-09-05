import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft, Check } from 'lucide-react'
import { useUserInfo } from './userInfoStore'

/**
 * T028｜退款成功页
 * -------------------------------------------------------------
 * 显示本次退款金额 + 退款后账户余额 + 返回个人中心 / 查看退款记录两个动作。
 */
export default function RefundSuccessPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const amount = parseFloat(searchParams.get('amount') || '0')
  const balance = useUserInfo().balance

  return (
    <div className="mx-auto flex min-h-full max-w-[480px] flex-col bg-[#F8F8FA]">
      {/* 顶部栏 */}
      <div className="relative shrink-0 bg-gradient-to-br from-[#D4A853] to-[#E8C97A] px-4 pt-3 pb-3">
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
            退款成功
          </div>
        </div>
      </div>

      {/* 主体 */}
      <div className="flex-1 px-4 pt-16">
        <div className="flex flex-col items-center">
          {/* 渐变金勾 */}
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#D4A853] to-[#E8C97A] text-white shadow-md">
            <Check className="h-10 w-10" strokeWidth={3} />
          </div>
          <div className="mt-4 text-lg font-semibold text-text-primary">退款已提交</div>
          <div className="mt-1 text-xs text-text-tertiary">预计 1-3 个工作日内到账</div>
        </div>

        {/* 金额卡 */}
        <div className="mt-10 rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">本次退款金额</span>
            <span className="text-2xl font-bold text-[#B8893D]">¥{amount.toFixed(2)}</span>
          </div>
          <div className="my-3 border-t border-dashed border-divider" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">退款后账户余额</span>
            <span className="text-base font-medium text-text-primary">¥{balance.toFixed(2)}</span>
          </div>
        </div>

        {/* 提示 */}
        <div className="mt-3 rounded-xl bg-[#FFF8E8] px-3 py-2.5 text-xs leading-relaxed text-text-secondary">
          退款已原路返回至您的充值账户。如未到账，请联系客服或在「退款记录」查看进度。
        </div>
      </div>

      {/* 底部双按钮 */}
      <div className="px-4 pb-8 pt-6 space-y-3">
        <button
          type="button"
          onClick={() => navigate('/legacy-profile/info')}
          className="w-full rounded-full bg-gradient-to-r from-[#D4A853] to-[#E8C97A] py-3.5 text-base font-semibold text-white shadow-md active:opacity-90"
        >
          返回个人中心
        </button>
        <button
          type="button"
          onClick={() => navigate('/legacy-profile/refund-records')}
          className="w-full rounded-full border border-[#D4A853] bg-white py-3.5 text-base font-medium text-[#B8893D] active:bg-[#FFF8E8]"
        >
          查看退款记录
        </button>
      </div>
    </div>
  )
}