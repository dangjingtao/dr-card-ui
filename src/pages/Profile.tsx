import { ChevronRight, Settings } from 'lucide-react'
import Header from '../components/mobile/Header'
import PageContainer from '../components/mobile/PageContainer'
import { Avatar, Card, IconButton, ListItem } from '../components/ui'

export default function Profile() {
  return (
    <PageContainer className="px-0">
      <Header title="我的" actions={[<IconButton key="settings" icon={Settings} label="设置" />]} />
      <div className="space-y-4 px-4 pt-2">
        <Card className="flex items-center gap-3">
          <Avatar name="卡博士" size="large" />
          <div>
            <div className="font-semibold text-text-primary">卡博士用户</div>
            <div className="text-sm text-text-secondary">欢迎回来</div>
          </div>
        </Card>
        <Card className="overflow-hidden p-0">
          <ListItem title="账户与安全" actionable trailing={<ChevronRight className="h-5 w-5" />} />
          <ListItem title="关于卡博士" actionable trailing={<ChevronRight className="h-5 w-5" />} />
        </Card>
      </div>
    </PageContainer>
  )
}
