import { runtimePolicy } from '../app/config/runtime'
import { createBusinessError } from './http/appError'
import { httpClient, type HttpClient } from './http/httpClient'
import { parseContract } from './contracts'
import {
  buddyPhoneInviteResponseSchema,
  buddyPhoneSearchResponseSchema,
  H014_BUDDY_INVITE_PATH,
  H014_BUDDY_SEARCH_PATH,
  type BuddyPhoneInviteSuccess,
  type BuddyPhoneSearchSuccess,
} from './contracts/h014Flows'

function contractSource() {
  return runtimePolicy.dataMode === 'mock' ? 'mock' as const : 'api' as const
}

export interface BuddyPhoneService {
  search(phone: string): Promise<BuddyPhoneSearchSuccess>
  invite(phone: string): Promise<BuddyPhoneInviteSuccess>
}

export function createBuddyPhoneService(client: HttpClient = httpClient): BuddyPhoneService {
  return {
    async search(phone) {
      const raw = await client.request<unknown>({
        method: 'GET',
        url: H014_BUDDY_SEARCH_PATH,
        params: { phone: phone.trim() },
      })
      const parsed = parseContract(buddyPhoneSearchResponseSchema, raw, {
        source: contractSource(),
        contract: 'buddy-phone-search',
      })
      if (!parsed.ok) {
        throw createBusinessError(parsed.error.message, {
          code: parsed.error.code,
          details: { contract: 'buddy-phone-search' },
        })
      }
      return parsed.data
    },

    async invite(phone) {
      const raw = await client.request<unknown>({
        method: 'POST',
        url: H014_BUDDY_INVITE_PATH,
        data: { phone: phone.trim() },
      })
      const parsed = parseContract(buddyPhoneInviteResponseSchema, raw, {
        source: contractSource(),
        contract: 'buddy-phone-invite',
      })
      if (!parsed.ok) {
        throw createBusinessError(parsed.error.message, {
          code: parsed.error.code,
          details: { contract: 'buddy-phone-invite' },
        })
      }
      return parsed.data
    },
  }
}

export const buddyPhoneService = createBuddyPhoneService()
