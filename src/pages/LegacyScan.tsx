import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Image, ScanLine, Zap } from 'lucide-react'

/**
 * 历史首页入口的独立扫一扫页。
 * 与卡包核销链路的 /card/verify 相互独立：这里是首页通用扫码入口，
 * 不承接券码核销语义，识别结果暂不接后续页面。
 */
export default function LegacyScan() {
  const navigate = useNavigate()

  return (
    <div className="min-h-full bg-black text-white">
      <main className="relative flex min-h-full flex-col items-center px-5 pb-10">
        <div className="absolute left-0 right-0 top-1/2 h-72 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.12)_0%,transparent_70%)]" aria-hidden />

        <div className="relative z-10 flex w-full items-center pt-4">
          <button
            type="button"
            aria-label="返回"
            onClick={() => navigate('/legacy-home')}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="flex-1 text-center text-base font-medium">扫一扫</span>
          <span className="h-9 w-9" aria-hidden />
        </div>

        <div className="relative z-10 mt-6 flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm" role="status">
          <ScanLine className="h-4 w-4" />
          <span>将二维码 / 条形码对准扫描框，自动识别</span>
        </div>

        <div className="relative z-10 mx-auto mt-8 aspect-square w-[260px] max-w-[75vw]">
          <span className="absolute left-0 top-0 h-8 w-8 rounded-tl-2xl border-l-4 border-t-4 border-white/90" aria-hidden />
          <span className="absolute right-0 top-0 h-8 w-8 rounded-tr-2xl border-r-4 border-t-4 border-white/90" aria-hidden />
          <span className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-2xl border-b-4 border-l-4 border-white/90" aria-hidden />
          <span className="absolute bottom-0 right-0 h-8 w-8 rounded-br-2xl border-b-4 border-r-4 border-white/90" aria-hidden />
          <span className="absolute inset-x-3 top-1/2 h-0.5 -translate-y-1/2 rounded bg-white/80 shadow-[0_0_12px_2px_rgba(255,255,255,0.6)]" aria-hidden />
        </div>

        <p className="relative z-10 mt-10 text-center text-sm text-white/60">
          请将二维码放入框内，即可自动扫描
        </p>

        <div className="relative z-10 mt-auto flex w-full items-center justify-center gap-14 pt-10">
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
      </main>
    </div>
  )
}
