// #169: production release primitives. No process environment, cloud access or
// scheduled operations here. #170 must inject the REAL health check before use.
import { createHash } from 'node:crypto'

export const LAST = 'kbs-web/prod/last/'
export const HISTORY = 'kbs-web/prod/history/'
export const CATALOG = HISTORY + 'catalog.json'
export const MANIFEST = 'release-manifest.json'
export const KEEP = 5

export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const data = bytes => Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes)
const parse = bytes => JSON.parse(data(bytes).toString('utf8'))
const json = value => Buffer.from(JSON.stringify(value, null, 2) + '\n')

export function safeFile(path) {
  return typeof path === 'string' && path.length < 512 &&
    !path.startsWith('/') && !path.includes('\\') &&
    !/[\x00-\x1f]/.test(path) &&
    path.split('/').every(part => part && part !== '.' && part !== '..')
}
export function safeId(id) {
  return typeof id === 'string' && /^r[1-9][0-9]{0,15}-a[1-9][0-9]{0,5}$/.test(id)
}
function ensure(cond, reason) { if (!cond) throw new Error(reason) }
const releasePrefix = id => {
  ensure(safeId(id), 'Invalid release ID')
  return HISTORY + id + '/'
}
function fileEntries(fileMap) {
  const files = [...fileMap.entries()].map(([path, content]) => {
    ensure(safeFile(path) && path !== MANIFEST, 'Unsafe release filename')
    return { path, sha256: sha256(data(content)), size: data(content).length }
  }).sort((a, b) => a.path.localeCompare(b.path))
  ensure(files.some(x => x.path === 'index.html') && files.some(x => x.path === 'build-meta.json'),
    'Release is missing index or build metadata')
  return files
}
export function makeCandidate({ files, runId, attempt, sha, at = new Date().toISOString() }) {
  const id = `r${runId}-a${attempt}`
  ensure(safeId(id), 'Invalid GitHub run ID or attempt')
  ensure(/^[a-f0-9]{40}$/.test(sha), 'Invalid source Git SHA')
  ensure(!Number.isNaN(Date.parse(at)), 'Invalid release timestamp')
  const map = files instanceof Map ? files : new Map(Object.entries(files))
  const meta = parse(map.get('build-meta.json') ?? '{}')
  ensure(meta.appEnvironment === 'prod' && meta.dataMode === 'api' &&
    meta.bridgeMode === 'native' && meta.ossWeb?.target === 'prod' &&
    meta.ossWeb?.path === '/kbs-web/prod/last/' &&
    meta.build?.sha === sha && meta.build?.id === `${runId}.${attempt}`,
    'Refusing nonproduction, mismatched or Mock H5 bundle')
  return { manifest: {
    schemaVersion: 1, id, sha, buildId: meta.build.id, activatedAt: at,
    files: fileEntries(map),
  }, files: new Map([...map].map(([k, v]) => [k, data(v)])) }
}
export function checkManifest(manifest) {
  ensure(manifest?.schemaVersion === 1 && safeId(manifest.id) &&
    /^[a-f0-9]{40}$/.test(manifest.sha) &&
    typeof manifest.activatedAt === 'string' &&
    !Number.isNaN(Date.parse(manifest.activatedAt)) &&
    Array.isArray(manifest.files) && manifest.files.length > 1, 'Invalid release manifest')
  const names = new Set()
  for (const f of manifest.files) {
    ensure(safeFile(f.path) && f.path !== MANIFEST &&
      /^[a-f0-9]{64}$/.test(f.sha256) &&
      Number.isSafeInteger(f.size) && f.size >= 0 &&
      !names.has(f.path), 'Unsafe release manifest file entry')
    names.add(f.path)
  }
  ensure(names.has('index.html') && names.has('build-meta.json'), 'Incomplete release manifest')
  return manifest
}
async function getManifest(store, prefix) {
  const bytes = await store.get(prefix + MANIFEST)
  return bytes == null ? null : checkManifest(parse(bytes))
}
async function readSnapshot(store, prefix, manifest) {
  const files = new Map()
  for (const item of manifest.files) {
    const bytes = await store.get(prefix + item.path)
    ensure(bytes != null && data(bytes).length === item.size &&
      sha256(data(bytes)) === item.sha256,
    `Missing or damaged artifact: ${prefix + item.path}`)
    files.set(item.path, data(bytes))
  }
  return files
}
async function putAndCheck(store, key, bytes) {
  await store.put(key, bytes)
  const remote = await store.get(key)
  ensure(remote != null && sha256(data(remote)) === sha256(data(bytes)),
    `OSS readback mismatch: ${key}`)
}
function parseCatalog(bytes) {
  const cat = bytes == null ? { schemaVersion: 1, entries: [] } : parse(bytes)
  ensure(cat?.schemaVersion === 1 && Array.isArray(cat.entries), 'Invalid history catalog')
  const ids = new Set()
  for (const item of cat.entries) {
    ensure(safeId(item.id) && !ids.has(item.id) &&
      typeof item.activatedAt === 'string' &&
      !Number.isNaN(Date.parse(item.activatedAt)) &&
      /^[a-f0-9]{40}$/.test(item.sha) &&
      (item.state === undefined || item.state === 'deleting'),
      'Invalid catalog entry')
    if (item.state === 'deleting') {
      ensure(Array.isArray(item.deleteFiles) && item.deleteFiles.length >= 3 &&
        item.deleteFiles.at(-1) === MANIFEST &&
        item.deleteFiles.every(path => safeFile(path)) &&
        new Set(item.deleteFiles).size === item.deleteFiles.length,
        'Damaged historic deletion journal')
    } else {
      ensure(item.deleteFiles === undefined, 'Unexpected historic delete file list')
    }
    ids.add(item.id)
  }
  return cat
}
async function catalog(store) { return parseCatalog(await store.get(CATALOG)) }

