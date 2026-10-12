import { z } from 'zod'
import { parseApiEnvelope } from './contracts/apiEnvelope'
import { httpClient } from './http'

export const REDEEM_CARD_CODE_PATH = '/api/cardredemptioncodes/redeem'

const redeemedCardSchema = z.object({
  user_card_id: z.number().int().positive(),
  card_id: z.number().int().positive(),
  card_name: z.string(),
  card_sn: z.string().min(1),
}).passthrough()

export type RedeemedCard = z.infer<typeof redeemedCardSchema>

/** 真实兑换码核兑；只传原值，不改变大小写、字符类型或空格。 */
export async function redeemCardCode(code: string): Promise<RedeemedCard> {
  const payload = await httpClient.request<unknown>({
    method: 'POST',
    url: REDEEM_CARD_CODE_PATH,
    data: { code },
  })
  return parseApiEnvelope(payload, redeemedCardSchema, {
    contract: 'cardredemptioncodes.redeem',
    fallbackMessage: '兑换失败，请稍后重试',
  })
}
