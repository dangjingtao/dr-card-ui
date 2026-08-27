import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BookOpen, ChevronRight, Gift, Heart, Search } from 'lucide-react'
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
  NEWCOMER_COUPON_SUCCESS,
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
 * 事实源：docs/requirements/2026-08-27-ui-change-requirements.md §2 §3
 * 已确认（§2.2 自上而下）：页面标题「诗得丽品牌专栏」→ 顶部搜索栏与头像（保持原位原样）→
 *        现有 Banner → **删除金刚区**（不保留淋浴/洗烘/饮水/吹风）→ 完整承载打卡业务内容 →
 *        公益板块 → 卡博士品牌故事 → 底部导航保持固定。
 * §2.3：打卡内容以共享组件 `CheckinBoard` 迁入，**不**重复迁入 /checkin 的标题栏、返回按钮与
 *        底部导航，避免首页出现两套页面外壳；公益板块与品牌故事随页面正常滚动，不吸底不悬浮。
 * §3：新用户弹窗随机展示 1 张或 2 张体验券及对应商品内容；确定 → 先出领取成功 → 进入体验券
 *        页面（用户定案 `/exchange`）；关闭 → 不领取，停留 `/`。
 *
 * 实现约束：
 * - 页面标题由 MobileLayout 依 routes.ts 统一提供，本页不自造标题栏（§2.3）。
 * - `CheckinBoard` 的 section 自管 `mx-4`，故 PageContainer 用 `inset={false}`，
 *   首屏各 section 自行补 `mx-4`，保证与打卡内容左右对齐。
 * - 用户定案「默认全是新用户」：挂载时若 URL 没有任何 `?overlay=`，即自动弹出新人体验券。
 *   该判断只在挂载时惰性求值一次，关闭后置为 false，避免与纯 URL 驱动的 `useOverlay()`
 *   相互覆盖（否则 `close()` 删参后会立刻再次弹出，形成死循环）。
 * - 随机券组合只在无 `?state=` 时发生（1 张 / 2 张概率 1:1，用户定案），且惰性求值一次，
 *   避免同一次访问内反复抖动；验收一律用 `?state=coupon-1` / `?state=coupon-2` 复现（夹具铁律）。
 * - `?newcomer=off` 抑制自动弹窗：仅供取证/回归脚本确定性地拿到首页无遮挡形态，
 *   不改变产品行为，真实访问不带此参数。
 *
 * ⚠️ 未决规则隔离在 fixtures 的 NEWCOMER_COUPON_RULE_STATUS：
 *    B-032 券池/库存/单人上限 / B-033 公益板块无原型视觉（已定案暂不跳转）。
 *    B-031 新用户口径已由用户定案「默认全是新用户」，仅跨会话频次待接口阶段确认。
 * 可复现状态：?state=coupon-1|coupon-2；?overlay=newcomer-coupon|coupon-success|make-up-success；
 *            ?newcomer=off 抑制自动弹窗
 */
export default function Home() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const route = findRouteByPathname('/')
  const { state } = useFixtureState(route)
  const { overlay, open, close } = useOverlay()

  const debug = searchParams.get('debug') === '1'

  // 「默认全是新用户」：挂载时无任何 overlay 且未被 ?newcomer=off 抑制，则自动弹出。
  const [autoNewcomer, setAutoNewcomer] = useState(
    () => searchParams.get('newcomer') !== 'off' && !searchParams.get('overlay'),
  )

  // 无 ?state= 时才在页面层随机选一个组合（1:1，B-032），惰性求值一次以保证同次访问稳定。
  const [randomVariant] = useState<CouponVariantKey>(() =>
    Math.random() < 0.5 ? 'coupon-1' : 'coupon-2',
  )
  const variantKey: CouponVariantKey =
    state?.key === 'coupon-1' || state?.key === 'coupon-2' ? state.key : randomVariant

  return (
    <PageContainer className="pb-24 pt-4" inset={false}>
      <section className="mx-4 flex items-center gap-3" aria-label="搜索与用户入口">
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
        <CheckinBoard onMakeup={() => open('make-up-success')} debug={debug} />
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

          // 公益板块暂不实现跳转（B-033 已定案）：渲染为静态板块，不给可点击语义。
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
          open('coupon-success')
        }}
        onDismiss={() => {
          setAutoNewcomer(false)
          close()
        }}
        onSuccessAction={() => navigate(NEWCOMER_COUPON_SUCCESS.actionTo)}
      />

      <CheckinMakeupSuccessOverlay open={overlay === 'make-up-success'} onDismiss={close} debug={debug} />

      <DebugPanel route={route} />
    </PageContainer>
  )
}
