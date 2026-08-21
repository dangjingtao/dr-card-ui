import Header from '../components/mobile/Header'
import PageContainer from '../components/mobile/PageContainer'
import { Button, Card, Input } from '../components/ui'

export default function Exchange() {
  return (
    <PageContainer className="px-0">
      <Header title="兑换" />
      <div className="px-4 pt-2">
        <Card>
          <div className="space-y-4">
            <Input label="兑换码" placeholder="请输入兑换码" />
            <Button className="w-full">立即兑换</Button>
          </div>
        </Card>
      </div>
    </PageContainer>
  )
}
