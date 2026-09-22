import assert from 'node:assert/strict'
import fs from 'node:fs'
import http from 'node:http'
import { createServer as createViteServer } from 'vite'
import { setupServer } from 'msw/node'

const vite = await createViteServer({
  appType: 'custom',
  logLevel: 'error',
  server: { middlewareMode: true },
})

let realServer
let mockServer

try {
  const { createHttpClient } = await vite.ssrLoadModule('/src/services/http/httpClient.ts')
  const { handlers } = await vite.ssrLoadModule('/src/mocks/handlers/index.ts')
  const { H013_NETWORK_PROBE_PATH, H013_NETWORK_PROBE_PAYLOAD } = await vite.ssrLoadModule(
    '/src/mocks/fixtures/networkProbe.ts',
  )

  assert.ok(fs.existsSync('public/mockServiceWorker.js'), 'MSW worker source asset must exist.')

  const mainSource = fs.readFileSync('src/main.tsx', 'utf8')
  assert.match(mainSource, /runtimePolicy\.dataMode\s*!==\s*['"]mock['"]/) 
  assert.match(mainSource, /import\(['"]\.\/mocks\/browser['"]\)/)

  const browserSource = fs.readFileSync('src/mocks/browser.ts', 'utf8')
  assert.match(browserSource, /setupWorker\(\.\.\.handlers\)/)
  assert.match(browserSource, /mockServiceWorker\.js/)

  const buildSource = fs.readFileSync('scripts/build-h5.mjs', 'utf8')
  assert.match(buildSource, /dataMode === ['"]mock['"]/) 
  assert.match(buildSource, /rmSync\(mockWorkerPath, \{ force: true \}\)/)

  const requestProbe = (client) =>
    client.request({
      method: 'GET',
      url: H013_NETWORK_PROBE_PATH,
    })

  mockServer = setupServer(...handlers)
  mockServer.listen({ onUnhandledRequest: 'error' })

  const mockedClient = createHttpClient({ baseURL: 'https://h013.mock.invalid' })
  assert.deepEqual(await requestProbe(mockedClient), H013_NETWORK_PROBE_PAYLOAD)

  mockServer.close()
  mockServer = undefined

  realServer = http.createServer((request, response) => {
    if (request.method !== 'GET' || request.url !== H013_NETWORK_PROBE_PATH) {
      response.writeHead(404).end()
      return
    }

    response.writeHead(200, { 'Content-Type': 'application/json' })
    response.end(JSON.stringify({ ok: true, source: 'real', boundary: 'network' }))
  })

  await new Promise((resolve, reject) => {
    realServer.once('error', reject)
    realServer.listen(0, '127.0.0.1', resolve)
  })

  const address = realServer.address()
  assert.ok(address && typeof address === 'object')

  const realClient = createHttpClient({ baseURL: `http://127.0.0.1:${address.port}` })
  assert.deepEqual(await requestProbe(realClient), {
    ok: true,
    source: 'real',
    boundary: 'network',
  })

  console.log(
    'H013 MSW PASS: the same HTTP-client request uses MSW or a real HTTP server without page branching; browser bootstrap and worker asset gates are wired.',
  )
} finally {
  mockServer?.close()
  if (realServer) {
    await new Promise((resolve) => realServer.close(resolve))
  }
  await vite.close()
}
