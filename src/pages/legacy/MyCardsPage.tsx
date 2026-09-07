import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Plus, CreditCard } from 'lucide-react'
import { useCards } from './cardStore'

/**
 * T031｜我的卡（绑完卡后页面）
 * -------------------------------------------------------------
 * 每张卡独立卡片：卡面 + 状态 + 编号 + 所属项目
 * 点击进卡详情 / 点击 + 按钮进绑定卡流程（占位）
 */
export default function MyCardsPage() {
  const navigate = useNavigate()
  const cards = useCards()

  const STATUS_LABEL: Record<string, { label: string; color: string }> = {
    normal: { label: '正常', color: 'bg-[#D1FAE5] text-[#047857]' },
    reported: { label: '已挂失', color: 'bg-[#FEE2E2] text-[#B91C1C]' },
    unreported: { label: '已解挂', color: 'bg-[#FEF3C7] text-[#92400E]' },
  }

  return (
    <div className="mx-auto flex min-h-full max-w-[480px] flex-col bg-[#F8F8FA]">
      {/* 顶部栏：淡金渐变背景 */}
      <div
        className="relative shrink-0 px-4 pt-3 pb-3"
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
            我的卡
          </div>
        </div>
      </div>

      {/* 绑定卡按钮 */}
      <div className="px-4 pt-4">
        <button
          type="button"
          onClick={() => alert('绑定卡流程施工中')}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-base font-medium text-text-primary shadow-sm active:bg-[#F8F8FA]"
        >
          <Plus className="h-5 w-5 text-[#B8893D]" />
          绑定卡
        </button>
      </div>

      {/* 卡列表 */}
      <div className="flex-1 space-y-3 px-4 pb-8 pt-3">
        {cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-text-tertiary">
            <CreditCard className="mb-3 h-12 w-12 opacity-30" />
            <div className="text-sm">暂无绑定卡</div>
            <div className="mt-1 text-xs">点击上方按钮绑定你的校园卡</div>
          </div>
        ) : (
          cards.map((card) => {
            const status = STATUS_LABEL[card.status]
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => navigate(`/legacy-profile/my-cards/${card.id}`)}
                className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-sm active:bg-[#F8F8FA]"
              >
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)' }}
                >
                  <CreditCard className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium text-text-primary">
                      {card.projectName}
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${status.color}`}
                    >
                      {status.label}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-text-tertiary">
                    卡序号：{card.cardNo}
                  </div>
                  <div className="text-xs text-text-tertiary">
                    用户卡号：{card.userCardNo}
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}