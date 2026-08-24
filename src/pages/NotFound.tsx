import { useNavigate } from 'react-router-dom'
import PageContainer from '../components/mobile/PageContainer'
import { Button, EmptyState } from '../components/ui'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <PageContainer inset={false}>
      <div className="px-4 pt-3">
        <EmptyState
          title="页面不存在"
          supportingText="链接可能已失效，或该路由尚未开放。"
          primaryAction={<Button onClick={() => navigate('/')}>回到首页</Button>}
        />
      </div>
    </PageContainer>
  )
}
