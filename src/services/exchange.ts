import { z } from 'zod'

import { parseContract } from './contracts/parseContract'
import { createBusinessError, httpClient } from './http'

/** H014 reserved transport seam; not a confirmed backend endpoint while H008 is blocked. */
export const H014_EXCHANGE_REDEEM_PATH = '/__h014/exchange/redeem'

const exchangeRedeemResponseSchema = z.discriminatedUnion('ok', [
  z.object({ ok: z.literal(true) }),
  z.object({
    ok: z.literal(false),
    message: z.string().min(1),
  }),
])

export async function redeemExchangeProduct(productId: string): Promise<void> {
  const payload = await httpClient.request<unknown>({
    method: 'POST',
    url: H014_EXCHANGE_REDEEM_PATH,
    data: { productId },
  })
  const parsed = parseContract(exchangeRedeemResponseSchema, payload, {
    source: 'api',
    contract: 'h014.exchange-redeem',
  })

  if (!parsed.ok) throw createBusinessError(parsed.message)
}
