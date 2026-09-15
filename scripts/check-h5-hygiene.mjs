import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const ROOT = process.cwd()
const BASELINE_PATH = path.join(ROOT, 'scripts', 'h5-hygiene-baseline.json')

const UNUSED_DIAGNOSTIC_CODES = new Set([6133, 6192, 6196])

// H001 only guards the formal H5 construction surface. H002 will make route
// ownership first-class; until then these known Native-reference / mall pages
// stay outside this gate so hygiene work cannot silently turn into a legacy rewrite.
const EXCLUDED_PREFIXES = ['src/pages/legacy/']
const EXCLUDED_FILES = new Set([
  'src/pages/LegacyHome.tsx',
  'src/pages/LegacyScan.tsx',
  'src/pages/LegacyService.tsx',
  'src/pages/RepairProjects.tsx',
  'src/pages/RepairForm.tsx',
  'src/pages/FeedbackPage.tsx',
  'src/pages/DeviceListPage.tsx',
  'src/pages/DeviceDetailPage.tsx',
  'src/pages/VendingBuyPage.tsx',
  'src/pages/VendingOrderPage.tsx',
  'src/pages/MallHome.tsx',
])

const normalize = (value) => value.split(path.sep).join('/')
const relative = (fileName) => normalize(path.relative(ROOT, fileName))

function isFormalH5Source(fileName) {
  const file = relative(fileName)
  if (!file.startsWith('src/')) return false
  if (EXCLUDED_FILES.has(file)) return false
  return !EXCLUDED_PREFIXES.some((prefix) => file.startsWith(prefix))
}

function readBaseline() {
  if (!fs.existsSync(BASELINE_PATH)) {
    return { unusedDiagnostics: {} }
  }

  const parsed = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'))
  return {
    unusedDiagnostics: parsed.unusedDiagnostics ?? {},
  }
}

function loadProgram() {
  const configPath = path.join(ROOT, 'tsconfig.json')
  const configFile = ts.readConfigFile(configPath, ts.sys.readFile)
  if (configFile.error) {
    throw new Error(ts.flattenDiagnosticMessageText(configFile.error.messageText, '\n'))
  }

  const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, ROOT, {
    noEmit: true,
    noUnusedLocals: true,
    noUnusedParameters: true,
  })

  if (parsed.errors.length) {
    throw new Error(parsed.errors.map((item) => ts.flattenDiagnosticMessageText(item.messageText, '\n')).join('\n'))
  }

  return ts.createProgram({ rootNames: parsed.fileNames, options: parsed.options })
}

function formatPosition(sourceFile, position) {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(position ?? 0)
  return `${line + 1}:${character + 1}`
}

function collectUnusedDiagnostics(program) {
  const diagnostics = ts.getPreEmitDiagnostics(program).filter(
    (diagnostic) =>
      diagnostic.file &&
      UNUSED_DIAGNOSTIC_CODES.has(diagnostic.code) &&
      isFormalH5Source(diagnostic.file.fileName),
  )

  const byFile = new Map()
  for (const diagnostic of diagnostics) {
    const file = relative(diagnostic.file.fileName)
    const current = byFile.get(file) ?? []
    current.push({
      code: diagnostic.code,
      position: formatPosition(diagnostic.file, diagnostic.start),
      message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
    })
    byFile.set(file, current)
  }
  return byFile
}

function rootIdentifierText(expression) {
  let current = expression
  while (ts.isPropertyAccessExpression(current) || ts.isElementAccessExpression(current)) {
    current = current.expression
  }
  return ts.isIdentifier(current) ? current.text : ''
}

