import DebugPanel from '../components/mobile/DebugPanel'
import PageContainer from '../components/mobile/PageContainer'
import { findRouteByPathname } from '../app/router/routes'
import brandCultureLongPage from '../assets/brand/ip/brand-culture-longpage.webp'

/**
 * 品牌文化（#16）
 * 事实源：摹客 `D1gOOzGEq`（页面树「品牌文化」，index 15，artboard 375×1414）
 * - 页面在原型中只有两个元素：顶部导航栏（返回 + 标题）与一张长图
 *   `ef4c2310-…png`（源 1683×5950）@(0,88) 375×1326，`lockedRatio: true`，无任何交互；
 *   88 + 1326 = 1414 正好铺满 artboard，375 × (5950 / 1683) ≈ 1325.9，等比缩放不裁切。
 * - 原型全页 0 个 button，无浮动 CTA、无「立即体验」按钮。
 * 用户定案（本轮）：**只铺原型长图，不加浮动 CTA**；历史深色稿（T13 深绿金 + 浮动按钮）
 * 不予继承，B-001 据此关闭。
 *
 * 实现约束：
 * - 返回栏由 MobileLayout 统一提供（routes.ts 默认 `back`，返回诗得丽专栏），页面不自造标题栏。
 * - 长图需全宽铺满，故 `PageContainer inset={false}`，不加 px-4 贴边。
 * - artboard 底色 rgb(252,250,246) 与项目 `--color-background`(#FCF8F1) 同属暖白，
 *   差值不可感知，故直接消费 `bg-background`，不为单页引入私有底色。
 *
 * ⚠️ 文案三口径冲突（未静默统一，待产品确认）：
 *    摹客页面树名「品牌文化」/ 原型导航栏标题「核心文化」/ 素材名「核心品牌vi8.16」。
 *    当前标题沿用 routes.ts 已登记的「品牌文化」（与首页金刚区入口文案一致）。
 * ⚠️ 长图为整张位图，其中文字无法被选中、搜索或响应式重排；原型未提供可结构化的分段文案，
 *    因此不自行拆图重排。alt 只做整体说明，不臆造图内文案。
 */
export default function BrandCulture() {
  const route = findRouteByPathname('/brand-culture')

  return (
    <PageContainer inset={false} className="pb-0">
      <img
        src={brandCultureLongPage}
        alt="诗得丽品牌文化长图"
        className="block w-full"
        data-brand-culture-longpage
      />
      <DebugPanel route={route} />
    </PageContainer>
  )
}
