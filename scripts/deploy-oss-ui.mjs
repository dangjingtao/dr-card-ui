#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, readdirSync, rmSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative, dirname, sep } from 'node:path'

const prefix = 'oss://kbs-sdl/kbs-web/ui/'
const root = join(process.cwd(), 'dist')
const meta = JSON.parse(readFileSync(join(root, 'build-meta.json'), 'utf8'))

if (process.env.GITHUB_EVENT_NAME !== 'push' || process.env.GITHUB_REF_NAME !== 'preview') {
  throw new Error('UI fixed publish only accepts a preview branch push.')
}
if (meta.appEnvironment !== 'preview' || meta.ossWeb?.target !== 'ui' ||
    meta.ossWeb?.path !== '/kbs-web/ui/' || meta.build.sha !== process.env.GITHUB_SHA) {
  throw new Error('Refusing mismatched UI package.')
}
if (!process.env.OSS_ACCESS_KEY_ID || !process.env.OSS_ACCESS_KEY_SECRET) {
  throw new Error('Missing OSS deployment credentials.')
}

function currentPreviewHead() {
  const r = spawnSync('git', ['ls-remote', '--exit-code', 'origin', 'refs/heads/preview'], {
    encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
  })
  return r.status === 0 ? r.stdout.trim().split(/\s+/)[0] : ''
}
if (currentPreviewHead() !== process.env.GITHUB_SHA) {
  throw new Error('Stale preview run: refusing to publish fixed UI entry.')
}

function ossutil(...args) {
  const r = spawnSync('ossutil', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  if (r.status !== 0) {
    throw new Error(`ossutil ${args[0]} failed for ${args[1] || ''}: ${(r.stderr || r.stdout).slice(0, 850)}`)
  }
  return r.stdout
}
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name)
    return entry.isDirectory() ? walk(path) : entry.isFile() ? [path] : []
  }).sort()
}
const files = walk(root).map(file => ({ file, key: relative(root, file).split(sep).join('/') }))
if (!files.some(x => x.key === 'index.html') || !files.some(x => x.key === 'build-meta.json')) {
  throw new Error('Missing UI entry or build metadata.')
}

const temp = mkdtempSync(join(tmpdir(), 'kbs-ui-oss-'))
const priorIndex = join(temp, 'prior-index.html')
const priorMeta = join(temp, 'prior-meta.json')
let hadPrior = false
try {
  ossutil('cp', prefix + 'index.html', priorIndex)
  ossutil('cp', prefix + 'build-meta.json', priorMeta)
  hadPrior = true
} catch (error) {
  const detail = String(error)
  if (!/NoSuchKey|404 Not Found/i.test(detail)) throw error
}

function uploadAndReadback(file, key) {
  if (!key || key.startsWith('/') || key.split('/').includes('..')) throw new Error('Unsafe OSS object key')
  const remote = prefix + key
  const downloaded = join(temp, 'readback', key)
  mkdirSync(dirname(downloaded), { recursive: true })
  ossutil('cp', file, remote)
  ossutil('cp', remote, downloaded)
  if (!readFileSync(file).equals(readFileSync(downloaded))) {
    throw new Error(`OSS readback differs: ${key}`)
  }
}

let metadataTouched = false
let indexTouched = false
try {
  for (const item of files) {
    if (item.key !== 'index.html' && item.key !== 'build-meta.json') uploadAndReadback(item.file, item.key)
  }
  metadataTouched = true
  uploadAndReadback(join(root, 'build-meta.json'), 'build-meta.json')
  if (currentPreviewHead() !== process.env.GITHUB_SHA) throw new Error('Preview advanced during upload.')
  indexTouched = true
  uploadAndReadback(join(root, 'index.html'), 'index.html')
  console.log(`Verified ${files.length} UI files under ${prefix}. Fixed entry updated last.`)
} catch (error) {
  if (hadPrior && (metadataTouched || indexTouched)) {
    try {
      ossutil('cp', priorMeta, prefix + 'build-meta.json')
      if (indexTouched) ossutil('cp', priorIndex, prefix + 'index.html')
      console.error('Prior UI entry restored after interrupted upload.')
    } catch (restoreError) {
      console.error('CRITICAL: UI entry restore failed:', String(restoreError))
    }
  }
  throw error
} finally {
  rmSync(temp, { recursive: true, force: true })
}
