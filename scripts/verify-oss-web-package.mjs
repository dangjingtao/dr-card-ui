#!/usr/bin/env node
// #168: deterministic bundle assertions for the fixed OSS URL convention.
// This script is safe to run on PRs: it never accesses cloud credentials.
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const target = process.argv[2]
const allowed = { ui: 'preview', dev: 'dev', test: 'test', prod: 'prod' }
if (!Object.hasOwn(allowed, target)) {
  throw new Error('Usage: node scripts/verify-oss-web-package.mjs ui|dev|test|prod')
}
const expectedBase = `/kbs-web/${target === 'prod' ? 'prod/last' : target}`
const root = join(process.cwd(), 'dist')
const meta = JSON.parse(readFileSync(join(root, 'build-meta.json'), 'utf8'))
const html = readFileSync(join(root, 'index.html'), 'utf8')
if (meta.appEnvironment !== allowed[target] ||
    meta.ossWeb?.path !== expectedBase + '/' ||
    meta.ossWeb?.target !== target) {
  throw new Error(`OSS package build identity mismatch for ${target}`)
}
if (target === 'test' || target === 'prod') {
  if (meta.dataMode !== 'api' || meta.bridgeMode !== 'native' ||
      !meta.apiBaseConfigured || !meta.buddyPublicOriginConfigured ||
      existsSync(join(root, 'mockServiceWorker.js'))) {
    throw new Error('Formal H5 cannot ship Mock or unconfigured API/Native bridge')
  }
} else if (meta.dataMode !== 'mock' || !existsSync(join(root, 'mockServiceWorker.js'))) {
  throw new Error('UI/development fixture bundle must preserve its Mock worker')
}
if (/(?:src|href)=["']\\/assets\\//.test(html)) {
  throw new Error('Absolute /assets URLs break fixed OSS subdirectories')
}
const jsRefs = [...html.matchAll(/src=["'](\\.\\/assets\\/[^"']+\\.js)["']/g)].map(m => m[1])
const cssRefs = [...html.matchAll(/href=["'](\\.\\/assets\\/[^"']+\\.css)["']/g)].map(m => m[1])
if (!jsRefs.length || !cssRefs.length) {
  throw new Error('Missing relative ./assets JS/CSS references')
}
for (const asset of [...jsRefs, ...cssRefs]) {
  if (asset.includes('..') || !existsSync(join(root, asset))) {
    throw new Error(`Invalid or missing referenced static asset: ${asset}`)
  }
}
const jsFiles = readdirSync(join(root, 'assets')).filter(name => name.endsWith('.js'))
if (!jsFiles.some(name => readFileSync(join(root, 'assets', name), 'utf8').includes(expectedBase))) {
  throw new Error(`React Router basename ${expectedBase} is absent from JS bundle`)
}
console.log(`OSS ${target}: ${expectedBase}/, relative JS/CSS, router, and runtime policy verified`)
