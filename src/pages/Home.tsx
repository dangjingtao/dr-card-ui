import Header from '../components/mobile/Header'
import PageContainer from '../components/mobile/PageContainer'
import MemberCard from '../components/card/MemberCard'
import ValueCard from '../components/card/ValueCard'
import { Section } from '../components/ui'

export default function Home() {
  return (
    <PageContainer className="px-0">
      <Header />
      <div className="space-y-5 px-4 pt-2">
        <MemberCard />
        <Section title="我的账户" supportingText="Com Design Premium Gold 移动端基座">
          <ValueCard value={1280} />
        </Section>
      </div>
    </PageContainer>
  )
}
