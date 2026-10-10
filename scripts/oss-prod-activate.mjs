#!/usr/bin/env node
// #170: Deploy to kbs-web/prod/last for human acceptance without inventing
// unrelated business prerequisites. OSS readback is mandatory; company HTTP
// page verification is additional evidence, not a prerequisite to uploading.
import { spawnSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { OssProdStore } from './oss-prod-store.mjs'
import { makeCandidate, publish, rollback, pruneHistory, LAST, MANIFEST, sha256 } from './oss-prod-release-core.mjs'
import { checkPublishedH5, productionBase } from './oss-prod-healthcheck.mjs'

const mode = process.argv[2] ?? 'publish'
const assert = (condition, message) => { if (!condition) throw new Error(message) }
assert(['publish', 'rollback'].includes(mode), 'Unknown production operation')
assert(process.env.GITHUB_REF?.startsWith('refs/heads/') &&
  ['push', 'workflow_dispatch'].includes(process.env.GITHUB_EVENT_NAME),
  'Publishing is only supported from a selected Git branch, not PRs or tags')
assert(process.env.OSS_ACCESS_KEY_ID && process.env.OSS_ACCESS_KEY_SECRET,
  'Missing OSS credentials (required to actually upload files)')

const webBase = process.env.OSS_PROD_WEB_BASE_URL?.trim() ||
  'http://kbs.3cgroup.cn/kbs-web/prod/last/'
productionBase(webBase)
const store = new OssProdStore({ allowWrites: true, allowSwitch: true, allowDeletes: true })
const currentHead = async sha => {
  const branch = process.env.GITHUB_REF_NAME
  const result = spawnSync('git', ['ls-remote', '--exit-code', 'origin', `refs/heads/${branch}`], {
    encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
  })
  return result.status === 0 && result.stdout.trim().split(/\s+/)[0] === sha
}
const verifiedRelease = async manifest => {
  // Reuse the existing OSS Connection Smoke's byte-readback principle.
  for (const file of manifest.files) {
    const bytes = await store.get(LAST + file.path)
    assert(bytes && bytes.length === file.size && sha256(bytes) === file.sha256,
      `OSS readback/identity mismatch: ${file.path}`)
  }
  const publishedManifest = await store.get(LAST + MANIFEST)
  assert(publishedManifest && JSON.parse(publishedManifest.toString()).id === manifest.id,
    'OSS release manifest has wrong identity')
  // Domain/mapping/HTTPS are still user acceptance work. Never roll back a
  // verified upload merely because the website has not been configured yet.
  try {
    const site = await checkPublishedH5({ baseUrl: webBase, manifest })
    return { ok: true, releaseId: manifest.id, website: 'passed', ...site }
  } catch (error) {
    console.warn(`::warning::OSS upload verified, public H5 verification pending: ${error.message}`)
    return { ok: true, releaseId: manifest.id, website: 'pending',
      siteError: error.message, source: 'oss-object-readback' }
  }
}
function walk(root, current = root) {
  return readdirSync(current, { withFileTypes: true }).flatMap(item => {
    const path = join(current, item.name)
    if (item.isDirectory()) return walk(root, path)
    if (!item.isFile()) return []
    return [[relative(root, path).split(sep).join('/'), readFileSync(path)]]
  })
}
if (mode === 'publish') {
  assert(process.env.GITHUB_EVENT_NAME === 'push' ||
    process.env.GITHUB_EVENT_NAME === 'workflow_dispatch',
    'Use a branch push or manual publish action')
  assert(/^[a-f0-9]{40}$/.test(process.env.GITHUB_SHA ?? ''), 'Invalid Git SHA')
  const candidate = makeCandidate({
    files: new Map(walk(join(process.cwd(), 'dist'))),
    runId: process.env.GITHUB_RUN_ID,
    attempt: process.env.GITHUB_RUN_ATTEMPT,
    sha: process.env.GITHUB_SHA,
  })
  const result = await publish({
    store, candidate, healthcheck: verifiedRelease, currentHead,
    allowBootstrap: true, // empty last initializes automatically; unmanaged last is still rejected
  })
  const check = await verifiedRelease(candidate.manifest)
  console.log(JSON.stringify({
    event: 'prod-last-deployed', fromBranch: process.env.GITHUB_REF_NAME,
    releaseId: result.releaseId, previousId: result.previousId,
    oss: 'verified', website: check.website, url: webBase,
  }))
  if (check.website === 'passed') {
    // Successful website verification permits normal five-history retention.
    // No separate activation/prune toggles are required.
    const plan = await pruneHistory({ store, activeId: candidate.manifest.id,
      attestation: { ...check, fromExistingHealthcheck: true }, allowDelete: true })
    console.log(JSON.stringify({ event: 'history-retention', count: plan.total,
      removed: plan.removed || [], maximum: plan.keep }))
  } else {
    console.log('Public website awaiting human acceptance; no history objects deleted.')
  }
} else {
  assert(process.env.GITHUB_EVENT_NAME === 'workflow_dispatch',
    'Historical rollback requires manual workflow dispatch')
  const releaseId = process.env.OSS_PROD_ROLLBACK_ID || ''
  assert(releaseId && releaseId === process.env.OSS_PROD_ROLLBACK_CONFIRM_ID,
    'Manual rollback requires matching release IDs')
  const result = await rollback({
    store, releaseId, healthcheck: verifiedRelease,
    authorizeRollback: async ({ to }) => to === releaseId,
  })
  console.log(JSON.stringify({ event: 'prod-manual-rollback',
    restored: result.restored, outgoing: result.previous,
    website: 'check action logs', historyDeleted: false, url: webBase }))
}
