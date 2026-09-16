#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { loadEnv } from 'vite'

const TARGETS = {
  dev: { mode: 'development', appEnvironment: 'dev', defaultDataMode: 'mock' },
  preview: { mode: 'preview', appEnvironment: 'preview', defaultDataMode: 'mock' },
  test: { mode: 'test', appEnvironment: 'test', defaultDataMode: 'api' },
  prod: { mode: 'production', appEnvironment: 'prod', defaultDataMode: 'api' },
}

const DATA_MODES = new Set(['mock', 'api'])
const BRIDGE_MODES = new Set(['disabled', 'mock', 'native'])
const root = process.cwd()
const requestedTarget = process.argv[2] ?? 'prod'
const dryRun = process.argv.includes('--dry-run')

function fail(message) {
  console.error(`[build-h5] ${message}`)
  process.exit(1)
}

function commandOutput(command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8' })
  return result.status === 0 ? result.stdout.trim() : ''
}

function resolveCloudflareTarget() {
  const branch = process.env.CF_PAGES_BRANCH?.trim()
  if (!branch) fail('CF_PAGES_BRANCH is required for `npm run build:cf`.')

  if (branch === 'main') {
    fail('`main` is the retained legacy branch. Cloudflare production must target `prod`, not `main`.')
  }

  if (branch === 'prod' || branch === 'test' || branch === 'dev' || branch === 'preview') {
    return branch
  }

  // Feature/PR branch previews intentionally use preview semantics: deterministic Mock + fixture tools.
  return 'preview'
}

const targetName = requestedTarget === 'cf' ? resolveCloudflareTarget() : requestedTarget
const target = TARGETS[targetName]
if (!target) fail(`Unknown build target "${requestedTarget}". Expected dev, preview, test, prod, or cf.`)

const fileEnv = loadEnv(target.mode, root, 'VITE_')
const readEnv = (key) => process.env[key] ?? fileEnv[key]
const errors = []

const explicitAppEnvironment = readEnv('VITE_APP_ENV')?.trim()
if (explicitAppEnvironment && explicitAppEnvironment !== target.appEnvironment) {
  errors.push(
    `VITE_APP_ENV=${explicitAppEnvironment} contradicts build target ${targetName} (${target.appEnvironment}).`,
  )
}

const rawDataMode = readEnv('VITE_DATA_MODE')?.trim()
const dataMode = rawDataMode || target.defaultDataMode
if (!DATA_MODES.has(dataMode)) errors.push(`Unknown VITE_DATA_MODE=${dataMode}. Expected mock or api.`)

const rawBridgeMode = readEnv('VITE_BRIDGE_MODE')?.trim()
const bridgeMode = rawBridgeMode || 'disabled'
if (!BRIDGE_MODES.has(bridgeMode)) {
  errors.push(`Unknown VITE_BRIDGE_MODE=${bridgeMode}. Expected disabled, mock, or native.`)
}

const prodLike = target.appEnvironment === 'test' || target.appEnvironment === 'prod'
if (prodLike && dataMode === 'mock') {
  errors.push(`${target.appEnvironment} builds forbid VITE_DATA_MODE=mock; Mock fallback is not allowed.`)
}
if (prodLike && bridgeMode === 'mock') {
  errors.push(`${target.appEnvironment} builds forbid VITE_BRIDGE_MODE=mock; Bridge Mock is dev/preview only.`)
}

const apiBaseUrl = readEnv('VITE_API_BASE_URL')?.trim() ?? ''
if (apiBaseUrl) {
  try {
    const parsed = new URL(apiBaseUrl)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      errors.push('VITE_API_BASE_URL must use http:// or https://.')
    }
  } catch {
    errors.push('VITE_API_BASE_URL must be an absolute http(s) URL when provided.')
  }
}

if (errors.length > 0) {
  errors.forEach((error) => console.error(`[build-h5] config error: ${error}`))
  process.exit(1)
}

const gitSha = commandOutput('git', ['rev-parse', 'HEAD'])
const gitBranch = commandOutput('git', ['branch', '--show-current'])
const buildSha =
  readEnv('VITE_BUILD_SHA')?.trim() ||
  process.env.CF_PAGES_COMMIT_SHA?.trim() ||
  process.env.GITHUB_SHA?.trim() ||
  gitSha ||
  'local'
const sourceBranch =
  readEnv('VITE_SOURCE_BRANCH')?.trim() ||
  process.env.CF_PAGES_BRANCH?.trim() ||
  process.env.GITHUB_HEAD_REF?.trim() ||
  process.env.GITHUB_REF_NAME?.trim() ||
  gitBranch ||
  'local'
const buildId =
  readEnv('VITE_BUILD_ID')?.trim() ||
  (process.env.GITHUB_RUN_ID
    ? `${process.env.GITHUB_RUN_ID}.${process.env.GITHUB_RUN_ATTEMPT ?? '1'}`
    : `${target.appEnvironment}-${buildSha.slice(0, 12)}`)

const runtimeEnv = {
  VITE_APP_ENV: target.appEnvironment,
  VITE_DATA_MODE: dataMode,
  VITE_API_BASE_URL: apiBaseUrl,
  VITE_BRIDGE_MODE: bridgeMode,
  VITE_BUILD_SHA: buildSha,
  VITE_BUILD_ID: buildId,
  VITE_SOURCE_BRANCH: sourceBranch,
}

const metadata = {
  schemaVersion: 1,
  viteMode: target.mode,
  appEnvironment: target.appEnvironment,
  dataMode,
  bridgeMode,
  apiBaseConfigured: Boolean(apiBaseUrl),
  build: {
    sha: buildSha,
    id: buildId,
    sourceBranch,
  },
}

console.log(
  `[build-h5] env=${metadata.appEnvironment} mode=${metadata.viteMode} data=${dataMode} bridge=${bridgeMode} branch=${sourceBranch} sha=${buildSha.slice(0, 12)} id=${buildId}`,
)
if (!apiBaseUrl) {
  console.warn('[build-h5] VITE_API_BASE_URL is empty; real backend integration remains blocked by H008.')
}

if (dryRun) {
  console.log(JSON.stringify(metadata))
  process.exit(0)
}

const viteBin = resolve(root, 'node_modules/vite/bin/vite.js')
const result = spawnSync(process.execPath, [viteBin, 'build', '--mode', target.mode], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, ...runtimeEnv },
})

if (result.status !== 0) process.exit(result.status ?? 1)

mkdirSync(resolve(root, 'dist'), { recursive: true })
writeFileSync(resolve(root, 'dist/build-meta.json'), `${JSON.stringify(metadata, null, 2)}\n`, 'utf8')
console.log('[build-h5] wrote dist/build-meta.json')
