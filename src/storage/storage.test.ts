import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { defineStorageKey } from './keys'
import { createStorageAdapter, type StorageBackend } from './storage'

type MemoryStorage = StorageBackend & { values: Map<string, string> }

function createMemoryStorage(): MemoryStorage {
  const values = new Map<string, string>()

  return {
    values,
    getItem(key) {
      return values.get(key) ?? null
    },
    setItem(key, value) {
      values.set(key, value)
    },
    removeItem(key) {
      values.delete(key)
    },
  }
}

describe('Storage Adapter', () => {
  it('namespaces keys and keeps local/session storage separated', () => {
    const localBackend = createMemoryStorage()
    const sessionBackend = createMemoryStorage()
    const adapter = createStorageAdapter((area) =>
      area === 'local' ? localBackend : sessionBackend,
    )
    const localKey = defineStorageKey(
      'h017-local-probe',
      'local',
      z.object({ theme: z.enum(['light', 'dark']) }),
    )
    const sessionKey = defineStorageKey(
      'h017-session-probe',
      'session',
      z.object({ step: z.number().int().nonnegative() }),
    )

    expect(localKey.name).toBe('dr-card:h017-local-probe')
    expect(sessionKey.name).toBe('dr-card:h017-session-probe')
    expect(adapter.write(localKey, { theme: 'dark' })).toBe(true)
    expect(adapter.write(sessionKey, { step: 2 })).toBe(true)
    expect(adapter.read(localKey)).toEqual({ theme: 'dark' })
    expect(adapter.read(sessionKey)).toEqual({ step: 2 })
    expect(sessionBackend.values.has(localKey.name)).toBe(false)
    expect(localBackend.values.has(sessionKey.name)).toBe(false)
  })

  it('removes malformed or schema-invalid stored values instead of leaking them upward', () => {
    const backend = createMemoryStorage()
    const adapter = createStorageAdapter(() => backend)
    const key = defineStorageKey(
      'h017-corrupt-probe',
      'local',
      z.object({ theme: z.enum(['light', 'dark']) }),
    )

    backend.values.set(key.name, '{broken json')
    expect(adapter.read(key)).toBeNull()
    expect(backend.values.has(key.name)).toBe(false)

    backend.values.set(key.name, JSON.stringify({ theme: 'invalid' }))
    expect(adapter.read(key)).toBeNull()
    expect(backend.values.has(key.name)).toBe(false)
  })

  it('rejects invalid writes and serialization failures', () => {
    const backend = createMemoryStorage()
    const adapter = createStorageAdapter(() => backend)
    const typedKey = defineStorageKey(
      'h017-typed-probe',
      'local',
      z.object({ theme: z.enum(['light', 'dark']) }),
    )
    const anyKey = defineStorageKey('h017-any-probe', 'session', z.any())

    expect(adapter.write(typedKey, { theme: 'invalid' })).toBe(false)

    const circular: { self?: unknown } = {}
    circular.self = circular
    expect(adapter.write(anyKey, circular)).toBe(false)
  })

  it('degrades safely when the storage backend is unavailable or throws', () => {
    const key = defineStorageKey(
      'h017-failure-probe',
      'local',
      z.object({ value: z.string() }),
    )
    const unavailable = createStorageAdapter(() => {
      throw new Error('storage getter blocked')
    })

    expect(unavailable.read(key)).toBeNull()
    expect(unavailable.write(key, { value: 'x' })).toBe(false)
    expect(unavailable.remove(key)).toBe(false)

    const throwingBackend = createStorageAdapter(() => ({
      getItem() {
        throw new Error('get blocked')
      },
      setItem() {
        throw new Error('quota exceeded')
      },
      removeItem() {
        throw new Error('remove blocked')
      },
    }))

    expect(throwingBackend.read(key)).toBeNull()
    expect(throwingBackend.write(key, { value: 'x' })).toBe(false)
    expect(throwingBackend.remove(key)).toBe(false)
  })
})
