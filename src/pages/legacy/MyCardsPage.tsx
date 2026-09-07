import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Plus, CreditCard, FlaskConical, Wallet } from 'lucide-react'
import { useCards, type CardStatus } from './cardStore'

/**
 * T031｜我的卡（多张卡列表 + 绑定卡按钮）
 * -------------------------------------------------------------
 * 2026-09-07 T029 迭代：用户可绑定多张卡，"绑定卡"按钮始终保留。
 *
 * 严格按截图结构：
 * - 顶部渐变背景：返回 + 居中"我的卡"标题
 * - 中部：已绑定的卡片列表（每张卡一条横排卡片，可点击进详情）
 * - 下方：始终保留"绑定卡"按钮（带 + 图标）
 *
 * 右下角保留原型状态切换器（开发工具，不计入业务页面）。
 */
const DEMO_STATE_KEY = 'KBS_CARD_DEMO_STATE'

function readDemoState(): 'unbound' | 'bound' {
  try {
    const v = sessionStorage.getItem(DEMO_STATE_KEY)
    return v === 'unbound' ? 'unbound' : 'bound'
  } catch {
    return 'bound'
  }
}

function writeDemoState(v: 'unbound' | 'bound') {
  try {
    sessionStorage.setItem(DEMO_STATE_KEY, v)
  } catch {
    /* ignore */
  }
}

const STATUS_TEXT: Record<CardStatus, string> = {
  normal: '正常',
  reported: '已挂失',
  unreported: '已解挂',
}

export default function MyCardsPage() {
  const navigate = useNavigate()
  const allCards = useCards()
  const [demoState, setDemoState] = useState<'unbound' | 'bound'>(() => readDemoState())

  /* 未绑卡演示态：列表清空 */
  const cards = demoState === 'unbound' ? [] : allCards

  const switchDemoState = () => {
    const next = demoState === 'bound' ? 'unbound' : 'bound'
    setDemoState(next)
    writeDemoState(next)
  }

  return (
    <div className="mx-auto flex min-h-full max-w-[480px] flex-col bg-[#F8F8FA]">
      {/* 顶部栏：淡金渐变背景（卡博士APP主色） */}
      <div
        className="relative shrink-0 px-4 pt-3 pb-3"
        style={{ background: 'linear-gradient(135deg, #D4A853 0%, #E8C97A 50%, #F0D68E 100%)' }}
      >
        <div className="relative flex items-center">
          <button
            type="button"
            aria-label="返回"
            onClick={() => navigate('/legacy-profile')}
            className="flex h-10 w-10 items-center justify-center text-white active:opacity-80"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold text-white">
            我的卡
          </div>
        </div>
      </div>

      {/* 已绑定的卡片列表（按截图：每张卡一条白底横排卡片） */}
      {cards.length > 0 && (
        <div className="mt-4 space-y-3 px-4">
          {cards.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => navigate(`/legacy-profile/my-cards/${card.id}`)}
              className="flex w-full items-center gap-3 rounded-2xl bg-white px-3 py-3 text-left shadow-sm active:bg-[#F8F8FA]"
            >
              {/* 左侧：紫色圆形卡片图标 */}
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#7B61FF]">
                <Wallet className="h-6 w-6 text-white" />
              </div>

              {/* 中部：姓名 + 卡号 */}
              <div className="min-w-0 flex-1">
                <div className="truncate text-base font-medium text-text-primary">
                  {card.realName || '未命名'}
                </div>
                <div className="mt-0.5 truncate text-xs text-text-tertiary">
                  {card.cardNo}（卡号：{card.userCardNo}）
                </div>
              </div>

              {/* 右侧：状态 + 用途 + chevron */}
              <div className="flex shrink-0 items-center gap-2 text-xs text-text-tertiary">
                <span className="text-[#333]">{STATUS_TEXT[card.status]}</span>
                <span className="text-text-tertiary">小票消费卡</span>
                <ChevronRight className="h-4 w-4 text-text-tertiary" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 绑定卡按钮：始终保留 */}
      <div className={`px-4 ${cards.length > 0 ? 'mt-4' : 'pt-4'}`}>
        <button
          type="button"
          onClick={() => navigate('/legacy-profile/my-cards/scan-bind')}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-base font-medium text-text-primary shadow-sm active:bg-[#F8F8FA]"
        >
          <Plus className="h-5 w-5 text-[#B8893D]" />
          绑定卡
        </button>
      </div>

      {/* 未绑卡时：在按钮下方显示空态 */}
      {cards.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center px-4 pb-8 pt-12 text-text-tertiary">
          <CreditCard className="mb-3 h-16 w-16 opacity-30" />
          <div className="text-base text-text-secondary">暂无绑定卡</div>
          <div className="mt-1 text-xs">点击上方按钮绑定你的校园卡</div>
        </div>
      )}

      {/* 右下角：原型状态切换器（开发用，不计入业务页面） */}
      <button
        type="button"
        onClick={switchDemoState}
        title="切换卡的绑定状态（开发用）"
        className="fixed bottom-6 right-4 z-40 flex items-center gap-1.5 rounded-full bg-text-primary px-3 py-2 text-xs font-medium text-white shadow-lg active:opacity-80"
      >
        <FlaskConical className="h-3.5 w-3.5" />
        {demoState === 'bound' ? '已绑卡' : '未绑卡'}
      </button>
    </div>
  )
}
