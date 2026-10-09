import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Loader2, Send, UserRoundPlus, UserRoundCheck } from 'lucide-react'
import DebugPanel from '../components/mobile/DebugPanel'
import PageContainer from '../components/mobile/PageContainer'
import PromptOverlay from '../components/mobile/PromptOverlay'
import { Button, Dialog, SearchField } from '../components/ui'
import { BUDDY_INVITE_COPY, BUDDY_SEARCH_SAMPLE_PHONES } from '../app/fixtures'
import { useFixtureQueryControls } from '../app/fixtures/useFixture'
import { findRouteByPathname } from '../app/router/routes'
import { isCompleteBuddyPhone, type BuddyPhoneSearchOutcome, type BuddyPhoneUser } from '../services/buddyPhone'
import {
  acceptBuddyPhoneInvitation,
  buddyPhoneContractReady,
  searchBuddyByPhone,
  sendBuddyPhoneInvite,
} from '../services/buddyPhoneGateway'

const INITIAL_STATE_KEYS = new Set(['searching', 'invitable', 'not-found', 'invited'])
const SEARCH_ERROR = '搜索失败，请稍后重试'
const CURRENT_VERSION_WARNING = '成为搭子后，当前版本暂不支持解除关系'

export default function BuddyPhoneInvite() {
  const route = findRouteByPathname('/buddy/invite/phone')
  const { get } = useFixtureQueryControls()
  const routeState = get('state')
  const demoState = routeState && INITIAL_STATE_KEYS.has(routeState)
    ? routeState as BuddyPhoneSearchOutcome
    : 'idle'
  const [phone, setPhone] = useState(() => demoState in BUDDY_SEARCH_SAMPLE_PHONES
    ? BUDDY_SEARCH_SAMPLE_PHONES[demoState as keyof typeof BUDDY_SEARCH_SAMPLE_PHONES]
    : '')
  const [outcome, setOutcome] = useState<BuddyPhoneSearchOutcome | 'idle' | 'searching'>(demoState)
  const [user, setUser] = useState<BuddyPhoneUser | null>(demoState === 'invitable' || demoState === 'invited'
    ? { id: 'mock-prototype', nickname: '演示搭子', avatarUrl: null } : null)
  const [invitationId, setInvitationId] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [success, setSuccess] = useState(buddyPhoneContractReady && routeState === 'success')
  const [statusText, setStatusText] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const searchSeq = useRef(0)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false; searchSeq.current++ }
  }, [])

  // DebugPanel updates ?state= on the same mounted route. Reconcile all derived
  // prototype UI rather than retaining stale search results or a success overlay.
  useEffect(() => {
    searchSeq.current++
    setPhone(demoState in BUDDY_SEARCH_SAMPLE_PHONES
      ? BUDDY_SEARCH_SAMPLE_PHONES[demoState as keyof typeof BUDDY_SEARCH_SAMPLE_PHONES]
      : '')
    setOutcome(demoState)
    setUser(demoState === 'invitable' || demoState === 'invited'
      ? { id: 'mock-prototype', nickname: '演示搭子', avatarUrl: null }
      : null)
    setInvitationId(null)
    setPending(false)
    setConfirmOpen(false)
    setSuccess(buddyPhoneContractReady && routeState === 'success')
    setStatusText(null)
    setError(null)
  }, [routeState, demoState])

  const resetSearch = (next: string) => {
    searchSeq.current++
    setPhone(next)
    setOutcome('idle')
    setUser(null)
    setInvitationId(null)
    setError(null)
    setStatusText(null)
    setConfirmOpen(false)
  }

  const search = async () => {
    if (!buddyPhoneContractReady || !isCompleteBuddyPhone(phone)) {
      setError(buddyPhoneContractReady ? '请输入完整且正确的手机号' : '搭子邀请接口尚未接通')
      return
    }
    const seq = ++searchSeq.current
    setOutcome('searching')
    setError(null)
    setStatusText(null)
    try {
      const found = await searchBuddyByPhone(phone.trim())
      if (!mounted.current || seq !== searchSeq.current) return
      setUser(found.user ?? null)
      setOutcome(found.outcome)
      setInvitationId(found.invitationId ?? null)
    } catch {
      if (!mounted.current || seq !== searchSeq.current) return
      setOutcome('idle')
      setUser(null)
      setError(SEARCH_ERROR)
    }
  }

  const send = async () => {
    if (pending || !isCompleteBuddyPhone(phone) || outcome !== 'invitable') return
    const seq = searchSeq.current
    setPending(true)
    setError(null)
    try {
      await sendBuddyPhoneInvite(phone.trim())
      if (!mounted.current || seq !== searchSeq.current) return
      setOutcome('invited')
      setSuccess(true)
    } catch {
      if (mounted.current) setError('发送邀请失败，请稍后重试')
    } finally {
      if (mounted.current) setPending(false)
    }
  }

  const confirm = async () => {
    if (!invitationId || pending || outcome !== 'incoming-pending') return
    const seq = searchSeq.current
    setPending(true)
    setError(null)
    try {
      await acceptBuddyPhoneInvitation(invitationId)
      if (!mounted.current || seq !== searchSeq.current) return
      setOutcome('already-buddies')
      setConfirmOpen(false)
      // Mock response verifies UI state only; it is not a durable backend relation.
      setStatusText('演示确认已完成；真实搭子关系仍待后台接入')
    } catch {
      if (mounted.current) setError('确认失败，请稍后重试')
    } finally {
      if (mounted.current) setPending(false)
    }
  }

  const canSearch = isCompleteBuddyPhone(phone) && !pending && outcome !== 'searching' && buddyPhoneContractReady
  const showUser = user && ['invitable', 'invited', 'incoming-pending', 'already-buddies', 'self'].includes(outcome)
  return (
    <>
      <PageContainer inset={false} className="pb-8">
        <section className="px-4 pt-4" aria-label={BUDDY_INVITE_COPY.phoneTitle}>
          <form onSubmit={(event) => { event.preventDefault(); void search() }} className="flex items-center gap-2">
            <SearchField
              type="tel" inputMode="tel" aria-label="输入完整手机号搜索搭子"
              placeholder="请输入完整手机号" value={phone} variant="pill"
              inputClassName="placeholder:text-text-tertiary" loading={outcome === 'searching'}
              onChange={(event) => resetSearch(event.target.value)}
              onClear={() => resetSearch('')}
              className="min-w-0 flex-1 px-4"
            />
            <Button type="submit" disabled={!canSearch} className="h-11 flex-none rounded-pill px-5">搜索</Button>
          </form>
          {!buddyPhoneContractReady && (
            <p role="status" className="mt-3 rounded-container bg-surface px-3 py-3 text-center text-sm text-text-secondary">
              搭子搜索与邀请接口待后台接入，目前不可使用
            </p>
          )}
          {buddyPhoneContractReady && (
            <p className="mt-2 text-xs text-buddy-muted">演示数据，仅用于交互验收，不会向真实账号发送邀请</p>
          )}
          <h2 className="mt-6 px-1 text-sm font-medium text-buddy-text">{BUDDY_INVITE_COPY.phoneResult}</h2>
          {outcome === 'idle' && !error && (
            <div className="mt-3 rounded-container bg-surface px-4 py-8 text-center shadow-card">
              <UserRoundPlus className="mx-auto h-8 w-8 text-text-tertiary" aria-hidden />
              <p className="mt-2 text-sm text-text-tertiary">输入完整手机号查找洗头搭子</p>
            </div>
          )}
          {outcome === 'searching' && (
            <div role="status" className="mt-3 flex items-center justify-center gap-2 rounded-container bg-surface px-4 py-8 text-sm text-text-secondary shadow-card">
              <Loader2 className="h-5 w-5 animate-spin text-buddy-accent" aria-hidden />正在搜索…
            </div>
          )}
          {showUser && (
            <article className="mt-3 flex items-center gap-3 rounded-container bg-surface px-4 py-3 shadow-card">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" aria-hidden className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <span aria-hidden className="flex h-12 w-12 items-center justify-center rounded-full bg-buddy-surface text-buddy-accent">
                  <UserRoundPlus className="h-6 w-6" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium text-buddy-text">{user.nickname}</p>
                <p className="mt-1 text-xs text-buddy-muted">
                  {outcome === 'invitable' ? '可发送邀请'
                    : outcome === 'invited' ? '已发送邀请，等待对方确认'
                      : outcome === 'incoming-pending' ? '对方已邀请你，等待你确认'
                        : outcome === 'self' ? '不能邀请自己' : '已经是洗头搭子'}
                </p>
              </div>
              {outcome === 'invitable' && (
                <Button size="regular" leadingIcon={Send} loading={pending} disabled={pending} onClick={() => void send()} className="flex-none rounded-pill px-4">
                  发送邀请
                </Button>
              )}
              {outcome === 'incoming-pending' && (
                <Button size="regular" leadingIcon={UserRoundCheck} disabled={pending} onClick={() => setConfirmOpen(true)} className="flex-none rounded-pill px-3">
                  确认成为搭子
                </Button>
              )}
            </article>
          )}
          {outcome === 'not-found' && (
            <p role="status" className="mt-3 rounded-container bg-surface p-5 text-center text-sm text-text-secondary">没有找到已注册用户，请核对完整手机号</p>
          )}
          {statusText && <p role="status" className="mt-3 text-sm text-buddy-accent">{statusText}</p>}
          {error && <p role="alert" className="mt-3 text-sm text-danger-text">{error}</p>}
        </section>
        <DebugPanel route={route} />
      </PageContainer>

      <Dialog open={confirmOpen} title="确认成为洗头搭子？" onClose={() => { if (!pending) setConfirmOpen(false) }}
        actions={
          <>
            <Button variant="outline" disabled={pending} onClick={() => setConfirmOpen(false)}>取消</Button>
            <Button loading={pending} disabled={pending} onClick={() => void confirm()}>确认成为搭子</Button>
          </>
        }>
        {user?.nickname} 已邀请你成为洗头搭子。{CURRENT_VERSION_WARNING}。取消不会拒绝邀请。
      </Dialog>

      <PromptOverlay
        open={success} label={BUDDY_INVITE_COPY.phoneSuccessCapsule}
        onDismiss={() => setSuccess(false)}
        className="border border-border-subtle bg-surface px-6 pb-6 pt-7 text-center shadow-modal"
      >
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-bg text-success-text">
          <CheckCircle2 className="h-7 w-7" aria-hidden />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-text-primary">{BUDDY_INVITE_COPY.phoneSuccessCapsule}</h2>
        <p className="mt-2 text-sm leading-6 text-text-secondary">{BUDDY_INVITE_COPY.phoneSuccessDesc}</p>
        <p className="mt-2 text-xs text-text-tertiary">演示状态：未发送到真实用户通知中心</p>
        <Button size="large" className="mt-5 w-full rounded-full" onClick={() => setSuccess(false)}>
          {BUDDY_INVITE_COPY.phoneSuccessAction}
        </Button>
      </PromptOverlay>
    </>
  )
}
