import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import DebugPanel from '../components/mobile/DebugPanel'
import PromptOverlay from '../components/mobile/PromptOverlay'
import { Button } from '../components/ui'
import {
  BUDDY_INVITE_COPY,
  BUDDY_SHARE_FEEDBACK,
  type BuddyShareOutcome,
} from '../app/fixtures'
import { useFixtureDebug, useFixtureQueryControls, withFixtureQuery } from '../app/fixtures/useFixture'
import { findRouteByPathname } from '../app/router/routes'
import { runtimePolicy } from '../app/config/runtime'
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
 * 保存成功后展示刚生成并保存的真实海报（仅内存路由 state），
 * 没有海报数据的历史 fixture 状态保留图标，不伪造成功保存的图片。
 * 复制链接是已退役的历史原型状态，正式用户流程不可达。
 */
export default function BuddyShareResult() {
  const navigate = useNavigate()
  const location = useLocation()
  const route = findRouteByPathname('/buddy/invite/qrcode')
  const { get } = useFixtureQueryControls()
  const debug = useFixtureDebug()
  // API/test/prod 直接进入结果路由不能默认展示夹具的「保存成功」。
  const outcome = STATE_OUTCOME[get('state') ?? ''] ??
    (runtimePolicy.dataMode === 'mock' ? 'poster-saved' : 'poster-failed')
  const feedback = BUDDY_SHARE_FEEDBACK[outcome]
  const isLink = outcome.startsWith('link-')
  // In-app navigation carries the exact saved PNG. This stays out of query strings, fixtures and URLs.
  const value = (location.state as { buddyPosterPreview?: unknown } | null)?.buddyPosterPreview
  const savedPosterSrc = outcome === 'poster-saved' && typeof value === 'string' &&
    /^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(value) ? value : null
  const back = () => navigate(withFixtureQuery('/buddy/invite', { debug: debug ? '1' : null }), { replace: true })

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
              {savedPosterSrc ? (
                <img
                  src={savedPosterSrc}
                  alt="刚保存的洗头搭子邀请海报"
                  className="mx-auto max-h-[min(50dvh,400px)] w-auto max-w-full rounded-lg object-contain shadow-card"
                />
              ) : (
                <span aria-hidden className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success-bg text-success-text">
                  <CheckCircle2 className="h-10 w-10" />
                </span>
              )}
              <p className="mt-4 text-sm leading-6 text-text-secondary">{feedback.text}</p>
              {savedPosterSrc && (
                <p className="mt-1 text-xs text-text-tertiary">{BUDDY_INVITE_COPY.qrScanHint}</p>
              )}
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

      <DebugPanel route={route} />
    </>
  )
}
