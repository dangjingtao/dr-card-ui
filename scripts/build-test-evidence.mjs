import fs from 'node:fs'
import path from 'node:path'

const cwd = process.cwd()
const siteRoot = path.resolve(cwd, process.env.EVIDENCE_SITE_DIR || 'test-evidence-site')
const reportDir = path.resolve(cwd, process.env.EVIDENCE_PLAYWRIGHT_REPORT || 'playwright-report')
const resultFile = path.resolve(cwd, process.env.EVIDENCE_PLAYWRIGHT_JSON || 'test-results/playwright-results.json')
const buildMetaFile = path.resolve(cwd, process.env.EVIDENCE_BUILD_META || 'dist/build-meta.json')

const sha = process.env.EVIDENCE_COMMIT_SHA || process.env.GITHUB_SHA || 'unknown'
const shortSha = sha.slice(0, 12)
const branch = process.env.EVIDENCE_BRANCH || process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME || 'unknown'
const repository = process.env.EVIDENCE_REPOSITORY || process.env.GITHUB_REPOSITORY || 'unknown'
const runId = process.env.EVIDENCE_RUN_ID || process.env.GITHUB_RUN_ID || 'unknown'
const runAttempt = process.env.EVIDENCE_RUN_ATTEMPT || process.env.GITHUB_RUN_ATTEMPT || '1'
const playwrightOutcome = process.env.EVIDENCE_PLAYWRIGHT_OUTCOME || 'unknown'
const bridgeStatus = process.env.EVIDENCE_BRIDGE_STATUS || 'not verified — H015 real Native protocol is blocked'
const generatedAt = new Date().toISOString()

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function copyDirectory(source, destination) {
  if (!fs.existsSync(source)) return false
  fs.mkdirSync(path.dirname(destination), { recursive: true })
  fs.cpSync(source, destination, { recursive: true, force: true })
  return true
}

function copyFileIfPresent(source, destination) {
  if (!fs.existsSync(source)) return false
  fs.mkdirSync(path.dirname(destination), { recursive: true })
  fs.copyFileSync(source, destination)
  return true
}

function collectFailedSpecs(suites, parents = [], failures = []) {
  for (const suite of suites || []) {
    const nextParents = suite.title ? [...parents, suite.title] : parents
    for (const spec of suite.specs || []) {
      if (spec.ok === false) failures.push([...nextParents, spec.title].filter(Boolean).join(' › '))
    }
    collectFailedSpecs(suite.suites, nextParents, failures)
  }
  return [...new Set(failures)]
}

const results = readJson(resultFile)
const buildMeta = readJson(buildMetaFile)
const stats = results?.stats || {}
const failedSpecs = collectFailedSpecs(results?.suites)
const unexpected = Number.isFinite(stats.unexpected) ? stats.unexpected : failedSpecs.length
const status = playwrightOutcome === 'success' && unexpected === 0
  ? 'passed'
  : playwrightOutcome === 'failure' || unexpected > 0
    ? 'failed'
    : 'unknown'

const summary = {
  schemaVersion: 1,
  status,
  generatedAt,
  commit: sha,
  shortCommit: shortSha,
  branch,
  repository,
  run: {
    id: runId,
    attempt: runAttempt,
    url: repository !== 'unknown' && runId !== 'unknown'
      ? `https://github.com/${repository}/actions/runs/${runId}`
      : null,
  },
  environment: {
    appEnvironment: buildMeta?.appEnvironment ?? 'unknown',
    dataMode: buildMeta?.dataMode ?? 'unknown',
    bridgeMode: buildMeta?.bridgeMode ?? 'unknown',
    bridgeVerification: bridgeStatus,
  },
  playwright: {
    outcome: playwrightOutcome,
    expected: Number.isFinite(stats.expected) ? stats.expected : null,
    unexpected: Number.isFinite(stats.unexpected) ? stats.unexpected : unexpected,
    flaky: Number.isFinite(stats.flaky) ? stats.flaky : null,
    skipped: Number.isFinite(stats.skipped) ? stats.skipped : null,
    durationMs: Number.isFinite(stats.duration) ? Math.round(stats.duration) : null,
    failedSpecs,
  },
  scopeNotice: 'Browser CI evidence only. This is not App WebView, real API business, or Native JSBridge acceptance.',
}