// The previous accepted release is archived BEFORE any last/ file is modified.
// Existing history IDs are verified, never silently overwritten.
async function archivePrevious(store, oldManifest, oldFiles) {
  const listing = await catalog(store)
  ensure(!listing.entries.some(e => e.id === oldManifest.id && e.state === 'deleting'),
    'Historic archive is pending deletion; cannot re-use its release ID')
  const prefix = releasePrefix(oldManifest.id)
  const existing = await getManifest(store, prefix)
  if (existing) {
    ensure(JSON.stringify(existing) === JSON.stringify(oldManifest),
      'Conflicting existing history release ID')
    await readSnapshot(store, prefix, existing)
  } else {
    for (const entry of oldManifest.files) {
      ensure(await store.get(prefix + entry.path) == null,
        'Partial/conflicting immutable history prefix; manual repair required')
    }
    for (const entry of oldManifest.files) {
      await putAndCheck(store, prefix + entry.path, oldFiles.get(entry.path))
    }
    await putAndCheck(store, prefix + MANIFEST, json(oldManifest))
  }
  const catalogued = listing.entries.find(e => e.id === oldManifest.id)
  ensure(!catalogued || (catalogued.sha === oldManifest.sha &&
    catalogued.activatedAt === oldManifest.activatedAt), 'Conflicting history catalog ID')
  if (!catalogued) {
    listing.entries.push({
      id: oldManifest.id, sha: oldManifest.sha, activatedAt: oldManifest.activatedAt,
    })
    await putAndCheck(store, CATALOG, json(listing))
  }
}

