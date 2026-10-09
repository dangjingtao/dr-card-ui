import { z } from 'zod'
import { parseContract } from './contracts/parseContract'
import { createBusinessError, httpClient } from './http'

/**
 * #111: reserved Mock-only seams. These are NOT confirmed backend routes.
 * API/test/prod UI uses buddyPhoneGateway's fail-closed gate until #105/#95 is signed.
 */
export const H014_BUDDY_PHONE_SEARCH_PATH = '/__h014/buddy-phone/search'
export const H014_BUDDY_PHONE_INVITE_PATH = '/__h014/buddy-phone/invite'
export const H111_BUDDY_INBOX_PATH = '/__h014/buddy-phone/invitations'

export const isCompleteBuddyPhone = (phone: string): boolean => /^1[3-9]\d{9}$/.test(phone.trim())
export type BuddyPhoneSearchOutcome =
  | 'invitable' | 'not-found' | 'invited' | 'incoming-pending' | 'already-buddies' | 'self'

const buddyUserSchema = z.object({
  id: z.string().min(1).max(120),
  nickname: z.string().min(1).max(120),
  avatarUrl: z.string().url().nullable(),
})
export type BuddyPhoneUser = z.infer<typeof buddyUserSchema>

const buddyPhoneSearchResponseSchema = z.discriminatedUnion('ok', [
  z.object({
    ok: z.literal(true),
    outcome: z.enum(['invitable', 'not-found', 'invited', 'incoming-pending', 'already-buddies', 'self']),
    user: buddyUserSchema.optional(),
    invitationId: z.string().min(1).optional(),
  }),
  z.object({ ok: z.literal(false), message: z.string().min(1) }),
])

const successSchema = z.discriminatedUnion('ok', [
  z.object({ ok: z.literal(true), result: z.enum(['sent', 'already-pending', 'accepted', 'already-buddies']).optional() }),
  z.object({ ok: z.literal(false), message: z.string().min(1) }),
])

const invitationSchema = z.object({
  id: z.string().min(1),
  inviter: buddyUserSchema,
  status: z.enum(['pending', 'completed']),
  createdAt: z.string().min(1),
})
export type BuddyPhoneInvitation = z.infer<typeof invitationSchema>
const inboxSchema = z.discriminatedUnion('ok', [
  z.object({ ok: z.literal(true), items: z.array(invitationSchema).max(100) }),
  z.object({ ok: z.literal(false), message: z.string().min(1) }),
])
export interface BuddyPhoneSearchResult {
  outcome: BuddyPhoneSearchOutcome
  user?: BuddyPhoneUser
  invitationId?: string
}

export async function searchBuddyByPhone(phone: string): Promise<BuddyPhoneSearchResult> {
  const payload = await httpClient.request<unknown>({
    method: 'GET', url: H014_BUDDY_PHONE_SEARCH_PATH, params: { phone: phone.trim() },
  })
  const parsed = parseContract(buddyPhoneSearchResponseSchema, payload, {
    source: 'api', contract: 'h111.buddy-phone-search',
  })
  if (!parsed.ok) throw createBusinessError(parsed.message)
  if (parsed.outcome !== 'not-found' && !parsed.user) {
    throw createBusinessError('用户资料不完整')
  }
  if (parsed.outcome === 'incoming-pending' && !parsed.invitationId) {
    throw createBusinessError('反向邀请缺少确认标识')
  }
  return {
    outcome: parsed.outcome,
    ...(parsed.user ? { user: parsed.user } : {}),
    ...(parsed.invitationId ? { invitationId: parsed.invitationId } : {}),
  }
}

export async function sendBuddyPhoneInvite(phone: string): Promise<void> {
  const payload = await httpClient.request<unknown>({
    method: 'POST', url: H014_BUDDY_PHONE_INVITE_PATH, data: { phone: phone.trim() },
  })
  const parsed = parseContract(successSchema, payload, {
    source: 'api', contract: 'h111.buddy-phone-send',
  })
  if (!parsed.ok) throw createBusinessError(parsed.message)
}

export async function getBuddyPhoneInvitations(): Promise<BuddyPhoneInvitation[]> {
  const payload = await httpClient.request<unknown>({
    method: 'GET', url: H111_BUDDY_INBOX_PATH,
  })
  const parsed = parseContract(inboxSchema, payload, {
    source: 'api', contract: 'h111.buddy-inbox',
  })
  if (!parsed.ok) throw createBusinessError(parsed.message)
  return parsed.items
}

export async function acceptBuddyPhoneInvitation(id: string): Promise<'accepted' | 'already-buddies'> {
  if (!id || id.includes('/') || id.includes('?')) throw createBusinessError('邀请标识无效')
  const payload = await httpClient.request<unknown>({
    method: 'POST', url: `${H111_BUDDY_INBOX_PATH}/${encodeURIComponent(id)}/accept`,
  })
  const parsed = parseContract(successSchema, payload, {
    source: 'api', contract: 'h111.buddy-invitation-accept',
  })
  if (!parsed.ok) throw createBusinessError(parsed.message)
  if (parsed.result !== 'accepted' && parsed.result !== 'already-buddies') {
    throw createBusinessError('邀请确认结果不完整')
  }
  return parsed.result
}
