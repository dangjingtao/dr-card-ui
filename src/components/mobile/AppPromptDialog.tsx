import { X } from 'lucide-react'
import PromptOverlay from './PromptOverlay'
import promptBottle from '../../assets/brand/dialog/dialog-prompt-bottle.webp'
import { Button, IconButton } from '../ui'

export type AppPromptVariant = 'guide' | 'force'

export interface AppPromptDialogProps {
  open: boolean
  /**
   * 摹客对应两个 artboard：
   * - guide：「引导弹窗」，单按钮「下载链接」+ 右上关闭图标（#13）；
   * - force：「强制APP弹窗」，双按钮「我知道了 / 下载链接」（#20）。
   */
  variant?: AppPromptVariant
  message?: string
  onAcknowledge: () => void
  onDownload?: () => void
  downloadHint?: string
}

/**
 * TIPS 弹窗（#13 引导弹窗 / #20 强制 APP 弹窗）
 * -------------------------------------------------------------
 * 保留摹客 TIPS、左图右文和 guide / force 的单、双操作结构，
 * 面板、分割线、文字、反馈与按钮统一消费 Com Design 语义 Token。
 */
export default function AppPromptDialog({
  open,
  variant = 'force',
  message = '该功能请前往APP使用噢！',
  onAcknowledge,
  onDownload,
  downloadHint,
}: AppPromptDialogProps) {
  return (
    <PromptOverlay open={open} label="APP 能力引导" onDismiss={onAcknowledge}>
      <div className="relative bg-[var(--color-surface-overlay-warm)] px-5 pb-5 pt-5">
        <span className="inline-flex rounded-pill bg-reward-subtle px-2.5 py-1 text-[11px] font-semibold tracking-[0.12em] text-reward-text">
          DEAR SEED
        </span>
        <h2 className="mt-3 text-xl font-bold leading-6 text-text-primary">TIPS</h2>

        {variant === 'guide' && (
          <IconButton
            icon={X}
            label="关闭"
            onClick={onAcknowledge}
            className="absolute right-3 top-3 text-text-secondary"
          />
        )}

        <div className="mt-3 h-px bg-border-subtle" />

        <div className="mt-4 flex items-center gap-4">
          <span className="flex h-[116px] w-[92px] flex-none items-center justify-center rounded-container border border-border-subtle bg-surface shadow-floating">
            <img
              src={promptBottle}
              alt=""
              aria-hidden
              className="h-[106px] w-[78px] object-contain"
            />
          </span>
          <p className="flex-1 text-left text-sm leading-6 text-text-secondary">{message}</p>
        </div>
      </div>

      <div className="bg-surface px-5 pb-5 pt-4">
        {downloadHint && (
          <p role="status" className="mb-3 rounded-control bg-info-bg px-3 py-2 text-center text-xs leading-5 text-info-text">
            {downloadHint}
          </p>
        )}

        <div className="flex items-center gap-3">
          {variant === 'force' && (
            <Button variant="outline" size="large" className="flex-1 rounded-pill" onClick={onAcknowledge}>
              我知道了
            </Button>
          )}
          <Button size="large" className="flex-1 rounded-pill" onClick={onDownload}>
            下载链接
          </Button>
        </div>
      </div>
    </PromptOverlay>
  )
}