function renderSummaryHtml(data) {
  const failed = data.playwright.failedSpecs.length
    ? `<ul>${data.playwright.failedSpecs.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
    : '<p>No failed Playwright specs recorded.</p>'
  const runLink = data.run.url
    ? `<a href="${escapeHtml(data.run.url)}">GitHub Actions run ${escapeHtml(data.run.id)}</a>`
    : 'GitHub Actions run unavailable'
  const statusClass = data.status === 'passed' ? 'pass' : data.status === 'failed' ? 'fail' : 'unknown'

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>卡博士 H5 测试证据 · ${escapeHtml(data.shortCommit)}</title>
<style>
:root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#171717;background:#f6f6f4}body{margin:0;padding:32px 18px}.wrap{max-width:920px;margin:0 auto}.card{background:#fff;border:1px solid #e7e5e4;border-radius:16px;padding:22px;margin:0 0 16px;box-shadow:0 1px 2px rgba(0,0,0,.04)}h1{font-size:24px;margin:0 0 8px}h2{font-size:16px;margin:0 0 12px}.muted{color:#737373}.status{display:inline-flex;align-items:center;border-radius:999px;padding:5px 10px;font-weight:700;font-size:13px}.pass{background:#dcfce7;color:#166534}.fail{background:#fee2e2;color:#991b1b}.unknown{background:#fef3c7;color:#92400e}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}.metric{border:1px solid #eee;border-radius:12px;padding:12px}.metric b{display:block;font-size:20px;margin-top:4px}code{word-break:break-all}a{color:#9a6700}.notice{border-left:4px solid #d97706;padding-left:12px}ul{padding-left:22px}</style>
</head>
<body><main class="wrap">
<section class="card"><span class="status ${statusClass}">${escapeHtml(data.status.toUpperCase())}</span><h1>卡博士 H5 测试证据</h1><p class="muted">Commit <code>${escapeHtml(data.commit)}</code> · ${escapeHtml(data.branch)} · ${escapeHtml(data.generatedAt)}</p><p>${runLink}</p></section>
<section class="card"><h2>测试汇总</h2><div class="grid"><div class="metric">Expected<b>${escapeHtml(data.playwright.expected ?? '—')}</b></div><div class="metric">Unexpected<b>${escapeHtml(data.playwright.unexpected ?? '—')}</b></div><div class="metric">Flaky<b>${escapeHtml(data.playwright.flaky ?? '—')}</b></div><div class="metric">Skipped<b>${escapeHtml(data.playwright.skipped ?? '—')}</b></div></div><p><a href="./playwright/">Playwright HTML report</a> · <a href="./results.json">Machine JSON</a> · <a href="./summary.json">Evidence metadata</a></p></section>
<section class="card"><h2>环境</h2><p>App env: <code>${escapeHtml(data.environment.appEnvironment)}</code> · API mode: <code>${escapeHtml(data.environment.dataMode)}</code> · Bridge mode: <code>${escapeHtml(data.environment.bridgeMode)}</code></p><p>Bridge verification: ${escapeHtml(data.environment.bridgeVerification)}</p></section>
<section class="card"><h2>失败用例</h2>${failed}</section>
<section class="card notice"><strong>证据边界</strong><p>${escapeHtml(data.scopeNotice)}</p></section>
</main></body></html>`
}

function writeSnapshot(destination) {
  fs.rmSync(destination, { recursive: true, force: true })
  fs.mkdirSync(destination, { recursive: true })
  fs.writeFileSync(path.join(destination, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`)
  fs.writeFileSync(path.join(destination, 'index.html'), renderSummaryHtml(summary))

  if (!copyFileIfPresent(resultFile, path.join(destination, 'results.json'))) {
    fs.writeFileSync(path.join(destination, 'results.json'), `${JSON.stringify({ missing: true, reason: 'Playwright JSON report was not produced.' }, null, 2)}\n`)
  }

  if (!copyDirectory(reportDir, path.join(destination, 'playwright'))) {
    fs.mkdirSync(path.join(destination, 'playwright'), { recursive: true })
    fs.writeFileSync(path.join(destination, 'playwright', 'index.html'), '<!doctype html><meta charset="utf-8"><title>Playwright report unavailable</title><p>Playwright HTML report was not produced for this run.</p>')
  }
}

fs.mkdirSync(path.join(siteRoot, 'commits'), { recursive: true })
const commitDir = path.join(siteRoot, 'commits', sha)
const latestDir = path.join(siteRoot, 'latest')
writeSnapshot(commitDir)
writeSnapshot(latestDir)

const commitEntries = fs.readdirSync(path.join(siteRoot, 'commits'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => {
    const metadata = readJson(path.join(siteRoot, 'commits', entry.name, 'summary.json'))
    return { name: entry.name, generatedAt: metadata?.generatedAt ?? '' }
  })
  .sort((a, b) => {
    if (a.name === sha) return -1
    if (b.name === sha) return 1
    const byTime = b.generatedAt.localeCompare(a.generatedAt)
    return byTime !== 0 ? byTime : b.name.localeCompare(a.name)
  })

const commitLinks = commitEntries.slice(0, 100)
  .map(({ name: commit }) => `<li><a href="./commits/${encodeURIComponent(commit)}/"><code>${escapeHtml(commit)}</code></a>${commit === sha ? ' · current' : ''}</li>`)
  .join('')

fs.writeFileSync(path.join(siteRoot, 'index.html'), `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>卡博士 H5 测试证据</title><style>body{font-family:Inter,system-ui,sans-serif;max-width:880px;margin:40px auto;padding:0 18px;color:#171717}a{color:#9a6700}code{word-break:break-all}.notice{background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:14px}</style></head><body><h1>卡博士 H5 测试证据</h1><p><a href="./latest/">查看 latest</a></p><div class="notice">Browser CI evidence only. This site does not mean App WebView, real API business, or Native JSBridge has been accepted.</div><h2>Commits</h2><ul>${commitLinks}</ul></body></html>`)

const summaryMd = [
  '## H5 test evidence',
  '',
  `- Status: **${summary.status.toUpperCase()}**`,
  `- Commit: \`${summary.commit}\``,
  `- Branch: \`${summary.branch}\``,
  `- Env: \`${summary.environment.appEnvironment}\` / API \`${summary.environment.dataMode}\``,
  `- Bridge: ${summary.environment.bridgeVerification}`,
  `- Playwright: expected ${summary.playwright.expected ?? '—'}, unexpected ${summary.playwright.unexpected ?? '—'}, flaky ${summary.playwright.flaky ?? '—'}, skipped ${summary.playwright.skipped ?? '—'}`,
  `- Artifact path: \`/commits/${summary.commit}/\` and \`/latest/\``,
  '',
  `> ${summary.scopeNotice}`,
  '',
].join('\n')
fs.writeFileSync(path.join(siteRoot, 'summary.md'), summaryMd)

console.log(`[evidence] ${summary.status}: ${sha} -> ${path.relative(cwd, siteRoot)}`)
