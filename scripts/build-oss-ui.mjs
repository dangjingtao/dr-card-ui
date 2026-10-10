#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

const env = {
  ...process.env,
  H5_OSS_ARTIFACT: '1',
  OSS_WEB_TARGET: 'ui',
}
const result = spawnSync('npm', ['run', 'build'], { stdio: 'inherit', env })
if (result.status !== 0) process.exit(result.status ?? 1)

const sha = process.env.GITHUB_SHA || spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim()
const sourceBranch = process.env.GITHUB_REF_NAME || 'preview'
const buildId = process.env.GITHUB_RUN_ID
  ? `${process.env.GITHUB_RUN_ID}.${process.env.GITHUB_RUN_ATTEMPT || '1'}`
  : `ui-${sha.slice(0, 12)}`

const html = readFileSync('dist/index.html', 'utf8')
if (!html.includes('/kbs-web/ui/assets/')) {
  throw new Error('UI OSS package does not reference /kbs-web/ui/assets/')
}

writeFileSync('dist/build-meta.json', JSON.stringify({
  schemaVersion: 1,
  viteMode: 'preview',
  appEnvironment: 'preview',
  dataMode: 'prototype',
  bridgeMode: 'disabled',
  ossWeb: { target: 'ui', path: '/kbs-web/ui/' },
  build: { sha, id: buildId, sourceBranch },
}, null, 2) + '\n')

console.log(`UI OSS package ready: /kbs-web/ui/ @ ${sha}`)
