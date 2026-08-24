import { chromium } from '@playwright/test'
const base = process.env.BASE_URL ?? 'http://127.0.0.1:5173'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 375, height: 812 } })
const errors = []
page.on('console', m => { if (m.type() === 'error') errors.push('[console] ' + m.text()) })
page.on('pageerror', e => errors.push('[pageerror] ' + e.message))
const routes = ['/', '/dearseed', '/card', '/exchange', '/profile', '/membership', '/mall?state=error', '/dearseed?overlay=newcomer', '/luck/result?result=minor', '/no-such-page']
for (const path of routes) {
  await page.goto(base + path, { waitUntil: 'networkidle' })
}
await page.waitForTimeout(500)
console.log(errors.length === 0 ? 'NO_BLOCKING_ERRORS' : errors.join('\n'))
await browser.close()
