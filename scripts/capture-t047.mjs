// T047 诗得丽专栏首张轮播图品牌名替换：卡博士.极地种子 375×812 验收
// 覆盖：
//   1) /dearseed 顶部 hero 叠加文字层 title=「卡博士.极地种子」subtitle=「极地种子品牌故事」
//   2) / 底部「公益板块与品牌故事」列表第二项 title=「极地种子品牌故事」desc 含「了解极地种子」
//   3) 不残留旧品牌文案「卡博士诗得丽」「卡博士品牌故事」
//
// ⚠️ 前置：T037 起根路由 `/` 有登录守卫，因此本脚本先走真实登录动线
//    再用 SPA 导航进目标页。
//
// 用法: BASE_URL=http://127.0.0.1:5173 node scripts/capture-t047.mjs
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const outDir = join(root, 'docs/workbench/evidence/screenshots')
mkdirSync(outDir, { recursive: true })

const base = process.env.BASE_URL ?? 'http://127.0.0.1:5173'

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL ?? 'chrome' })
const page = await browser.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1 })

const problems = []
const known = []
let currentStep = '启动'
const tag = (text) => `[${currentStep}] ${text}`
const isKnownNoise = (text) => text.includes('React Router Future Flag Warning')
const isFaviconNoise = (msg) => msg.text().includes('Failed to load resource') && (msg.location()?.url ?? '').includes('favicon.ico')
page.on('console', (msg) => {
  if (msg.type() !== 'error' && msg.type() !== 'warning') return
  const text = msg.text()
  if (isKnownNoise(text) || isFaviconNoise(msg)) known.push(text)
  else problems.push(tag(`[${msg.type()}] ${text}`))
})
page.on('pageerror', (error) => problems.push(tag(`[pageerror] ${error.message}`)))
page.on('response', (res) => {
  if (res.status() >= 400) problems.push(tag(`[http ${res.status()}] ${res.url()}`))
})

const shot = async (name) => {
  await page.waitForTimeout(250)
  await page.screenshot({ path: join(outDir, `t047-${name}.png`), fullPage: false })
  console.log(`captured t047-${name}`)
}

const pathOf = () => new URL(page.url()).pathname
const expect = (ok, message) => {
  if (!ok) problems.push(`[assert] ${message}`)
}

/* ── 0. 登录动线 ── */
currentStep = '步骤 0｜登录动线'
console.log('步骤 0｜登录动线')
await page.goto(base + '/', { waitUntil: 'load' })
await page.waitForTimeout(800)
expect(pathOf() === '/legacy-profile/login', `未登录访问 / 应被守卫重定向到登录页，实际 ${pathOf()}`)

await page.fill('input[placeholder="请输入手机号"]', '15047757139')
await page.fill('input[placeholder="请输入密码"]', '123456')
await page.click('button[aria-label="同意协议"]')
await page.click('button:has-text("立即登录")')
await page.waitForTimeout(1200)
const bindLater = page.locator('button:has-text("稍后再说")')
if (await bindLater.count()) {
  await bindLater.first().click()
  await page.waitForTimeout(500)
}
expect(pathOf() === '/legacy-profile', `登录后应落在 /legacy-profile，实际 ${pathOf()}`)

/* ── 1. 进 /legacy-home → 点"进入专栏"按钮 → /，看底部品牌故事卡片 ── */
currentStep = '步骤 1｜/legacy-home → 专栏卡片 → /'
console.log('步骤 1｜/legacy-home → 专栏卡片 → /')
await page.locator('nav[aria-label="主导航"] button[aria-label="首页"]').click()
await page.waitForTimeout(800)
console.log(`  legacy Tab「首页」 → ${pathOf()}`)
expect(pathOf() === '/legacy-home', `应进入 /legacy-home，实际 ${pathOf()}`)

/* 点"诗得丽品牌专栏"卡片上的"进入专栏"按钮 */
await page.locator('button:has-text("进入专栏")').first().click()
await page.waitForTimeout(800)
console.log(`  「进入专栏」 → ${pathOf()}`)
expect(pathOf() === '/', `应进入 /，实际 ${pathOf()}`)

