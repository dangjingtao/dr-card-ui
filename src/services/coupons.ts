import { httpClient } from './http'

/**
 * 7002「优惠券管理」接口（本地联调：dev server `/api` 透传到 7002，无需 salt / token）。
 * 契约来源：http://192.168.1.81:7002/swagger-ui/index.json
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
