import { useNavigate, useSearchParams } from 'react-router-dom'
import { Gift } from 'lucide-react'
import PromptOverlay from '../components/mobile/PromptOverlay'
import { Button } from '../components/ui'
import { resolveClaimResult, type ClaimSource } from '../app/fixtures'
import DearseedColumn from './DearseedColumn'

export interface ClaimSuccessProps {
  /** 反馈来源；不传时由 `?from=campaign|onboarding` 决定，默认活动领取（#15） */
  source?: ClaimSource
}

/**
 * 领取成功反馈（#15 路由 /claim/success；#25 路由 /onboarding/success）
 * -------------------------------------------------------------
 * 摹客原型中两者都不是独立页面，而是「诗得丽专栏首页 + 遮罩 + 居中成功弹窗」，
 * 文案是唯一差异，故共用一套呈现：
 * - #15：专栏「本期活动」点击领取后 → 「领取成功，卡券已放入卡包……」
 * - #25：完善信息提交成功后 → 「您的信息已保存今日已自动打卡并领取成功……」
 * 因此这里把诗得丽专栏作为背景渲染，弹窗复用既有 PromptOverlay；
 * remark「点击关闭回到主页面」→ 关闭后回专栏已领取态（closeTo=/dearseed?state=claimed）。
 * ⚠️ 卡券实体、卡包落库、自动打卡的真实规则未确认，此处仅为确定性夹具，不定稿。
 */
export default function ClaimSuccess({ source }: ClaimSuccessProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const result = resolveClaimResult(searchParams.get('from') ?? source ?? null)
  const close = () => navigate(result.closeTo, { replace: true })

  return (
    <>
      <DearseedColumn />

      <PromptOverlay
        open
        label={result.source === 'onboarding' ? '填写完成后领取成功' : '领取成功'}
        onDismiss={close}
        className="bg-surface px-6 pb-6 pt-7 text-center"
      >
        <div
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-full"
          style={{ background: 'var(--gradient-claim)' }}
          aria-hidden
        >
          <Gift className="h-9 w-9 text-claim-text" />
        </div>

        <h2 className="mt-4 text-xl font-bold text-text-primary">{result.title}</h2>
        <p className="mt-2 text-sm leading-6 text-text-secondary">{result.desc}</p>

        <Button size="large" className="mt-6 h-11 w-full rounded-full" onClick={close}>
          {result.closeLabel}
        </Button>
      </PromptOverlay>
    </>
  )
}