/* 首页默认自动弹新人体验券（T021）+ 身份选择（T043）都会弹，关掉 */
const newcomerClose = page.locator('button[aria-label="关闭新人体验券"]')
if (await newcomerClose.count()) {
  await newcomerClose.first().click()
  await page.waitForTimeout(300)
}
const pickerClose2 = page.locator('button[aria-label="关闭身份选择"]')
if (await pickerClose2.count()) {
  await pickerClose2.first().click()
  await page.waitForTimeout(300)
}

/* 滚动到底部，定位 COLUMN_HOME_SECTIONS 第二项 */
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
await page.waitForTimeout(400)

const cardTitle = await page.getByText('极地种子品牌故事', { exact: true }).count()
const cardDesc = await page.getByText('了解极地种子品牌起源与匠心洗护', { exact: true }).count()
console.log(`  首页底部卡片：title=${cardTitle} desc=${cardDesc}`)
expect(cardTitle >= 1, '首页底部「卡博士品牌故事」卡片应展示「极地种子品牌故事」标题')
expect(cardDesc >= 1, '首页底部卡片应展示「了解极地种子品牌起源与匠心洗护」描述')

/* 公益板块仍为静态不可点击（D-079） */
const causeTitle = await page.getByText('公益板块', { exact: true }).count()
expect(causeTitle >= 1, '公益板块标题应保留')

await shot('01-home-bottom-card')

/* ── 2. 用 SPA history 跳到 /dearseed，验证 hero 文字层 ── */
currentStep = '步骤 2｜SPA history → /dearseed hero 文字层'
console.log('步骤 2｜SPA history → /dearseed hero 文字层')
await page.evaluate(() => {
  window.history.pushState({}, '', '/dearseed')
  window.dispatchEvent(new PopStateEvent('popstate'))
})
await page.waitForTimeout(800)
console.log(`  history 跳到 → ${pathOf()}`)
expect(pathOf() === '/dearseed', `应进入 /dearseed，实际 ${pathOf()}`)

/* T043 进入 /dearseed 会自动弹身份选择，关掉再取干净形态 */
const pickerClose = page.locator('button[aria-label="关闭身份选择"]')
if (await pickerClose.count()) {
  await pickerClose.first().click()
  await page.waitForTimeout(400)
}

/* 检查叠加文字层 */
const heroTitle = await page.getByText('卡博士.极地种子', { exact: true }).count()
const heroSubtitle = await page.getByText('极地种子品牌故事', { exact: true }).count()
console.log(`  hero 文字层：title="${heroTitle}" subtitle="${heroSubtitle}"`)
expect(heroTitle >= 1, '诗得丽专栏 hero 应展示「卡博士.极地种子」主标题')
expect(heroSubtitle >= 1, '诗得丽专栏 hero 应展示「极地种子品牌故事」副标题')

/* 不应再出现旧品牌名 */
const staleTitle = await page.getByText('卡博士诗得丽', { exact: true }).count()
const staleSubtitle = await page.getByText('卡博士品牌故事', { exact: true }).count()
console.log(`  残留旧文案：旧标题=${staleTitle} 旧副标题=${staleSubtitle}`)
expect(staleTitle === 0, 'hero 不应再展示旧标题「卡博士诗得丽」')
expect(staleSubtitle === 0, 'hero 不应再展示旧副标题「卡博士品牌故事」')

await shot('02-dearseed-hero')

console.log('')
if (problems.length === 0) console.log('T047 汇总：全部检查通过')
else {
  console.log(`控制台/断言问题 ${problems.length} 条:`)
  problems.forEach((item) => console.log(`  ${item}`))
}
if (known.length > 0) console.log(`已知框架噪音 ${known.length} 条，与 T047 无关`)

await browser.close()
process.exit(problems.length === 0 ? 0 : 1)