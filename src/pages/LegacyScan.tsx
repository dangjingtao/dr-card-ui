import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft, Image, ScanLine, Zap, Droplets, Wind, GlassWater, Fan } from 'lucide-react'

/**
 * 历史首页入口的独立扫一扫页。
 *
 * - 扫码框自适应居中，所有元素不超出页面
 * - 演示态：
 *   - `from=scratch-card`：刮刮充值卡入口，显示「模拟扫码完成」
 *   - 其它入口（首页扫一扫）：显示 4 个设备模拟按钮（2×2 网格）+ 模拟购买洗发水按钮
 *
 * 4 个设备模拟按钮的跳转逻辑：
 * - 淋浴 / 饮水：直接进入设备启动页（自动启动，T030 自动启动逻辑）
 * - 洗烘 / 吹风：进入设备详情页（用户选择金额/时长后手动启动）
 */

const DEMO_DEVICES = [
  {
    type: 'shower',
    id: 'shower-001',
    label: '淋浴',
    icon: Droplets,
    gradient: 'from-[#8671F5] to-[#5A42D1]',
    autoStart: true,
  },
  {
    type: 'laundry',
    id: 'laundry-001',
    label: '洗烘',
    icon: Wind,
    gradient: 'from-[#52D9BA] to-[#0E8A6E]',
    autoStart: false,
  },
  {
    type: 'water',
    id: 'water-001',
    label: '饮水',
    icon: GlassWater,
    gradient: 'from-[#6BA3FF] to-[#1F55BD]',
    autoStart: true,
  },
  {
    type: 'hairdryer',
    id: 'hairdryer-001',
    label: '吹风',
    icon: Fan,
    gradient: 'from-[#FFC942] to-[#BB7708]',
    autoStart: false,
  },
] as const

export default function LegacyScan() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const fromScratchCard = params.get('from') === 'scratch-card'

  function handleDeviceDemo(type: string, id: string, autoStart: boolean) {
    // 淋浴 / 饮水：自动启动，直接走 connecting
    // 洗烘 / 吹风：进详情页选金额
    navigate(`/device/connecting?type=${type}&id=${id}`)
  }

  return (
    <div className="h-full bg-black text-white">
      <main className="relative flex h-full flex-col items-center px-5">
        {/* 背景光晕 */}
        <div
          className="absolute left-0 right-0 top-1/3 h-72 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.12)_0%,transparent_70%)]"
          aria-hidden
        />

        {/* 顶部栏 */}
        <div className="relative z-10 flex w-full flex-none items-center pt-4">
          <button
            type="button"
            aria-label="返回"
            onClick={() => navigate('/legacy-home')}
            className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-white/10"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="flex-1 text-center text-base font-medium">扫一扫</span>
          <span className="h-9 w-9 flex-none" aria-hidden />
        </div>

        {/* 提示文字 */}
        <div className="relative z-10 mt-4 flex flex-none items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm">
          <ScanLine className="h-4 w-4 flex-none" />
          <span>将二维码 / 条形码对准扫描框，自动识别</span>
        </div>

        {/* 扫码框（flex-1 自适应居中） */}
        <div className="relative z-10 flex flex-1 items-center justify-center py-4">
          <div className="relative aspect-square w-[260px] max-w-[70vw] max-h-[50vh]">
            <span
              className="absolute left-0 top-0 h-8 w-8 rounded-tl-2xl border-l-4 border-t-4 border-white/90"
              aria-hidden
            />
            <span
              className="absolute right-0 top-0 h-8 w-8 rounded-tr-2xl border-r-4 border-t-4 border-white/90"
              aria-hidden
            />
            <span
              className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-2xl border-b-4 border-l-4 border-white/90"
              aria-hidden
            />
            <span
              className="absolute bottom-0 right-0 h-8 w-8 rounded-br-2xl border-b-4 border-r-4 border-white/90"
              aria-hidden
            />
            <span
              className="absolute inset-x-3 top-1/2 h-0.5 -translate-y-1/2 animate-pulse rounded bg-white/80 shadow-[0_0_12px_2px_rgba(255,255,255,0.6)]"
              aria-hidden
            />
          </div>
        </div>

        {/* 提示文字 */}
        <p className="relative z-10 flex-none text-center text-sm text-white/60">
          请将二维码放入框内，即可自动扫描
        </p>

        {/* 底部工具栏（照亮 / 相册） */}
        <div className="relative z-10 mt-4 flex w-full flex-none items-center justify-center gap-14">
          <button type="button" className="flex flex-col items-center gap-1.5 text-xs text-white/80">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
              <Zap className="h-[22px] w-[22px]" />
            </span>
            轻触照亮
          </button>
          <button type="button" className="flex flex-col items-center gap-1.5 text-xs text-white/80">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
              <Image className="h-[22px] w-[22px]" />
            </span>
            相册
          </button>
        </div>

        {/* 演示按钮区：刮刮卡模式 */}
        {fromScratchCard && (
          <div className="relative z-10 mt-4 w-full flex-none px-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={() => navigate('/legacy-profile/scratch-card')}
              className="w-full rounded-full bg-gradient-to-r from-[#D4A853] to-[#E8C97A] py-3.5 text-sm font-semibold text-white shadow-md active:opacity-90"
            >
              模拟扫码完成
            </button>
            <p className="mt-2 text-center text-xs text-white/40">
              仅供设计演示：点击立即返回刮刮充值卡页并弹"充值成功"
            </p>
          </div>
        )}

        {/* 演示按钮区：通用模式（4 设备 + 洗发水） */}
        {!fromScratchCard && (
          <div className="relative z-10 mt-4 w-full flex-none px-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
            {/* 4 个设备模拟按钮（2×2 网格） */}
            <div className="grid grid-cols-2 gap-3">
              {DEMO_DEVICES.map((d) => {
                const Icon = d.icon
                return (
                  <button
                    key={d.type}
                    type="button"
                    onClick={() => handleDeviceDemo(d.type, d.id, d.autoStart)}
                    className={`flex items-center justify-center gap-2 rounded-full bg-gradient-to-r ${d.gradient} py-3 text-sm font-semibold text-white shadow-md active:opacity-90`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {d.label}
                  </button>
                )
              })}
            </div>

            {/* 模拟购买洗发水 */}
            <button
              type="button"
              onClick={() => navigate('/vending/buy?id=vending-001')}
              className="mt-3 w-full rounded-full bg-gradient-to-r from-[#FF8A65] to-[#E64A19] py-3.5 text-sm font-semibold text-white shadow-md active:opacity-90"
            >
              模拟购买洗发水
            </button>
            <p className="mt-2 text-center text-xs text-white/40">
              仅供设计演示：选择设备类型直接进入对应页面
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
