import { UserRoundCheck, X } from 'lucide-react'
import { runtimePolicy } from '../app/config/runtime'
import PromptOverlay from '../components/mobile/PromptOverlay'
import { Button } from '../components/ui'
import { BUDDY_INVITE_COPY } from '../app/fixtures'
import { useFixtureDebug, useFixtureNavigate, useFixtureQueryControls } from '../app/fixtures/useFixture'
import { acceptBuddyInvite } from '../app/state/buddies'
import buddyAvatarXiaomei from '../assets/brand/buddy/buddy-avatar-xiaomei.webp'
import DearseedColumn from './DearseedColumn'

/**
 * 接受搭子邀请（摹客 #36）
 * -------------------------------------------------------------
 * 原型是「诗得丽专栏首页 + 遮罩 + 邀请弹窗」，故把专栏页作为背景层渲染，
 * 与 ClaimSuccess / ExchangeResult 同一套「背景页 + 弹窗」写法。
 * 本页不自挂 DebugPanel：背景层 DearseedColumn 已经挂了一个（bound 到 /dearseed），
 * 两个面板都是 fixed bottom-0，重复挂会完全重叠。dismissed 状态继续支持 fixture 复现，
 * 但 test/prod 外部 `?state=` 不再能直接注入。
 */
export default function BuddyAccept() {
  const fixtureNavigate = useFixtureNavigate()
  const { get, patch } = useFixtureQueryControls()
  const debug = useFixtureDebug()
  const state = get('state')
  // 正式 API 尚无邀请预览/确认合同，禁止「小美」夹具模拟真实绑定成功。
  const fixtureMode = runtimePolicy.dataMode === 'mock'

  if (state === 'dismissed') return <DearseedColumn />

  const dismiss = () => patch({ state: 'dismissed' })
  const accept = () => {
    if (!fixtureMode) return
    acceptBuddyInvite('小美')
    fixtureNavigate('/buddy', { debug: debug ? '1' : null }, { replace: true })
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
        {fixtureMode ? (
          <img src={buddyAvatarXiaomei} alt="" aria-hidden className="mx-auto h-20 w-20 rounded-full object-cover ring-4 ring-buddy-surface" />
        ) : (
          <span aria-hidden className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-buddy-surface text-buddy-accent">
            <UserRoundCheck className="h-9 w-9" />
          </span>
        )}
        <h2 className="mt-4 text-lg font-semibold leading-7 text-text-primary">
          {fixtureMode ? BUDDY_INVITE_COPY.acceptCapsule : '邀请暂不可用'}
        </h2>
        <p className="mt-2 text-sm leading-6 text-text-secondary">
          {fixtureMode ? BUDDY_INVITE_COPY.acceptDesc : '邀请查询与绑定接口尚未接通，请稍后再试。'}
        </p>
        <p className="mt-2 text-xs leading-5 text-text-secondary">成为搭子后，当前版本暂不支持解除关系</p>
        <Button size="large" leadingIcon={UserRoundCheck} disabled={!fixtureMode} className="mt-5 w-full rounded-full" onClick={accept}>
          确认成为搭子
        </Button>
        <Button variant="ghost" className="mt-2 w-full rounded-full" onClick={dismiss}>
          取消
        </Button>
      </PromptOverlay>
    </>
  )
}
