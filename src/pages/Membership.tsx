import { useNavigate } from 'react-router-dom'
import { ChevronRight, Clover, Crown, HandHelping, ListChecks, Ticket } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import DebugPanel from '../components/mobile/DebugPanel'
import PageContainer from '../components/mobile/PageContainer'
import { Button, ProgressIndicator } from '../components/ui'
import { findRouteByPathname } from '../app/router/routes'
import {
  BUBBLE_BALANCE,
  CAMPAIGN_FIXTURE,
  MEMBER_ENTRIES,
  MEMBER_PROFILE,
  MEMBER_SECTION_LABELS,
} from '../app/fixtures'
import lv4Hero from '../assets/brand/member/member-lv4-hero.webp'
import campaignThumb from '../assets/brand/member/checkin-dearseed-kit.webp'

/**
 * 会员中心（#6）
 * 事实源：docs/prototype/02-membership-and-checkin.md §1
 * - 页面内容：会员等级与状态、泡泡值余额、四入口（今日澡运 / 是日任务 / 优惠卡包 / 洗头搭子）、底部「本期活动」。
 * ⚠️ 与 reference/D-007 的差异：历史稿把四入口写成「今日幸运 / 每日任务」，与原型文案不一致，
 *    按 AGENTS §7 改回原型口径，不做「文案优化」；等级 hero 的品牌艺术表现保留（AGENTS §3）。
 * ⚠️ 历史稿的「连续打卡 7 天 · 福利加倍 / 5 / 5 已完成 / 限定洗护套装」属自行补写的活动规则，
 *    本次改为复用首页已确认的 CAMPAIGN_FIXTURE（T005 已验收口径），不再另造一套活动规则。
 * ⚠️ 等级命名与权益未决规则隔离在 MEMBER_RULE_STATUS（B-022 / B-023）。
 *
 * 本次按用户提供的视觉参考图重排版面：
 * - 会员页新增视觉优先消费既有 token / Tailwind 语义类与 CSS 变量（如 --gradient-bubble、
 *   --gradient-member），避免在页面内另起一套组件 Token。
 * - hero 卡面此前叠在 bg-member-surface 上且 opacity-60，把素材本身的绿金卡面压灰；本次改为满幅呈现。
 * - 「前往领取」继续复用全局 Button primary 语义，不让会员页另起一套按钮颜色、按压态和圆角规则。
 */
