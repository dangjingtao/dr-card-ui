import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, Search, Send, UserRoundPlus } from 'lucide-react'
import DebugPanel from '../components/mobile/DebugPanel'
import PageContainer from '../components/mobile/PageContainer'
import PromptOverlay from '../components/mobile/PromptOverlay'
import { Button } from '../components/ui'
import {
  BUDDY_INVITE_COPY,
  BUDDY_SEARCH_FEEDBACK,
  BUDDY_SEARCH_SAMPLE_PHONES,
  type BuddySearchOutcome,
} from '../app/fixtures'
import { findRouteByPathname } from '../app/router/routes'
import { SEARCH_LATENCY, sendPhoneInvite } from '../app/adapters/buddyShare'
import { markPhoneInvited, resolveBuddyPhoneOutcome } from '../app/state/buddies'
import buddyAvatarXiaomei from '../assets/brand/buddy/buddy-avatar-xiaomei.webp'

const FIXTURE_STATES = new Set<BuddySearchOutcome>(['searching', 'invitable', 'not-found', 'invited'])

function initialPhone(state: BuddySearchOutcome): string {
  if (state === 'invitable' || state === 'not-found' || state === 'invited') {
    return BUDDY_SEARCH_SAMPLE_PHONES[state]
  }
  return ''
}

/** 手机号搜索邀请（摹客 #32 / #33） */
export default function BuddyPhoneInvite() {
  const route = findRouteByPathname('/buddy/invite/phone')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const raw = searchParams.get('state')
  const directState: BuddySearchOutcome = raw && FIXTURE_STATES.has(raw as BuddySearchOutcome)
    ? (raw as BuddySearchOutcome)
    : 'idle'
  const [phone, setPhone] = useState(() => initialPhone(directState))
  const [outcome, setOutcome] = useState<BuddySearchOutcome>(directState)
  const [sending, setSending] = useState(false)
  const searchTimer = useRef<number | null>(null)
  const keepDebug = searchParams.get('debug') === '1' ? '&debug=1' : ''
  const success = raw === 'success'

  useEffect(() => {
    setOutcome(directState)
    setPhone(initialPhone(directState))
  }, [directState])

  useEffect(() => () => {
    if (searchTimer.current != null) window.clearTimeout(searchTimer.current)
  }, [])

  const search = () => {
    const trimmed = phone.trim()
    if (!trimmed) return
    setOutcome('searching')
    if (searchTimer.current != null) window.clearTimeout(searchTimer.current)
    searchTimer.current = window.setTimeout(() => {
      setOutcome(resolveBuddyPhoneOutcome(trimmed))
    }, SEARCH_LATENCY)
  }

  const send = () => {
    const trimmed = phone.trim()
    if (!trimmed || sending) return
    setSending(true)
    void sendPhoneInvite(trimmed).then(() => {
      markPhoneInvited(trimmed)
      navigate(`/buddy/invite/phone?state=success&phone=${encodeURIComponent(trimmed)}${keepDebug}`, { replace: true })
    })
  }

  const closeSuccess = () => navigate(`/buddy${searchParams.get('debug') === '1' ? '?debug=1' : ''}`, { replace: true })

  return (
    <>
      <PageContainer inset={false} className="pb-8">
        <section className="px-4 pt-4" aria-label={BUDDY_INVITE_COPY.phoneTitle}>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              search()
            }}
            className="flex items-center gap-2"
          >
            <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-pill border border-border-subtle bg-surface px-4 shadow-sm">
              <Search className="h-4 w-4 flex-none text-text-tertiary" aria-hidden />
              <input
                type="tel"
                inputMode="tel"
                aria-label="输入手机号搜索搭子"
                placeholder={BUDDY_INVITE_COPY.phonePlaceholder}
                value={phone}
                onChange={(event) => {
                  setPhone(event.target.value)
                  setOutcome('idle')
                }}
                className="min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-tertiary"
              />
            </label>
            <Button type="submit" disabled={!phone.trim() || outcome === 'searching'} className="h-11 flex-none rounded-pill px-5">
              搜索
            </Button>
          </form>

          <h2 className="mt-6 px-1 text-sm font-medium text-buddy-text">{BUDDY_INVITE_COPY.phoneResult}</h2>

          {outcome === 'idle' && (
            <div className="mt-3 rounded-container bg-surface px-4 py-8 text-center shadow-card">
              <UserRoundPlus className="mx-auto h-8 w-8 text-text-tertiary" aria-hidden />
              <p className="mt-2 text-sm text-text-tertiary">输入手机号查找洗头搭子</p>
            </div>
          )}

          {outcome === 'searching' && (
            <div role="status" className="mt-3 flex items-center justify-center gap-2 rounded-container bg-surface px-4 py-8 text-sm text-text-secondary shadow-card">
              <Loader2 className="h-5 w-5 animate-spin text-buddy-accent" aria-hidden />
              正在搜索…
            </div>
          )}

          {outcome === 'invitable' && (
            <article className="mt-3 flex items-center gap-3 rounded-container bg-surface px-4 py-3 shadow-card">
              <img src={buddyAvatarXiaomei} alt="" aria-hidden className="h-12 w-12 rounded-full object-cover" />
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium text-buddy-text">小美</p>
                <p className="mt-0.5 text-xs text-buddy-muted">{phone}</p>
              </div>
              <Button size="regular" leadingIcon={Send} loading={sending} disabled={sending} onClick={send} className="flex-none rounded-pill px-4">
                {BUDDY_INVITE_COPY.phoneSubmit}
              </Button>
            </article>
          )}

          {(outcome === 'not-found' || outcome === 'invited') && (
            <div role="status" className="mt-3 rounded-container bg-surface px-4 py-6 text-center shadow-card">
              <p className="text-sm leading-6 text-text-secondary">{BUDDY_SEARCH_FEEDBACK[outcome]}</p>
            </div>
          )}
        </section>

        <DebugPanel route={route} />
      </PageContainer>

      <PromptOverlay
        open={success}
        label={BUDDY_INVITE_COPY.phoneSuccessCapsule}
        onDismiss={closeSuccess}
        className="border border-border-subtle bg-surface px-6 pb-6 pt-7 text-center shadow-modal"
      >
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-bg text-success-text">
          <Send className="h-7 w-7" aria-hidden />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-text-primary">{BUDDY_INVITE_COPY.phoneSuccessCapsule}</h2>
        <p className="mt-2 text-sm leading-6 text-text-secondary">{BUDDY_INVITE_COPY.phoneSuccessDesc}</p>
        <Button size="large" className="mt-5 w-full rounded-full" onClick={closeSuccess}>
          {BUDDY_INVITE_COPY.phoneSuccessAction}
        </Button>
      </PromptOverlay>
    </>
  )
}
