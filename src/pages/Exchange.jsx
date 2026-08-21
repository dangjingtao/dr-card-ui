import Header from '../components/mobile/Header'
import PageContainer from '../components/mobile/PageContainer'
import { Card } from '../components/ui'

export default function Exchange() {
  return (
    <PageContainer className="px-0">
      <Header title="兑换" />
      <div className="px-4 py-4">
        <Card className="border border-border-subtle">
          <h1 className="font-semibold text-text-primary">兑换中心</h1>
          <p className="mt-2 text-sm text-text-secondary">兑换码与权益页面将在这里继续完善。</p>
        </Card>
      </div>
    </PageContainer>
  )
}
