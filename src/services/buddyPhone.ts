import { z } from 'zod'

import { parseContract } from './contracts/parseContract'
import { createBusinessError, httpClient } from './http'

/**
 * H014 reserved transport seams.
 *
 * These paths are intentionally scoped under /__h014 so they cannot be mistaken for confirmed
 * backend endpoints while H008 is still blocked. Pages call this service only; once backend
 * endpoint/DTO/auth contracts are supplied, the transport mapping can be replaced here without
 * changing page code or Mock/API branching in the page.
 */
export const H014_BUDDY_PHONE_SEARCH_PATH = '/__h014/buddy-phone/search'
export const H014_BUDDY_PHONE_INVITE_PATH = '/__h014/buddy-phone/invite'

export type BuddyPhoneSearchOutcome = 'invitable' | 'not-found' | 'invited'

const buddyPhoneSearchResponseSchema = z.discriminatedUnion('ok', [
  z.object({
    ok: z.literal(true),
    outcome: z.enum(['invitable', 'not-found', 'invited']),
  }),
  z.object({
    ok: z.literal(false),
    message: z.string().min(1),
  }),
])

const buddyPhoneInviteResponseSchema = z.discriminatedUnion('ok', [
  z.object({ ok: z.literal(true) }),
  z.object({
    ok: z.literal(false),
    message: z.string().min(1),
  }),
])

export async function searchBuddyByPhone(phone: string): Promise<{ outcome: BuddyPhoneSearchOutcome }> {
  const payload = await httpClient.request<unknown>({
    method: 'GET',
    url: H014_BUDDY_PHONE_SEARCH_PATH,
    params: { phone: phone.trim() },
  })
  const parsed = parseContract(buddyPhoneSearchResponseSchema, payload, {
    source: 'api',
    contract: 'h014.buddy-phone-search',
  })

  if (!parsed.ok) throw createBusinessError(parsed.message)
  return { outcome: parsed.outcome }
}

export async function sendBuddyPhoneInvite(phone: string): Promise<void> {
  const payload = await httpClient.request<unknown>({
    method: 'POST',
    url: H014_BUDDY_PHONE_INVITE_PATH,
    data: { phone: phone.trim() },
  })
  const parsed = parseContract(buddyPhoneInviteResponseSchema, payload, {
    source: 'api',
    contract: 'h014.buddy-phone-invite',
  })

  if (!parsed.ok) throw createBusinessError(parsed.message)
}
