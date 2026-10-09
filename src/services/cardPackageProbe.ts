import {
  getCardApiCredentialsFromEnv,
  requestDiscountCardList,
  type CardApiEnvelope,
} from './cardPackage'

export type DiscountCardProbeResponse = CardApiEnvelope

/**
 * Development-only connectivity probe for the upstream discount-card endpoint.
 * It intentionally does not invent secstr/auth values; a 502 business response still proves
 * that the browser reached the upstream API and received its JSON envelope.
 */
export function probeDiscountCardList(): Promise<DiscountCardProbeResponse> {
  return requestDiscountCardList(
    { type: 'unused', startIndex: 0, pageSize: 50 },
    { credentials: getCardApiCredentialsFromEnv() },
  )
}
