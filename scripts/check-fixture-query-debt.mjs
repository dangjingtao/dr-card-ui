import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const ROOT = process.cwd()
const BASELINE_PATH = path.join(ROOT, 'scripts', 'h004-fixture-query-baseline.json')
const PROTECTED_KEYS = new Set(['state', 'overlay', 'debug'])
const QUERY_METHODS = new Set(['get', 'getAll', 'has', 'set', 'append', 'delete'])

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
const CONTROL_FILES = new Set([
  'src/app/fixtures/useFixture.ts',
  'src/components/mobile/DebugPanel.tsx',
])

const normalize = (value) => value.split(path.sep).join('/')
const relative = (fileName) => normalize(path.relative(ROOT, fileName))

function isFormalSource(fileName) {
  const file = relative(fileName)
  if (!file.startsWith('src/')) return false
  if (EXCLUDED_FILES.has(file)) return false
  if (EXCLUDED_PREFIXES.some((prefix) => file.startsWith(prefix))) return false
  return !CONTROL_FILES.has(file)
}

function loadProgram() {
  const configPath = path.join(ROOT, 'tsconfig.json')
  const configFile = ts.readConfigFile(configPath, ts.sys.readFile)
  if (configFile.error) throw new Error(ts.flattenDiagnosticMessageText(configFile.error.messageText, '\n'))
  const parsed = ts.parseJsonConfigFileContent(configFile, ts.sys, ROOT, { noEmit: true })
  if (parsed.errors.length) {
    throw new Error(parsed.errors.map((item) => ts.flattenDiagnosticMessageText(item.messageText, '\n')).join('\n'))
  }
  return ts.createProgram({ rootNames: parsed.fileNames, options: parsed.options })
}

function readBaseline() {
  if (!fs.existsSync(BASELINE_PATH)) return {}
  return JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'))
}

function formatPosition(sourceFile, node) {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
  return `${line + 1}:${character + 1}`
}

function collect(program) {
  const byFile = new Map()
  for (const sourceFile of program.getSourceFiles()) {
    if (!isFormalSource(sourceFile.fileName)) continue
    const file = relative(sourceFile.fileName)

    const visit = (node) => {
      if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
        const method = node.expression.name.text
        const key = node.arguments[0]
        if (
          QUERY_METHODS.has(method) &&
          key &&
          ts.isStringLiteralLike(key) &&
          PROTECTED_KEYS.has(key.text)
        ) {
          const current = byFile.get(file) ?? []
          current.push({
            position: formatPosition(sourceFile, node),
            key: key.text,
            method,
          })
          byFile.set(file, current)
        }
      }
      ts.forEachChild(node, visit)
    }

    visit(sourceFile)
  }
  return byFile
}

function main() {
  const baseline = readBaseline()
  const current = collect(loadProgram())
  const failures = []
  const tightened = []

  for (const [file, items] of current.entries()) {
    const allowed = baseline[file] ?? 0
    if (items.length > allowed) {
      failures.push(`${file}: ${items.length} protected-query access(es), baseline allows ${allowed}`)
      for (const item of items) {
        failures.push(`  ${item.position} ${item.method}("${item.key}")`)
      }
    } else if (items.length < allowed) {
      tightened.push(`${file}: baseline ${allowed}, current ${items.length}`)
    }
  }

  for (const [file, allowed] of Object.entries(baseline)) {
    if (!current.has(file) && allowed > 0) tightened.push(`${file}: baseline ${allowed}, current 0`)
  }

  if (tightened.length) {
    console.warn('H004 fixture-query debt baseline can be tightened:')
    for (const item of tightened) console.warn(`  - ${item}`)
  }

  if (failures.length) {
    console.error('H004 fixture-query debt check failed:')
    for (const item of failures) console.error(`  ${item}`)
    process.exit(1)
  }

  const total = [...current.values()].reduce((sum, items) => sum + items.length, 0)
  console.log(`H004 fixture-query debt PASS: ${total} protected-query access(es) within explicit baseline.`)
}

main()
