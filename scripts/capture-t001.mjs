import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const outDir = join(root, 'docs/workbench/evidence/screenshots')
mkdirSync(outDir, { recursive: true })

const base = process.env.BASE_URL ?? 'http://localhost:5173'
const routes = [
  ['home', '/'],
  ['points', '/points'],
  ['scan', '/card/verify'],
  ['membership', '/membership'],
  ['profile', '/profile'],
]

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1 })
for (const [name, path] of routes) {
  await page.goto(base + path, { waitUntil: 'networkidle' })
  await page.waitForTimeout(300)
  await page.screenshot({ path: join(outDir, `t001-seed-${name}.png`), fullPage: false })
  console.log(`captured T001 seed ${name} -> ${path}`)
}
await browser.close()
