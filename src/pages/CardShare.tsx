import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Check, ShoppingBag } from 'lucide-react'
import PageContainer from '../components/mobile/PageContainer'
import DebugPanel from '../components/mobile/DebugPanel'
import { Button, SearchField } from '../components/ui'
import { useFixtureQueryControls, useFixtureState } from '../app/fixtures/useFixture'
import { findRouteByPathname } from '../app/router/routes'
import {
  resolveCardCoupon,
  SHARE_PRODUCT_FIXTURE,
  SHARE_TARGET_FIXTURES,
  type ShareTargetFixture,
} from '../app/fixtures'

/**
 * 分享（#65 选择接收的人 / #66 分享成功）
 * -------------------------------------------------------------
 * 视觉、结构、文案与单选交互照 reference/分享.html、reference/分享成功.html 还原：
 * - #65：搜索框 + 分组标题「搭子列表」+ 单选列表 + 底部主操作「下一步」，默认选中第一位；
 * - #66：成功环 hero + 商品信息卡（缩略图 / 名称 / 点分隔 meta / 标签）+「查看我的卡包」+ ghost「返回」。
 * 两个节点在原稿里是同一条链路的前后页，故合并为一页，用 fixture state 切换，
 * 便于 preview/dev 按 URL 直达截图，同时 test/prod 外部 query 不再可信。
 *
 * B-015 已关闭：按原型做「搭子列表」夹具，单选对象 → 下一步 → 分享成功；
 *   不做对方接受、次数限制、时效限制和持久化，分享后原卡包状态不变。
 * B-017 已关闭：#66 商品卡的「洗发试用装 / 已发货 / 单次使用」仅为原型展示夹具
 *   （SHARE_PRODUCT_FIXTURE），「已发货」不代表分享操作触发真实发货，不实现物流规则。
 */
export default function CardShare() {
  const navigate = useNavigate()
  const route = findRouteByPathname('/card/share')
  const { state } = useFixtureState(route)
  const { patch: patchFixtureState } = useFixtureQueryControls()
  const [searchParams] = useSearchParams()

  const coupon = resolveCardCoupon(searchParams.get('coupon'))
  const [keyword, setKeyword] = useState('')
  const [selected, setSelected] = useState<string>(SHARE_TARGET_FIXTURES[0].id)

  const targets = SHARE_TARGET_FIXTURES.filter((item) => item.name.includes(keyword.trim()))
  const receiver: ShareTargetFixture =
    SHARE_TARGET_FIXTURES.find((item) => item.id === selected) ?? SHARE_TARGET_FIXTURES[0]

  const submit = () => {
    patchFixtureState(
      { state: 'success' },
      { coupon: coupon.id, target: receiver.id },
    )
  }

  if (state?.key === 'success') {
    return (
      <PageContainer className="flex min-h-full flex-col pb-6" inset>
        <div className="flex flex-col items-center gap-3 px-5 pb-4 pt-14 text-center">
          <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-success-bg" aria-hidden>
            <span className="absolute -inset-1.5 rounded-full border border-dashed border-success opacity-25" />
            <Check className="h-8 w-8 text-success" strokeWidth={3} />
          </span>
          <h1 className="text-lg font-semibold text-text-primary">分享成功</h1>
          <p className="max-w-[260px] text-sm leading-6 text-text-secondary">已成功分享给好友，邀请他也来一起玩吧</p>
        </div>

        <section className="mx-4 mt-5 flex items-center gap-3 rounded-container bg-surface p-3 shadow-sm" aria-label="分享的商品">
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[12px] bg-surface-selected text-text-brand"
            aria-hidden
          >
            <ShoppingBag className="h-7 w-7" strokeWidth={1.8} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-semibold text-text-primary">{SHARE_PRODUCT_FIXTURE.name}</h2>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-text-tertiary">
              <span>{SHARE_PRODUCT_FIXTURE.date}</span>
              <span className="h-[3px] w-[3px] rounded-full bg-current opacity-60" aria-hidden />
              <span>{SHARE_PRODUCT_FIXTURE.shipping}</span>
            </p>
            <span className="mt-1.5 inline-flex rounded-full bg-surface-selected px-2 py-0.5 text-[11px] font-medium text-text-brand">
              {SHARE_PRODUCT_FIXTURE.tag}
            </span>
          </div>
        </section>

        <div className="mt-auto flex flex-col items-center gap-2 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-5">
          <Button size="large" className="h-12 w-full" onClick={() => navigate('/card', { replace: true })}>
            查看我的卡包
          </Button>
          <Button variant="ghost" className="h-9 text-sm font-medium" onClick={() => navigate(-1)}>
            返回
          </Button>
        </div>

        <DebugPanel route={route} />
      </PageContainer>
    )
  }

  return (
    <PageContainer className="flex min-h-full flex-col pb-6" inset>
      <div className="px-4 pt-3">
        <SearchField
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          onClear={() => setKeyword('')}
          placeholder="搜索搭子"
          inputClassName="placeholder:text-text-tertiary"
        />
      </div>

      <section className="mt-5 px-4" aria-label="搭子列表">
        <h2 className="text-sm font-medium text-text-primary">搭子列表</h2>
        <div className="mt-2 overflow-hidden rounded-container bg-surface shadow-sm">
          {targets.map((target, index) => {
            const checked = selected === target.id
            return (
              <button
                key={target.id}
                type="button"
                onClick={() => setSelected(target.id)}
                className={`flex w-full items-center gap-3 px-4 py-3.5 text-left ${index > 0 ? 'border-t border-border-subtle' : ''}`}
              >
                <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-surface-selected text-sm font-semibold text-text-brand">
                  {target.name.slice(0, 1)}
                </span>
                <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-text-primary">{target.name}</span>
                <span
                  className={`flex h-5 w-5 flex-none items-center justify-center rounded-full border ${
                    checked ? 'border-primary bg-primary text-text-inverse' : 'border-border bg-surface'
                  }`}
                  aria-hidden
                >
                  {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <div className="mt-auto px-4 pb-[env(safe-area-inset-bottom)] pt-5">
        <Button size="large" className="h-12 w-full rounded-pill" onClick={submit} disabled={!selected}>
          下一步
        </Button>
      </div>

      <DebugPanel route={route} />
    </PageContainer>
  )
}
