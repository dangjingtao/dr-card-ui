import { useLocation, useNavigate } from 'react-router-dom'
import PageContainer from '../components/mobile/PageContainer'
import FixtureOverlay from '../components/mobile/FixtureOverlay'
import { Card, Tag } from '../components/ui'
import { findRouteByPathname } from '../app/router/routes'
import { useFixtureState } from '../app/fixtures/useFixture'

/**
 * 确定性施工占位页（NodeStub）
 * -------------------------------------------------------------
 * 承载 T005–T013 尚未施工的节点：明确标记「TXXX 施工中」，不伪装成已完成页面，
 * 满足 T004「现有路由不得因纯占位被误判完成」。所有状态通过 `?state=` / `?overlay=`
 * 可复现，验收不必改源码。
 */
export default function NodeStub() {
  const location = useLocation()
  const navigate = useNavigate()
  const route = findRouteByPathname(location.pathname)
  const { raw, state } = useFixtureState(route)

  if (!route) return null

  const setQuery = (key: 'state' | 'overlay', value: string) => {
    const search = new URLSearchParams(location.search)
    search.set(key, value)
    navigate(`${location.pathname}?${search.toString()}`, { replace: true })
  }

  return (
    <PageContainer inset={false}>
      <div className="px-4 pb-8 pt-3">
        <Card>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Tag variant="warning">{route.task} 施工中</Tag>
              <Tag variant="neutral">{route.path}</Tag>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">{route.title}</h2>
              <p className="mt-1 text-sm text-text-secondary">{route.owner}</p>
            </div>

            <dl className="space-y-2 text-sm">
              <div className="flex gap-3">
                <dt className="w-16 shrink-0 text-text-tertiary">节点</dt>
                <dd className="text-text-primary">{route.nodes.join('、')}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-16 shrink-0 text-text-tertiary">入口</dt>
                <dd className="text-text-primary">{route.entry ?? '—'}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-16 shrink-0 text-text-tertiary">返回</dt>
                <dd className="text-text-primary">{route.returnTo ?? '—'}</dd>
              </div>
            </dl>

            {route.states && route.states.length > 0 && (
              <div>
                <div className="text-sm font-medium text-text-primary">确定性状态（?state=）</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {route.states.map((item) => (
                    <button key={item.key} type="button" onClick={() => setQuery('state', item.key)}>
                      <Tag variant={raw === item.key ? 'brand' : 'neutral'}>
                        {item.key} · #<b>{item.node}</b>
                      </Tag>
                    </button>
                  ))}
                </div>
                {state && (
                  <p className="mt-2 text-xs text-text-secondary">当前 fixture 状态：{state.label}</p>
                )}
              </div>
            )}

            {route.overlays && route.overlays.length > 0 && (
              <div>
                <div className="text-sm font-medium text-text-primary">可复现弹层（?overlay=）</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {route.overlays.map((item) => (
                    <button key={item.key} type="button" onClick={() => setQuery('overlay', item.key)}>
                      <Tag variant="brand">
                        {item.key} · #<b>{item.node}</b>
                      </Tag>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
      <FixtureOverlay route={route} />
    </PageContainer>
  )
}
