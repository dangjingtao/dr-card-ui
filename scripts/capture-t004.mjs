// T004 骨架/路由/状态夹具 375×812 自检截图
// 用法: BASE_URL=http://localhost:5176 node scripts/capture-t004.mjs
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const outDir = join(root, 'docs/workbench/evidence/screenshots')
mkdirSync(outDir, { recursive: true })

const base = process.env.BASE_URL ?? 'http://127.0.0.1:5173'
const routes = [
  // 首页带 ?newcomer=off 抑制 T021 的默认新人体验券弹窗，保证截图取到无遮挡形态
  ['home', '/?newcomer=off'],
  ['dearseed-overlay-newcomer', '/dearseed?overlay=newcomer'],
  ['card', '/card'],
  ['exchange', '/exchange'],
  ['profile', '/profile'],
  /*
   * T023 起 /membership 重定向到 /mall（需求 §6），原「membership-stub」截图与 mall-webview 完全重复，
   * 故从本脚本下线；变更前证据保留在 t004-membership-stub.png，重定向落点证据见 t023-17-mall-from-membership.png。
   */
  ['mall-webview', '/mall'],
  ['mall-webview-error', '/mall?state=error'],
  ['exchange-sheet-redeem', '/exchange?overlay=redeem'],
  ['luck-result-good', '/luck/result?result=good'],
  ['checkin-deeplink', '/checkin'],
  ['not-found', '/no-such-page'],
]

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1 })
for (const [name, path] of routes) {
  await page.goto(base + path, { waitUntil: 'networkidle' })
  await page.waitForTimeout(300)
  await page.screenshot({ path: join(outDir, `t004-${name}.png`), fullPage: false })
  console.log(`captured t004-${name} -> ${path}`)
}
await browser.close()
