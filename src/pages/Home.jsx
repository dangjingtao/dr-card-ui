import Header from '../components/mobile/Header'
import PageContainer from '../components/mobile/PageContainer'
import { Card, Tag } from '../components/ui'

export default function Home() {
  return (
    <PageContainer className="px-0">
      <Header title="卡博士" />
      <div className="space-y-4 px-4 py-4">
        <Card className="border border-border-subtle">
          <Tag variant="brand">Com Design · Premium Gold</Tag>
          <h1 className="mt-3 text-xl font-semibold text-text-primary">移动 UI 基建已就绪</h1>
          <p className="mt-2 text-sm text-text-secondary">首页高保真内容从这里继续施工。</p>
        </Card>
      </div>
    </PageContainer>
  )
}
