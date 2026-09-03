import { useNavigate } from 'react-router-dom'
import { BookOpen, ChevronRight, FlaskConical, Gift, Heart, HeartHandshake, QrCode, Search } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import BannerCarousel from '../components/mobile/BannerCarousel'
import PageContainer from '../components/mobile/PageContainer'
import { HOME_BANNER_CAROUSEL } from '../app/fixtures'
import avatar from '../assets/brand/home/home-avatar.webp'
import bannerCheckin from '../assets/brand/home/home-banner-checkin.webp'
import bannerWashCare from '../assets/brand/home/home-banner-wash-care.webp'
import iconShower from '../assets/brand/home/home-icon-shower.webp'
import iconDryer from '../assets/brand/home/home-icon-dryer.webp'
import iconWater from '../assets/brand/home/home-icon-water.webp'
import iconBlower from '../assets/brand/home/home-icon-blower.webp'

const carouselAssets: Record<string, string> = {
  checkin: bannerCheckin,
  'wash-care': bannerWashCare,
}

const quickEntries = [
  { label: '淋浴', icon: iconShower },
  { label: '洗烘', icon: iconDryer },
  { label: '饮水', icon: iconWater },
  { label: '吹风', icon: iconBlower },
]

// 仅配置了 to 的卡片可跳转，其余为纯展示项。
const listCards: {
  icon: LucideIcon
  tone: string
  title: string
  sub: string
  to?: string
  trailing?: LucideIcon
}[] = [
  {
    icon: FlaskConical,
    tone: 'bg-secondary text-text-brand',
    title: '诗得丽品牌专栏',
    sub: '会员福利 · 品牌服务 · 洗护好物',
    to: '/',
  },
  {
    icon: Heart,
    tone: 'bg-success-bg text-success-text',
    title: '公益板块',
    sub: '每次打卡助力公益，传递温暖',
    trailing: HeartHandshake,
  },
  {
    icon: BookOpen,
    tone: 'bg-info-bg text-info-text',
    title: '卡博士品牌故事',
    sub: '了解品牌起源与匠心洗护',
  },
]

/** 历史 APP 首页的独立入口，供后续改造成另一条产品入口。 */
export default function LegacyHome() {
  const navigate = useNavigate()

  return (
    <PageContainer className="space-y-4 pb-6 pt-4">
      <section className="flex items-center gap-3" aria-label="搜索与用户入口">
        <label className="flex h-10 flex-1 items-center gap-2 rounded-full border border-border-subtle bg-surface px-3 text-text-tertiary">
          <Search className="h-4 w-4" />
          <input type="search" placeholder="搜索你想要的商品" aria-label="搜索商品" className="min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-tertiary" />
        </label>
        <button type="button" aria-label="进入会员中心" onClick={() => navigate('/membership')} className="h-10 w-10 flex-none overflow-hidden rounded-full border border-border-subtle bg-surface shadow-sm">
          <img src={avatar} alt="会员头像" className="h-full w-full object-cover" />
        </button>
      </section>

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
      />

      <nav className="grid grid-cols-4 gap-x-1 gap-y-2" aria-label="快捷入口">
        {quickEntries.map((item) => (
          <div key={item.label} className="flex flex-col items-center gap-1">
            <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-[20px]">
              <img src={item.icon} alt={item.label} className="h-full w-full object-cover" />
            </span>
            <span className="text-xs text-text-primary">{item.label}</span>
          </div>
        ))}
      </nav>

      <button
        type="button"
        aria-label="扫一扫"
        onClick={() => navigate('/legacy-home/scan')}
        className="flex h-[72px] w-full items-center gap-3 rounded-xl bg-surface px-4 shadow-sm"
      >
        <span className="flex h-11 w-11 flex-none items-center justify-center rounded-lg bg-secondary text-text-brand">
          <QrCode className="h-[22px] w-[22px]" />
        </span>
        <span className="min-w-0 flex-1 text-left">
          <span className="block text-[15px] font-medium text-text-primary">扫一扫</span>
          <span className="mt-0.5 block text-xs text-text-tertiary">扫描二维码，快速开启服务</span>
        </span>
        <ChevronRight className="h-[18px] w-[18px] text-text-tertiary" />
      </button>

      <section className="space-y-3" aria-label="首页业务入口">
        {listCards.map((card) => {
          const Trailing = card.trailing ?? ChevronRight
          return (
            <button key={card.title} type="button" onClick={() => card.to && navigate(card.to)} className="flex h-[72px] w-full items-center gap-3 rounded-xl bg-surface px-4 shadow-sm">
              <span className={`flex h-11 w-11 flex-none items-center justify-center rounded-lg ${card.tone}`}>
                <card.icon className="h-[22px] w-[22px]" />
              </span>
              <span className="min-w-0 flex-1 text-left">
                <span className="block text-[15px] font-medium text-text-primary">{card.title}</span>
                <span className="mt-0.5 block text-xs text-text-tertiary">{card.sub}</span>
              </span>
              <Trailing className="h-[18px] w-[18px] text-text-tertiary" />
            </button>
          )
        })}
      </section>

      <button type="button" aria-label="福袋" onClick={() => navigate('/redeem')} className="fixed bottom-[calc(59px+env(safe-area-inset-bottom)+1rem)] right-4 z-30 flex h-14 w-14 flex-col items-center justify-center rounded-full border border-border-subtle bg-reward-subtle text-reward-text shadow-sm">
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-surface bg-danger" aria-hidden />
        <Gift className="h-[22px] w-[22px]" />
        <span className="mt-0.5 text-[10px] leading-none">福袋</span>
      </button>
    </PageContainer>
  )
}
