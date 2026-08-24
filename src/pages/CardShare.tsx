import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Check, Search, ShoppingBag } from 'lucide-react'
import PageContainer from '../components/mobile/PageContainer'
import DebugPanel from '../components/mobile/DebugPanel'
import { Button } from '../components/ui'
import { useFixtureState } from '../app/fixtures/useFixture'
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
 * 两个节点在原稿里是同一条链路的前后页，故合并为一页，用 `?state=success` 切换，
 * 便于按 URL 直达截图（与 /claim/success 复用同一套约定）。
 *
 * B-015 已关闭：按原型做「搭子列表」夹具，单选对象 → 下一步 → 分享成功；
 *   不做对方接受、次数限制、时效限制和持久化，分享后原卡包状态不变。
 * B-017 已关闭：#66 商品卡的「洗发试用装 / 已发货 / 单次使用」仅为原型展示夹具
 *   （SHARE_PRODUCT_FIXTURE），「已发货」不代表分享操作触发真实发货，不实现物流规则。
 * ⚠️ 原稿两个节点的 app-bar 标题分别为「选择接收的人」「分享成功」，而 shell 的标题只按路由取
 *    单值（MobileLayout 不在本次改动范围），故路由标题统一为「分享」，不做逐状态标题。
 */
export default function CardShare() {
  const navigate = useNavigate()
  const route = findRouteByPathname('/card/share')
  const { state } = useFixtureState(route)
  const [searchParams, setSearchParams] = useSearchParams()

  const coupon = resolveCardCoupon(searchParams.get('coupon'))
  const [keyword, setKeyword] = useState('')
  /** reference 原稿默认选中第一位接收人，保持一致 */
  const [selected, setSelected] = useState<string>(SHARE_TARGET_FIXTURES[0].id)

  const targets = SHARE_TARGET_FIXTURES.filter((item) => item.name.includes(keyword.trim()))
  const receiver: ShareTargetFixture =
    SHARE_TARGET_FIXTURES.find((item) => item.id === selected) ?? SHARE_TARGET_FIXTURES[0]

  const submit = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('coupon', coupon.id)
      next.set('target', receiver.id)
      next.set('state', 'success')
      return next
    })
  }

  if (state?.key === 'success') {
    return (
      <PageContainer className="flex min-h-full flex-col pb-6" inset>
        {/* #66 hero：56px 上留白 + 64px 成功环（外圈 1px 虚线，opacity .25）+ 标题 + 副文案（文案照原稿） */}
        <div className="flex flex-col items-center gap-3 px-5 pb-4 pt-14 text-center">
          <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-success-bg" aria-hidden>
            <span className="absolute -inset-1.5 rounded-full border border-dashed border-success opacity-25" />
            <Check className="h-8 w-8 text-success" strokeWidth={3} />
          </span>
          <h1 className="text-lg font-semibold text-text-primary">分享成功</h1>
          <p className="max-w-[260px] text-sm leading-6 text-text-secondary">已成功分享给好友，邀请他也来一起玩吧</p>
        </div>

        {/* #66 商品卡：结构与内容照原稿 product-card；内容为展示夹具，不代表真实发货（B-017 已关闭） */}
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

        {/* #66 底部按钮组：主按钮 + ghost「返回」，纵向 8px 间距 */}
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
        <label className="flex min-h-10 items-center gap-2 rounded-control border border-border-subtle bg-surface px-3 focus-within:border-border-focused">
          <Search className="h-4 w-4 shrink-0 text-text-tertiary" aria-hidden />
          <input
            type="text"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            aria-label="搜索好友"
            placeholder="搜索好友"
            className="min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-placeholder"
          />
        </label>
      </div>

      {/* #65 分组标题：原稿 section-header「搭子列表」（600 16px/22px，一级文字色） */}
      <h2 className="px-4 pb-2 pt-4 text-base font-semibold leading-[22px] text-text-primary">搭子列表</h2>

      <ul role="listbox" aria-label="好友" className="mx-4 overflow-hidden rounded-container bg-surface shadow-sm">
        {targets.map((item, index) => {
          const active = item.id === selected
          return (
            <li key={item.id} role="option" aria-selected={active}>
              <button
                type="button"
                onClick={() => setSelected(item.id)}
                className={`flex min-h-12 w-full items-center gap-3 px-3 py-2 text-left ${
                  active ? 'bg-[var(--com-brand-50)]' : 'bg-transparent'
                } ${index > 0 ? 'border-t border-border-subtle' : ''}`}
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--com-brand-100)] text-base font-semibold text-text-brand"
                  aria-hidden
                >
                  {item.initial}
                </span>
                <span className="min-w-0 flex-1 truncate text-base text-text-primary">{item.name}</span>
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    active ? 'border-primary' : 'border-border'
                  }`}
                  aria-hidden
                >
                  {active && <span className="h-2 w-2 rounded-full bg-primary" />}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      {targets.length === 0 && (
        <p className="mt-6 px-4 text-center text-sm text-text-tertiary">没有匹配「{keyword.trim()}」的好友</p>
      )}

      <div className="mt-auto px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">
        <Button size="large" className="h-12 w-full" onClick={submit}>
          下一步
        </Button>
      </div>

      <DebugPanel route={route} />
    </PageContainer>
  )
}
