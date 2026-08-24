import { useNavigate } from 'react-router-dom'
import { ChevronRight, Clover, Gift, HandHelping, ListChecks, Ticket } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import DebugPanel from '../components/mobile/DebugPanel'
import PageContainer from '../components/mobile/PageContainer'
import { Button, ProgressIndicator } from '../components/ui'
import { findRouteByPathname } from '../app/router/routes'
import { BUBBLE_BALANCE, CAMPAIGN_FIXTURE, MEMBER_ENTRIES, MEMBER_PROFILE } from '../app/fixtures'
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
        className="relative mx-4 overflow-hidden rounded-card bg-member-surface shadow-member"
        aria-label="会员等级与泡泡值"
      >
        <img src={lv4Hero} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-60" />
        <div className="relative px-5 pb-5 pt-4">
          <p className="text-[11px] tracking-[0.18em] text-member-accent">{MEMBER_PROFILE.brandLine}</p>
          <div className="mt-3 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-lg font-medium text-member-text">{MEMBER_PROFILE.nickname}</p>
              <span className="mt-2 inline-flex items-center rounded-pill bg-member-accent px-2.5 py-1 text-xs font-medium text-bubble-on-gold">
                {MEMBER_PROFILE.levelLabel} {MEMBER_PROFILE.levelName}
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/points')}
              aria-label={`泡泡值余额 ${BUBBLE_BALANCE}，查看明细`}
              className="flex-none text-right"
            >
              <span className="block text-2xl font-semibold leading-none text-member-accent">
                {BUBBLE_BALANCE.toLocaleString()}
              </span>
              <span className="mt-1 flex items-center justify-end gap-0.5 text-[11px] text-member-muted">
                {MEMBER_PROFILE.bubbleUnit}
                <ChevronRight className="h-3 w-3" aria-hidden />
              </span>
            </button>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-member-accent/20 pt-3">
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
        className="mx-4 rounded-feature border border-border-subtle bg-surface p-3 shadow-[0_10px_28px_rgba(51,37,20,0.06)]"
        aria-label="会员玩法入口"
      >
        <div className="flex items-center justify-between px-1 pb-2">
          <h2 className="text-[15px] font-semibold text-text-primary">会员服务</h2>
          <span className="text-[11px] text-text-tertiary">专属玩法</span>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {MEMBER_ENTRIES.map((entry) => {
            const Icon = entryIcons[entry.id] ?? Clover
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => navigate(entry.to)}
                className="group flex min-w-0 flex-col items-center gap-2 rounded-container px-1 py-2.5 transition active:bg-surface-pressed"
              >
                <span
                  className="relative flex h-11 w-14 items-center justify-center overflow-hidden rounded-pill border border-member-accent/20 bg-member-surface shadow-sm transition duration-150 group-active:scale-[0.96]"
                  style={{ backgroundImage: 'var(--gradient-member)' }}
                >
                  <span className="absolute inset-x-2 top-0 h-px bg-member-accent opacity-60" aria-hidden />
                  <Icon className="relative h-5 w-5 text-member-accent" strokeWidth={1.8} aria-hidden />
                </span>
                <span className="w-full truncate text-center text-xs font-medium text-text-secondary">{entry.name}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="mx-4 rounded-feature border border-border-subtle bg-surface p-4 shadow-[0_10px_28px_rgba(51,37,20,0.06)]">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-reward-subtle text-reward-strong">
              <Gift className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <h2 className="text-[15px] font-semibold text-text-primary">本期活动</h2>
              <p className="text-[10px] text-text-tertiary">会员限定福利</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/checkin')}
            className="flex min-h-9 items-center gap-0.5 rounded-pill px-2 text-xs text-text-secondary active:bg-surface-pressed"
          >
            {campaign.moreLabel}
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </button>
        </header>

        <div className="mt-3 overflow-hidden rounded-container bg-claim-surface p-3">
          <div className="flex items-center gap-3">
            <img
              src={campaignThumb}
              alt={campaign.title}
              className="h-[72px] w-[72px] flex-none rounded-coupon border border-surface object-cover shadow-sm"
            />
            <div className="min-w-0 flex-1">
              <span className="inline-flex rounded-pill bg-surface px-2 py-1 text-[10px] font-semibold text-reward-text">打卡福利</span>
              <p className="mt-1.5 line-clamp-2 text-sm font-semibold leading-5 text-claim-text">{campaign.title}</p>
              <p className="mt-1 text-[11px] text-text-secondary">累计打卡 {campaign.days} / {campaign.target} 天</p>
            </div>
          </div>

          <div className="mt-3 rounded-control bg-surface/70 p-2.5">
            <div className="mb-2 flex items-center justify-between text-[11px]">
              <span className="text-text-secondary">本期打卡进度</span>
              <span className="font-semibold text-reward-text">{campaign.days} / {campaign.target}</span>
            </div>
            <ProgressIndicator
              label={`累计打卡进度 ${campaign.days} / ${campaign.target} 天`}
              value={campaign.days}
              max={campaign.target}
            />
          </div>

          <Button
            size="regular"
            className="mt-3 w-full rounded-pill text-xs"
            onClick={() => navigate('/claim/success?from=campaign')}
          >
            {campaign.claimLabel}
          </Button>
        </div>
      </section>

      <DebugPanel route={route} />
    </PageContainer>
  )
}
