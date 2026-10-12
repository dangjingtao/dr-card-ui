import { z } from 'zod'
import { parseApiEnvelope } from './contracts/apiEnvelope'
import { httpClient } from './http'

/** 后台确认的用户兑换码核兑接口，见 docs/engineering/card-code-redeem-contract.md。 */
export const REDEEM_CARD_CODE_PATH = '/api/cardredemptioncodes/redeem'

const redemptionReceiptSchema = z.object({
  user_card_id: z.number().int().positive(),
  card_id: z.number().int().positive(),
  card_name: z.string(),
  card_sn: z.string().min(1),
}).passthrough()

export type RedemptionReceipt = z.infer<typeof redemptionReceiptSchema>

/** 用户只传原始 code，登录身份由统一 HTTP 层携带，成功后返回后台发券回执。 */
export async function redeemCardCode(code: string): Promise<RedemptionReceipt> {
  const payload = await httpClient.request<unknown>({
    method: 'POST',
    url: REDEEM_CARD_CODE_PATH,
    data: { code },
  })
  return parseApiEnvelope(payload, redemptionReceiptSchema, {
    contract: 'cardredemptioncodes.redeem',
    fallbackMessage: '兑换失败，请稍后重试',
  })
}
