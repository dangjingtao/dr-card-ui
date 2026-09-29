import { z } from 'zod'

import { parseApiEnvelope } from './contracts/apiEnvelope'
import { httpClient } from './http'

/**
 * 7002「优惠券管理」接口（本地联调：dev server `/api` 透传到 7002，无需 salt / token）。
 * 契约来源：http://192.168.1.81:7002/swagger-ui/index.json
 *
 * 同路径两条消费方式并存：
 * - `fetchCouponList`：首页/卡券页在用，返回原始信封，容忍后端字段轻微漂移；
 * - `fetchCouponIndex`：我的页在用，走 zod 契约 + `parseApiEnvelope`，失败显式抛错。
 * 两者共用 `COUPON_LIST_PATH`，不重复定义路径。
 */
export const COUPON_LIST_PATH = '/api/coupons/index'

/** coupons.status：10=上架，20=下架（后端 schema 定义，非前端推断）。 */
export const COUPON_STATUS_ON_SHELF = 10

export interface CouponTemplate {
  id: number
  create_time?: string
  update_time?: string
  name: string
  short_desc?: string | null
  image?: string | null
  category_id?: number | string | null
  /** 兑换所需泡泡值 */
  points_number?: number | string | null
  /** 可兑换数量 */
  total_number?: number | null
  /** 已兑换数量（后端字段名即为 exchanged_nuuur） */
  exchanged_nuuur?: number | null
  status?: number | null
}

export interface CouponListPage {
  data: CouponTemplate[]
  current_page: number
  per_page: number
  total: number
  last_page: number
}

export interface CouponListEnvelope {
  code: number
  msg: string
  status?: string
  data: CouponListPage
}

/**
 * 我的页券模板契约：只强约束列表必备字段与分页结构，其余字段整体放行，
 * 避免后端新增字段触发契约失败。`points_number` / `category_id` 后端可能返回字符串，
 * 因此按 `number | string` 容错（与 `CouponTemplate` 声明一致）。
 */
const couponTemplateSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    short_desc: z.string().nullish(),
    image: z.string().nullish(),
    category_id: z.union([z.number(), z.string()]).nullish(),
    points_number: z.union([z.number(), z.string()]).nullish(),
    total_number: z.number().nullish(),
    exchanged_nuuur: z.number().nullish(),
    status: z.number().nullish(),
  })
  .passthrough()

const couponListPageSchema = z
  .object({
    data: z.array(couponTemplateSchema),
    current_page: z.number(),
    per_page: z.number(),
    total: z.number(),
    last_page: z.number(),
  })
  .passthrough()

export interface CouponListParams {
  /** coupons.status：10=上架（首页/卡券页固定），20=下架。2026-09-28 联调文档起为必填。 */
  status?: number
  /** 按分类过滤。 */
  categoryId?: number
  page?: number
  pageSize?: number
}

export async function fetchCouponList(params: CouponListParams = {}): Promise<CouponListEnvelope> {
  return httpClient.request<CouponListEnvelope>({
    method: 'GET',
    url: COUPON_LIST_PATH,
    params: {
      status: params.status ?? COUPON_STATUS_ON_SHELF,
      category_id: params.categoryId,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 50,
    },
  })
}

/** 我的页券模板分页默认每页条数（客户端文档默认 15，上限 100）。 */
export const COUPON_PAGE_SIZE_DEFAULT = 15

/**
 * 我的页「优惠券列表」入参。
 *
 * 与 `fetchCouponList` 同路径（`GET /api/coupons/index`），差别只在本页按客户端文档口径消费：
 * - 走统一 `parseApiEnvelope` 契约校验，失败抛 `AppError`，页面按错误态渲染而非静默空列表；
 * - 默认 `page=1` / `pageSize=15`，分页结构取 `data.data` 嵌套两层。
 */
export interface CouponIndexParams {
  page?: number
  pageSize?: number
  /** 券状态过滤：10=上架，20=下架；不传由后端默认（全部）。 */
  status?: number
  categoryId?: number
}

export async function fetchCouponIndex(
  params: CouponIndexParams = {},
): Promise<CouponListPage> {
  const payload = await httpClient.request<unknown>({
    method: 'GET',
    url: COUPON_LIST_PATH,
    params: {
      category_id: params.categoryId,
      status: params.status,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? COUPON_PAGE_SIZE_DEFAULT,
    },
  })

  return parseApiEnvelope(payload, couponListPageSchema, {
    contract: 'coupons.index',
    fallbackMessage: '优惠券列表获取失败',
  })
}
