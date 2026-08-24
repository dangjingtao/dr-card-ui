import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Download, Link2, Loader2 } from 'lucide-react'
import PageContainer from '../components/mobile/PageContainer'
import WecomQrPlaceholder from '../components/mobile/WecomQrPlaceholder'
import { BUDDY_INVITE_COPY } from '../app/fixtures'
import { copyInviteLink, saveInvitePoster } from '../app/adapters/buddyShare'
import buddyAvatarSelf from '../assets/brand/buddy/buddy-avatar-self.webp'

/**
 * 邀请搭子（摹客 #29）
 * -------------------------------------------------------------
 * 事实源：docs/prototype/03-partner-and-invite.md §3
 * 已确认内容：用户头像 + 邀请话术胶囊、邀请二维码、「请截图保存」、
 * 「更多分享方式」下的「保存到本地」「复制链接」两个入口。
 *
 * ⚠️ 历史稿 T06 的 200×200 QR 卡片、金色高亮话术与北极熊剪影属二次视觉设计，未采用（见文档 §3 警示）。
 * ⚠️ 二维码为占位图形，不伪造可扫码内容（B-005 / BUDDY_RULE_STATUS.shareCapability）。
 * 分享结果统一由 app/adapters/buddyShare 返回，本页不直接触碰相册与剪贴板；
 * 成功反馈落到 /buddy/invite/qrcode 的 #34 / #35 两个状态（D-056：失败态只由 `?state=` 复现）。
 *
 * 本路由在 routes.ts 未登记 states，因此不渲染 DebugPanel（D-064）。
 */
type SharePending = 'poster' | 'link' | null

export default function BuddyInvite() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [pending, setPending] = useState<SharePending>(null)
  const alive = useRef(true)

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  const keepDebug = searchParams.get('debug') === '1' ? '&debug=1' : ''

  /** 走适配层拿反馈，再用 `?state=` 落到对应结果节点，保证结果页可被 URL 直达复现 */
  const share = (kind: Exclude<SharePending, null>) => {
    if (pending) return
    setPending(kind)
    const task = kind === 'poster' ? saveInvitePoster() : copyInviteLink()
    void task.then((feedback) => {
      if (!alive.current) return
      setPending(null)
      const state = feedback.outcome === 'poster-saved' ? 'saved' : 'link-copied'
      navigate(`/buddy/invite/qrcode?state=${state}${keepDebug}`)
    })
  }

  return (
    <PageContainer inset={false} className="flex min-h-full flex-col pb-8">
      {/* #29 邀请卡：头像 + 话术胶囊 + 二维码 + 截图提示 */}
      <section className="px-4 pt-4" aria-label="邀请二维码">
        <div className="flex flex-col items-center rounded-container bg-surface px-5 pb-6 pt-6 shadow-card">
          <img
            src={buddyAvatarSelf}
            alt=""
            aria-hidden
            className="h-14 w-14 rounded-full object-cover ring-2 ring-buddy-surface"
          />
          <p className="mt-3 rounded-pill bg-buddy-surface px-4 py-1.5 text-sm font-medium text-buddy-accent">
            {BUDDY_INVITE_COPY.capsule}
          </p>
          <WecomQrPlaceholder
            className="mt-5"
            label="搭子邀请二维码占位"
            caption={null}
            cell={16}
          />
          <p className="mt-4 text-[13px] text-buddy-muted">{BUDDY_INVITE_COPY.qrHint}</p>
        </div>
      </section>

      {/* #29 更多分享方式：两个入口都走适配层，成功后跳到 #34 / #35 */}
      <section className="mt-5 px-4" aria-label={BUDDY_INVITE_COPY.moreShare}>
        <p className="px-1 text-sm font-medium text-buddy-text">{BUDDY_INVITE_COPY.moreShare}</p>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => share('poster')}
            disabled={pending !== null}
            className="flex flex-col items-center gap-2 rounded-container bg-surface py-4 shadow-card active:bg-surface-subtle disabled:opacity-60"
          >
            <span
              className="flex h-11 w-11 items-center justify-center rounded-full bg-buddy-surface text-buddy-accent"
              aria-hidden
            >
              {pending === 'poster' ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Download className="h-5 w-5" />
              )}
            </span>
            <span className="text-[13px] text-buddy-text">{BUDDY_INVITE_COPY.saveLocal}</span>
          </button>

          <button
            type="button"
            onClick={() => share('link')}
            disabled={pending !== null}
            className="flex flex-col items-center gap-2 rounded-container bg-surface py-4 shadow-card active:bg-surface-subtle disabled:opacity-60"
          >
            <span
              className="flex h-11 w-11 items-center justify-center rounded-full bg-buddy-surface text-buddy-accent"
              aria-hidden
            >
              {pending === 'link' ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Link2 className="h-5 w-5" />
              )}
            </span>
            <span className="text-[13px] text-buddy-text">{BUDDY_INVITE_COPY.copyLink}</span>
          </button>
        </div>
        {pending !== null && (
          <p role="status" aria-live="polite" className="mt-3 text-center text-xs text-buddy-muted">
            处理中…
          </p>
        )}
      </section>
    </PageContainer>
  )
}
