import { z } from 'zod'
import { parseApiEnvelope } from './contracts/apiEnvelope'
import { httpClient } from './http'

export const COUPON_CATEGORY_INDEX_PATH = '/api/couponscategory/index'
export const COUPON_CATEGORY_SELECT_PATH = '/api/couponscategory/select'
export const COUPON_CATEGORY_DETAIL_PATH = '/api/couponscategory/detail'

const categorySchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  pid: z.number().int().nonnegative(),
  sort: z.number(),
}).passthrough()
const categoryPageSchema = z.object({
  data: z.array(categorySchema),
  current_page: z.number().int().positive(),
  per_page: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  last_page: z.number().int().positive(),
}).passthrough()
const selectPageSchema = z.object({
  data: z.array(z.object({ value: z.number().int().positive(), label: z.string() }).passthrough()),
  current_page: z.number().int().positive(),
  per_page: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  last_page: z.number().int().positive(),
}).passthrough()

export type CouponCategory = z.infer<typeof categorySchema>
export type CouponCategoryOption = { key: string; label: string }
export const COUPON_CATEGORY_PAGE_SIZE = 100
export const COUPON_CATEGORY_MAX_PAGES = 20

export function normalizeCategoryId(value: string | number | null | undefined): string | undefined {
  if (typeof value === 'number') return Number.isSafeInteger(value) && value > 0 ? String(value) : undefined
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return undefined
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) ? String(parsed) : undefined
}

/** Only root categories have approved tabs; backend controls names and order. */
export async function fetchCouponCategoryPage(page = 1) {
  const payload = await httpClient.request<unknown>({
    method: 'GET',
    url: COUPON_CATEGORY_INDEX_PATH,
    params: { pid: 0, page, pageSize: COUPON_CATEGORY_PAGE_SIZE, 'orderBy[sort]': 'DESC' },
  })
  return parseApiEnvelope(payload, categoryPageSchema, {
    contract: 'couponscategory.index', fallbackMessage: '体验券分类获取失败',
  })
}

/** Available for select-style consumers; select's total/last_page must never drive paging. */
export async function fetchCouponCategorySelect() {
  const payload = await httpClient.request<unknown>({ method: 'GET', url: COUPON_CATEGORY_SELECT_PATH })
  return parseApiEnvelope(payload, selectPageSchema, {
    contract: 'couponscategory.select', fallbackMessage: '体验券分类选项获取失败',
  }).data.map(item => ({ key: String(item.value), label: item.label }))
}

export async function fetchCouponCategoryDetail(id: string) {
  const normalized = normalizeCategoryId(id)
  if (!normalized) throw new Error('分类编号无效')
  const payload = await httpClient.request<unknown>({
    method: 'GET', url: COUPON_CATEGORY_DETAIL_PATH, params: { id: Number(normalized) },
  })
  return parseApiEnvelope(payload, categorySchema.nullable(), {
    contract: 'couponscategory.detail', fallbackMessage: '体验券分类详情获取失败',
  })
}

/** Exhaust page metadata; never silently expose partial categories as a complete set. */
export async function fetchRootCouponCategories(): Promise<CouponCategoryOption[]> {
  const first = await fetchCouponCategoryPage()
  if (first.current_page !== 1 || first.last_page > COUPON_CATEGORY_MAX_PAGES) {
    throw new Error('体验券分类过多或分页异常，请联系管理员')
  }
  const all: CouponCategory[] = [...first.data]
  for (let page = 2; page <= first.last_page; page++) {
    const next = await fetchCouponCategoryPage(page)
    if (next.current_page !== page || next.total !== first.total || next.last_page !== first.last_page) {
      throw new Error('分类列表发生变化，请重新加载')
    }
    all.push(...next.data)
  }
  const unique = new Map(all.map(row => [row.id, row]))
  if (all.length !== first.total || unique.size !== first.total || all.some(row => row.pid !== 0)) {
    throw new Error('体验券分类列表不完整，请重试')
  }
  return [...unique.values()]
    .sort((a, b) => b.sort - a.sort || b.id - a.id)
    .map(row => ({ key: String(row.id), label: row.name }))
}
