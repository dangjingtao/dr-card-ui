import PageContainer from '../components/mobile/PageContainer'
import { Button, Card, Section, Tag } from '../components/ui'

/* T002 品牌 Token 展示页
 * - 默认/交互/状态/组合示例均直接消费 tokens.css + card-brand.css 的语义 Token。
 * - 语义与取值依据见 docs/design/token-sampling.md、docs/design/token-validation.md。
 * - 本页是工程参照页，不属于业务导航；不参与业务信息架构。
 */

function Swatch({ className, token, value, note = '' }: { className: string; token: string; value: string; note?: string }) {
  return (
    <div className="flex w-full items-center gap-3 rounded-control border border-border-subtle bg-surface p-2.5">
      <span className={`h-10 w-10 shrink-0 rounded-control border border-border-subtle ${className}`} aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-mono text-xs text-text-primary">{token}</span>
        <span className="block truncate font-mono text-[11px] text-text-tertiary">{value}</span>
      </span>
      {note && <span className="shrink-0 text-[11px] text-text-tertiary">{note}</span>}
    </div>
  )
}

function SwatchGrid({ items }: { items: Array<{ className: string; token: string; value: string; note?: string }> }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((s) => (
        <Swatch key={s.token} {...s} />
      ))}
    </div>
  )
}

