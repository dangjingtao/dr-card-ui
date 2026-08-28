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
  Ticket,
  UserRoundPlus,
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
  to?: string
  appOnly?: boolean
}

const tiles: Tile[] = [
  { icon: Ticket, name: '卡券兑换', from: '#FFF8E6', deep: '#F4DFA9', color: '#B5793B', to: '/redeem' },
  { icon: Crown, name: '会员中心', from: '#FFF4CF', deep: '#E8C361', color: '#8A5A10', to: '/membership' },
  { icon: ClipboardList, name: '订单管理', from: '#FFF3EB', deep: '#FFD3C0', color: '#D63D10', to: '/orders' },
  { icon: MapPin, name: '地址管理', from: '#FFF8E6', deep: '#F3DFA9', color: '#9A6110', to: '/address' },
  { icon: UserRoundPlus, name: '绑定搭子', from: '#EFFCFE', deep: '#CDEFF5', color: '#0E9FB3', to: '/buddy' },
  { icon: Gift, name: '品牌福利官', from: '#EEFAF3', deep: '#CDEAD9', color: '#147A4C', to: '/service/welfare-officer' },
  { icon: Headphones, name: '客服中心', from: '#F6F8FB', deep: '#E1E6ED', color: '#535D72', to: '/service/chat' },
]

const stats = [
  { name: '卡包', value: '1', to: '/card', hint: '查看卡包' },
  { name: '泡泡值', value: '1,280', to: '/points', hint: '查看泡泡值明细' },
  { name: '专属权益', value: '9', to: '/mall', hint: '查看卡博士商城' },
]

const hotGoods = [
  { image: hotBerry, name: '莓果净澈体验券', meta: '单次体验 · 到店核销' },
  { image: hotHoney, name: '蜂蜜修护体验券', meta: '单次体验 · 到店核销' },
  { image: hotSeasalt, name: '海盐控油体验券', meta: '单次体验 · 到店核销' },
  { image: hotHerbal, name: '草本柔顺体验券', meta: '单次体验 · 到店核销' },
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
                <span className="text-xl font-bold leading-none tracking-tight text-[#4A3206]">{stat.value}</span>
                <span className="relative whitespace-nowrap text-xs text-[#6B4A12]/75">
                  {stat.name}
                  <ChevronRight className="absolute left-full top-1/2 ml-0.5 h-3 w-3 -translate-y-1/2" aria-hidden />
                </span>
              </button>
            </Fragment>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-4 mt-3" aria-labelledby="profile-services-title">
        <header className="mb-1.5 flex items-center justify-between px-1">
          <h3 id="profile-services-title" className="flex items-center gap-2 text-[13px] font-semibold text-text-primary">
            <span className="h-3.5 w-1 rounded-full bg-[#D6A43A]" aria-hidden />
            快捷服务
          </h3>
          <span className="text-[10px] tracking-[0.12em] text-[#9A8060]">常用功能</span>
        </header>
        <div className="grid grid-cols-6 grid-rows-[52px_52px_58px] gap-2">
          {tiles.map((tile, index) => {
            const isPrimaryRow = index < 4
            const placement =
              index === 0
                ? 'col-span-3 col-start-1 row-start-1'
                : index === 1
                  ? 'col-span-3 col-start-1 row-start-2'
                  : index === 2
                    ? 'col-span-3 col-start-4 row-start-1'
                    : index === 3
                      ? 'col-span-3 col-start-4 row-start-2'
                      : 'col-span-2 row-start-3'

            return (
              <button
                key={tile.name}
                type="button"
                onClick={() => (tile.appOnly ? openAppPrompt() : navigate(tile.to as string))}
                aria-haspopup={tile.appOnly ? 'dialog' : undefined}
                className={`group relative overflow-hidden border border-white/75 text-left shadow-[0_3px_10px_rgba(130,86,28,0.07)] transition active:scale-[0.98] ${placement} ${
                  isPrimaryRow
                    ? 'flex items-center gap-2.5 rounded-[15px] px-3'
                    : 'flex flex-col items-center justify-center gap-1 rounded-[15px] px-1'
                }`}
                style={{
                  background: `linear-gradient(145deg, ${tile.from} 0%, ${tile.deep} 100%)`,
                  color: tile.color,
                }}
              >
                {isPrimaryRow ? (
                  <>
                    <tile.icon className="h-5 w-5 flex-none" strokeWidth={2} />
                    <span className="min-w-0 flex-1 whitespace-nowrap text-[12px] font-medium text-text-primary">{tile.name}</span>
                    <ChevronRight className="h-3.5 w-3.5 flex-none opacity-55 transition-transform group-active:translate-x-0.5" aria-hidden />
                  </>
                ) : (
                  <>
                    <tile.icon className="h-[19px] w-[19px]" strokeWidth={2} />
                    <span className="whitespace-nowrap text-[11px] font-medium text-text-primary">{tile.name}</span>
                  </>
                )}
              </button>
            )
          })}
        </div>
      </section>

      <section className="relative z-10 mx-4 mt-4">
        <header className="flex items-center justify-between px-1 pb-2.5">
          <h3 className="text-base font-semibold text-text-primary">热门体验券</h3>
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
