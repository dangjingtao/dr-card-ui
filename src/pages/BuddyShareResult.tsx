import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import DebugPanel from '../components/mobile/DebugPanel'
import PromptOverlay from '../components/mobile/PromptOverlay'
import WecomQrPlaceholder from '../components/mobile/WecomQrPlaceholder'
import { Button } from '../components/ui'
import {
  BUDDY_INVITE_COPY,
  BUDDY_SHARE_FEEDBACK,
  type BuddyShareOutcome,
} from '../app/fixtures'
import { findRouteByPathname } from '../app/router/routes'
import BuddyInvite from './BuddyInvite'

/** routes.ts 登记的状态键 → 分享结果；`saved` 是 #34 成功态在路由上的键名 */
const STATE_OUTCOME: Record<string, BuddyShareOutcome> = {
  saved: 'poster-saved',
  'poster-saved': 'poster-saved',
  'poster-failed': 'poster-failed',
  'link-copied': 'link-copied',
  'link-failed': 'link-failed',
}

/**
 * 搭子分享结果（摹客 #34 / #35）
 * 保存海报用居中反馈卡，复制链接用页内轻提示；
 * 失败态只由 `?state=` 驱动，不伪造端能力成功/失败。
 */
export default function BuddyShareResult() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const route = findRouteByPathname('/buddy/invite/qrcode')
  const outcome = STATE_OUTCOME[searchParams.get('state') ?? ''] ?? 'poster-saved'
  const feedback = BUDDY_SHARE_FEEDBACK[outcome]
  const isLink = outcome.startsWith('link-')
  const keepDebug = searchParams.get('debug') === '1' ? '?debug=1' : ''
  const back = () => navigate(`/buddy/invite${keepDebug}`, { replace: true })

  return (
    <>
      <BuddyInvite />

      {isLink ? (
        <div
          role={feedback.ok ? 'status' : 'alert'}
          aria-live="polite"
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+24px)] left-1/2 z-50 flex w-[calc(100%-32px)] max-w-[343px] -translate-x-1/2 items-center gap-3 rounded-container border border-border-subtle bg-surface px-4 py-3 shadow-modal"
        >
          {feedback.ok ? (
            <CheckCircle2 className="h-5 w-5 flex-none text-success-text" aria-hidden />
          ) : (
            <AlertCircle className="h-5 w-5 flex-none text-danger" aria-hidden />
          )}
          <p className="min-w-0 flex-1 text-sm leading-5 text-text-primary">{feedback.text}</p>
          <button type="button" onClick={back} className="flex-none text-xs font-medium text-buddy-accent">
            知道了
          </button>
        </div>
      ) : (
        <PromptOverlay
          open
          label={feedback.ok ? '二维码保存成功' : '二维码保存失败'}
          onDismiss={back}
          className="border border-border-subtle bg-surface px-6 pb-6 pt-6 text-center shadow-modal"
        >
          {feedback.ok ? (
            <>
              <WecomQrPlaceholder
                className="mx-auto w-fit"
                label="已生成的搭子邀请二维码占位"
                caption={BUDDY_INVITE_COPY.qrScanHint}
                cell={12}
              />
              <p className="mt-4 text-sm leading-6 text-text-secondary">{feedback.text}</p>
            </>
          ) : (
            <>
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-danger-bg text-danger-text">
                <AlertCircle className="h-8 w-8" aria-hidden />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-text-primary">保存失败</h2>
              <p className="mt-2 text-sm leading-6 text-text-secondary">{feedback.text}</p>
            </>
          )}
          <Button size="large" className="mt-5 w-full rounded-full" onClick={back}>
            {BUDDY_INVITE_COPY.posterAction}
          </Button>
        </PromptOverlay>
      )}

      {/* 4 个结果状态都要能被验收面板直接切到（D-021 面板只在 ?debug=1 下出现） */}
      <DebugPanel route={route} />
    </>
  )
}
