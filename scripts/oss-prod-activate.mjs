#!/usr/bin/env node
// #170 production publisher. Explicitly disabled until ops confirms:
// company HTTPS origin, real API, scoped prod environment, branch protection,
// and the existing OSS Connection Smoke read/write proof.
import { spawnSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { OssProdStore } from './oss-prod-store.mjs'
import { makeCandidate, publish, rollback, pruneHistory, LAST, sha256 } from './oss-prod-release-core.mjs'
import { checkPublishedH5, productionBase } from './oss-prod-healthcheck.mjs'

const mode = process.argv[2] ?? 'publish'
function assert(condition, message) { if (!condition) throw new Error(message) }
assert(['publish', 'rollback'].includes(mode), 'Unknown production operation')
assert(process.env.OSS_PROD_WEB_ENABLED === 'true' &&
  process.env.OSS_PROD_HEALTHCHECK_CONFIRMED === 'true',
'Production cutover requires explicit release and Healthcheck approvals (#170/#171)')
assert(process.env.GITHUB_REF_NAME === 'prod' && process.env.GITHUB_EVENT_NAME !== 'pull_request',
'Only the prod branch can use production publish credentials')
assert(process.env.OSS_ACCESS_KEY_ID && process.env.OSS_ACCESS_KEY_SECRET,
'Missing scoped production OSS credentials')
const webBase = process.env.OSS_PROD_WEB_BASE_URL ?? ''
productionBase(webBase) // refuses HTTP, foreign host, routes, query and redirects
assert((process.env.VITE_API_BASE_URL || '').startsWith('https://') &&
  !/tunnel-dev|example\.invalid|localhost/i.test(process.env.VITE_API_BASE_URL),
'Production requires a stable HTTPS production API, not a dev tunnel')
const publicOrigin = process.env.VITE_BUDDY_PUBLIC_ORIGIN ?? ''
assert(publicOrigin.startsWith('https://') &&
  !/aliyuncs\.com|example\.invalid/i.test(publicOrigin),
'Production invitation origin must not be the private OSS bucket')
const store = new OssProdStore({
  allowWrites: true,
  allowSwitch: true,
  allowDeletes: process.env.OSS_PROD_PRUNE_ENABLED === 'true',
})
const healthcheck = manifest => checkPublishedH5({ baseUrl: webBase, manifest })
const currentHead = async sha => {
  const result = spawnSync('git', ['ls-remote', '--exit-code', 'origin', 'refs/heads/prod'], {
    encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
  })
  return result.status === 0 && result.stdout.trim().split(/\s+/)[0] === sha
}

function walk(root, current = root) {
  return readdirSync(current, { withFileTypes: true }).flatMap(item => {
    const file = join(current, item.name)
    if (item.isDirectory()) return walk(root, file)
    if (!item.isFile()) return []
    const key = relative(root, file).split(sep).join('/')
    return [[key, readFileSync(file)]]
  })
}
if (mode === 'publish') {
  assert(process.env.GITHUB_EVENT_NAME === 'push',
    'New production release may only come from a prod branch push')
  assert(/^[a-f0-9]{40}$/.test(process.env.GITHUB_SHA ?? ''), 'Invalid GitHub commit SHA')
  const candidate = makeCandidate({
    files: new Map(walk(join(process.cwd(), 'dist'))),
    runId: process.env.GITHUB_RUN_ID, attempt: process.env.GITHUB_RUN_ATTEMPT,
    sha: process.env.GITHUB_SHA,
  })
  // The core fails closed if old last is unmanaged or no approved bootstrap.
  const result = await publish({ store, candidate, healthcheck, currentHead,
    allowBootstrap: process.env.OSS_PROD_BOOTSTRAP_APPROVED === 'true' })
  console.log(JSON.stringify({ event: 'prod-web-live', releaseId: result.releaseId,
    previous: result.previousId, checked: result.healthcheck, prefix: LAST }))
  // A cleanup failure never causes a rollback of a HEALTHY live release.
  // The workflow is marked failed and retains evidence for operator action.
  const proof = await healthcheck(candidate.manifest)
  // Reuse the EXISTING OSS Connection Smoke's remote read-back principle,
  // additionally requiring the actual live index bytes to match this build.
  const remoteIndex = await store.get(LAST + 'index.html')
  const indexRecord = candidate.manifest.files.find(file => file.path === 'index.html')
  assert(remoteIndex && sha256(remoteIndex) === indexRecord.sha256,
    'OSS read-back and live website identity disagree; history may not be pruned')
  const attestation = { ...proof, fromExistingHealthcheck: true }
  const plan = await pruneHistory({ store, activeId: candidate.manifest.id,
    attestation, allowDelete: process.env.OSS_PROD_PRUNE_ENABLED === 'true' })
  console.log(JSON.stringify({ event: 'history-retention', dryRun: plan.dryRun,
    count: plan.total, victims: plan.victims.map(x => x.id), removed: plan.removed || [] }))
} else {
  assert(process.env.GITHUB_EVENT_NAME === 'workflow_dispatch' &&
    process.env.OSS_PROD_ROLLBACK_ENABLED === 'true',
  'Rollback is manual-only with a separately enabled approval')
  const id = process.env.OSS_PROD_ROLLBACK_ID || ''
  const result = await rollback({ store, releaseId: id, healthcheck,
    authorizeRollback: async ({ to }) => to === id &&
      process.env.OSS_PROD_ROLLBACK_CONFIRM_ID === id })
  console.log(JSON.stringify({ event: 'prod-manual-rollback', restored: result.restored,
    outgoing: result.previous, prefix: LAST, pruned: false }))
}
