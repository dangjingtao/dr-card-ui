import type { StorageArea, StorageKey } from './keys'

export interface StorageBackend {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export type StorageResolver = (area: StorageArea) => StorageBackend | null

export interface StorageAdapter {
  read<T>(key: StorageKey<T>): T | null
  write<T>(key: StorageKey<T>, value: T): boolean
  remove(key: StorageKey<unknown>): boolean
}

function resolveBrowserStorage(area: StorageArea): StorageBackend | null {
  if (typeof window === 'undefined') return null

  try {
    return area === 'local' ? window.localStorage : window.sessionStorage
  } catch {
    return null
  }
}

function resolveSafely(resolveStorage: StorageResolver, area: StorageArea): StorageBackend | null {
  try {
    return resolveStorage(area)
  } catch {
    return null
  }
}

function removeCorruptValue(storage: StorageBackend, key: string): void {
  try {
    storage.removeItem(key)
  } catch {
    // A corrupt value must never turn a read into an application error.
  }
}

export function createStorageAdapter(
  resolveStorage: StorageResolver = resolveBrowserStorage,
): StorageAdapter {
  return {
    read<T>(key: StorageKey<T>): T | null {
      const storage = resolveSafely(resolveStorage, key.area)
      if (!storage) return null

      let raw: string | null
      try {
        raw = storage.getItem(key.name)
      } catch {
        return null
      }

      if (raw === null) return null

      let parsedJson: unknown
      try {
        parsedJson = JSON.parse(raw)
      } catch {
        removeCorruptValue(storage, key.name)
        return null
      }

      const parsed = key.schema.safeParse(parsedJson)
      if (!parsed.success) {
        removeCorruptValue(storage, key.name)
        return null
      }

      return parsed.data
    },

    write<T>(key: StorageKey<T>, value: T): boolean {
      const parsed = key.schema.safeParse(value)
      if (!parsed.success) return false

      let serialized: string | undefined
      try {
        serialized = JSON.stringify(parsed.data)
      } catch {
        return false
      }

      if (serialized === undefined) return false

      const storage = resolveSafely(resolveStorage, key.area)
      if (!storage) return false

      try {
        storage.setItem(key.name, serialized)
        return true
      } catch {
        return false
      }
    },

    remove(key: StorageKey<unknown>): boolean {
      const storage = resolveSafely(resolveStorage, key.area)
      if (!storage) return false

      try {
        storage.removeItem(key.name)
        return true
      } catch {
        return false
      }
    },
  }
}

export const storage = createStorageAdapter()
