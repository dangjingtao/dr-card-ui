import { useEffect, useRef, useState } from 'react'
import { Download, Loader2, RefreshCw } from 'lucide-react'
import PageContainer from '../components/mobile/PageContainer'
import { BUDDY_INVITE_COPY } from '../app/fixtures'
import { useFixtureDebug, useFixtureNavigate } from '../app/fixtures/useFixture'
import { saveInvitePoster } from '../app/adapters/buddyShare'
import { loadOwnBuddyQr } from '../services/buddyQr'
import { createBuddyPoster, renderBuddyQrPng } from '../lib/buddyQrPoster'
import buddyAvatarSelf from '../assets/brand/buddy/buddy-avatar-self.webp'

type QrState =
  | { status: 'loading' }
  | { status: 'ready'; dataUrl: string; demo: boolean }
  | { status: 'failed'; message: string }

export default function BuddyInvite() {
  const fixtureNavigate = useFixtureNavigate()
  const debug = useFixtureDebug()
  const [qr, setQr] = useState<QrState>({ status: 'loading' })
  const [retryKey, setRetryKey] = useState(0)
  const [pending, setPending] = useState(false)
  const alive = useRef(true)

  useEffect(() => {
    alive.current = true
    let active = true
    const load = async () => {
      setQr({ status: 'loading' })
      try {
        const source = await loadOwnBuddyQr()
        const dataUrl = await renderBuddyQrPng(source.url)
        if (active) setQr({ status: 'ready', dataUrl, demo: source.demo })
      } catch (error) {
        if (active) {
          setQr({
            status: 'failed',
            message: error instanceof Error ? error.message : '获取二维码失败，请稍后重试',
          })
        }
      }
    }
    void load()
    return () => { active = false; alive.current = false }
  }, [retryKey])

  const sharePoster = async () => {
    if (pending || qr.status !== 'ready') return
    setPending(true)
    let outcome: 'saved' | 'poster-failed' = 'poster-failed'
    try {
      // 先从已展示的同一 PNG QR 生成可导出海报，再交给现有 Native 保存接口。
      const payload = await createBuddyPoster(qr.dataUrl, { demo: qr.demo })
      const result = await saveInvitePoster(payload)
      if (result.outcome === 'poster-saved' && result.ok) outcome = 'saved'
    } catch {
      // canvas / 图片读取 / 相册权限失败都不能伪装保存成功。
    } finally {
      if (alive.current) {
        setPending(false)
        fixtureNavigate('/buddy/invite/qrcode', {
          state: outcome,
          debug: debug ? '1' : null,
        })
      }
    }
  }

  return (
    <PageContainer inset={false} className="flex min-h-full flex-col pb-8">
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

          {qr.status === 'ready' ? (
            <img
              className="mt-5 h-[220px] w-[220px] bg-white p-1"
              src={qr.dataUrl}
              alt={qr.demo ? '洗头搭子演示二维码，不可建立真实关系' : '我的洗头搭子专属邀请二维码'}
              width={220}
              height={220}
            />
          ) : (
            <div
              className="mt-5 flex h-[220px] w-[220px] items-center justify-center rounded-container bg-surface-subtle px-5 text-center"
              role="status"
            >
              {qr.status === 'loading' ? (
                <Loader2 className="h-7 w-7 animate-spin text-buddy-accent" aria-label="正在生成二维码" />
              ) : (
                <span className="text-sm leading-6 text-buddy-muted">{qr.message}</span>
              )}
            </div>
          )}

          <p className="mt-4 text-[13px] text-buddy-muted">{BUDDY_INVITE_COPY.qrHint}</p>
          {qr.status === 'ready' && qr.demo && (
            <p role="status" className="mt-2 text-center text-xs text-buddy-muted">
              演示二维码，仅用于预览，不能建立真实关系
            </p>
          )}
          {qr.status === 'failed' && (
            <button
              type="button"
              className="mt-3 inline-flex items-center gap-1 text-sm text-buddy-accent"
              onClick={() => setRetryKey((key) => key + 1)}
            >
              <RefreshCw className="h-4 w-4" aria-hidden />重试获取
            </button>
          )}
        </div>
      </section>

      <section className="mt-5 px-4" aria-label="保存邀请海报">
        <button
          type="button"
          onClick={() => void sharePoster()}
          disabled={pending || qr.status !== 'ready'}
          className="mt-2 flex w-full flex-col items-center gap-2 rounded-container bg-surface py-4 shadow-card active:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span
            className="flex h-11 w-11 items-center justify-center rounded-full bg-buddy-surface text-buddy-accent"
            aria-hidden
          >
            {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
          </span>
          <span className="text-[13px] text-buddy-text">{BUDDY_INVITE_COPY.saveLocal}</span>
        </button>
        {pending && (
          <p role="status" aria-live="polite" className="mt-3 text-center text-xs text-buddy-muted">
            正在生成并保存海报…
          </p>
        )}
      </section>
    </PageContainer>
  )
}
