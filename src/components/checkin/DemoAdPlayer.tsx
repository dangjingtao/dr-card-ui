import { useEffect, useState } from 'react'
import { Dialog } from '../ui'
import pointsBenefitVoucher from '../../assets/brand/bubble/points-benefit-voucher.webp'

export interface DemoAdPlayerProps {
  /** 是否展示广告 */
  open: boolean
  /** 广告必须看完的最少时长（秒），默认 5 秒。期间 onComplete 不会触发 */
  durationSeconds?: number
  /** 看完全部广告后的回调：触发补签完成 */
  onComplete: () => void
  /** 用户主动关闭广告的回调（本期 PRD 限制不可跳过，预留接口以备后用） */
  onClose?: () => void
}

/**
 * T045｜演示广告播放器（诗得丽签到补签流）
 * -------------------------------------------------------------
 * - 全屏遮罩 + 视频缩略图占位（项目内 webp 静态资源，无外部 SDK 依赖）
 * - 顶部「广告」标签 + 倒计时 + 关闭按钮（关闭按钮本期禁用，B-046）
 * - 倒计时归零后自动触发 onComplete（不允许中途跳过）
 * - 真实接入广告 SDK 后，只需替换视频区内容 + 监听 SDK 事件即可
 */
export default function DemoAdPlayer({ open, durationSeconds = 5, onComplete, onClose }: DemoAdPlayerProps) {
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds)

  // 打开时重置倒计时
  useEffect(() => {
    if (open) setSecondsLeft(durationSeconds)
  }, [open, durationSeconds])

  // 倒计时 tick
  useEffect(() => {
    if (!open) return
    if (secondsLeft <= 0) {
      onComplete()
      return
    }
    const timer = window.setTimeout(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [open, secondsLeft, onComplete])

  return (
    <Dialog
      open={open}
      title="观看广告"
      onClose={onClose}
      presentation="custom"
      size="compact"
      className="overflow-hidden bg-[#0f1115]"
    >
      {/* 顶部：广告标识 + 倒计时 + 关闭（本期禁用） */}
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2.5 text-white/85">
        <span className="inline-flex items-center gap-1 rounded-pill bg-white/10 px-2 py-0.5 text-[10px] font-semibold tracking-[0.12em]">
          AD · 广告
        </span>
        <span
          className="text-[11px] font-medium tabular-nums"
          aria-live="polite"
          aria-label={`广告剩余 ${secondsLeft} 秒`}
        >
          {secondsLeft}s 后可完成补签
        </span>
        <button
          type="button"
          disabled
          aria-label="不可跳过广告"
          className="flex h-7 w-7 items-center justify-center rounded-full text-white/30 disabled:cursor-not-allowed"
        >
          ×
        </button>
      </div>

      {/* 视频缩略图占位 */}
      <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden bg-black">
        <img
          src={pointsBenefitVoucher}
          alt="演示广告内容"
          className="h-full w-full object-cover opacity-90"
        />
        {/* 底部播放进度条（视觉占位，1/duration 比例） */}
        <div
          aria-hidden
          className="absolute bottom-0 left-0 h-1 bg-white/85 transition-[width] duration-1000 ease-linear"
          style={{ width: `${((durationSeconds - secondsLeft) / durationSeconds) * 100}%` }}
        />
        {/* 中心进度文字 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white">
          <span className="text-[10px] font-semibold tracking-[0.16em] text-white/75">DEMO REWARD AD</span>
          <span className="text-3xl font-bold tabular-nums">{secondsLeft}</span>
          <span className="text-[11px] text-white/75">看完全部广告即可补签</span>
        </div>
      </div>

      {/* 底部：卡博士品牌脚注 + 演示位标记 */}
      <div className="flex items-center justify-between border-t border-white/10 px-4 py-2 text-[10px] text-white/55">
        <span>DEAR SEED · 卡博士</span>
        <span className="inline-flex items-center gap-1 rounded-pill bg-white/10 px-1.5 py-0.5 text-[9px] font-semibold tracking-wider text-white/75">
          演示位 · 后续接入真实 SDK
        </span>
      </div>
    </Dialog>
  )
}
