import { chromium } from '@playwright/test'

const base = process.env.BASE_URL ?? 'http://localhost:5199'
const outDir = 'docs/workbench/evidence/screenshots'

/**
 * T023 起 `/membership` 重定向到 /mall 商城占位页（需求 §6），原会员中心用例下线，
 * 变更前证据保留在 docs/workbench/evidence/screenshots/std-membership.png。
 */
const cases = [
  ['std-checkin', '/checkin', ['今日已签到', '本周期签到日历', '连续签到奖励', '为你精选']],
  ['std-profile', '/profile', ['我的', 'VIP 泡泡新生', '卡券兑换', '客服中心', '热门兑换']],
]

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 375, height: 812 } })
const errors = []
let failed = 0
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text())
})
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))

for (const [name, path, expectTexts] of cases) {
  await page.goto(base + path, { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${outDir}/${name}.png` })
  const bodyText = await page.evaluate(() => document.body.innerText)
  const imgs = await page.evaluate(() =>
    Array.from(document.querySelectorAll('img')).map((i) => ({ alt: i.alt, ok: i.naturalWidth > 0 })),
  )
  const missing = expectTexts.filter((t) => !bodyText.includes(t))
  if (missing.length || imgs.some((image) => !image.ok)) failed++
  console.log(`\n=== ${path} (${name}.png) ===`)
  console.log('imgs:', JSON.stringify(imgs))
  console.log('missing texts:', missing.length ? missing : 'NONE')
  console.log('errors so far:', errors.length ? errors : 'NONE')
}

await browser.close()
process.exit(failed === 0 && errors.length === 0 ? 0 : 1)
