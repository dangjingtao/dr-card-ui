import { Crown, Gem, Leaf, Smile } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import DebugPanel from '../components/mobile/DebugPanel'
import PageContainer from '../components/mobile/PageContainer'
import { findRouteByPathname } from '../app/router/routes'
import { MEMBER_CARD_FACES, MEMBER_LEVELS, MEMBER_LEVELS_REMARK, MEMBER_RULE_STATUS } from '../app/fixtures'
import membershipHero from '../assets/brand/member/membership-levels-reference-hero.webp'
import roseCard from '../assets/brand/member/member-card-rose.webp'
import lavenderCard from '../assets/brand/member/member-card-lavender.webp'
import oceanCard from '../assets/brand/member/member-card-ocean.webp'
import emeraldCard from '../assets/brand/member/member-card-emerald.webp'

/**
 * 会员等级（#26）
 * 产品事实源：docs/prototype/02-membership-and-checkin.md §2。
 * 视觉方向：Penpot《卡博士补充UI》/「会员中心 / 01-会员等级」；仅继承构图、层级与卡面物料。
 * ⚠️ 等级数量 / 命名 / 卡面清单仍沿用历史夹具，未经产品确认（B-022）。
 * ⚠️ 权益、升级门槛与解锁判断未在原型中确认（B-023），本页不补写。
 */
const levelVisuals: Array<{
  icon: LucideIcon
  surface: string
  accent: string
  border: string
}> = [
  { icon: Smile, surface: '#F0F1FF', accent: '#5B5EF7', border: '#DFE1FF' },
  { icon: Leaf, surface: '#E9FCFF', accent: '#00BDD6', border: '#D2F3F8' },
  { icon: Crown, surface: '#FFF2D6', accent: '#F3A21B', border: '#F8E1AE' },
  { icon: Gem, surface: '#252B3D', accent: '#F3A21B', border: '#252B3D' },
]

const cardFaceVisuals = [
  { image: roseCard, foreground: '#252B3D', tagClassName: 'bg-[#FFE5EC] text-[#8A4960]' },
  { image: lavenderCard, foreground: '#252B3D', tagClassName: 'bg-[#F0E8FF] text-[#695484]' },
  { image: oceanCard, foreground: '#252B3D', tagClassName: 'bg-[#E6F7FC] text-[#356B7B]' },
  { image: emeraldCard, foreground: '#FFFFFF', tagClassName: 'bg-[#DDF8EA] text-[#31624B]' },
]

export default function MembershipLevels() {
  const route = findRouteByPathname('/membership/levels')

  return (
    <PageContainer inset={false} className="pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
      <section className="relative mx-2 mt-3 aspect-[2/1] overflow-hidden rounded-[20px]" aria-labelledby="membership-hero-title">
        <img src={membershipHero} alt="" className="absolute inset-0 h-full w-full object-cover" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-r from-white/35 via-white/10 to-transparent" aria-hidden />
        <div className="relative flex h-full max-w-[62%] flex-col px-6 py-8">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-[#5B5EF7]">DEARSEED MEMBERSHIP</p>
          <h2 id="membership-hero-title" className="mt-2 text-[24px] font-bold leading-8 tracking-[-0.02em] text-[#252B3D]">
            会员等级参考
          </h2>
          <p className="mt-1.5 text-[13px] leading-5 text-[#535D72]">会员等级与专属卡面视觉</p>
          <p className="mt-auto w-fit rounded-full bg-white/70 px-2.5 py-1 text-[10px] leading-4 text-[#687288] backdrop-blur-sm">
            {MEMBER_LEVELS_REMARK}
          </p>
        </div>
      </section>

      <section className="relative z-10 mx-2 -mt-6 rounded-[22px] bg-surface px-2 pb-5 pt-5 shadow-[0_10px_30px_rgba(37,43,61,0.07)]" aria-labelledby="membership-level-title">
        <div className="px-2">
          <h2 id="membership-level-title" className="text-base font-bold text-text-primary">会员等级</h2>
          <p className="mt-1 text-xs leading-5 text-text-secondary">四级会员视觉分层，当前等级以高亮标识</p>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2" aria-label={`${MEMBER_LEVELS.length} 个会员等级`}>
          {MEMBER_LEVELS.map((level, index) => {
            const visual = levelVisuals[index] ?? levelVisuals[0]
            const Icon = visual.icon
            const inverse = index === levelVisuals.length - 1
            return (
              <div
                key={level.label}
                className="flex min-h-[112px] min-w-0 flex-col items-center rounded-xl border px-1 pb-2 pt-3 text-center"
                style={{ backgroundColor: visual.surface, borderColor: visual.border }}
                data-level={level.label}
                data-level-current={level.current ? 'true' : undefined}
                aria-current={level.current ? 'true' : undefined}
              >
                <Icon className="h-7 w-7 stroke-[1.8]" style={{ color: visual.accent }} aria-hidden />
                <span className={`mt-2 text-xs font-semibold ${inverse ? 'text-white' : 'text-text-primary'}`}>{level.label}</span>
                <span className={`mt-1 whitespace-nowrap text-[10px] leading-4 ${inverse ? 'text-white/90' : 'text-text-secondary'}`}>
                  {level.name}
                </span>
                {level.current ? (
                  <span className="mt-auto rounded-full bg-white/10 px-2 py-0.5 text-[9px] leading-4 text-[#F6C65B]">当前</span>
                ) : null}
              </div>
            )
          })}
        </div>
      </section>

      <section className="px-3 pt-5" aria-labelledby="member-card-face-title">
        <div className="px-1">
          <h2 id="member-card-face-title" className="text-base font-bold text-text-primary">会员卡面</h2>
          <p className="mt-0.5 text-[10px] font-medium tracking-[0.08em] text-text-tertiary">MEMBERSHIP CARD COLLECTION</p>
        </div>

        <div className="mt-3 space-y-2">
          {MEMBER_CARD_FACES.map((card, index) => {
            const visual = cardFaceVisuals[index] ?? cardFaceVisuals[0]
            return (
              <article key={card.scene} className="flex min-h-[102px] items-center gap-2 rounded-2xl bg-surface p-1 shadow-[0_4px_16px_rgba(37,43,61,0.05)]">
                <div className="min-w-0 flex-1 py-2 pl-2">
                  <span className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-medium ${visual.tagClassName}`}>
                    {card.scene}
                  </span>
                  <h3 className="mt-1.5 text-sm font-bold text-text-primary">{card.name}</h3>
                  <p className="mt-1 text-[11px] leading-4 text-text-tertiary">{card.desc}</p>
                </div>
                <div className="relative aspect-[77/45] w-[46%] max-w-[164px] flex-none overflow-hidden rounded-xl">
                  <img src={visual.image} alt={`${card.name}会员卡面`} className="absolute inset-0 h-full w-full object-cover" />
                  <div className="absolute inset-0 flex flex-col justify-between p-2.5" style={{ color: visual.foreground }} aria-hidden>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold">DearSeed</span>
                      <span className="flex h-6 w-6 items-center justify-center rounded-full border border-current/60 text-[9px] font-bold">Ds</span>
                    </div>
                    <span className="text-[9px] font-medium tracking-[0.12em] opacity-75">MEMBER CARD</span>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <aside className="mx-4 mt-4 rounded-xl border border-border-subtle bg-surface px-3 py-2.5" data-rule-status="member-level">
        <p className="text-[11px] leading-[18px] text-text-tertiary">{MEMBER_RULE_STATUS.levelProgress.note}</p>
      </aside>

      <DebugPanel route={route} />
    </PageContainer>
  )
}
