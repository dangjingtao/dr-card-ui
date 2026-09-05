import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Inbox } from 'lucide-react'

/**
 * T028｜退款记录页（占位）
 * -------------------------------------------------------------
 * 任务卡明文：当前退款走公众号工单推款，APP 内仅做 UI 展示，
 * 不在范围内做原生退款闭环。所以本页先做"暂无记录"占位，
 * 后续如有需要再接入真实数据。
 */
export default function RefundRecordsPage() {
  const navigate = useNavigate()

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
            退款记录
          </div>
        </div>
      </div>

      {/* 空态 */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-12 pt-16">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-bg-secondary text-text-tertiary">
          <Inbox className="h-10 w-10" />
        </div>
        <div className="mt-4 text-sm text-text-secondary">暂无退款记录</div>
        <div className="mt-1 text-xs text-text-tertiary">退款请到「设置 → 退款」按流程申请</div>
      </div>
    </div>
  )
}