// Never change an already-published static key to different bytes.
// Keeping old assets preserves clients still using cached old HTML.
async function stageAssets(store, candidate) {
  for (const f of candidate.manifest.files) {
    if (f.path === 'index.html' || f.path === 'build-meta.json') continue
    const key = LAST + f.path
    const previous = await store.get(key)
    ensure(previous == null || sha256(data(previous)) === f.sha256,
      `Non-versioned static object collision at ${key}; rename/hash the asset`)
    if (previous == null) await putAndCheck(store, key, candidate.files.get(f.path))
  }
}
async function switchEntry(store, manifest, files) {
  // The HTML entry point is the last file to change. No rm or folder sync.
  await putAndCheck(store, LAST + 'build-meta.json', files.get('build-meta.json'))
  await putAndCheck(store, LAST + MANIFEST, json(manifest))
  await putAndCheck(store, LAST + 'index.html', files.get('index.html'))
}
async function revertEntry(store, oldManifest, oldFiles) {
  if (!oldManifest) throw new Error('Bootstrap has no previous release; manual recovery required')
  await switchEntry(store, oldManifest, oldFiles)
}
function healthy(result, id) {
  return result?.ok === true && result.releaseId === id
}

function assertCandidate(candidate) {
  checkManifest(candidate?.manifest)
  ensure(candidate.files instanceof Map, 'Candidate must contain verifiable static files')
  const declared = candidate.manifest.files
  ensure(declared.length === candidate.files.size, 'Candidate includes undeclared files')
  for (const file of declared) {
    const bytes = candidate.files.get(file.path)
    ensure(bytes != null && data(bytes).length === file.size &&
      sha256(data(bytes)) === file.sha256, 'Candidate file/manifest hash mismatch')
  }
}

// Pipeline integration point for #170. Without a real injected healthcheck
// publish is rejected; this module is NOT wired to a production Action in #169.
export async function publish({ store, candidate, healthcheck, currentHead, allowBootstrap = false }) {
  ensure(typeof healthcheck === 'function' && typeof currentHead === 'function',
    'Real Healthcheck and source branch guard are mandatory')
  assertCandidate(candidate)
  const oldManifest = await getManifest(store, LAST)
  const oldIndex = await store.get(LAST + 'index.html')
  ensure(Boolean(oldManifest) === Boolean(oldIndex),
    'Unmanaged or damaged last/ entry; refuse to establish a false rollback baseline')
  ensure(oldManifest || allowBootstrap,
    'First prod/last deployment requires separately approved bootstrap')
  ensure(!oldManifest || oldManifest.id !== candidate.manifest.id,
    'Release already active; refusing duplicate promotion')
  const oldFiles = oldManifest ? await readSnapshot(store, LAST, oldManifest) : null
  if (oldManifest) await archivePrevious(store, oldManifest, oldFiles)
  await stageAssets(store, candidate)
  ensure(await currentHead(candidate.manifest.sha), 'Stale or unverifiable prod branch HEAD')
  let switched = false
  try {
    switched = true // includes partial entry writes
    await switchEntry(store, candidate.manifest, candidate.files)
    const result = await healthcheck(candidate.manifest)
    ensure(healthy(result, candidate.manifest.id), 'Real Healthcheck failed or returned wrong release ID')
    return { releaseId: candidate.manifest.id, previousId: oldManifest?.id ?? null,
      healthcheck: 'passed', history: (await catalog(store)).entries.length }
  } catch (error) {
    if (switched) {
      try { await revertEntry(store, oldManifest, oldFiles) }
      catch (restoreError) {
        throw new AggregateError([error, restoreError],
          'Release failed; automatic recovery could not restore a verified prior entry')
      }
    }
    throw error
  }
}

