import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createServer as createViteServer } from 'vite'

process.env.VITE_APP_ENV = 'dev'
process.env.VITE_DATA_MODE = 'mock'
process.env.VITE_BRIDGE_MODE = 'native'

const vite = await createViteServer({
  appType: 'custom',
  logLevel: 'error',
  server: { middlewareMode: true },
})

const originalWindow = globalThis.window

function collectFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) return collectFiles(entryPath)
    return /\.[jt]sx?$/.test(entry.name) ? [entryPath] : []
  })
}

try {
  const {
    NativeBridgeError,
    getLoginToken,
    getNativeBridgeDiagnostics,
  } = await vite.ssrLoadModule('/src/services/nativeBridge.ts')

  const firstBridge = {
    marker: 'first',
    getLoginToken() {
      assert.equal(this, firstBridge, 'Android injected method must keep its receiver binding')
      return 'token-first'
    },
  }
  globalThis.window = { androidBridge: firstBridge }

  assert.deepEqual(getNativeBridgeDiagnostics(), {
    mode: 'native',
    host: 'android',
    hostVersion: null,
    capabilities: { getLoginToken: true },
  })
  assert.equal(await getLoginToken(), 'token-first')

  const secondBridge = {
    marker: 'second',
    getLoginToken() {
      assert.equal(this, secondBridge, 'late-injected Android bridge must keep its receiver binding')
      return 'token-second'
    },
  }
  globalThis.window.androidBridge = secondBridge
  assert.equal(
    await getLoginToken(),
    'token-second',
    'adapter must resolve window.androidBridge on every invocation instead of caching it',
  )

  globalThis.window = {}
  await assert.rejects(
    getLoginToken(),
    (error) => error instanceof NativeBridgeError && error.code === 'bridge-unsupported',
  )

  globalThis.window = { androidBridge: {} }
  await assert.rejects(
    getLoginToken(),
    (error) => error instanceof NativeBridgeError && error.code === 'capability-unsupported',
  )

  globalThis.window = {
    androidBridge: {
      getLoginToken() {
        throw new Error('native exploded')
      },
    },
  }
  await assert.rejects(
    getLoginToken(),
    (error) => error instanceof NativeBridgeError && error.code === 'invocation-failed',
  )

  globalThis.window = {
    androidBridge: {
      getLoginToken() {
        return new Promise(() => {})
      },
    },
  }
  await assert.rejects(
    getLoginToken({ timeoutMs: 20 }),
    (error) => error instanceof NativeBridgeError && error.code === 'invocation-timeout',
  )

  globalThis.window = {
    webkit: {
      messageHandlers: {
        getAuthorizationInfo: { postMessage() {} },
      },
    },
  }
  assert.deepEqual(getNativeBridgeDiagnostics(), {
    mode: 'native',
    host: 'ios',
    hostVersion: null,
    capabilities: { getLoginToken: false },
  })

  for (const file of collectFiles('src/pages')) {
    const source = fs.readFileSync(file, 'utf8')
    assert.doesNotMatch(
      source,
      /\b(?:window\s*\.\s*androidBridge|androidBridge\s*\.|webkit\s*\??\.\s*messageHandlers)\b/,
      `${file} must not access Native host globals directly`,
    )
  }

  const adapterSource = fs.readFileSync('src/services/nativeBridge.ts', 'utf8')
  assert.match(adapterSource, /method\.call\(bridge\)/)
  assert.match(adapterSource, /runtimePolicy\.bridgeMode === 'native'/)
  assert.doesNotMatch(adapterSource, /mockToken|fakeToken|fallbackToken/)

  console.log(
    'H015 PASS: Android getLoginToken is centralized, late injection and receiver binding are preserved, Promise/timeout/error semantics are deterministic, iOS is not falsely unified, and pages do not access host globals directly.',
  )
} finally {
  if (originalWindow === undefined) delete globalThis.window
  else globalThis.window = originalWindow
  await vite.close()
}
