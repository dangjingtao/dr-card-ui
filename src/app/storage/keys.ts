import type { ZodType } from 'zod'

export type StorageArea = 'local' | 'session'

export type StorageKey<T> = Readonly<{
  name: `dr-card:${string}`
  area: StorageArea
  schema: ZodType<T>
}>

/**
 * Storage keys are defined here, not next to pages or stores.
 *
 * H011 intentionally does not add a real business key: the formal H5 currently has
 * no confirmed persistence requirement, and authentication/token persistence is not
 * decided by this task.
 */
export function defineStorageKey<T>(
  name: string,
  area: StorageArea,
  schema: ZodType<T>,
): StorageKey<T> {
  return Object.freeze({
    name: `dr-card:${name}` as const,
    area,
    schema,
  })
}

/**
 * Add confirmed, non-sensitive persistence keys to this registry.
 * Do not add passwords, consumption/payment PINs, long-lived secrets, or ad-hoc auth tokens.
 */
export const STORAGE_KEYS = {} as const
