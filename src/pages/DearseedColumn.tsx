import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, ChevronRight, Crown, Droplets, ShoppingBag, Sparkles, X } from 'lucide-react'
import AppPromptDialog from '../components/mobile/AppPromptDialog'
import DebugPanel from '../components/mobile/DebugPanel'
import FixtureOverlay from '../components/mobile/FixtureOverlay'
import NewcomerDialog from '../components/mobile/NewcomerDialog'
import PageContainer from '../components/mobile/PageContainer'
import PromptOverlay from '../components/mobile/PromptOverlay'
import { Button, ProgressIndicator } from '../components/ui'
import { findRouteByPathname } from '../app/router/routes'
import { useFixtureState, useOverlay } from '../app/fixtures/useFixture'
import {
  APP_GUIDE_FIXTURE,
  BUBBLE_BALANCE,
  CAMPAIGN_FIXTURE,
  CHECKIN_REMINDER,
  DEARSEED_PICKS,
  MEMBER_PROFILE,
  NEWCOMER_FIXTURE,
} from '../app/fixtures'
import columnBanner from '../assets/brand/home/home-banner-carousel.webp'
import avatar from '../assets/brand/home/home-avatar.webp'
import campaignThumb from '../assets/brand/member/checkin-dearseed-kit.webp'
import pickShampooA from '../assets/brand/exchange/exchange-pick-shampoo-a.webp'
import pickShampooB from '../assets/brand/exchange/exchange-pick-shampoo-b.webp'

const pickAssets = {
  'pick-a': pickShampooA,
  'pick-b': pickShampooB,
} as const

const columnEntries = [
  { label: '品牌文化', icon: Sparkles, to: '/brand-culture' },
  { label: '会员空间', icon: Crown, to: '/mall' },
  { label: '洗护兑换', icon: ShoppingBag, to: '/exchange' },
]

/**
 * 诗得丽品牌专栏（摹客顶级页面 mRzKbV3B_ / 主画板 6CDuUGxQ1p）。
 * 与卡博士 APP 首页分离；只接入原型中已确认且当前有真实去向的三个主入口。
 * 个性定制、数字空间、核心小科普等无已确认业务页或明确暂缓的入口不擅自上线。
 */