function collectArchitectureViolations(program) {
  const violations = []

  for (const sourceFile of program.getSourceFiles()) {
    if (!isFormalH5Source(sourceFile.fileName)) continue
    const file = relative(sourceFile.fileName)
    const allowsStorage = file.startsWith('src/storage/')
    const allowsNetwork = file.startsWith('src/services/') || file.startsWith('src/mocks/')
    const allowsBridge = file.startsWith('src/bridge/')

    const report = (node, rule, message) => {
      violations.push({
        file,
        position: formatPosition(sourceFile, node.getStart(sourceFile)),
        rule,
        message,
      })
    }

    const visit = (node) => {
      if (!allowsStorage && ts.isIdentifier(node) && (node.text === 'localStorage' || node.text === 'sessionStorage')) {
        report(node, 'no-direct-web-storage', 'Web Storage must be accessed through src/storage/.')
      }

      if (!allowsNetwork) {
        if (ts.isCallExpression(node)) {
          if (ts.isIdentifier(node.expression) && node.expression.text === 'fetch') {
            report(node, 'no-direct-network', 'Direct fetch calls belong behind src/services/ or src/mocks/.')
          }
          if (rootIdentifierText(node.expression) === 'axios') {
            report(node, 'no-direct-network', 'Direct axios calls belong behind src/services/ or src/mocks/.')
          }
        }
        if (ts.isNewExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'XMLHttpRequest') {
          report(node, 'no-direct-network', 'XMLHttpRequest belongs behind src/services/ or src/mocks/.')
        }
      }

      if (!allowsBridge && ts.isPropertyAccessExpression(node)) {
        const text = node.getText(sourceFile)
        if (
          text.startsWith('window.webkit.messageHandlers') ||
          text.startsWith('window.ReactNativeWebView') ||
          text.startsWith('window.WebViewJavascriptBridge') ||
          text.startsWith('window.JSBridge') ||
          text.startsWith('window.Native') ||
          text.startsWith('window.Android')
        ) {
          report(node, 'no-direct-native-bridge', 'Native host calls must be isolated behind src/bridge/.')
        }
      }

      ts.forEachChild(node, visit)
    }

    visit(sourceFile)
  }

  // Avoid duplicate reports for nested property-access nodes on the same line/rule.
  return [...new Map(violations.map((item) => [`${item.file}:${item.position}:${item.rule}`, item])).values()]
}

function main() {
  const baseline = readBaseline()
  const program = loadProgram()
  const unusedByFile = collectUnusedDiagnostics(program)
  const architectureViolations = collectArchitectureViolations(program)
  const failures = []
  const staleBaseline = []

  for (const [file, diagnostics] of [...unusedByFile.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const allowed = baseline.unusedDiagnostics[file] ?? 0
    if (diagnostics.length > allowed) {
      failures.push(`${file}: ${diagnostics.length} unused diagnostic(s), baseline allows ${allowed}`)
      for (const diagnostic of diagnostics) {
        failures.push(`  TS${diagnostic.code} ${diagnostic.position} ${diagnostic.message}`)
      }
    }
  }

  for (const [file, allowed] of Object.entries(baseline.unusedDiagnostics)) {
    const current = unusedByFile.get(file)?.length ?? 0
    if (current < allowed) staleBaseline.push(`${file}: baseline ${allowed}, current ${current}`)
  }

  for (const violation of architectureViolations) {
    failures.push(`${violation.file}:${violation.position} [${violation.rule}] ${violation.message}`)
  }

  if (staleBaseline.length) {
    console.warn('H5 hygiene baseline can be tightened:')
    for (const item of staleBaseline) console.warn(`  - ${item}`)
  }

  if (failures.length) {
    console.error('H5 hygiene check failed:')
    for (const failure of failures) console.error(`  ${failure}`)

    const suggestedBaseline = Object.fromEntries(
      [...unusedByFile.entries()]
        .filter(([, diagnostics]) => diagnostics.length > 0)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([file, diagnostics]) => [file, diagnostics.length]),
    )
    console.error('\nCurrent unused-diagnostic counts (for explicit legacy-debt review only):')
    console.error(JSON.stringify({ unusedDiagnostics: suggestedBaseline }, null, 2))
    process.exit(1)
  }

  console.log(
    `H5 hygiene PASS: ${program.getSourceFiles().filter((file) => isFormalH5Source(file.fileName)).length} formal source files checked; ` +
      `${[...unusedByFile.values()].reduce((sum, items) => sum + items.length, 0)} unused diagnostic(s) within baseline; ` +
      `${architectureViolations.length} architecture violation(s).`,
  )
}

main()
