import { z } from 'zod'

/**
 * H014 migration paths are frontend integration seams, not a claim about the blocked H008 backend
 * contract. They let the page → service → HTTP → MSW lifecycle become real now; H008 must replace
 * or confirm these paths when the backend base/auth/envelope is provided.
 */
export const H014_BUDDY_SEARCH_PATH = '/__h014/buddies/phone-search'
export const H014_BUDDY_INVITE_PATH = '/__h014/buddies/phone-invitations'
export const H014_EXCHANGE_REDEEM_PATH = '/__h014/exchange/redemptions'

export const serviceFailureSchema = z.object({
  ok: z.literal(false),
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
  }),
})

export const buddyPhoneSearchSuccessSchema = z.object({
  ok: z.literal(true),
  data: z.object({
    outcome: z.enum(['invitable', 'not-found', 'invited']),
    phone: z.string(),
    name: z.string().optional(),
  }),
})

export const buddyPhoneSearchResponseSchema = z.discriminatedUnion('ok', [
  buddyPhoneSearchSuccessSchema,
  serviceFailureSchema,
])

export const buddyPhoneInviteSuccessSchema = z.object({
  ok: z.literal(true),
  data: z.object({
    phone: z.string(),
  }),
})

export const buddyPhoneInviteResponseSchema = z.discriminatedUnion('ok', [
  buddyPhoneInviteSuccessSchema,
  serviceFailureSchema,
])

export const exchangeRedeemSuccessSchema = z.object({
  ok: z.literal(true),
  data: z.object({
    productId: z.string().min(1),
  }),
})

export const exchangeRedeemResponseSchema = z.discriminatedUnion('ok', [
  exchangeRedeemSuccessSchema,
  serviceFailureSchema,
])

export type BuddyPhoneSearchSuccess = z.infer<typeof buddyPhoneSearchSuccessSchema>['data']
export type BuddyPhoneInviteSuccess = z.infer<typeof buddyPhoneInviteSuccessSchema>['data']
export type ExchangeRedeemSuccess = z.infer<typeof exchangeRedeemSuccessSchema>['data']
