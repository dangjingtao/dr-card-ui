import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Image as ImageIcon, Zap } from 'lucide-react'
import { cardActions } from './cardStore'

/**
 * T031｜扫码绑卡页
 * -------------------------------------------------------------
 * 顶部淡金渐变背景（含返回 + 标题）
 * 中间黑色"扫码取景框"：四角白色 L 形扫描线 + 居中红绿渐变扫描条
 * 提示文案：把二维码放入框内，自动识别绑定
 * 底部两个辅助按钮：打开相册 / 打开闪光灯
 *
 * mock：3 秒后"识别成功"，弹"识别到卡号 XXX，是否绑卡？" → 确认 → 写入 store + 回卡详情
 */
export default function ScanBindCardPage() {
  const navigate = useNavigate()
  const [scanning, setScanning] = useState(true)
  const [recognized, setRecognized] = useState<null | { cardNo: string; projectName: string }>(null)

  /* mock 扫描：3 秒后识别成功（实际应接扫一扫 SDK） */
  useState(() => {
    setTimeout(() => {
      setScanning(false)
      setRecognized({
        cardNo: '073249EC',
        projectName: '卡博士库存项目（10003）',
      })
    }, 3000)
    return null
  })

  const handleConfirmBind = () => {
    if (!recognized) return
    /* 写入 store：第一张卡（如有则替换） */
    cardActions.set([
      {
        id: 'card-001',
        cardNo: recognized.cardNo,
        projectId: '10003',
        projectName: '卡博士库存项目',
        userCardNo: recognized.cardNo.slice(-6),
        mac: '',
        realName: '',
        className: '1',
        studentId: '1',
        status: 'normal',
      },
    ])
    /* 标记原型状态为已绑卡 */
    try {
      sessionStorage.setItem('KBS_CARD_DEMO_STATE', 'bound')
    } catch {
      /* ignore */
    }
    /* 跳转到卡详情 */
    navigate('/legacy-profile/my-cards/card-001', { replace: true })
  }

  const handleCancel = () => {
    navigate('/legacy-profile/my-cards')
  }

  return (
    <div className="mx-auto flex min-h-full max-w-[480px] flex-col bg-black">
      {/* 顶部淡金渐变（带返回 + 标题） */}
      <div
        className="relative shrink-0 px-4 pt-3 pb-4"
        style={{ background: 'linear-gradient(135deg, #D4A853 0%, #E8C97A 50%, #F0D68E 100%)' }}
      >
        <div className="flex items-center">
          <button
            type="button"
            aria-label="返回"
            onClick={handleCancel}
            className="relative z-10 flex h-10 w-10 items-center justify-center text-white active:opacity-80"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="flex-1 text-center text-lg font-semibold text-white">
            扫一扫绑卡
          </div>
          <div className="h-10 w-10" />
        </div>
      </div>

      {/* 黑色扫描区 */}
      <div className="relative flex flex-1 items-center justify-center bg-black px-8">
        {/* 取景框：4 个白色 L 角 + 居中红绿扫描条 */}
        <div className="relative h-64 w-64">
          {/* 四角 L 形线 */}
          <Corner pos="tl" />
          <Corner pos="tr" />
          <Corner pos="bl" />
          <Corner pos="br" />

          {/* 扫描条（从顶到底来回扫） */}
          {scanning && (
            <div className="absolute inset-x-0 top-0 overflow-hidden">
              <div
                className="h-0.5 w-full"
                style={{
                  background:
                    'linear-gradient(90deg, transparent 0%, #34D399 20%, #FBBF24 50%, #EF4444 80%, transparent 100%)',
                  boxShadow: '0 0 12px rgba(239, 68, 68, 0.6)',
                  animation: 'scanline 2.2s linear infinite',
                }}
              />
            </div>
          )}

          {/* 蒙层（取景框外暗） */}
          <div className="absolute inset-0">
            <div className="absolute left-0 right-0 top-0 h-[60px] bg-black/60" />
            <div className="absolute bottom-0 left-0 right-0 top-[232px] bg-black/60" />
            <div className="absolute left-0 top-[60px] h-[172px] w-[40px] bg-black/60" />
            <div className="absolute right-0 top-[60px] h-[172px] w-[40px] bg-black/60" />
          </div>
        </div>
      </div>

      {/* 提示文案 */}
      <div className="bg-black px-8 pb-4 text-center text-xs text-white/70">
        将实体卡背面的二维码放入框内，自动识别绑定
      </div>

      {/* 底部两个辅助按钮 */}
      <div className="bg-black px-8 pb-10 pt-2">
        <div className="flex justify-around">
          <button
            type="button"
            className="flex flex-col items-center gap-1.5 text-white/80 active:opacity-60"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
              <ImageIcon className="h-5 w-5" />
            </div>
            <span className="text-xs">相册</span>
          </button>
          <button
            type="button"
            className="flex flex-col items-center gap-1.5 text-white/80 active:opacity-60"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
              <Zap className="h-5 w-5" />
            </div>
            <span className="text-xs">手电筒</span>
          </button>
        </div>
      </div>

      {/* 识别成功弹窗（覆盖在扫码区上方） */}
      {recognized && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-8">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-center text-base font-semibold text-text-primary">
              识别到卡号
            </h3>
            <div className="mt-3 rounded-xl bg-[#FFF8E8] px-4 py-3 text-center">
              <div className="text-2xl font-bold text-[#B8893D] font-mono">
                {recognized.cardNo}
              </div>
              <div className="mt-1 text-xs text-text-secondary">{recognized.projectName}</div>
            </div>
            <p className="mt-3 text-center text-sm text-text-secondary">
              确认绑定到当前账号吗？
            </p>
            <div className="mt-6 flex divide-x divide-divider overflow-hidden rounded-xl border border-divider">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 py-3 text-sm text-text-secondary active:bg-bg-secondary"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmBind}
                className="flex-1 py-3 text-sm text-[#B8893D] active:bg-bg-secondary"
              >
                确认绑定
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scanline {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(256px); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

function Corner({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const map: Record<typeof pos, string> = {
    tl: 'top-0 left-0 border-l-2 border-t-2',
    tr: 'top-0 right-0 border-r-2 border-t-2',
    bl: 'bottom-0 left-0 border-l-2 border-b-2',
    br: 'bottom-0 right-0 border-r-2 border-b-2',
  }
  return (
    <div
      className={`absolute h-5 w-5 border-white ${map[pos]}`}
      style={{ borderRadius: 2 }}
    />
  )
}