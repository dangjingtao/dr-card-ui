import { z } from 'zod'

import { parseContract } from './parseContract'

/**
 * Foundation-only Mock example for H009.
 *
 * This is deliberately not a backend DTO or Native Bridge protocol. It proves the
 * runtime-schema pattern without inventing the still-unconfirmed H008 contract.
 * Replace it with a real domain contract when the first backend/Bridge contract is
 * confirmed; do not promote these fields into product semantics.
 */
export const h009MockPayloadSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  enabled: z.boolean(),
})

export type H009MockPayload = z.infer<typeof h009MockPayloadSchema>

export function parseH009MockPayload(input: unknown): H009MockPayload {
  return parseContract(h009MockPayloadSchema, input, {
    source: 'mock',
    contract: 'h009.mock-example',
  })
}
