import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Plus, CreditCard } from 'lucide-react'

/**
 * T031｜我的卡 二级页面
 * -------------------------------------------------------------
 * 顶部「+ 绑定卡」按钮 + 列表空态，对齐原小程序"我的卡"页面布局。
 * 数据先空态（mock），待 B-047 决策后再接入实体卡列表接口。
 */
export default function MyCardsPage() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto flex min-h-full max-w-[480px] flex-col bg-[#F8F8FA]">
      {/* 顶部栏：淡金渐变背景（与状态栏同色） */}
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
            我的卡
          </div>
        </div>
      </div>

      {/* 绑定卡按钮 */}
      <div className="px-4 pt-4">
        <button
          type="button"
          onClick={() => alert('绑定卡施工中（T031 待 B-047 决策）')}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-base font-medium text-text-primary shadow-sm active:bg-[#F8F8FA]"
        >
          <Plus className="h-5 w-5 text-[#B8893D]" />
          绑定卡
        </button>
      </div>

      {/* 空态 */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-12 pt-16">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-bg-secondary text-text-tertiary">
          <CreditCard className="h-10 w-10" />
        </div>
        <div className="mt-4 text-base text-text-secondary">暂无绑定卡</div>
        <div className="mt-1 text-xs text-text-tertiary">点击上方按钮绑定你的校园卡</div>
      </div>
    </div>
  )
}
