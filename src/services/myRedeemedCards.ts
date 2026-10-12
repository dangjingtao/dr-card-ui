import { z } from 'zod'
import { parseApiEnvelope } from './contracts/apiEnvelope'
import { httpClient } from './http'

export const MY_REDEEMED_CARDS_PATH = '/api/usercards/index'

const localCardSchema = z.object({
  id: z.number().int().positive(),
  source: z.number(),
  card_name: z.string(),
  face_value: z.union([z.string(), z.number()]).nullish(),
  valid_end_time: z.number().nullish(),
  status: z.number(),
}).passthrough()

const localCardsPageSchema = z.object({
  data: z.array(localCardSchema),
  total: z.number(),
  current_page: z.number(),
  per_page: z.number(),
  last_page: z.number(),
}).passthrough()

export type MyRedeemedCard = z.infer<typeof localCardSchema>
export type MyRedeemedCardsPage = z.infer<typeof localCardsPageSchema>

/** 只查当前登录用户通过兑换码领取的本地卡券，和第三方 MyCoupons 分开。 */
export async function fetchMyRedeemedCards(status: 10 | 20 | 30, page = 1): Promise<MyRedeemedCardsPage> {
  const payload = await httpClient.request<unknown>({
    method: 'GET',
    url: MY_REDEEMED_CARDS_PATH,
    params: { status, source: 60, page, pageSize: 100 },
  })
  return parseApiEnvelope(payload, localCardsPageSchema, {
    contract: 'usercards.redeemed',
    fallbackMessage: '兑换码卡券加载失败',
  })
}