export default function Membership() {
  const navigate = useNavigate()
  const route = findRouteByPathname('/membership')
  const campaign = CAMPAIGN_FIXTURE

  const entryIcons: Record<string, LucideIcon> = {
    luck: Clover,
    task: ListChecks,
    coupon: Ticket,
    buddy: HandHelping,
  }

  return (
    <PageContainer inset={false} className="space-y-4 pb-24 pt-2">
      <section
        className="relative mx-4 overflow-hidden rounded-feature bg-member-surface shadow-member"
        aria-label="会员等级与泡泡值"
      >
        <img src={lv4Hero} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
        <div className="relative px-5 pb-4 pt-5">
          <p className="text-[11px] tracking-[0.2em] text-member-accent">{MEMBER_PROFILE.brandLine}</p>
          <div className="mt-4 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[22px] font-medium leading-tight text-member-text">{MEMBER_PROFILE.nickname}</p>
              <span
                className="mt-2.5 inline-flex items-center rounded-pill px-3 py-1 text-xs font-semibold text-bubble-on-gold"
                style={{ backgroundImage: 'var(--gradient-bubble)' }}
              >
                {MEMBER_PROFILE.levelLabel} {MEMBER_PROFILE.levelName}
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/points')}
              aria-label={`泡泡值余额 ${BUBBLE_BALANCE}，查看明细`}
              className="flex-none rounded-container text-right"
            >
              <span className="block text-[28px] font-semibold leading-none text-member-accent">
                {BUBBLE_BALANCE.toLocaleString()}
              </span>
              <span className="mt-1.5 block text-[11px] tracking-[0.02em] text-member-muted">
                {MEMBER_PROFILE.bubbleUnit}
              </span>
            </button>
          </div>
          <div className="mt-4 h-px bg-member-muted/45" aria-hidden />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[11px] tracking-[0.14em] text-member-muted">{MEMBER_PROFILE.cardNo}</span>
            <button
              type="button"
              onClick={() => navigate('/membership/levels')}
              className="flex items-center gap-0.5 text-xs text-member-accent"
            >
              {MEMBER_PROFILE.levelEntryLabel}
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        </div>
      </section>

      <section
        className="mx-4 rounded-feature border border-border-subtle bg-claim-surface p-4 shadow-[0_10px_28px_rgba(51,37,20,0.06)]"
        aria-label="会员玩法入口"
      >
        <h2 className="pb-1 text-base font-semibold text-text-primary">{MEMBER_SECTION_LABELS.entriesTitle}</h2>
        <div className="mt-3 grid grid-cols-4 gap-1">
          {MEMBER_ENTRIES.map((entry) => {
            const Icon = entryIcons[entry.id] ?? Clover
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => navigate(entry.to)}
                className="group flex min-w-0 flex-col items-center gap-2 rounded-container px-0.5 py-1.5 transition active:bg-surface-pressed"
              >
                <span
                  className="flex h-[54px] w-[54px] items-center justify-center rounded-full p-[3px] shadow-member transition duration-150 group-active:scale-[0.96]"
                  style={{ backgroundImage: 'var(--gradient-bubble)' }}
                >
                  <span
                    className="flex h-full w-full items-center justify-center rounded-full bg-member-surface"
                    style={{ backgroundImage: 'var(--gradient-member)' }}
                  >
                    <Icon className="h-6 w-6 text-member-accent" strokeWidth={1.8} aria-hidden />
                  </span>
                </span>
                <span className="w-full truncate text-center text-[13px] font-semibold text-text-primary">
                  {entry.name}
                </span>
                <span className="-mt-1 w-full truncate text-center text-[11px] text-text-tertiary">
                  {entry.subtitle}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="relative mx-4 overflow-hidden rounded-feature border border-border-subtle bg-claim-surface p-4 shadow-[0_10px_28px_rgba(51,37,20,0.06)]">
        <span
          className="absolute -right-11 top-4 w-36 rotate-45 py-1 text-center text-[10px] font-semibold tracking-[0.08em] text-bubble-on-gold"
          style={{ backgroundImage: 'var(--gradient-bubble)' }}
        >
          进行中
        </span>

        <header className="flex items-center gap-2 pr-16">
          <Crown className="h-5 w-5 flex-none text-reward-strong" aria-hidden />
          <h2 className="text-base font-semibold text-text-primary">本期活动</h2>
          <p className="truncate text-xs text-text-tertiary">会员限定福利</p>
        </header>

        <div className="mt-3 flex items-center gap-3">
          <img
            src={campaignThumb}
            alt={campaign.title}
            className="h-[92px] w-[92px] flex-none rounded-coupon border border-surface object-cover shadow-sm"
          />
          <div className="min-w-0 flex-1">
            <span className="inline-flex rounded-pill bg-surface px-2.5 py-1 text-[11px] font-semibold text-reward-text">
              打卡福利
            </span>
            <p className="mt-2 line-clamp-2 text-[15px] font-semibold leading-5 text-claim-text">{campaign.title}</p>
            <p className="mt-1.5 text-[11px] text-text-secondary">
              累计打卡 {campaign.days} / {campaign.target} 天　即可领取
            </p>
          </div>
        </div>

        <div className="mt-3.5">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-text-secondary">本期打卡进度</span>
            <span className="font-semibold text-reward-text">
              {campaign.days} / {campaign.target}
            </span>
          </div>
          <ProgressIndicator
            label={`累计打卡进度 ${campaign.days} / ${campaign.target} 天`}
            value={campaign.days}
            max={campaign.target}
            className="[&>div>div]:bg-[image:var(--gradient-bubble)] [&>div]:h-2 [&>div]:bg-surface"
          />
        </div>

        <Button
          size="large"
          onClick={() => navigate('/claim/success?from=campaign')}
          className="mt-4 w-full rounded-pill text-[15px] shadow-primary-button"
        >
          {campaign.claimLabel}
        </Button>
      </section>

      <DebugPanel route={route} />
    </PageContainer>
  )
}
