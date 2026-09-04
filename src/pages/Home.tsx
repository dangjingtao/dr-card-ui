import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BookOpen, ChevronLeft, ChevronRight, Gift, Heart, Search } from 'lucide-react'
import BannerCarousel from '../components/mobile/BannerCarousel'
import CheckinBoard from '../components/mobile/CheckinBoard'
import CheckinMakeupSuccessOverlay from '../components/mobile/CheckinMakeupSuccessOverlay'
import DebugPanel from '../components/mobile/DebugPanel'
import NewcomerCouponDialog from '../components/mobile/NewcomerCouponDialog'
import PageContainer from '../components/mobile/PageContainer'
import { useFixtureState, useOverlay } from '../app/fixtures/useFixture'
import { findRouteByPathname } from '../app/router/routes'
import {
  COLUMN_HOME_SECTIONS,
  HOME_BANNER_CAROUSEL,
  NEWCOMER_COUPON_RULE_STATUS,
  NEWCOMER_COUPON_VARIANTS,
} from '../app/fixtures'
import avatar from '../assets/brand/home/home-avatar.webp'
import bannerCheckin from '../assets/brand/home/home-banner-checkin.webp'
import bannerWashCare from '../assets/brand/home/home-banner-wash-care.webp'

const carouselAssets: Record<string, string> = {
  checkin: bannerCheckin,
  'wash-care': bannerWashCare,
}

const sectionIcons = {
  cause: Heart,
  'brand-story': BookOpen,
} as const

type CouponVariantKey = keyof typeof NEWCOMER_COUPON_VARIANTS

/**
 * 诗得丽品牌专栏首页（原 APP 首页，T021 改造）
 * -------------------------------------------------------------
 * 2026-08-28 追加确认：签到业务在首页仅保留紧凑 7 日入口，不再展示金色签到 Hero；
 * 完整金色签到卡、30 天日历与补签入口统一收回 `/checkin` 内页。
 */
export default function Home() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const route = findRouteByPathname('/')
  const { state } = useFixtureState(route)
  const { overlay, open, close } = useOverlay()

  const debug = searchParams.get('debug') === '1'

  const [autoNewcomer, setAutoNewcomer] = useState(
    () => searchParams.get('newcomer') !== 'off' && !searchParams.get('overlay'),
  )

  const [randomVariant] = useState<CouponVariantKey>(() =>
    Math.random() < 0.5 ? 'coupon-1' : 'coupon-2',
  )
  const variantKey: CouponVariantKey =
    state?.key === 'coupon-1' || state?.key === 'coupon-2' ? state.key : randomVariant

  return (
    <PageContainer className="pb-24 pt-4" inset={false}>
      <section className="mx-4 flex items-center gap-2" aria-label="搜索与用户入口">
        <button
          type="button"
          aria-label="返回卡博士首页"
          onClick={() => navigate('/legacy-home')}
          className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-border-subtle bg-surface text-text-primary active:bg-surface-secondary"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <label className="flex h-10 flex-1 items-center gap-2 rounded-full border border-border-subtle bg-surface px-3 text-text-tertiary">
          <Search className="h-4 w-4" />
          <input
            type="search"
            placeholder="搜索你想要的商品"
            aria-label="搜索商品"
            className="min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-tertiary"
          />
        </label>
        <button
          type="button"
          aria-label="进入卡博士商城"
          onClick={() => navigate('/mall')}
          className="h-10 w-10 flex-none overflow-hidden rounded-full border border-border-subtle bg-surface shadow-sm"
        >
          <img src={avatar} alt="会员头像" className="h-full w-full object-cover" />
        </button>
      </section>

      <div className="mx-4 mt-4">
        <BannerCarousel
          label="首页活动轮播"
          interval={HOME_BANNER_CAROUSEL.interval}
          speed={HOME_BANNER_CAROUSEL.speed}
          slides={HOME_BANNER_CAROUSEL.slides.map((slide) => ({
            key: slide.key,
            image: slide.asset ? carouselAssets[slide.asset] : undefined,
            alt: slide.alt,
            eyebrow: 'eyebrow' in slide ? slide.eyebrow : undefined,
            title: 'title' in slide ? slide.title : undefined,
            description: 'description' in slide ? slide.description : undefined,
            cta: 'cta' in slide ? slide.cta : undefined,
          }))}
          onSelect={(_, index) => {
            const slide = HOME_BANNER_CAROUSEL.slides[index]
            if (!slide) return
            if ('to' in slide) navigate(slide.to)
            else navigate(`/dearseed?overlay=${slide.toOverlay}`)
          }}
        />
      </div>

      <div className="mt-4">
        <CheckinBoard mode="home" onMakeup={() => open('make-up-success')} debug={debug} />
      </div>

      <section className="mx-4 mt-7 space-y-3" aria-label="公益板块与品牌故事">
        {COLUMN_HOME_SECTIONS.map((item) => {
          const Icon = sectionIcons[item.key]
          const body = (
            <>
              <span className="flex h-11 w-11 flex-none items-center justify-center rounded-app-icon bg-reward-subtle text-reward-strong">
                <Icon className="h-[22px] w-[22px]" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-bold leading-5 text-text-primary">{item.title}</span>
                <span className="mt-1 block text-xs leading-5 text-text-tertiary">{item.desc}</span>
              </span>
              {item.action && (
                <span className="flex flex-none items-center gap-0.5 text-xs text-reward-text">
                  {item.action}
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </span>
              )}
            </>
          )
          const shell = 'flex w-full items-center gap-3 rounded-feature bg-surface p-4 text-left shadow-bubble'

          if (!item.to) {
            return (
              <div key={item.key} className={shell}>
                {body}
              </div>
            )
          }

          return (
            <button key={item.key} type="button" onClick={() => navigate(item.to)} className={shell}>
              {body}
            </button>
          )
        })}
      </section>

      {debug && (
        <p className="mx-4 mt-4 text-xs leading-5 text-text-tertiary">
          夹具态：{NEWCOMER_COUPON_RULE_STATUS.newUserDetection.note}
          {NEWCOMER_COUPON_RULE_STATUS.causeSection.note}
        </p>
      )}

      <button
        type="button"
        aria-label="福袋"
        onClick={() => navigate('/redeem')}
        className="fixed bottom-[calc(59px+env(safe-area-inset-bottom)+1rem)] right-4 z-30 flex h-14 w-14 flex-col items-center justify-center rounded-full border border-border-subtle bg-reward-subtle text-reward-text shadow-sm"
      >
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-surface bg-danger" aria-hidden />
        <Gift className="h-[22px] w-[22px]" />
        <span className="mt-0.5 text-[10px] leading-none">福袋</span>
      </button>

      <NewcomerCouponDialog
        open={overlay === 'newcomer-coupon' || (autoNewcomer && !overlay)}
        successOpen={overlay === 'coupon-success'}
        coupons={NEWCOMER_COUPON_VARIANTS[variantKey]}
        onConfirm={() => {
          setAutoNewcomer(false)
          close()
          navigate('/card')
        }}
        onDismiss={() => {
          setAutoNewcomer(false)
          close()
        }}
        onSuccessAction={() => navigate('/card')}
      />

      <CheckinMakeupSuccessOverlay open={overlay === 'make-up-success'} onDismiss={close} debug={debug} />

      <DebugPanel route={route} />
    </PageContainer>
  )
}
