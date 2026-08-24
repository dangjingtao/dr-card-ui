import { useNavigate, useParams } from 'react-router-dom'
import { Headset, MapPin, PackageSearch } from 'lucide-react'
import PageContainer from '../components/mobile/PageContainer'
import { Button, EmptyState } from '../components/ui'
import {
  ORDER_COPY,
  ORDER_DELIVERY_LABEL,
  findOrder,
  formatYuan,
  maskPhone,
  orderGoodsTotal,
  orderPayable,
  orderQuantity,
} from '../app/fixtures'

export default function OrderDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const order = findOrder(id)

  if (!order) {
    return (
      <PageContainer className="flex flex-col pb-8">
        <EmptyState
          className="flex-1"
          visual={
            <span className="flex h-24 w-24 items-center justify-center rounded-full bg-background">
              <PackageSearch className="h-12 w-12 text-reward" strokeWidth={1.6} />
            </span>
          }
          title={<span className="text-[15px] leading-[22px] text-text-secondary">{ORDER_COPY.missingTitle}</span>}
          supportingText={<span className="text-xs leading-[18px]">{ORDER_COPY.missingDesc}</span>}
          primaryAction={
            <Button variant="outline" onClick={() => navigate('/orders')}>
              {ORDER_COPY.missingAction}
            </Button>
          }
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer inset={false} className="flex flex-col pb-6">
      <div className="flex flex-1 flex-col gap-2.5 px-4 pt-3">
        {/* 原型 §15：顶部为订单状态 */}
        <section className="rounded-container bg-surface px-4 py-4 shadow-card">
          <p className="text-lg font-semibold leading-7 text-text-primary">
            {ORDER_DELIVERY_LABEL[order.delivery]}
          </p>
          <p className="mt-1 text-xs leading-4 text-text-tertiary">{order.createdAt}</p>
        </section>

        {/* 收货地址、联系人和脱敏手机号 */}
        <section className="rounded-container bg-surface px-4 py-3.5 shadow-card">
          <h2 className="text-xs font-medium leading-4 text-text-tertiary">{ORDER_COPY.receiverLabel}</h2>
          <div className="mt-2 flex items-start gap-2.5">
            <MapPin aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-reward" strokeWidth={1.8} />
            <div className="min-w-0 flex-1">
              <p className="flex items-baseline gap-2 text-sm font-medium leading-5 text-text-primary">
                <span className="truncate">{order.receiver.name}</span>
                <span className="shrink-0 text-xs font-normal text-text-secondary">
                  {maskPhone(order.receiver.phone)}
                </span>
              </p>
              <p className="mt-1 break-words text-xs leading-[18px] text-text-secondary">
                {order.receiver.region} {order.receiver.detail}
              </p>
            </div>
          </div>
        </section>

        {/* 商品信息与数量 */}
        <section className="rounded-container bg-surface px-4 py-3.5 shadow-card">
          <h2 className="text-xs font-medium leading-4 text-text-tertiary">{ORDER_COPY.goodsSectionTitle}</h2>
          <ul className="mt-2 flex flex-col gap-2.5">
            {order.items.map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="break-words text-sm font-medium leading-5 text-text-primary">{item.name}</h3>
                  <p className="mt-0.5 truncate text-xs leading-4 text-text-tertiary">{item.spec}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm leading-5 text-text-primary">{formatYuan(item.price)}</p>
                  <p className="mt-0.5 text-xs leading-4 text-text-tertiary">×{item.qty}</p>
                </div>
              </li>
            ))}
          </ul>
          <hr className="my-3 border-border-subtle" />
          <p className="text-right text-xs leading-4 text-text-tertiary">
            {ORDER_COPY.countPrefix} {orderQuantity(order)} {ORDER_COPY.countSuffix}
          </p>
        </section>

        {/* 价格信息：商品总价、运费、实付款（⚠️ 未含未确认的优惠规则，见 B-030） */}
        <section className="rounded-container bg-surface px-4 py-3.5 shadow-card">
          <h2 className="text-xs font-medium leading-4 text-text-tertiary">{ORDER_COPY.priceSectionTitle}</h2>
          <dl className="mt-2 flex flex-col gap-2 text-sm leading-5">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-text-secondary">{ORDER_COPY.goodsTotalLabel}</dt>
              <dd className="text-text-primary">{formatYuan(orderGoodsTotal(order))}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-text-secondary">{ORDER_COPY.freightLabel}</dt>
              <dd className="text-text-primary">{formatYuan(order.freight)}</dd>
            </div>
            <hr className="border-border-subtle" />
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-text-secondary">{ORDER_COPY.payableLabel}</dt>
              <dd className="text-base font-semibold leading-5 text-text-primary">
                {formatYuan(orderPayable(order))}
              </dd>
            </div>
          </dl>
        </section>

        {/* 订单信息：订单编号、下单时间 */}
        <section className="rounded-container bg-surface px-4 py-3.5 shadow-card">
          <h2 className="text-xs font-medium leading-4 text-text-tertiary">{ORDER_COPY.orderSectionTitle}</h2>
          <dl className="mt-2 flex flex-col gap-2 text-sm leading-5">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="shrink-0 text-text-secondary">{ORDER_COPY.codeLabel}</dt>
              <dd className="min-w-0 break-all text-right text-text-primary">{order.code}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="shrink-0 text-text-secondary">{ORDER_COPY.createdLabel}</dt>
              <dd className="text-text-primary">{order.createdAt}</dd>
            </div>
          </dl>
        </section>
      </div>

      {/* 原型 §15 保留客服入口 */}
      <div className="sticky bottom-0 mt-2.5 bg-background px-4 pb-[env(safe-area-inset-bottom)] pt-3">
        <Button
          variant="outline"
          size="large"
          leadingIcon={Headset}
          className="w-full rounded-pill"
          onClick={() => navigate('/service/chat')}
        >
          {ORDER_COPY.serviceAction}
        </Button>
      </div>
    </PageContainer>
  )
}