export default function Tokens() {
  return (
    <PageContainer inset={false}>
      <div className="space-y-5 px-4 pt-2 pb-8">
        {/* 层级说明 */}
        <Card className="border border-border-subtle bg-surface-subtle">
          <p className="text-sm text-text-primary">
            分层：Com Design 基础层 → 卡博士品牌语义层 → 页面组件层。
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            primitive/semantic 见 tokens.css；品牌语义与组件 Token 见 card-brand.css；取样与校验见
            docs/design/token-sampling.md 与 token-validation.md。
          </p>
        </Card>

        {/* 1. 会员 */}
        <Section title="会员 Membership" supportingText="会员卡暗面 + 暖金高亮；等级色阶为展示稿占位（待 T006）">
          <SwatchGrid
            items={[
              { className: 'bg-member-surface', token: '--color-member-surface', value: 'ink-900 #1C1B18' },
              { className: 'bg-member-accent', token: '--color-member-accent', value: 'premium-300 #EDBC6C' },
              { className: 'bg-member-muted', token: '--color-member-muted', value: 'premium-100 #FFF0C7' },
              { className: 'bg-member-level-0', token: '--color-member-level-0', value: 'premium-200 占位' },
              { className: 'bg-member-level-1', token: '--color-member-level-1', value: 'premium-300 占位' },
              { className: 'bg-member-level-2', token: '--color-member-level-2', value: 'premium-400 占位' },
              { className: 'bg-member-level-3', token: '--color-member-level-3', value: 'premium-500 占位' },
              { className: 'bg-[var(--gradient-member)]', token: '--gradient-member', value: '会员卡渐变' },
            ]}
          />
          <div className="mt-3 rounded-container bg-member-surface p-4 text-member-text shadow-member">
            <div className="text-xs text-member-accent">MEMBER</div>
            <div className="mt-1 text-lg font-semibold">卡博士会员</div>
            <div className="mt-1 flex items-center gap-2">
              {['L1', 'L2', 'L3', 'L4'].map((lv, i) => (
                <span key={lv} className={`rounded-pill px-2 py-0.5 text-[11px] text-member-text bg-member-level-${i}`}>
                  {lv}
                </span>
              ))}
            </div>
          </div>
        </Section>

        {/* 2. 泡泡值 */}
        <Section title="泡泡值 Bubble Points" supportingText="金色奖励语义；原型红色表达为冲突记录（见 token-sampling.md）">
          <SwatchGrid
            items={[
              { className: 'bg-bubble-surface', token: '--color-bubble-surface', value: 'premium-50 #FFF9EA' },
              { className: 'bg-bubble-accent', token: '--color-bubble-accent', value: 'premium-300 #EDBC6C' },
              { className: 'bg-bubble-text', token: '--color-bubble-text', value: 'premium-900 #332514' },
              { className: 'bg-bubble-on-gold', token: '--color-bubble-on-gold', value: 'premium-900 金面文字' },
            ]}
          />
          <div className="mt-3 rounded-2xl bg-[var(--gradient-bubble)] p-4 text-bubble-on-gold shadow-bubble">
            <p className="text-sm text-bubble-on-gold-muted">今日泡泡值</p>
            <p className="mt-1 text-3xl font-semibold">1280</p>
            <button className="mt-4 rounded-full bg-surface px-5 py-2 text-sm text-bubble-on-gold-muted">查看积分详情</button>
          </div>
        </Section>

        {/* 3. 卡券状态 */}
        <Section title="卡券 Coupon" supportingText="可用/已使用/已过期三态需可区分；#9F8189 豆沙色为原型冲突记录">
          <SwatchGrid
            items={[
              { className: 'bg-coupon-surface', token: '--color-coupon-surface', value: 'warm-50 #FCF8F1' },
              { className: 'bg-coupon-accent', token: '--color-coupon-accent', value: 'premium-300 #EDBC6C' },
              { className: 'bg-coupon-available', token: '--color-coupon-available', value: 'success-500 #21B66F' },
              { className: 'bg-coupon-used', token: '--color-coupon-used', value: 'neutral-800 #5C5C5C' },
              { className: 'bg-coupon-expired', token: '--color-coupon-expired', value: 'danger-500 #D63E50' },
            ]}
          />
          <div className="mt-3 space-y-2">
            {(
              [
                { label: '可用', bg: 'bg-coupon-available-bg', color: 'text-coupon-available', border: 'border-coupon-available' },
                { label: '已使用', bg: 'bg-coupon-used-bg', color: 'text-coupon-used', border: 'border-coupon-used' },
                { label: '已过期', bg: 'bg-coupon-expired-bg', color: 'text-coupon-expired', border: 'border-coupon-expired' },
              ] as const
            ).map((s) => (
              <div key={s.label} className={`flex items-center justify-between rounded-coupon border ${s.border} ${s.bg} px-3 py-2.5`}>
                <span className="text-sm font-medium text-coupon-text">DearSeed 洗发水样包</span>
                <Tag variant={s.label === '可用' ? 'success' : s.label === '已使用' ? 'neutral' : 'danger'}>{s.label}</Tag>
              </div>
            ))}
          </div>
        </Section>

        {/* 4. 澡运 */}
        <Section title="今日澡运 Luck" supportingText="大吉/中吉/小吉三态来自历史稿 T03，规则待 T006 决策">
          <div className="flex items-end gap-3">
            {(
              [
                { name: '大吉', g: 'var(--gradient-luck-great)', cls: 'bg-luck-great', token: '--color-luck-great', value: 'premium-300' },
                { name: '中吉', g: 'var(--gradient-luck-good)', cls: 'bg-luck-good', token: '--color-luck-good', value: 'brand-400' },
                { name: '小吉', g: 'var(--gradient-luck-minor)', cls: 'bg-luck-minor', token: '--color-luck-minor', value: 'neutral-300' },
              ] as const
            ).map((s) => (
              <div key={s.name} className="flex flex-1 flex-col items-center gap-1.5">
                <div style={{ background: s.g }} className="flex h-16 w-16 items-center justify-center rounded-luck text-lg font-bold text-luck-text-on shadow-luck">
                  {s.name}
                </div>
                <span className="font-mono text-[10px] text-text-tertiary">{s.token}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* 5. 搭子 / 客服 / 领取 / 兑换 */}
        <Section title="搭子 · 客服 · 领取 · 兑换" supportingText="搭子页已由 T007 落地；客服/兑换页待 T008/T013 确认，Token 先落命名与默认值">
          <SwatchGrid
            items={[
              { className: 'bg-buddy-accent', token: '--color-buddy-accent', value: 'brand-500 #F25B26', note: '搭子' },
              { className: 'bg-buddy-mutual', token: '--color-buddy-mutual', value: 'premium-400 默契值(仅预留)', note: '搭子·D-059 禁页面引用' },
              { className: 'bg-support-user-bubble', token: '--color-support-user-bubble', value: 'brand-600', note: '客服' },
              { className: 'bg-support-queue', token: '--color-support-queue', value: 'warning-500', note: '客服·排队' },
              { className: 'bg-support-connected', token: '--color-support-connected', value: 'success-500', note: '客服·已接入' },
              { className: 'bg-claim-accent', token: '--color-claim-accent', value: 'premium-400', note: '领取' },
              { className: 'bg-checkin-success', token: '--color-checkin-success', value: 'success-500', note: '打卡' },
              { className: 'bg-redpacket', token: '--color-redpacket', value: 'danger-500 红包(占位)', note: '红包' },
              { className: 'bg-exchange-price', token: '--color-exchange-price', value: 'danger-500 原型红价', note: '兑换' },
              { className: 'bg-exchange-accent', token: '--color-exchange-accent', value: 'brand-500', note: '兑换' },
            ]}
          />
        </Section>

        {/* 6. 状态色 */}
        <Section title="状态色 Status" supportingText="success / warning / danger / info 的底 + 文组合">
          <div className="space-y-2">
            <div className="flex gap-2">
              <Tag variant="success">成功</Tag>
              <Tag variant="warning">警告</Tag>
              <Tag variant="danger">危险</Tag>
              <Tag variant="info">信息</Tag>
              <Tag variant="brand">品牌</Tag>
              <Tag variant="neutral">中性</Tag>
            </div>
            <AlertDemo />
          </div>
        </Section>

        {/* 7. 交互态 */}
        <Section title="交互态 Interaction" supportingText="默认 / 按下(active) / 禁用 / 聚焦">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button variant="primary">主要按钮</Button>
              <Button variant="secondary">次要按钮</Button>
              <Button variant="outline">描边按钮</Button>
              <Button variant="ghost">幽灵按钮</Button>
              <Button variant="destructive">危险按钮</Button>
              <Button disabled>禁用按钮</Button>
            </div>
            <input
              aria-label="聚焦示例"
              placeholder="聚焦时边框变为 primary"
              className="min-h-10 w-full rounded-control border border-border bg-surface px-3 text-base outline-none placeholder:text-text-placeholder focus:border-border-focused"
            />
          </div>
        </Section>

        {/* 8. 组件组合 */}
        <Section title="组合示例 Combination" supportingText="会员卡 + 泡泡值 + 打卡态在同一 375 宽度内的组合">
          <div className="space-y-3">
            <div className="rounded-container bg-member-surface p-4 text-member-text shadow-member">
              <div className="flex items-center justify-between">
                <div className="text-xs text-member-accent">MEMBER</div>
                <span className="rounded-pill bg-member-accent px-2 py-0.5 text-[11px] text-member-text">Lv.3</span>
              </div>
              <div className="mt-2 text-xl font-semibold">卡博士会员</div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-pill bg-[var(--color-member-track)]">
                <div className="h-full w-2/3 rounded-pill bg-member-accent" />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-container border border-border-subtle bg-surface px-4 py-3">
              <div>
                <div className="text-sm text-text-secondary">连续签到 3 天</div>
                <div className="mt-0.5 text-xs text-text-tertiary">再签 7 天可得 10 🫧</div>
              </div>
              <span className="rounded-pill bg-checkin-success px-3 py-1.5 text-xs text-text-inverse">已打卡</span>
            </div>
          </div>
        </Section>
      </div>
    </PageContainer>
  )
}

function AlertDemo() {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <div className="rounded-control bg-success-bg p-3 text-success-text">成功：打卡成功 +100🫧</div>
      <div className="rounded-control bg-warning-bg p-3 text-warning-text">警告：卡券即将到期</div>
      <div className="rounded-control bg-danger-bg p-3 text-danger-text">危险：兑换失败</div>
      <div className="rounded-control bg-info-bg p-3 text-info-text">信息：活动进行中</div>
    </div>
  )
}
