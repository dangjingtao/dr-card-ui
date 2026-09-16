import { CheckCircle2 } from 'lucide-react'
import PromptOverlay from './PromptOverlay'
import { Button } from '../ui'
import { CHECKIN_MAKEUP_SUCCESS, CHECKIN_RULE_STATUS } from '../../app/fixtures'

export interface CheckinMakeupSuccessOverlayProps {
  open: boolean
  onDismiss: () => void
  /** `?debug=1` 时追加未决规则说明 */
  debug?: boolean
}

/**
 * 补打卡成功弹窗（#22）
 * -------------------------------------------------------------
 * 视觉与文案完全沿用 T006 已验收的 /checkin 实现，本组件只做「弹窗抽取」，
 * 使补签这个打卡主要操作可以被任意宿主页面自持，不必跳转到 /checkin 才能看到反馈。
 * T021 起被 /checkin 与诗得丽品牌专栏首页 `/` 共同复用（需求 §2.3「完整迁入主要操作」）。
 * 宿主仍各自在 routes.ts 登记自己的 `?overlay=make-up-success` 以保证可复现。
 */
export default function CheckinMakeupSuccessOverlay({
  open,
  onDismiss,
  debug = false,
}: CheckinMakeupSuccessOverlayProps) {
  return (
    <PromptOverlay
      open={open}
      label="补打卡成功"
      onDismiss={onDismiss}
      className="rounded-feature bg-surface px-6 pb-6 pt-7 text-center shadow-modal"
    >
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-reward-subtle text-reward-strong">
        <CheckCircle2 className="h-9 w-9" aria-hidden />
      </span>
      <h2 className="mt-4 text-xl font-bold text-text-primary">{CHECKIN_MAKEUP_SUCCESS.title}</h2>
      <p className="mt-2 text-sm leading-6 text-text-secondary">已为你补上当日签到，连续签到进度继续累计。</p>
      {debug && <p className="mt-2 text-xs leading-5 text-text-tertiary">夹具态：{CHECKIN_RULE_STATUS.makeupAd.note}</p>}
      <Button className="mt-5 w-full rounded-pill" size="large" onClick={onDismiss}>
        {CHECKIN_MAKEUP_SUCCESS.action}
      </Button>
    </PromptOverlay>
  )
}
