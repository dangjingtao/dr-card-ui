// T012 通知与消息详情 375×812 验收截图（含点击交互，用于记录未读变化）
// 用法: BASE_URL=http://localhost:5177 node scripts/capture-t012.mjs
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const outDir = join(root, 'docs/workbench/evidence/screenshots')
mkdirSync(outDir, { recursive: true })

const base = process.env.BASE_URL ?? 'http://127.0.0.1:5173'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1 })

const problems = []
page.on('console', (msg) => {
  if (msg.type() === 'error' || msg.type() === 'warning') problems.push(`[${msg.type()}] ${msg.text()}`)
})
page.on('pageerror', (error) => problems.push(`[pageerror] ${error.message}`))

const shot = async (name) => {
  await page.waitForTimeout(250)
  await page.screenshot({ path: join(outDir, `t012-${name}.png`), fullPage: false })
  console.log(`captured t012-${name}`)
}

const go = async (path) => {
  await page.goto(base + path, { waitUntil: 'networkidle' })
  await page.waitForTimeout(200)
}

/** 读取「全部」Tab 角标，作为未读数变化的文字证据 */
const allBadge = () => page.getByRole('tab', { name: /^全部/ }).innerText()

// —— 节点 #11 列表默认态 + 4 Tab 切换 ——
await go('/notifications')
console.log(`  全部 Tab 初始角标: ${(await allBadge()).replace(/\s+/g, '')}`)
await shot('11-list-all')

for (const [name, pattern] of [
  ['tab-unread', /^未读/],
  ['tab-system', /^系统$/],
  ['tab-activity', /^活动$/],
]) {
  await page.getByRole('tab', { name: pattern }).click()
  await shot(name)
}

// —— 节点 #42 未读态夹具 ——
await go('/notifications?state=unread')
await shot('42-state-unread')

// —— 未读变化：点开 n1 详情后返回，全部 Tab 角标应 3 → 2 ——
await go('/notifications')
const before = (await allBadge()).replace(/\s+/g, '')
await page.getByRole('button', { name: /订单核销成功/ }).click()
await page.waitForURL(/\/notifications\/n1$/)
await shot('44-detail-system')
await page.goBack()
await page.waitForTimeout(300)
const after = (await allBadge()).replace(/\s+/g, '')
await shot('unread-after-read')
console.log(`  未读变化: 全部 Tab ${before} -> ${after}`)
if (before === after) problems.push(`[assert] 进入详情后未读数未变化: ${before}`)

// —— 详情各形态 ——
await go('/notifications/n2')
await shot('44-detail-activity-cta')
await go('/notifications/n6')
await shot('44-detail-longtext')
await go('/notifications/none')
await shot('44-detail-fallback')

// —— 节点 #43 确认弹窗 → 确认 → Toast → 未读 Tab 空态 ——
await go('/notifications?overlay=clear')
await shot('43-dialog-clear')
await page.getByRole('button', { name: '确认' }).click()
await page.waitForTimeout(200)
await shot('43-toast-all-read')
const afterAll = (await allBadge()).replace(/\s+/g, '')
console.log(`  一键已读后 全部 Tab 角标: ${afterAll}`)
await page.getByRole('tab', { name: /^未读/ }).click()
await shot('list-empty-unread')

await browser.close()

console.log(problems.length ? `\n控制台/断言问题 ${problems.length} 条:\n${problems.join('\n')}` : '\n控制台无 error/warning，断言全部通过')
