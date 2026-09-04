import { useNavigate } from 'react-router-dom'
import {
  MapPin,
  Search,
  Bell,
  ChevronDown,
  QrCode,
  ChevronRight,
  FlaskConical,
  Heart,
  BookOpen,
  Gift,
} from 'lucide-react'
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
  { label: '淋浴', icon: iconShower, to: '/device/shower' },
  { label: '洗烘', icon: iconDryer, to: '/device/laundry' },
  { label: '饮水', icon: iconWater, to: '/device/water' },
  { label: '吹风', icon: iconBlower, to: '/device/hairdryer' },
]

/** 卡博士APP首页 */
export default function LegacyHome() {
  const navigate = useNavigate()

  return (
    <PageContainer className="space-y-4 pb-6 pt-4">
      {/* 搜索框（整行） */}
      <label className="flex h-10 w-full items-center gap-2 rounded-full border border-border-subtle bg-surface px-4 text-text-tertiary">
        <Search className="h-4 w-4 flex-none" />
        <input
          type="search"
          placeholder="点击进入搜索内容"
          aria-label="搜索"
          className="min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-tertiary"
        />
      </label>

      {/* 位置 + 头像昵称 + 通知 */}
      <div className="flex items-center justify-between">
        {/* 位置 pill */}
        <button
          type="button"
          className="flex items-center gap-1 rounded-full bg-[#F0F2F8] px-3 py-1.5 text-xs font-medium text-text-secondary active:bg-[#E5E8F0]"
        >
          <MapPin className="h-3.5 w-3.5" />
          <span className="max-w-[140px] truncate">在18号线琶洲西区...</span>
          <ChevronDown className="h-3 w-3" />
        </button>

        {/* 头像 + 昵称 + 通知 */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="进入会员中心"
              onClick={() => navigate('/membership')}
              className="h-7 w-7 overflow-hidden rounded-full border border-border-subtle bg-surface shadow-sm"
            >
              <img src={avatar} alt="会员头像" className="h-full w-full object-cover" />
            </button>
            <span className="text-xs font-medium text-text-primary">微信用户</span>
          </div>
          <button
            type="button"
            aria-label="通知"
            onClick={() => navigate('/notifications')}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary active:bg-[#F0F2F8]"
          >
            <Bell className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Banner 轮播 */}
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

      {/* 四金刚区 */}
      <nav className="grid grid-cols-4 gap-x-1 gap-y-2" aria-label="快捷入口">
        {quickEntries.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => item.to && navigate(item.to)}
            className="flex flex-col items-center gap-1"
          >
            <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-[20px]">
              <img src={item.icon} alt={item.label} className="h-full w-full object-cover" />
            </span>
            <span className="text-xs text-text-primary">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* 扫一扫（大 pill） */}
      <button
        type="button"
        aria-label="扫一扫"
        onClick={() => navigate('/legacy-home/scan')}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#F0F2F8] text-text-primary active:bg-[#E5E8F0]"
      >
        <QrCode className="h-5 w-5" />
        <span className="text-sm font-medium">扫一扫</span>
      </button>

      {/* 诗得丽品牌专栏（大卡片） */}
      <button
        type="button"
        onClick={() => navigate('/')}
        className="relative flex w-full items-center overflow-hidden rounded-2xl bg-gradient-to-r from-[#F7E9D4] to-[#EED9B8] shadow-sm active:opacity-90"
        style={{ aspectRatio: '3 / 1' }}
      >
        <div className="flex-1 px-5 text-left">
          <div className="text-base font-bold text-[#5C3D1E]">诗得丽品牌专栏</div>
          <div className="mt-1 text-xs text-[#8B6A45]">会员福利 · 品牌服务 · 洗护好物</div>
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#D9A968] px-3 py-1 text-[10px] font-medium text-[#2A1A10]">
            进入专栏
            <ChevronRight className="h-3 w-3" />
          </span>
        </div>
        <div className="flex h-full w-1/3 items-center justify-center">
          <FlaskConical className="h-12 w-12 text-[#C4943F]/60" />
        </div>
      </button>

      {/* 公益助力项目（大卡片） */}
      <button
        type="button"
        className="relative flex w-full items-center overflow-hidden rounded-2xl bg-gradient-to-r from-[#E8F7EF] to-[#CFEEDD] shadow-sm active:opacity-90"
        style={{ aspectRatio: '3 / 1' }}
      >
        <div className="flex-1 px-5 text-left">
          <div className="text-base font-bold text-[#1A5C3A]">公益助力项目</div>
          <div className="mt-1 text-xs text-[#4A8B6A]">每次打卡助力公益，传递温暖</div>
          <div className="mt-2 flex items-end gap-3">
            <div>
              <div className="text-lg font-bold text-[#1A5C3A]">3056</div>
              <div className="text-[10px] text-[#4A8B6A]">参与人数</div>
            </div>
            <div>
              <div className="text-lg font-bold text-[#1A5C3A]">395.6万</div>
              <div className="text-[10px] text-[#4A8B6A]">累计金额</div>
            </div>
          </div>
        </div>
        <div className="flex h-full w-1/3 items-center justify-center">
          <Heart className="h-12 w-12 text-[#6BC49A]/50" />
        </div>
      </button>

      {/* 卡博士品牌故事（大卡片） */}
      <button
        type="button"
        className="relative flex w-full items-center overflow-hidden rounded-2xl bg-gradient-to-r from-[#E8EEF9] to-[#D0DBF0] shadow-sm active:opacity-90"
        style={{ aspectRatio: '3 / 1' }}
      >
        <div className="flex-1 px-5 text-left">
          <div className="text-base font-bold text-[#1E3A6E]">卡博士品牌故事</div>
          <div className="mt-1 text-xs text-[#4A6B9A]">了解品牌起源与匠心洗护</div>
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#6B8BD9] px-3 py-1 text-[10px] font-medium text-white">
            了解更多
            <ChevronRight className="h-3 w-3" />
          </span>
        </div>
        <div className="flex h-full w-1/3 items-center justify-center">
          <BookOpen className="h-12 w-12 text-[#6B8BD9]/50" />
        </div>
      </button>

      {/* 福袋悬浮按钮 */}
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
    </PageContainer>
  )
}
