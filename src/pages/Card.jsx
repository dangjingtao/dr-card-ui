import Header from '../components/mobile/Header'
import PageContainer from '../components/mobile/PageContainer'
import MemberCard from '../components/card/MemberCard'

export default function CardPage() {
  return (
    <PageContainer className="px-0">
      <Header title="卡包" />
      <div className="px-4 py-4">
        <MemberCard />
      </div>
    </PageContainer>
  )
}