export default function DearseedColumn() {
  const navigate = useNavigate()
  const route = findRouteByPathname('/dearseed')
  const { state } = useFixtureState(route)
  const { overlay, open, close } = useOverlay()
  const [downloadHint, setDownloadHint] = useState<string | undefined>(undefined)
  const campaign = CAMPAIGN_FIXTURE
  const claimed = state?.key === 'claimed'
  const ownedOverlay = overlay === 'reminder' || overlay === 'newcomer' || overlay === 'app-guide'

  const closeAppGuide = () => {
    setDownloadHint(undefined)
    close()
  }

  return (
    <PageContainer inset={false} className="overflow-hidden pb-[calc(2rem+env(safe-area-inset-bottom))]">
      <button
        type="button"
        aria-label="诗得丽产品与活动推荐"
        onClick={() => open('newcomer')}
        className="relative block w-full overflow-hidden text-left"
      >
        <img src={columnBanner} alt="诗得丽产品与活动推荐" className="aspect-[375/210] w-full object-cover" />
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-background to-transparent" />
      </button>

      <section
        className="relative z-10 mx-4 -mt-8 overflow-hidden rounded-feature bg-member-surface px-5 pb-4 pt-5 text-member-text shadow-member"
        aria-label="会员信息与泡泡值"
      >
        <span aria-hidden className="absolute -right-12 -top-16 h-40 w-40 rounded-full border border-member-accent/15" />
        <span aria-hidden className="absolute -right-5 -top-8 h-24 w-24 rounded-full bg-member-accent/10 blur-2xl" />
        <div className="relative flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="h-12 w-12 flex-none overflow-hidden rounded-full border-2 border-member-accent/70 shadow-sm"
          >
            <img src={avatar} alt="用户头像" className="h-full w-full object-cover" />
          </button>
          <button type="button" onClick={() => navigate('/mall')} className="min-w-0 flex-1 text-left">
            <span className="block text-[10px] tracking-[0.18em] text-member-accent">DEARSEED MEMBER</span>
            <span className="mt-1 block truncate text-[17px] font-semibold text-member-text">{MEMBER_PROFILE.nickname}</span>
            <span className="mt-1 block text-[11px] text-member-muted">{MEMBER_PROFILE.levelLabel} · {MEMBER_PROFILE.levelName}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/points')}
            className="flex-none text-right"
            aria-label={`泡泡值余额 ${BUBBLE_BALANCE}，查看明细`}
          >
            <span className="block text-2xl font-semibold leading-none text-member-accent">{BUBBLE_BALANCE.toLocaleString()}</span>
            <span className="mt-1 flex items-center justify-end gap-0.5 text-[10px] tracking-[0.08em] text-member-muted">
              {MEMBER_PROFILE.bubbleUnit}
              <ChevronRight className="h-3 w-3" aria-hidden />
            </span>
          </button>
        </div>
        <div className="relative mt-4 flex items-center justify-between border-t border-member-accent/20 pt-3">
          <span className="text-[10px] tracking-[0.15em] text-member-muted">{MEMBER_PROFILE.cardNo}</span>
          <button type="button" onClick={() => navigate('/membership/levels')} className="-my-2 flex min-h-10 items-center gap-1 text-[11px] text-member-accent">
            {MEMBER_PROFILE.levelEntryLabel}
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      </section>

      <nav className="mx-4 mt-5 grid grid-cols-3 gap-3" aria-label="诗得丽专栏服务入口">
        {columnEntries.map((entry) => (
          <button
            key={entry.label}
            type="button"
            onClick={() => navigate(entry.to)}
            className="group flex min-w-0 flex-col items-center gap-2.5 rounded-app-icon bg-surface px-2 py-4 shadow-bubble transition active:translate-y-px active:bg-surface-pressed"
          >
            <span
              className="relative flex h-14 w-14 items-center justify-center rounded-app-icon shadow-app-icon transition group-active:scale-[0.96] group-active:shadow-app-icon-pressed"
              style={{ backgroundImage: 'var(--gradient-app-icon)' }}
            >
              <span aria-hidden className="pointer-events-none absolute inset-0 rounded-app-icon" style={{ backgroundImage: 'var(--gradient-app-icon-gloss)' }} />
              <entry.icon className="relative h-[26px] w-[26px] text-white drop-shadow-[0_1px_1px_rgba(122,33,6,0.45)]" strokeWidth={2.1} aria-hidden />
            </span>
            <span className="whitespace-nowrap text-xs font-medium text-text-primary">{entry.label}</span>
          </button>
        ))}
      </nav>

      <section className="mx-4 mt-7" aria-label="本期活动">
        <header className="mb-3 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-medium tracking-[0.2em] text-reward-strong">MEMBER BENEFITS</p>
            <h2 className="mt-1 text-lg font-bold text-text-primary">本期活动</h2>
          </div>
          <button type="button" onClick={() => navigate('/checkin')} className="flex min-h-10 items-center gap-0.5 text-xs text-text-secondary">
            {campaign.moreLabel}
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </button>
        </header>
        <div className="relative min-h-[154px] overflow-hidden rounded-feature bg-member-surface shadow-member">
          <img src={campaignThumb} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-35" />
          <span aria-hidden className="absolute inset-0 bg-gradient-to-r from-member-surface via-member-surface/90 to-member-surface/20" />
          <div className="relative flex min-h-[154px] flex-col justify-between p-5 pr-[116px]">
            <div>
              <span className="inline-flex rounded-pill border border-member-accent/35 bg-member-accent/10 px-2 py-1 text-[10px] font-medium text-member-accent">专栏限定福利</span>
              <p className="mt-2 text-[17px] font-semibold leading-6 text-member-text">{campaign.title}</p>
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between text-[11px] text-member-muted">
                <span>累计打卡进度</span>
                <span>{campaign.days} / {campaign.target} 天</span>
              </div>
              <ProgressIndicator
                className="[&>div]:bg-member-accent/20 [&>div>div]:bg-member-accent"
                label={`累计打卡进度 ${campaign.days} / ${campaign.target} 天`}
                value={campaign.days}
                max={campaign.target}
              />
            </div>
          </div>
          {claimed ? (
            <button type="button" disabled className="absolute bottom-5 right-4 min-h-10 rounded-pill bg-disabled px-4 text-xs font-semibold text-text-disabled">{campaign.claimedLabel}</button>
          ) : (
            <button type="button" onClick={() => navigate('/claim/success?from=campaign')} className="absolute bottom-5 right-4 min-h-10 rounded-pill bg-member-accent px-4 text-xs font-semibold text-bubble-on-gold shadow-primary-button active:scale-[0.98]">{campaign.claimLabel}</button>
          )}
        </div>
      </section>

      <section className="mx-4 mt-7" aria-label="为你精选">
        <header className="mb-3">
          <p className="text-[10px] font-medium tracking-[0.2em] text-reward-strong">DEARSEED SELECTION</p>
          <h2 className="mt-1 text-lg font-bold text-text-primary">为你精选</h2>
        </header>
        <div className="grid grid-cols-2 gap-3">
          {DEARSEED_PICKS.map((pick, index) => (
            <article
              key={pick.id}
              data-dearseed-pick={pick.id}
              className={`relative min-h-[254px] overflow-hidden rounded-feature border border-border-subtle p-3 shadow-bubble ${index === 0 ? 'bg-reward-subtle' : 'bg-surface'}`}
            >
              <button type="button" aria-label={`${pick.nameStrong}${pick.nameRest}`} onClick={() => navigate(pick.to)} className="block w-full pb-14 text-left">
                <span className="relative flex h-[104px] items-center justify-center overflow-hidden rounded-[14px] bg-surface/75">
                  <span aria-hidden className="absolute h-20 w-20 rounded-full bg-reward/20 blur-xl" />
                  <img src={pickAssets[pick.asset]} alt="" aria-hidden className="relative h-24 w-16 object-contain drop-shadow-[0_10px_12px_rgba(51,37,20,0.18)]" />
                </span>
                <span className="mt-3 block text-[12px] leading-[17px] text-text-primary"><span className="font-bold">{pick.nameStrong}</span>{pick.nameRest}</span>
                <span className="mt-1 line-clamp-1 block text-[10px] text-text-tertiary">{pick.desc}</span>
              </button>
              <div className="absolute inset-x-3 bottom-3 flex items-center justify-between">
                <span className="text-base font-bold text-exchange-price">{pick.cost}<span className="ml-0.5 text-[10px] font-medium">🫧</span></span>
                <button type="button" onClick={() => navigate(pick.ctaTo)} className="flex min-h-10 items-center gap-0.5 rounded-pill bg-primary px-3 text-[10px] font-semibold text-text-inverse shadow-primary-button active:bg-primary-pressed">
                  {pick.cta}
                  <ArrowUpRight className="h-3 w-3" aria-hidden />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {route && !ownedOverlay && <FixtureOverlay route={route} />}

      <PromptOverlay open={overlay === 'reminder'} label="每日打卡提示" onDismiss={close} className="bg-surface px-6 pb-6 pt-7 text-center shadow-modal">
        <button type="button" aria-label="关闭打卡提示" onClick={close} className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-text-tertiary active:bg-surface-subtle">
          <X className="h-5 w-5" aria-hidden />
        </button>
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-info-bg text-info-text">
          <Droplets className="h-8 w-8" aria-hidden />
        </span>
        <h2 className="mt-4 text-lg font-bold text-text-primary">{CHECKIN_REMINDER.title}</h2>
        <p className="mt-2 text-sm leading-6 text-text-secondary">{CHECKIN_REMINDER.tips}</p>
        <Button size="large" className="mt-5 w-full rounded-full" onClick={() => navigate('/checkin?state=success')}>{CHECKIN_REMINDER.action}</Button>
      </PromptOverlay>

      <NewcomerDialog open={overlay === 'newcomer'} onComplete={() => navigate(NEWCOMER_FIXTURE.ctaTo)} onBody={() => open(NEWCOMER_FIXTURE.bodyToOverlay)} onDismiss={close} />
      <AppPromptDialog open={overlay === 'app-guide'} variant="guide" message={APP_GUIDE_FIXTURE.message} onAcknowledge={closeAppGuide} onDownload={() => setDownloadHint(APP_GUIDE_FIXTURE.downloadHint)} downloadHint={downloadHint} />

      <DebugPanel route={route} />
    </PageContainer>
  )
}
