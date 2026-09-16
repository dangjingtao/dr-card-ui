import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { createServer } from 'vite'
import { z } from 'zod'

const server = await createServer({
  appType: 'custom',
  logLevel: 'error',
  server: { middlewareMode: true },
})

async function listSourceFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await listSourceFiles(fullPath)))
    } else if (/\.(?:ts|tsx|js|jsx)$/.test(entry.name)) {
      files.push(fullPath)
    }
  }

  return files
}

function createMemoryStorage() {
  const values = new Map()
  return {
    values,
    getItem(key) {
      return values.has(key) ? values.get(key) : null
    },
    setItem(key, value) {
      values.set(key, value)
    },
    removeItem(key) {
      values.delete(key)
    },
  }
}

try {
  const storageModule = await server.ssrLoadModule('/src/app/storage/storage.ts')
  const keyModule = await server.ssrLoadModule('/src/app/storage/keys.ts')
  const { createStorageAdapter, storage: browserStorage } = storageModule
  const { defineStorageKey, STORAGE_KEYS } = keyModule

  assert.deepEqual(STORAGE_KEYS, {})

  const localBackend = createMemoryStorage()
  const sessionBackend = createMemoryStorage()
  const adapter = createStorageAdapter((area) =>
    area === 'local' ? localBackend : sessionBackend,
  )

  const localKey = defineStorageKey(
    'h011-local-probe',
    'local',
    z.object({ theme: z.enum(['light', 'dark']) }),
  )
  const sessionKey = defineStorageKey(
    'h011-session-probe',
    'session',
    z.object({ step: z.number().int().nonnegative() }),
  )

  assert.equal(localKey.name, 'dr-card:h011-local-probe')
  assert.equal(sessionKey.name, 'dr-card:h011-session-probe')
  assert.equal(adapter.read(localKey), null)
  assert.equal(adapter.write(localKey, { theme: 'dark' }), true)
  assert.deepEqual(adapter.read(localKey), { theme: 'dark' })
  assert.equal(sessionBackend.values.has(localKey.name), false)

  assert.equal(adapter.write(sessionKey, { step: 2 }), true)
  assert.deepEqual(adapter.read(sessionKey), { step: 2 })
  assert.equal(localBackend.values.has(sessionKey.name), false)

  localBackend.values.set(localKey.name, '{broken json')
  assert.equal(adapter.read(localKey), null)
  assert.equal(localBackend.values.has(localKey.name), false)

  localBackend.values.set(localKey.name, JSON.stringify({ theme: 'invalid' }))
  assert.equal(adapter.read(localKey), null)
  assert.equal(localBackend.values.has(localKey.name), false)

  assert.equal(adapter.write(localKey, { theme: 'invalid' }), false)

  const anyKey = defineStorageKey('h011-any-probe', 'session', z.any())
  const circular = {}
  circular.self = circular
  assert.equal(adapter.write(anyKey, circular), false)

  assert.equal(adapter.remove(sessionKey), true)
  assert.equal(adapter.read(sessionKey), null)

  const resolverFailure = createStorageAdapter(() => {
    throw new Error('storage getter blocked')
  })
  assert.equal(resolverFailure.read(localKey), null)
  assert.equal(resolverFailure.write(localKey, { theme: 'light' }), false)
  assert.equal(resolverFailure.remove(localKey), false)

  const readFailure = createStorageAdapter(() => ({
    getItem() {
      throw new Error('getItem blocked')
    },
    setItem() {},
    removeItem() {},
  }))
  assert.equal(readFailure.read(localKey), null)

  const writeFailure = createStorageAdapter(() => ({
    getItem() {
      return null
    },
    setItem() {
      throw new Error('quota exceeded')
    },
    removeItem() {},
  }))
  assert.equal(writeFailure.write(localKey, { theme: 'light' }), false)

  const removeFailure = createStorageAdapter(() => ({
    getItem() {
      return null
    },
    setItem() {},
    removeItem() {
      throw new Error('remove blocked')
    },
  }))
  assert.equal(removeFailure.remove(localKey), false)

  // Vite SSR executes in Node without a browser window. The production facade must degrade safely.
  assert.equal(browserStorage.read(localKey), null)
  assert.equal(browserStorage.write(localKey, { theme: 'light' }), false)
  assert.equal(browserStorage.remove(localKey), false)

  const sourceFiles = await listSourceFiles('src')
  const storageImplementation = path.normalize('src/app/storage/storage.ts')
  const keyRegistry = path.normalize('src/app/storage/keys.ts')

  for (const file of sourceFiles) {
    const normalized = path.normalize(file)
    const source = await readFile(file, 'utf8')

    if (normalized !== storageImplementation) {
      assert.equal(
        source.includes('localStorage'),
        false,
        `${file} bypasses H011 by referencing localStorage directly`,
      )
      assert.equal(
        source.includes('sessionStorage'),
        false,
        `${file} bypasses H011 by referencing sessionStorage directly`,
      )
    }

    if (normalized !== keyRegistry) {
      assert.equal(
        source.includes('defineStorageKey('),
        false,
        `${file} defines a storage key outside the centralized registry`,
      )
    }
  }

  console.log(
    'H011 STORAGE PASS: guarded typed storage behavior, local/session separation, corrupt-value handling, SSR safety, centralized keys, and direct Web Storage bypass checks are verified.',
  )
} finally {
  await server.close()
}
