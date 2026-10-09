import { z } from 'zod'

import { parseApiEnvelope } from './contracts/apiEnvelope'
import { httpClient } from './http'

export const MY_COUPONS_PATH = '/api/coupons/MyCoupons'
export const MY_COUPONS_PAGE_SIZE_DEFAULT = 15
export const MY_COUPONS_PAGE_SIZE_MAX = 100

export type MyCouponType = 'unused' | 'used' | 'out_of_date'

const amountSchema = z.union([z.string(), z.number()])
// The H5 backend passes third-party discountcardlogs_list records through unchanged.
// Unlike the normalized pagination fields, individual card display fields may be absent.
const couponRecordSchema = z
  .object({
    id: z.union([z.number(), z.string()]).nullish(),
    active_name: z.string().nullish(),
    get_amount: amountSchema.nullish(),
    used_amount: amountSchema.nullish(),
    enable_amount: amountSchema.nullish(),
    valid_date_range: z.string().nullish(),
    dc_type: z.union([z.number(), z.string()]).nullish(),
    dc_type_format: z.string().nullish(),
  })
  .passthrough()

export type MyCouponRecord = z.infer<typeof couponRecordSchema>

const myCouponsPageSchema = z
  .object({
    data: z.array(couponRecordSchema),
    current_page: z.number(),
    per_page: z.number(),
    total: z.number(),
    last_page: z.number(),
  })
  .passthrough()

export type MyCouponsPage = z.infer<typeof myCouponsPageSchema>

export interface MyCouponsParams {
  type: MyCouponType
  page?: number
  pageSize?: number
}

/**
 * 当前用户已持有优惠卡列表。
 *
 * Bearer 认证由全局 httpClient auth provider 注入；H5 只消费老伙伴的 H5 契约，
 * 不感知上上游 startIndex / token / salt / timesp / secstr。
 */
export async function fetchMyCoupons(params: MyCouponsParams): Promise<MyCouponsPage> {
  const pageSize = Math.min(params.pageSize ?? MY_COUPONS_PAGE_SIZE_DEFAULT, MY_COUPONS_PAGE_SIZE_MAX)

  const payload = await httpClient.request<unknown>({
    method: 'POST',
    url: MY_COUPONS_PATH,
    data: {
      type: params.type,
      page: params.page ?? 1,
      pageSize,
    },
  })

  return parseApiEnvelope(payload, myCouponsPageSchema, {
    contract: 'coupons.myCoupons',
    fallbackMessage: '卡包获取失败',
  })
}
