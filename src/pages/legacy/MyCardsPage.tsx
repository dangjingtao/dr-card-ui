import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Plus, CreditCard, FlaskConical } from 'lucide-react'
import { useCards } from './cardStore'

/**
 * T031｜我的卡（声明状态两态：未绑卡 / 已绑卡）
 * -------------------------------------------------------------
 * 通过 sessionStorage key=KBS_CARD_DEMO_STATE 切换：
 *   'unbound'：显示"绑定卡"按钮 + 空态文案（用户未绑卡的真实体验）
 *   'bound'  ：直接跳转到卡详情（用户已绑卡 → 直接看到卡信息）
 *
 * 右下角悬浮的"原型状态切换器"是开发工具，不计入业务页面。
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

export default function MyCardsPage() {
  const navigate = useNavigate()
  const cards = useCards()
  const [demoState, setDemoState] = useState<'unbound' | 'bound'>(() => readDemoState())

  /* 当切换到 bound 时，跳到第一张卡的详情；切换到 unbound 时，留在本页 */
  useEffect(() => {
    writeDemoState(demoState)
    if (demoState === 'bound' && cards[0]) {
      navigate(`/legacy-profile/my-cards/${cards[0].id}`, { replace: true })
    }
  }, [demoState, cards, navigate])

  const switchDemoState = () => {
    setDemoState((cur) => (cur === 'bound' ? 'unbound' : 'bound'))
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

      {/* ==== 未绑卡状态：绑定卡按钮 + 空态 ==== */}
      {demoState === 'unbound' && (
        <>
          <div className="px-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/legacy-profile/my-cards/scan-bind')}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-base font-medium text-text-primary shadow-sm active:bg-[#F8F8FA]"
            >
              <Plus className="h-5 w-5 text-[#B8893D]" />
              绑定卡
            </button>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center px-4 pb-8 pt-12 text-text-tertiary">
            <CreditCard className="mb-3 h-16 w-16 opacity-30" />
            <div className="text-base text-text-secondary">暂无绑定卡</div>
            <div className="mt-1 text-xs">点击上方按钮绑定你的校园卡</div>
          </div>
        </>
      )}

      {/* ==== 已绑卡状态：被 useEffect 直接跳转到详情 ==== */}
      {demoState === 'bound' && cards[0] && (
        <div className="flex flex-1 items-center justify-center px-4 py-12 text-text-tertiary">
          <div className="text-sm">正在跳转到卡详情…</div>
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