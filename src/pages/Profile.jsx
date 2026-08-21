import Header from '../components/mobile/Header'
import PageContainer from '../components/mobile/PageContainer'
import { Avatar, Card, ListItem } from '../components/ui'

export default function Profile() {
  return (
    <PageContainer className="px-0">
      <Header title="我的" />
      <div className="space-y-4 px-4 py-4">
        <Card className="flex items-center gap-3 border border-border-subtle">
          <Avatar name="卡博士用户" size="large" />
          <div>
            <div className="font-semibold text-text-primary">卡博士用户</div>
            <div className="text-sm text-text-secondary">个人资料</div>
          </div>
        </Card>
        <Card className="overflow-hidden p-0">
          <ListItem title="账号与安全" actionable />
        </Card>
      </div>
    </PageContainer>
  )
}
