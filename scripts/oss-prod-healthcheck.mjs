// #170: validate the *deployed* H5 bytes over its stable company-domain URL.
// The existing OSS Connection Smoke already probes bucket write/read; this
// complements that probe with website identity/assets, not another monitor.
import { checkManifest, sha256 } from './oss-prod-release-core.mjs'

const fixedPath = '/kbs-web/prod/last/'
const content = body => Buffer.from(body)

export function productionBase(raw) {
  if (typeof raw !== 'string' || !raw) throw new Error('Company H5 origin is not configured')
  const url = new URL(raw)
  if (url.protocol !== 'https:' || url.hostname !== 'kbs.3cgroup.cn' ||
      url.pathname !== fixedPath || url.username || url.password ||
      url.port || url.search || url.hash || url.href !== raw) {
    throw new Error('Production H5 requires the approved HTTPS company URL ending /kbs-web/prod/last/')
  }
  return url
}
function verifyContentType(type, kind) {
  const media = (type || '').split(';')[0].trim().toLowerCase()
  if (kind === 'html') return media === 'text/html'
  if (kind === 'json') return media === 'application/json'
  if (kind === 'css') return media === 'text/css'
  if (kind === 'js') return ['text/javascript', 'application/javascript', 'application/x-javascript'].includes(media)
  return media !== 'text/html'
}
function noLongCache(header) {
  const cache = (header || '').toLowerCase()
  return cache.includes('no-cache') || cache.includes('no-store') || cache.includes('max-age=0')
}
const asArray = matches => [...matches].map(match => match[1])

export async function checkPublishedH5({ baseUrl, manifest, fetchImpl = fetch }) {
  checkManifest(manifest)
  if (typeof fetchImpl !== 'function') throw new Error('No HTTP fetch transport')
  const base = productionBase(baseUrl)
  const prefix = base.pathname
  // Release ID is an unguessable-enough nonce for bypassing intermediary URL caches,
  // but responses must still carry proper cache headers.
  const nonce = '?__h5_check=' + encodeURIComponent(manifest.id)
  const requested = []
  async function read(path, kind, withCacheRule = false) {
    const url = new URL(path + nonce, base)
    if (url.origin !== base.origin || !url.pathname.startsWith(prefix)) {
      throw new Error('Healthcheck attempted to leave production H5 prefix')
    }
    let res
    try {
      res = await fetchImpl(url.href, {
        method: 'GET', cache: 'no-store', redirect: 'error',
        signal: AbortSignal.timeout(12000),
      })
    } catch {
      throw new Error('Production website Healthcheck fetch failed')
    }
    if (!res.ok || !verifyContentType(res.headers.get('content-type'), kind)) {
      throw new Error(`Healthcheck HTTP status/type mismatch for ${path}`)
    }
    if (withCacheRule && !noLongCache(res.headers.get('cache-control'))) {
      throw new Error(`Healthcheck requires nonpersistent HTML/metadata cache: ${path}`)
    }
    const bytes = content(await res.arrayBuffer())
    requested.push(path)
    return bytes
  }
  const byName = new Map(manifest.files.map(f => [f.path, f]))
  async function verify(path, kind, cacheCheck = false) {
    const entry = byName.get(path)
    if (!entry) throw new Error(`Manifest omits required ${path}`)
    const bytes = await read(path, kind, cacheCheck)
    if (bytes.length !== entry.size || sha256(bytes) !== entry.sha256) {
      throw new Error(`Healthcheck content/identity mismatch: ${path}`)
    }
    return bytes
  }
  const html = (await verify('index.html', 'html', true)).toString('utf8')
  const meta = JSON.parse((await verify('build-meta.json', 'json', true)).toString('utf8'))
  if (meta.appEnvironment !== 'prod' || meta.dataMode !== 'api' ||
      meta.bridgeMode !== 'native' || meta.build?.sha !== manifest.sha ||
      meta.build?.id !== manifest.buildId ||
      meta.ossWeb?.path !== prefix) {
    throw new Error('Healthcheck wrong environment or Git identity')
  }
  const publishedManifest = JSON.parse((await read('release-manifest.json', 'json', true)).toString('utf8'))
  if (JSON.stringify(publishedManifest) !== JSON.stringify(manifest)) {
    throw new Error('Healthcheck returned stale release-manifest identity')
  }
  // Validate exactly the entry's JS/CSS links, not just a 200 HTML fallback.
  const assets = asArray(html.matchAll(/(?:src|href)=["']([^"']+)["']/g))
    .filter(url => /\.(?:js|css)(?:\?.*)?$/.test(url))
    .map(url => {
      const parsed = new URL(url, base)
      if (parsed.origin !== base.origin || !parsed.pathname.startsWith(prefix + 'assets/') ||
          parsed.search || parsed.hash) throw new Error('Healthcheck cross-environment static asset')
      return parsed.pathname.slice(prefix.length)
    })
  if (!assets.some(x => x.endsWith('.js')) || !assets.some(x => x.endsWith('.css'))) {
    throw new Error('No JS and CSS referenced in production HTML')
  }
  for (const path of new Set(assets)) {
    await verify(path, path.endsWith('.js') ? 'js' : 'css')
  }
  return { ok: true, releaseId: manifest.id,
    source: 'company-domain-static-readback', checkedPaths: requested }
}
