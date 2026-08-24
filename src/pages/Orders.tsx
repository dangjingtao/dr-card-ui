import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PackageOpen } from 'lucide-react'
import PageContainer from '../components/mobile/PageContainer'
import DebugPanel from '../components/mobile/DebugPanel'
import { Button, EmptyState, SegmentedControl } from '../components/ui'
import { useFixtureState } from '../app/fixtures/useFixture'
import { findRouteByPathname } from '../app/router/routes'
import {
  ORDER_COPY,
  ORDER_DELIVERY_LABEL,
  ORDER_TABS,
  formatYuan,
  orderPayable,
  orderQuantity,
  ordersByTab,
  type OrderFixture,
  type OrderTabKey,
} from '../app/fixtures'

/** 配送状态取色：进行中用信息色，售后用警示色，已完成收敛为次级文字 */
const DELIVERY_CLASS: Record<OrderFixture['delivery'], string> = {
  received: 'text-text-tertiary',
  shipped: 'text-info-text',
  pending: 'text-reward-text',
  aftersale: 'text-warning-text',
}

export default function Orders() {
  const navigate = useNavigate()
  const route = findRouteByPathname('/orders')
  const { state } = useFixtureState(route)

  /** `?state=` 直达某个 Tab，保证四个分类都能被单独截图复现 */
  const initialTab: OrderTabKey =
    state?.key === 'completed' || state?.key === 'ongoing' || state?.key === 'aftersale' ? state.key : 'all'
  const [tab, setTab] = useState<OrderTabKey>(initialTab)

  /** 空态只由 `?state=empty` 决定，不改夹具，保证 URL 可直达可复现 */
  const list = useMemo(() => (state?.key === 'empty' ? [] : ordersByTab(tab)), [state?.key, tab])

  const tabs = ORDER_TABS.map((item) => ({ value: item.key, label: item.label }))

  const openOrder = (order: OrderFixture) => {
    navigate(`/orders/${order.id}`)
  }

  return (
    <PageContainer inset={false} className="pb-6">
      <div className="px-4 pb-3 pt-2">
        <SegmentedControl items={tabs} value={tab} onChange={(value) => setTab(value as OrderTabKey)} />
      </div>

      <div className="px-4" aria-live="polite">
        {list.length > 0 ? (
          <ul className="flex flex-col gap-2.5">
            {list.map((order) => (
              <li key={order.id}>
                <article
                  role="button"
                  tabIndex={0}
                  aria-label={`${order.items[0].name} ${ORDER_DELIVERY_LABEL[order.delivery]}`}
                  onClick={() => openOrder(order)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      openOrder(order)
                    }
                  }}
                  className="flex cursor-pointer flex-col rounded-container bg-surface px-3.5 py-3.5 shadow-card transition active:scale-[0.995] active:bg-background"
                >
                  {/* 原型 §14：卡片顶部为下单时间 + 配送状态 */}
                  <header className="flex items-center justify-between gap-2">
                    <span className="text-xs leading-4 text-text-tertiary">{order.createdAt}</span>
                    <span className={`text-xs font-medium leading-4 ${DELIVERY_CLASS[order.delivery]}`}>
                      {ORDER_DELIVERY_LABEL[order.delivery]}
                    </span>
                  </header>

                  {/* 商品名、规格、单价与数量 */}
                  <div className="mt-2.5 flex flex-col gap-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-medium leading-5 text-text-primary">{item.name}</h3>
                          <p className="mt-0.5 truncate text-xs leading-4 text-text-tertiary">{item.spec}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm leading-5 text-text-primary">{formatYuan(item.price)}</p>
                          <p className="mt-0.5 text-xs leading-4 text-text-tertiary">×{item.qty}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <hr className="my-3 border-border-subtle" />

                  {/* 原型 §14：底部为商品件数与实付款 */}
                  <footer className="flex items-baseline justify-end gap-1.5">
                    <span className="text-xs leading-4 text-text-tertiary">
                      {ORDER_COPY.countPrefix} {orderQuantity(order)} {ORDER_COPY.countSuffix}
                    </span>
                    <span className="text-xs leading-4 text-text-secondary">{ORDER_COPY.payableLabel}</span>
                    <span className="text-base font-semibold leading-5 text-text-primary">
                      {formatYuan(orderPayable(order))}
                    </span>
                  </footer>
                </article>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            className="pt-12"
            visual={
              <span className="flex h-24 w-24 items-center justify-center rounded-full bg-background">
                <PackageOpen className="h-12 w-12 text-reward" strokeWidth={1.6} />
              </span>
            }
            title={<span className="text-[15px] leading-[22px] text-text-secondary">{ORDER_COPY.emptyTitle}</span>}
            supportingText={<span className="text-xs leading-[18px]">{ORDER_COPY.emptyDesc}</span>}
            primaryAction={
              <Button variant="outline" onClick={() => navigate('/redeem')}>
                {ORDER_COPY.emptyAction}
              </Button>
            }
          />
        )}
      </div>

      <DebugPanel route={route} />
    </PageContainer>
  )
}
