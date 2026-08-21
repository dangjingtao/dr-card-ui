import Header from '../components/mobile/Header'
import PageContainer from '../components/mobile/PageContainer'
import MemberCard from '../components/card/MemberCard'
import ValueCard from '../components/card/ValueCard'
import { Section } from '../components/ui'

const quickActions = [
  '泡泡值',
  '会员中心',
  '兑换商城',
  '我的卡包',
]

const activities = [
  '新人礼包领取',
  '今日签到',
  '洗头搭子邀请',
]

export default function Home() {
  return (
    <PageContainer className="px-0">
      <Header />
      <main className="space-y-5 px-4 pt-2 pb-8">
        <MemberCard />

        <section className="rounded-2xl bg-gradient-to-br from-[#D9B36C] to-[#C9A86A] p-4 text-white shadow-[0_8px_24px_rgba(0,0,0,.08)]">
          <p className="text-sm opacity-90">今日泡泡值</p>
          <p className="mt-1 text-3xl font-semibold">1280</p>
          <button className="mt-4 rounded-full bg-white px-5 py-2 text-sm text-[#8B6B32]">
            查看积分详情
          </button>
        </section>

        <Section title="快捷入口" supportingText="会员、兑换、卡包等核心服务">
          <div className="grid grid-cols-4 gap-3">
            {quickActions.map((item) => (
              <button key={item} className="rounded-xl bg-white p-3 text-xs text-[#1A1A1A] shadow-sm">
                {item}
              </button>
            ))}
          </div>
        </Section>

        <Section title="活动中心" supportingText="发现诗得丽最新福利">
          <div className="space-y-3">
            {activities.map((item) => (
              <div key={item} className="rounded-xl border border-[#E5E5E5] bg-white p-3 text-sm">
                {item}
              </div>
            ))}
          </div>
        </Section>

        <Section title="我的账户">
          <ValueCard value={1280} />
        </Section>
      </main>
    </PageContainer>
  )
}
