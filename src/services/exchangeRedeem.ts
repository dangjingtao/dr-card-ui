import { runtimePolicy } from '../app/config/runtime'
import { parseContract } from './contracts'
import {
  exchangeRedeemResponseSchema,
  H014_EXCHANGE_REDEEM_PATH,
  type ExchangeRedeemSuccess,
} from './contracts/h014Flows'
import { createBusinessError } from './http/appError'
import { httpClient, type HttpClient } from './http/httpClient'

function contractSource() {
  return runtimePolicy.dataMode === 'mock' ? 'mock' as const : 'api' as const
}

export interface ExchangeRedeemService {
  redeem(productId: string): Promise<ExchangeRedeemSuccess>
}

export function createExchangeRedeemService(client: HttpClient = httpClient): ExchangeRedeemService {
  return {
    async redeem(productId) {
      const raw = await client.request<unknown>({
        method: 'POST',
        url: H014_EXCHANGE_REDEEM_PATH,
        data: { productId },
      })
      const parsed = parseContract(exchangeRedeemResponseSchema, raw, {
        source: contractSource(),
        contract: 'exchange-redeem',
      })
      if (!parsed.ok) {
        throw createBusinessError(parsed.error.message, {
          code: parsed.error.code,
          details: { contract: 'exchange-redeem' },
        })
      }
      return parsed.data
    },
  }
}

export const exchangeRedeemService = createExchangeRedeemService()
