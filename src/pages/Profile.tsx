import { Fragment, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronRight,
  ClipboardList,
  Crown,
  Gift,
  Headphones,
  MapPin,
  Pencil,
  Sparkles,
  Ticket,
  UserRoundPlus,
  Wallet,
} from 'lucide-react'
import avatar from '../assets/brand/home/home-avatar.webp'
import hotBerry from '../assets/brand/exchange/profile-hot-berry.webp'
import hotHoney from '../assets/brand/exchange/profile-hot-honey.webp'
import hotSeasalt from '../assets/brand/exchange/profile-hot-seasalt.webp'
import hotHerbal from '../assets/brand/exchange/profile-hot-herbal.webp'
import PageContainer from '../components/mobile/PageContainer'
import AppPromptDialog from '../components/mobile/AppPromptDialog'
import { useOverlay } from '../app/fixtures/useFixture'
import { APP_FORCE_FIXTURE } from '../app/fixtures'

type Tile = {
  icon: typeof Ticket
  name: string
  from: string
  deep: string
  color: string
  shadow: string
  to?: string
  appOnly?: boolean
}

const tiles: Tile[] = [
  { icon: Ticket, name: '卡券兑换', from: '#FFF7E0', deep: '#F0D997', color: '#B5793B', shadow: 'rgba(181,121,59,0.32)', to: '/redeem' },
  { icon: ClipboardList, name: '订单管理', from: '#FFF0E7', deep: '#FFC8B0', color: '#D63D10', shadow: 'rgba(214,61,16,0.28)', to: '/orders' },
  { icon: MapPin, name: '地址管理', from: '#FFF7E0', deep: '#F1D997', color: '#9A6110', shadow: 'rgba(154,97,16,0.28)', to: '/address' },
  { icon: UserRoundPlus, name: '绑定搭子', from: '#EBFCFF', deep: '#C3EEF6', color: '#0E9FB3', shadow: 'rgba(14,159,179,0.28)', to: '/buddy' },
  { icon: Gift, name: '品牌福利官', from: '#E9FAF0', deep: '#C2EBD4', color: '#147A4C', shadow: 'rgba(20,122,76,0.28)', to: '/service/welfare-officer' },
  { icon: Headphones, name: '客服中心', from: '#F4F6FA', deep: '#DCE2EB', color: '#535D72', shadow: 'rgba(83,93,114,0.26)', to: '/service/chat' },
]

const stats = [
  { icon: Wallet, name: '卡包', value: '1', to: '/card', hint: '查看卡包' },
  { icon: Sparkles, name: '泡泡值', value: '1,280', to: '/points', hint: '查看泡泡值明细' },
  { icon: Crown, name: '专属权益', value: '9', to: '/membership', hint: '查看会员中心' },
]

const hotGoods = [
  { image: hotBerry, name: '莓果净澈', meta: '洗衣液 · 500ml' },
  { image: hotHoney, name: '蜂蜜修护', meta: '洗衣液 · 500ml' },
  { image: hotSeasalt, name: '海盐控油', meta: '洗衣液 · 500ml' },
  { image: hotHerbal, name: '草本柔顺', meta: '洗衣液 · 500ml' },
]

