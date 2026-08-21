import Header from '../components/mobile/Header'
import PageContainer from '../components/mobile/PageContainer'
import { Card as SurfaceCard, EmptyState } from '../components/ui'

export default function CardPage() {
  return (
    <PageContainer className="px-0">
      <Header title="卡包" />
      <div className="px-4 pt-2">
        <SurfaceCard>
          <EmptyState title="还没有卡片" supportingText="后续卡博士业务卡片会在这里沉淀。" />
        </SurfaceCard>
      </div>
    </PageContainer>
  )
}
