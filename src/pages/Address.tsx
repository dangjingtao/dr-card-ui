import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, MapPin, Plus, SquarePen } from 'lucide-react'
import { Button, EmptyState, Tag, Toast } from '../components/ui'
import PageContainer from '../components/mobile/PageContainer'
import DebugPanel from '../components/mobile/DebugPanel'
import { findRouteByPathname } from '../app/router/routes'
import { useFixtureState } from '../app/fixtures/useFixture'
import { ADDRESS_COPY, maskPhone, type AddressFixture } from '../app/fixtures'
import { setDefaultAddress, useAddresses } from '../app/state/addresses'

/**
 * #55 地址管理（T010）
 * 原型 04 §12：默认地址置顶并带「默认」标识；左侧圆圈切换默认地址；
 * 编辑 → 地址表单（⚠️ 原型未单独画编辑页，见 B-027）；「添加新地址」→ #60。
 */
export default function Address() {
  const route = findRouteByPathname('/address')
  const { state } = useFixtureState(route)
  const navigate = useNavigate()
  const { items } = useAddresses()
  const [toast, setToast] = useState<string | null>(null)

  /** 空态只由 `?state=empty` 决定，不改共享状态，保证 URL 可直达可复现 */
  const list = state?.key === 'empty' ? [] : items

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 1600)
    return () => window.clearTimeout(timer)
  }, [toast])

  const onSetDefault = (item: AddressFixture) => {
    if (item.isDefault) return
    setDefaultAddress(item.id)
    setToast(ADDRESS_COPY.defaultToast)
  }

  return (
    <PageContainer inset={false} className="flex min-h-full flex-col pb-6">
      {list.length === 0 ? (
        <EmptyState
          className="flex-1 pt-16"
          visual={
            <span className="flex h-24 w-24 items-center justify-center rounded-full bg-background">
              <MapPin className="h-12 w-12 text-reward" strokeWidth={1.6} />
            </span>
          }
          title={<span className="text-[15px] leading-[22px] text-text-secondary">{ADDRESS_COPY.emptyTitle}</span>}
          supportingText={<span className="text-xs leading-[18px]">{ADDRESS_COPY.emptyDesc}</span>}
        />
      ) : (
        <ul className="flex-1 space-y-3 px-4 pt-3">
          {list.map((item) => (
            <li key={item.id}>
              <article className="flex items-start gap-3 rounded-container bg-surface px-3.5 py-3.5 shadow-card">
                <button
                  type="button"
                  aria-label={item.isDefault ? `${item.name} 已是默认地址` : `将 ${item.name} ${ADDRESS_COPY.setDefaultHint}`}
                  aria-pressed={item.isDefault}
                  onClick={() => onSetDefault(item)}
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
                    item.isDefault
                      ? 'border-transparent bg-primary text-text-inverse'
                      : 'border-border bg-surface text-transparent active:bg-background'
                  }`}
                >
                  <Check aria-hidden className="h-3.5 w-3.5" strokeWidth={3} />
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[15px] font-medium leading-[22px] text-text-primary">{item.name}</span>
                    <span className="shrink-0 text-[13px] leading-[20px] text-text-secondary">{maskPhone(item.phone)}</span>
                    {item.isDefault && <Tag variant="brand">{ADDRESS_COPY.defaultTag}</Tag>}
                  </div>
                  <p className="mt-1 text-xs leading-[18px] text-text-secondary">
                    {item.region} {item.detail}
                  </p>
                </div>

                <button
                  type="button"
                  aria-label={`${ADDRESS_COPY.editAction} ${item.name} 的地址`}
                  onClick={() => navigate(`/address/new?id=${item.id}`)}
                  className="-mr-1 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-control text-text-tertiary active:bg-background"
                >
                  <SquarePen aria-hidden className="h-4 w-4" />
                </button>
              </article>
            </li>
          ))}
        </ul>
      )}

      <div className="sticky bottom-0 mt-4 bg-background px-4 pb-[env(safe-area-inset-bottom)] pt-3">
        <Button
          size="large"
          leadingIcon={Plus}
          className="w-full rounded-pill"
          onClick={() => navigate('/address/new')}
        >
          {ADDRESS_COPY.addAction}
        </Button>
      </div>

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-28 z-40 flex justify-center px-6">
          <Toast message={toast} status="success" />
        </div>
      )}

      <DebugPanel route={route} />
    </PageContainer>
  )
}