export async function rollback({ store, releaseId, healthcheck, authorizeRollback }) {
  ensure(safeId(releaseId) && typeof healthcheck === 'function' &&
    typeof authorizeRollback === 'function', 'Rollback requires explicit approval and real Healthcheck')
  const list = await catalog(store)
  ensure(list.entries.some(x => x.id === releaseId && x.state !== 'deleting'),
    'Not a catalogued successful historic release')
  const oldManifest = await getManifest(store, LAST)
  ensure(oldManifest && oldManifest.id !== releaseId, 'No distinct current release to restore')
  const oldFiles = await readSnapshot(store, LAST, oldManifest)
  const manifest = await getManifest(store, releasePrefix(releaseId))
  ensure(manifest && manifest.id === releaseId, 'Historic release manifest missing')
  const files = await readSnapshot(store, releasePrefix(releaseId), manifest)
  ensure(await authorizeRollback({ from: oldManifest.id, to: releaseId }),
    'Rollback not authorized for this exact release pair')
  // Preserve the currently deployed version BEFORE rollback, so a healthy
  // rollback does not lose the ability to roll forward to that exact build.
  await archivePrevious(store, oldManifest, oldFiles)
  await stageAssets(store, { manifest, files })
  try {
    await switchEntry(store, manifest, files)
    const result = await healthcheck(manifest)
    ensure(healthy(result, releaseId), 'Rollback healthcheck failed or returned wrong release')
    return { restored: releaseId, previous: oldManifest.id }
  } catch (error) {
    try { await revertEntry(store, oldManifest, oldFiles) }
    catch (restoreError) {
      throw new AggregateError([error, restoreError], 'Rollback failed; automatic recovery failed')
    }
    throw error
  }
}

export async function retentionPlan({ store, activeId, protectedIds = [] }) {
  ensure(safeId(activeId), 'Active release identity required')
  const list = await catalog(store)
  const all = [...list.entries].sort((a, b) =>
    Date.parse(a.activatedAt) - Date.parse(b.activatedAt) || a.id.localeCompare(b.id))
  const keep = new Set([activeId, ...protectedIds])
  for (const id of keep) ensure(safeId(id), 'Unsafe protected release ID')
  const deleting = all.filter(e => e.state === 'deleting')
  ensure(deleting.every(e => !keep.has(e.id)),
    'Pending history deletion is now protected or active; intervention required')
  const extra = Math.max(0, all.length - KEEP - deleting.length)
  const further = all.filter(e => e.state !== 'deleting' && !keep.has(e.id)).slice(0, extra)
  ensure(further.length === extra, 'Cannot prune: protected history exceeds retention capacity')
  return { total: all.length, keep: KEEP, victims: [...deleting, ...further], dryRun: true }
}

// Crash-safe two-phase history cleanup:
// 1. Write a recoverable deletion journal into catalog.json.
// 2. Remove exact keys idempotently. If the final catalog write fails, a new
//    run can resume from the journal even when the manifest is already gone.
// No pruning can happen without the existing post-publish Healthcheck proof.
export async function pruneHistory({ store, activeId, attestation, allowDelete = false, protectedIds = [] }) {
  const current = await getManifest(store, LAST)
  ensure(current?.id === activeId, 'History prune refused: active last/ does not match')
  const plan = await retentionPlan({ store, activeId, protectedIds })
  if (!allowDelete) return plan
  ensure(healthy(attestation, activeId) && attestation.fromExistingHealthcheck === true,
    'Deletion requires post-publish existing Healthcheck attestation (#170)')
  const listing = await catalog(store)
  for (const victim of plan.victims) {
    const prefix = releasePrefix(victim.id)
    let entry = listing.entries.find(e => e.id === victim.id)
    ensure(entry, 'Uncatalogued history cannot be deleted')
    if (entry.state !== 'deleting') {
      const manifest = await getManifest(store, prefix)
      ensure(manifest?.id === entry.id, 'History manifest missing: refusing deletion')
      await readSnapshot(store, prefix, manifest)
      entry = { ...entry, state: 'deleting',
        deleteFiles: [...manifest.files.map(x => x.path), MANIFEST] }
      listing.entries = listing.entries.map(e => e.id === entry.id ? entry : e)
      await putAndCheck(store, CATALOG, json(listing))
    }
    // The journal is durable before the first remove. On retry, already
    // deleted keys are skipped; the final manifest can already be missing.
    for (const relativePath of entry.deleteFiles) {
      const key = prefix + relativePath
      if (await store.get(key) != null) await store.remove(key)
    }
    listing.entries = listing.entries.filter(e => e.id !== entry.id)
    await putAndCheck(store, CATALOG, json(listing))
  }
  return { ...plan, dryRun: false, removed: plan.victims.map(x => x.id) }
}
