import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CalendarCheck, Gift, QrCode, Smartphone, Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import PageContainer from '../components/mobile/PageContainer'
import DebugPanel from '../components/mobile/DebugPanel'
import { Button, EmptyState } from '../components/ui'
import { findRouteByPathname } from '../app/router/routes'
import { useFixtureState } from '../app/fixtures/useFixture'
import { BUDDY_EMPTY_COPY, BUDDY_FEATURE_INTRO, BUDDY_INVITE_ENTRIES } from '../app/fixtures'
import { applyBuddyPreset, useBuddies, type BuddyListPreset } from '../app/state/buddies'
import buddyEmptyHero from '../assets/brand/buddy/buddy-empty-hero-v2.webp'
import buddyAvatarXiaomei from '../assets/brand/buddy/buddy-avatar-xiaomei.webp'

/**
 * 洗头搭子（摹客 #27 空态 / #28 有态）
 * -------------------------------------------------------------
 * - 空态与有态共用同一业务模型（搭子集合 + 说明卡 + 两个邀请入口），只在列表区切换视觉；
 * - ⚠️ 说明卡第三行「默契升级」是 #27/#28 的原型文案，此处只渲染文字，
 *   不提供任何默契值入口、数值或进度视觉（#31 先不做，B-006 / T014）；
 * - ⚠️ 不引入历史 T07 稿的 4 人 mock 与 98/86/72/55 默契值。
 */

/** `?state=` → 共享状态档位；URL 有 state 时以 URL 为准，否则沿用共享状态（供 #36 接受邀请后回看） */
const STATE_PRESETS: Record<string, BuddyListPreset> = {
  empty: 'empty',
  list: 'single',
  multi: 'multi',
}

const FEATURE_ICONS: Record<string, LucideIcon> = {
  checkin: CalendarCheck,
  welfare: Gift,
  mutual: Sparkles,
}

const ENTRY_ICONS: Record<string, LucideIcon> = {
  qrcode: QrCode,
  phone: Smartphone,
}

export default function Buddy() {
  const route = findRouteByPathname('/buddy')
  const { raw } = useFixtureState(route)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { items, count } = useBuddies()

  /** 夹具档位只在 URL 声明时生效，保证 `?state=` 可直达可复现 */
  useEffect(() => {
    const preset = raw == null ? undefined : STATE_PRESETS[raw]
    if (!preset) return
    applyBuddyPreset(preset)
  }, [raw])

  const keepDebug = searchParams.get('debug') === '1' ? '?debug=1' : ''

  return (
    <PageContainer inset={false} className="flex min-h-full flex-col pb-6">
      {count === 0 ? (
        <EmptyState
          className="flex-1 pt-10"
          visual={
            <div
              className="relative flex h-[196px] w-[244px] items-center justify-center"
              data-buddy-illustration="empty-hero"
            >
              <span
                className="absolute inset-x-5 bottom-3 h-24 rounded-[50%] bg-buddy-surface opacity-70 blur-2xl"
                aria-hidden
              />
              <img
                src={buddyEmptyHero}
                alt="两位卡博士白熊搭子一起洗护头发"
                className="relative h-[196px] w-[220px] object-contain"
              />
            </div>
          }
          title={<span className="text-base font-medium text-buddy-text">{BUDDY_EMPTY_COPY.title}</span>}
          supportingText={
            <span className="text-[13px] leading-5 text-buddy-muted">{BUDDY_EMPTY_COPY.desc}</span>
          }
        />
      ) : (
        <section className="px-4 pt-3" aria-label="我的洗头搭子">
          <ul className="space-y-2.5">
            {items.map((buddy) => (
              <li key={buddy.id}>
                <article className="flex items-center gap-3 rounded-container bg-surface px-3.5 py-3 shadow-card">
                  <img
                    src={buddyAvatarXiaomei}
                    alt=""
                    aria-hidden
                    className="h-12 w-12 flex-none rounded-full object-cover"
                  />
                  <p className="min-w-0 flex-1 truncate text-[15px] font-medium text-buddy-text">
                    {buddy.name}
                  </p>
                  {/* ⚠️ 原型 #28 每行只有头像 + 昵称；默契值/等级/徽标均为历史稿补写，不在此渲染 */}
                </article>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-4 px-4" aria-label={BUDDY_FEATURE_INTRO.title}>
        <p className="px-1 text-sm font-medium text-buddy-text">{BUDDY_FEATURE_INTRO.title}</p>
        <ul className="mt-2 overflow-hidden rounded-container bg-surface shadow-card">
          {BUDDY_FEATURE_INTRO.items.map((item, index) => {
            const Icon = FEATURE_ICONS[item.key] ?? Sparkles
            return (
              <li
                key={item.key}
                className={`flex items-center gap-3 px-4 py-3.5 ${index > 0 ? 'border-t border-border-subtle' : ''}`}
              >
                <span
                  className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-buddy-surface text-buddy-accent"
                  aria-hidden
                >
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-buddy-text">{item.title}</span>
                  <span className="mt-0.5 block text-xs leading-[18px] text-buddy-muted">{item.desc}</span>
                </span>
              </li>
            )
          })}
        </ul>
      </section>

      <div className="sticky bottom-0 mt-auto flex gap-3 bg-background px-4 pb-[env(safe-area-inset-bottom)] pt-4">
        {BUDDY_INVITE_ENTRIES.map((entry, index) => (
          <Button
            key={entry.key}
            size="large"
            variant={index === 0 ? 'primary' : 'outline'}
            leadingIcon={ENTRY_ICONS[entry.key]}
            className="flex-1 rounded-pill"
            onClick={() => navigate(`${entry.to}${keepDebug}`)}
          >
            {entry.label}
          </Button>
        ))}
      </div>

      <DebugPanel route={route} />
    </PageContainer>
  )
}
