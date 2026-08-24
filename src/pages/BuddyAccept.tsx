import { UserRoundCheck, X } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PromptOverlay from '../components/mobile/PromptOverlay'
import { Button } from '../components/ui'
import { BUDDY_INVITE_COPY } from '../app/fixtures'
import { acceptBuddyInvite } from '../app/state/buddies'
import buddyAvatarXiaomei from '../assets/brand/buddy/buddy-avatar-xiaomei.webp'
import DearseedColumn from './DearseedColumn'

/**
 * 接受搭子邀请（摹客 #36）
 * -------------------------------------------------------------
 * 原型是「诗得丽专栏首页 + 遮罩 + 邀请弹窗」，故把专栏页作为背景层渲染，
 * 与 ClaimSuccess / ExchangeResult 同一套「背景页 + 弹窗」写法。
 * 本页不自挂 DebugPanel：背景层 DearseedColumn 已经挂了一个（bound 到 /dearseed），
 * 两个面板都是 fixed bottom-0，重复挂会完全重叠。因此 `?state=dismissed`
 * （关闭图标的取消路径）以 URL 直达复现，不依赖调试面板切换。
 */
export default function BuddyAccept() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const state = searchParams.get('state')
  const debug = searchParams.get('debug') === '1' ? '?debug=1' : ''

  if (state === 'dismissed') return <DearseedColumn />

  const dismiss = () => navigate(`/buddy/accept?state=dismissed${debug ? '&debug=1' : ''}`, { replace: true })
  const accept = () => {
    acceptBuddyInvite('小美')
    navigate(`/buddy${debug}`, { replace: true })
  }

  return (
    <>
      <DearseedColumn />
      <PromptOverlay
        open
        label="接受洗头搭子邀请"
        onDismiss={dismiss}
        className="border border-border-subtle bg-surface px-6 pb-6 pt-6 text-center shadow-modal"
      >
        <button
          type="button"
          aria-label="关闭搭子邀请"
          onClick={dismiss}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-text-tertiary active:bg-surface-subtle"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
        <img src={buddyAvatarXiaomei} alt="" aria-hidden className="mx-auto h-20 w-20 rounded-full object-cover ring-4 ring-buddy-surface" />
        <h2 className="mt-4 text-lg font-semibold leading-7 text-text-primary">{BUDDY_INVITE_COPY.acceptCapsule}</h2>
        <p className="mt-2 text-sm leading-6 text-text-secondary">{BUDDY_INVITE_COPY.acceptDesc}</p>
        <Button size="large" leadingIcon={UserRoundCheck} className="mt-5 w-full rounded-full" onClick={accept}>
          {BUDDY_INVITE_COPY.acceptAction}
        </Button>
      </PromptOverlay>
    </>
  )
}
