import PromptOverlay from './PromptOverlay'
import { NEWCOMER_FIXTURE } from '../../app/fixtures'
import promptBottle from '../../assets/brand/dialog/dialog-prompt-bottle.webp'
import { Button } from '../ui'

export interface NewcomerDialogProps {
  open: boolean
  /** 主操作「去完善信息」 */
  onComplete: () => void
  /** 摹客 click：点击卡片本体继续查看 APP 下载引导（#13） */
  onBody: () => void
  /** 点遮罩关闭 */
  onDismiss: () => void
}

/**
 * 新人弹窗（#12）
 * -------------------------------------------------------------
 * 保留摹客「新人弹窗」的标题、左图右文和点击卡片进入 APP 引导的动线，
 * 视觉改为 Com Design Token：暖色 surface、reward 强调、primary 主按钮、
 * overlay 圆角/阴影及标准 48px 触控目标。
 */
export default function NewcomerDialog({ open, onComplete, onBody, onDismiss }: NewcomerDialogProps) {
  return (
    <PromptOverlay open={open} label="新人弹窗" onDismiss={onDismiss}>
      <button
        type="button"
        onClick={onBody}
        className="group block w-full bg-[var(--color-surface-overlay-warm)] px-5 pb-5 pt-6 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-border-focused"
      >
        <span className="mx-auto block w-fit rounded-pill bg-reward-subtle px-3 py-1 text-[11px] font-semibold tracking-[0.12em] text-reward-text">
          DEAR SEED
        </span>
        <h2 className="mt-3 text-center text-[22px] font-bold leading-7 text-text-primary">
          {NEWCOMER_FIXTURE.title}
        </h2>
        <div className="mx-auto mt-3 h-px w-12 bg-reward" aria-hidden />

        <div className="mt-4 flex items-center gap-4">
          <span className="flex h-[116px] w-[92px] flex-none items-center justify-center rounded-container border border-border-subtle bg-surface shadow-floating">
            <img
              src={promptBottle}
              alt=""
              aria-hidden
              className="h-[106px] w-[78px] object-contain transition-transform group-active:scale-[.98]"
            />
          </span>
          <p className="flex-1 text-left text-sm leading-6 text-text-secondary">
            {NEWCOMER_FIXTURE.desc}
          </p>
        </div>
      </button>

      <div className="bg-surface px-5 pb-5 pt-4">
        <Button size="large" className="w-full rounded-pill" onClick={onComplete}>
          {NEWCOMER_FIXTURE.cta}
        </Button>
      </div>
    </PromptOverlay>
  )
}
