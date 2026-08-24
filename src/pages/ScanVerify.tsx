import { useNavigate } from 'react-router-dom'
import { ScanLine } from 'lucide-react'

export default function ScanVerify() {
  const navigate = useNavigate()

  return (
    <div className="min-h-full bg-black text-white">
      <main className="relative flex flex-col items-center px-5">
        <div className="absolute left-0 right-0 top-1/2 h-72 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.12)_0%,transparent_70%)]" aria-hidden />

        <div className="relative z-10 mt-6 flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm" role="status">
          <ScanLine className="h-4 w-4" />
          <span>将二维码 / 条形码对准扫描框，自动识别</span>
        </div>

        <button
          type="button"
          onClick={() => navigate('/card/verify/confirm')}
          aria-label="模拟扫码识别，进入确认核销"
          className="relative z-10 mx-auto mt-8 aspect-square w-[260px] max-w-[75vw]"
        >
          <span className="absolute left-0 top-0 h-8 w-8 rounded-tl-2xl border-l-4 border-t-4 border-white/90" aria-hidden />
          <span className="absolute right-0 top-0 h-8 w-8 rounded-tr-2xl border-r-4 border-t-4 border-white/90" aria-hidden />
          <span className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-2xl border-b-4 border-l-4 border-white/90" aria-hidden />
          <span className="absolute bottom-0 right-0 h-8 w-8 rounded-br-2xl border-b-4 border-r-4 border-white/90" aria-hidden />
          <span className="absolute inset-x-3 top-1/2 h-0.5 -translate-y-1/2 rounded bg-white/80 shadow-[0_0_12px_2px_rgba(255,255,255,0.6)]" aria-hidden />
        </button>

        <div className="relative z-10 mt-10 text-center">
          <p className="text-lg font-semibold">请将二维码对准扫描框</p>
          <p className="mt-1 text-sm text-white/60">扫码后自动核销</p>
        </div>
      </main>
    </div>
  )
}
