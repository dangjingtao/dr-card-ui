import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { LoaderCircle, RotateCw, XCircle } from 'lucide-react'
import DebugPanel from '../components/mobile/DebugPanel'
import PageContainer from '../components/mobile/PageContainer'
import { Button, Card, EmptyState, IconButton, Tag } from '../components/ui'
import { findRouteByPathname } from '../app/router/routes'
import { useFixtureState } from '../app/fixtures/useFixture'

/**
 * H5 商城 WebView 边界页（T004 建立，T008 定案）
 * -------------------------------------------------------------
 * 用户确认 H5 商城（#17/#48/#49）承载为 WebView 边界页：
 * 商城列表、商品详情、购物车均不在本仓库做原生还原，本页只提供
 * 浏览器外壳占位 + 加载/已加载/失败三种确定性状态（`?state=`）。
 * 洗护兑换专区（#18/#37/#38/#39/#40）为本地原生页，见 pages/Exchange.tsx。
 */
export default function WebViewBoundary() {
  const location = useLocation()
  const navigate = useNavigate()
  const params = useParams<{ id?: string }>()
  const route = findRouteByPathname(location.pathname)
  const { raw } = useFixtureState(route)
  const mode = raw ?? 'loaded'

  const host = 'https://mall.shiideli.example'
  const fakeUrl =
    route?.path === '/mall/goods/:id'
      ? `${host}/goods/${params.id ?? '000'}`
      : route?.path === '/mall/cart'
        ? `${host}/cart`
        : `${host}/list`

  return (
    <PageContainer inset={false}>
      <div className="px-4 pb-8 pt-3">
        <Card>
          <div className="flex items-center gap-2">
            <Tag variant="warning">WebView 边界</Tag>
            <Tag variant="neutral">{route?.path}</Tag>
          </div>

          <div className="mt-3 overflow-hidden rounded-container border border-border-subtle">
            {/* 浏览器外壳占位 */}
            <div className="flex items-center gap-2 border-b border-border-subtle bg-surface-subtle px-3 py-2">
              <div className="flex shrink-0 gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-danger" />
                <span className="h-2.5 w-2.5 rounded-full bg-warning" />
                <span className="h-2.5 w-2.5 rounded-full bg-success" />
              </div>
              <div className="min-w-0 flex-1 truncate rounded-pill bg-surface px-3 py-1 text-xs text-text-tertiary">
                {fakeUrl}
              </div>
              <IconButton icon={RotateCw} label="刷新" size="regular" variant="ghost" />
            </div>

            <div className="flex h-64 items-center justify-center bg-background px-4">
              {mode === 'loading' && (
                <div className="flex flex-col items-center gap-2">
                  <LoaderCircle className="h-6 w-6 animate-spin text-text-brand" />
                  <span className="text-sm text-text-secondary">H5 加载中…</span>
                </div>
              )}
              {mode === 'error' && (
                <EmptyState
                  title="H5 加载失败"
                  supportingText="网络或宿主异常，请检查后重试。"
                  visual={<XCircle className="h-10 w-10" />}
                  primaryAction={
                    <Button variant="outline" onClick={() => navigate(`${location.pathname}?state=loaded`, { replace: true })}>
                      重试
                    </Button>
                  }
                />
              )}
              {mode === 'loaded' && (
                <EmptyState
                  title={route?.title ?? 'H5 页面'}
                  supportingText="WebView 边界页：商城 H5 由宿主承载，本仓库只保留边界与状态占位。"
                />
              )}
            </div>
          </div>

        </Card>

        {/* 状态切换统一交给 DebugPanel，遵守「调试面板只在 ?debug=1 下出现」（D-021） */}
        <DebugPanel route={route} />
      </div>
    </PageContainer>
  )
}
