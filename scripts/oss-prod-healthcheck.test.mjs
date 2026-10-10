import test from 'node:test'
import assert from 'node:assert/strict'
import { makeCandidate } from './oss-prod-release-core.mjs'
import { productionBase, checkPublishedH5 } from './oss-prod-healthcheck.mjs'

const base = 'https://kbs.3cgroup.cn/kbs-web/prod/last/'
const sha = 'a'.repeat(40)
function fixture() {
  const files = new Map([
    ['index.html', Buffer.from('<html><head><link rel="stylesheet" href="/kbs-web/prod/last/assets/ui-abcdef12.css"></head><body><script src="/kbs-web/prod/last/assets/index-abcdef12.js"></script></body></html>')],
    ['assets/index-abcdef12.js', Buffer.from('console.log("h5")')],
    ['assets/ui-abcdef12.css', Buffer.from('body { color: red }')],
    ['build-meta.json', Buffer.from(JSON.stringify({
      appEnvironment: 'prod', dataMode: 'api', bridgeMode: 'native',
      build: { sha, id: '101.1' }, ossWeb: { target: 'prod', path: '/kbs-web/prod/last/' },
    }))],
  ])
  return makeCandidate({ files, sha, runId: 101, attempt: 1 })
}
function fakeSite(candidate, overrides = {}) {
  const contentTypes = { 'index.html': 'text/html',
    'build-meta.json': 'application/json',
    'release-manifest.json': 'application/json',
    'assets/index-abcdef12.js': 'text/javascript',
    'assets/ui-abcdef12.css': 'text/css' }
  const provided = new Map(candidate.files)
  provided.set('release-manifest.json', Buffer.from(JSON.stringify(candidate.manifest)))
  const requests = []
  async function fetchImpl(raw, options) {
    const url = new URL(raw)
    requests.push(url.pathname)
    assert.equal(options.redirect, 'error')
    const key = url.pathname.slice('/kbs-web/prod/last/'.length)
    if (key === overrides.missing) return new Response('Not found', { status: 404 })
    const bytes = overrides[key] ?? provided.get(key)
    return new Response(bytes, {
      status: 200,
      headers: {
        'content-type': overrides.contentType?.[key] || contentTypes[key],
        'cache-control': overrides.cacheControl?.[key] || 'no-cache, must-revalidate',
      },
    })
  }
  return { fetchImpl, requests }
}
test('reject HTTP, custom domains, hidden query, traversal and foreign paths', () => {
  assert.equal(productionBase(base).href, base)
  for (const bad of [
    'http://kbs.3cgroup.cn/kbs-web/prod/last/',
    'https://evil.example/kbs-web/prod/last/',
    'https://kbs.3cgroup.cn/kbs-web/ui/',
    base + '?redirect=http://evil.example', base + '#fragment',
    'https://a@kbs.3cgroup.cn/kbs-web/prod/last/',
  ]) assert.throws(() => productionBase(bad))
})
test('real company static responses with matching SHA and assets pass', async () => {
  const candidate = fixture()
  const site = fakeSite(candidate)
  const proof = await checkPublishedH5({ baseUrl: base, manifest: candidate.manifest,
    fetchImpl: site.fetchImpl })
  assert.equal(proof.ok, true)
  assert.equal(proof.releaseId, 'r101-a1')
  assert.equal(proof.fromExistingHealthcheck, true)
  assert.equal(site.requests.length, 5)
  assert.ok(site.requests.includes('/kbs-web/prod/last/assets/index-abcdef12.js'))
})
test('missing JS, stale HTML, stale identity or wrong MIME refuse acceptance', async () => {
  const candidate = fixture()
  for (const overrides of [
    { missing: 'assets/index-abcdef12.js' },
    { 'index.html': Buffer.from('<html>old html</html>') },
    { 'build-meta.json': Buffer.from('{}') },
    { 'release-manifest.json': Buffer.from('{}') },
    { contentType: { 'assets/index-abcdef12.js': 'text/html' } },
    { contentType: { 'index.html': 'application/octet-stream' } },
    { cacheControl: { 'index.html': 'public, max-age=31536000' } },
  ]) {
    const site = fakeSite(candidate, overrides)
    await assert.rejects(checkPublishedH5({ baseUrl: base, manifest: candidate.manifest,
      fetchImpl: site.fetchImpl }))
  }
})
test('transport fails closed; App WebView capability is not claimed', async () => {
  const candidate = fixture()
  await assert.rejects(checkPublishedH5({ baseUrl: base, manifest: candidate.manifest,
    fetchImpl: async () => { throw new Error('timeout') } }), /fetch failed/)
})
