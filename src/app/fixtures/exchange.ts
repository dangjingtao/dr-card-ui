import { BUBBLE_BALANCE } from './membership'

export type ExchangeSort = 'default' | 'sort-exchange' | 'sort-points'

export const EXCHANGE_SORTS: Array<{ key: ExchangeSort; label: string }> = [
  { key: 'default', label: '综合' },
  { key: 'sort-exchange', label: '兑换量' },
  { key: 'sort-points', label: '泡泡值' },
]

export type ExchangeCategory = 'all' | 'shampoo' | 'conditioner' | 'scalp-care'

/**
 * 专区分类 Tab 与后端 `coupons.category_id` 的映射（2026-09-29 与产品确认按服务端过滤）。
 *
 * `categoryId` 是后端券分类主键；`all` 不传参，由后端返回全部上架券。
 * 具体取值以 7002 券分类表为准，如后端调整只需改这里，页面不感知。
 */
export const EXCHANGE_CATEGORIES: Array<{
  key: ExchangeCategory
  label: string
  categoryId?: number
}> = [
  { key: 'all', label: '全部' },
  { key: 'shampoo', label: '洗发体验', categoryId: 2 },
  { key: 'conditioner', label: '护发体验', categoryId: 3 },
  { key: 'scalp-care', label: '头皮护理', categoryId: 4 },
]

export type ExchangeStock = 'in-stock' | 'sold-out'

export interface ExchangeProductFixture {
  id: string
  name: string
  desc: string
  cost: number
  redeemed: number
  redeemedLabel: string
  stock: ExchangeStock
  category?: Exclude<ExchangeCategory, 'all'>
  thumb?: 'dearseed-kit' | 'honey' | 'seasalt' | 'berry' | 'herbal'
}

export const EXCHANGE_PRODUCT_FIXTURES: ExchangeProductFixture[] = [
  { id: 'e1', name: 'DearSeed 洗发水体验券', desc: '单次洗发体验，限到店核销', cost: 200, redeemed: 2000, redeemedLabel: '2000+', stock: 'in-stock', category: 'shampoo', thumb: 'dearseed-kit' },
  { id: 'e2', name: '洗护组合体验券', desc: '洗发 / 护发组合体验，限到店核销', cost: 200, redeemed: 1860, redeemedLabel: '1860', stock: 'in-stock', category: 'conditioner', thumb: 'honey' },
  { id: 'e3', name: '核心洗发水体验券', desc: '限到店核销', cost: 480, redeemed: 1240, redeemedLabel: '1240', stock: 'in-stock', category: 'scalp-care', thumb: 'seasalt' },
  { id: 'e4', name: '洗发体验券', desc: '单次洗发体验，限到店核销', cost: 320, redeemed: 720, redeemedLabel: '720', stock: 'sold-out', category: 'shampoo', thumb: 'berry' },
  { id: 'e5', name: '现金减免体验券', desc: '¥20 到店减免，限到店核销', cost: 1500, redeemed: 960, redeemedLabel: '960', stock: 'in-stock', thumb: 'herbal' },
]

export function exchangeProductsBySort(sort: ExchangeSort): ExchangeProductFixture[] {
  const list = [...EXCHANGE_PRODUCT_FIXTURES]
  if (sort === 'sort-exchange') return list.sort((a, b) => b.redeemed - a.redeemed)
  if (sort === 'sort-points') return list.sort((a, b) => a.cost - b.cost)
  return list
}

export function resolveExchangeCategory(raw: string | null): ExchangeCategory {
  return EXCHANGE_CATEGORIES.some((item) => item.key === raw) ? raw as ExchangeCategory : 'all'
}

/** 取分类对应的后端 `category_id`；`all` / 未配置返回 `undefined`（不传参 = 全部）。 */
export function resolveExchangeCategoryId(category: ExchangeCategory): number | undefined {
  return EXCHANGE_CATEGORIES.find((item) => item.key === category)?.categoryId
}

export function exchangeProductsByCategory(list: ExchangeProductFixture[], category: ExchangeCategory): ExchangeProductFixture[] {
  return category === 'all' ? list : list.filter((item) => item.category === category)
}

export function exchangeSearch(list: ExchangeProductFixture[], keyword: string): ExchangeProductFixture[] {
  const q = keyword.trim().toLowerCase()
  if (!q) return list
  return list.filter((item) => `${item.name}${item.desc}`.toLowerCase().includes(q))
}

export function resolveExchangeSort(raw: string | null): ExchangeSort {
  const found = EXCHANGE_SORTS.find((item) => item.key === raw)
  return found?.key ?? 'default'
}

export function resolveExchangeProduct(id: string | null): ExchangeProductFixture {
  const found = EXCHANGE_PRODUCT_FIXTURES.find((item) => item.id === id)
  return found ?? EXCHANGE_PRODUCT_FIXTURES[0]
}

export type ExchangeAvailability = 'redeemable' | 'insufficient' | 'sold-out'

export function exchangeAvailability(product: ExchangeProductFixture, balance: number = BUBBLE_BALANCE): ExchangeAvailability {
  if (product.stock === 'sold-out') return 'sold-out'
  if (product.cost > balance) return 'insufficient'
  return 'redeemable'
}

export const EXCHANGE_COPY = {
  searchPlaceholder: '搜索体验券',
  balanceLabel: '泡泡值余额',
  costUnit: '泡泡值',
  redeemedPrefix: '兑换量',
  quantity: 'x1',
  action: '立即兑换',
  soldOut: '已兑完',
  insufficient: '泡泡值不足',
  submitting: '兑换中',
  emptyTitle: '没有找到相关体验券',
  emptyDesc: '换个分类看看，或浏览全部洗护体验券。',
  emptyAction: '查看全部',
  errorTitle: '体验券加载失败',
  retryAction: '重新加载',
  successTitle: '兑换成功，卡券已经存入你的卡包啦～',
  successAction: '查看我的卡包',
  successClose: '关闭',
} as const

export const EXCHANGE_RULE_STATUS = {
  pointsSortDirection: {
    confirmed: false,
    blocker: 'B-024',
    note: '原型 §1/§2 只写「泡泡值」这一维度，未标注升序或降序；此处取「由低到高」以便低门槛体验券优先曝光，待产品确认。',
  },
  catalog: {
    confirmed: false,
    blocker: 'B-025',
    note: '原型 §1 仅逐字给出一张兑换卡，完整体验券清单、所需泡泡值、兑换量与兑完判定未确认；此处只用项目内已有文案构成确定性夹具。',
  },
  settlement: {
    confirmed: false,
    blocker: 'B-026',
    note: '原型 §3/§4 只画到「立即兑换 → 存入卡包」，泡泡值扣减时机、失败回滚与卡包写入均为服务端规则；本页不做持久化扣减，卡包列表不随兑换变化。',
  },
} as const