export default function Profile() {
  const navigate = useNavigate()
  const { overlay, open, close } = useOverlay()
  const [downloadHint, setDownloadHint] = useState<string | undefined>(undefined)

  const openAppPrompt = () => {
    setDownloadHint(undefined)
    open('app-prompt')
  }

  const closeAppPrompt = () => {
    setDownloadHint(undefined)
    close()
  }

  return (
    <PageContainer inset={false} className="relative pb-6">
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <span className="absolute left-[-60px] top-[520px] h-[280px] w-[280px] rounded-full bg-[#F8D992] opacity-30 blur-[28px]" />
        <span className="absolute bottom-[200px] right-[-40px] h-[200px] w-[200px] rounded-full bg-[#ED4D1B] opacity-5 blur-[28px]" />
        <span className="absolute right-[-60px] top-20 h-[240px] w-[240px] rounded-full bg-[#EDBC6C] opacity-10 blur-[28px]" />
      </div>

      <section className="relative z-10 mx-4 mt-2 overflow-hidden rounded-[20px] bg-[linear-gradient(140deg,#FAE9A8_0%,#F3D472_32%,#E4BA48_66%,#CDA135_100%)] p-[18px] pb-0 text-[#4A3206] shadow-[0_4px_10px_-4px_rgba(153,112,26,0.25)]">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.55)_0%,rgba(255,255,255,0)_32%,rgba(255,255,255,0.18)_52%,rgba(255,255,255,0)_72%)]" />
        <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-white/70" />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-[#A57A1D]/50" />

        <div className="relative flex items-center gap-3.5">
          <button
            type="button"
            aria-label="用户头像"
            onClick={() => navigate('/settings')}
            className="h-16 w-16 flex-none overflow-hidden rounded-full border-2 border-white/90 shadow-[0_0_0_4px_rgba(165,122,29,0.25)]"
          >
            <img src={avatar} alt="" className="h-full w-full object-cover" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-[#4A3206]">昵称 12345678910</h2>
              <span className="inline-flex h-[22px] flex-none items-center gap-1 rounded-full bg-[#4A3206] px-2 text-[11px] font-semibold text-[#F7E2A1]">
                <Crown className="h-3 w-3 text-[#F7E2A1]" />
                VIP 泡泡新生
              </span>
            </div>
            <p className="mt-1 text-xs tracking-wide text-[#6B4A12]/85">ID 80012345</p>
          </div>
          <button
            type="button"
            aria-label="编辑资料"
            onClick={() => navigate('/settings')}
            className="flex h-7 w-7 flex-none items-center justify-center rounded-md text-[#6B4A12]/80"
          >
            <Pencil className="h-[18px] w-[18px]" />
          </button>
        </div>

        <div className="relative mt-4">
          <div className="mb-2 flex items-baseline justify-between text-xs text-[#4A3206]/85">
            <span>当前 Lv.1 泡泡新生</span>
            <span className="font-semibold text-[#4A3206]">距 Lv.2 泡泡萌芽 还差 720 泡泡值</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[#4A3206]/20">
            <span className="block h-full rounded-full bg-[linear-gradient(90deg,#E4BA48,#A57A1D)]" style={{ width: '30%' }} />
          </div>
        </div>

        <div className="relative mx-[-18px] mt-4 flex items-center border-t border-[#4A3206]/20 py-3.5">
          {stats.map((stat, index) => (
            <Fragment key={stat.name}>
              {index > 0 ? <span className="h-6 w-px flex-none bg-[#4A3206]/20" aria-hidden /> : null}
              <button
                type="button"
                onClick={() => navigate(stat.to)}
                aria-label={`${stat.name} ${stat.value}，${stat.hint}`}
                className="flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl py-1 transition-transform duration-150 active:scale-[0.97]"
              >
                <span className="flex items-center gap-1 text-xl font-bold leading-none tracking-tight text-[#4A3206]">
                  <stat.icon className="h-4 w-4 text-[#6B4A12]/70" strokeWidth={2.2} aria-hidden />
                  {stat.value}
                </span>
                <span className="flex items-center gap-0.5 whitespace-nowrap text-xs text-[#6B4A12]/75">
                  {stat.name}
                  <ChevronRight className="h-3 w-3" aria-hidden />
                </span>
              </button>
            </Fragment>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-4 mt-3 grid grid-cols-3 gap-y-3 rounded-[16px] bg-surface px-2 py-5 shadow-[0_1px_2px_rgba(23,27,42,0.04)]">
        {tiles.map((tile) => (
          <button
            key={tile.name}
            type="button"
            onClick={() => (tile.appOnly ? openAppPrompt() : navigate(tile.to as string))}
            aria-haspopup={tile.appOnly ? 'dialog' : undefined}
            className="flex flex-col items-center gap-2.5 rounded-2xl px-1 pb-2 pt-3"
          >
            <span
              className="flex h-[56px] w-[56px] items-center justify-center rounded-[18px]"
              style={{
                background: `linear-gradient(145deg, ${tile.from} 0%, ${tile.deep} 100%)`,
                color: tile.color,
                boxShadow: `0 4px 8px -2px ${tile.shadow}`,
              }}
            >
              <tile.icon className="h-7 w-7" strokeWidth={2.2} />
            </span>
            <span className="whitespace-nowrap text-xs font-medium text-text-primary">{tile.name}</span>
          </button>
        ))}
      </section>

      <section className="relative z-10 mx-4 mt-4">
        <header className="flex items-center justify-between px-1 pb-2.5">
          <h3 className="text-base font-semibold text-text-primary">热门兑换</h3>
          <button type="button" className="inline-flex items-center gap-0.5 text-xs text-text-tertiary" onClick={() => navigate('/exchange')}>
            查看更多
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </header>
        <div className="flex gap-3 overflow-x-auto px-1 pb-1" style={{ scrollbarWidth: 'none' }}>
          {hotGoods.map((goods) => (
            <article key={goods.name} className="w-[120px] min-w-[120px] flex-none rounded-xl bg-surface p-2 pb-3 text-left shadow-[0_1px_2px_rgba(23,27,42,0.04)]">
              <div className="aspect-square overflow-hidden rounded-lg bg-surface-subtle">
                <img src={goods.image} alt="" aria-hidden className="h-full w-full object-cover" />
              </div>
              <h4 className="mt-2 truncate text-[13px] font-medium text-text-primary">{goods.name}</h4>
              <p className="mt-0.5 text-[11px] text-text-tertiary">{goods.meta}</p>
            </article>
          ))}
        </div>
      </section>

      <AppPromptDialog
        open={overlay === 'app-prompt'}
        variant="force"
        message={APP_FORCE_FIXTURE.message}
        onAcknowledge={closeAppPrompt}
        onDownload={() => setDownloadHint(APP_FORCE_FIXTURE.downloadHint)}
        downloadHint={downloadHint}
      />
    </PageContainer>
  )
}
