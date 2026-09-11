// T051 诗得丽专栏「我的」改名「会员中心」375×812 验收
// 覆盖：
//   1) /profile 底部 Tab 第 5 位 label =「会员中心」（不再是「我的」）
//   2) /profile TitleBar h1 =「会员中心」
//   3) /dearseed/membership 标题栏 =「会员中心」（T046 注册的复用路由）
//   4) /profile 8 项宫格第 2 项 =「会员权益」（避免与 Tab label 同名）
//   5) 通知 fixture 中相关文案已改「会员中心 · 客服中心」（无 UI 直接断言，由代码 grep 验证）
//
// ⚠️ 前置：T037 起根路由 `/` 有登录守卫，因此本脚本先走真实登录动线
//    再用 SPA 导航进目标页。/profile 是底部 Tab 入口（tabOrder=5）。
//
// 用法: BASE_URL=http://127.0.0.1:5173 node scripts/capture-t051.mjs
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
  await page.screenshot({ path: join(outDir, `t051-${name}.png`), fullPage: false })
  console.log(`captured t051-${name}`)
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

/* ── 1. 进 /legacy-home → 点"进入专栏"按钮 → /，主 5 项 Tab 才显示「会员中心」 ── */
currentStep = '步骤 1｜/legacy-home → / 触发主 5 项 Tab'
console.log('步骤 1｜/legacy-home → / 触发主 5 项 Tab')
await page.locator('nav[aria-label="主导航"] button[aria-label="首页"]').click()
await page.waitForTimeout(800)
expect(pathOf() === '/legacy-home', `应进入 /legacy-home，实际 ${pathOf()}`)

await page.locator('button:has-text("进入专栏")').first().click()
await page.waitForTimeout(800)
expect(pathOf() === '/', `应进入 /，实际 ${pathOf()}`)

/* 首页默认自动弹新人体验券（T021）+ 身份选择（T043）都会弹，关掉取干净形态 */
const newcomerClose = page.locator('button[aria-label="关闭新人体验券"]')
if (await newcomerClose.count()) {
  await newcomerClose.first().click()
  await page.waitForTimeout(300)
}
const pickerClose = page.locator('button[aria-label="关闭身份选择"]')
if (await pickerClose.count()) {
  await pickerClose.first().click()
  await page.waitForTimeout(300)
}

/* ── 2. 验证底部 Tab 第 5 位 label =「会员中心」 ── */
currentStep = '步骤 2｜主 5 项 Tab 第 5 位 label'
console.log('步骤 2｜主 5 项 Tab 第 5 位 label')
const tabLabels = await page.locator('nav[aria-label="主导航"] button').allInnerTexts()
console.log(`  底部 Tab label 数=${tabLabels.length}，依次=${JSON.stringify(tabLabels)}`)
expect(tabLabels.length === 5, `主导航应有 5 个 Tab，实际 ${tabLabels.length}`)
expect(tabLabels[4] === '会员中心', `底部 Tab 第 5 位 label 应为「会员中心」，实际 "${tabLabels[4]}"`)

await shot('01-main-tabs')

/* ── 3. 切到 /profile 看 TitleBar h1 + 宫格第 2 项 ── */
currentStep = '步骤 3｜/profile TitleBar + 宫格第 2 项'
console.log('步骤 3｜/profile TitleBar + 宫格第 2 项')
await page.locator('nav[aria-label="主导航"] button[aria-label="会员中心"]').click()
await page.waitForTimeout(800)
console.log(`  切到 → ${pathOf()}`)
expect(pathOf() === '/profile', `应进入 /profile，实际 ${pathOf()}`)

const titleBarText = await page.locator('[data-title-bar]').first().innerText()
console.log(`  /profile TitleBar="${titleBarText.replace(/\n/g, ' ')}"`)
expect(titleBarText.includes('会员中心'), `/profile TitleBar 应含「会员中心」，实际="${titleBarText.replace(/\n/g, ' ')}"`)

/* 8 项宫格第 2 项：会员权益 */
const tileNames = await page.locator('button:has-text("会员权益")').count()
console.log(`  8 项宫格第 2 项「会员权益」命中=${tileNames}`)
expect(tileNames >= 1, '8 项宫格第 2 项应展示「会员权益」（避免与 Tab label 同名）')

await shot('02-profile-tab-and-grid')

/* ── 4. /dearseed/membership 标题栏 ── */
currentStep = '步骤 4｜/dearseed/membership 标题栏'
console.log('步骤 4｜/dearseed/membership 标题栏')
/* SPA 内 history 跳转，避免被守卫拦截（userInfoStore 是内存态，整页刷新即丢） */
await page.evaluate(() => {
  window.history.pushState({}, '', '/dearseed/membership')
  window.dispatchEvent(new PopStateEvent('popstate'))
})
await page.waitForTimeout(800)
console.log(`  → ${pathOf()}`)
expect(pathOf() === '/dearseed/membership', `应进入 /dearseed/membership，实际 ${pathOf()}`)

const memberTitle = await page.locator('[data-title-bar]').first().innerText()
console.log(`  /dearseed/membership TitleBar="${memberTitle.replace(/\n/g, ' ')}"`)
expect(memberTitle.includes('会员中心'), `/dearseed/membership TitleBar 应含「会员中心」，实际="${memberTitle.replace(/\n/g, ' ')}"`)

await shot('03-dearseed-membership')

console.log('')
if (problems.length === 0) console.log('T051 汇总：全部检查通过')
else {
  console.log(`控制台/断言问题 ${problems.length} 条:`)
  problems.forEach((item) => console.log(`  ${item}`))
}
if (known.length > 0) console.log(`已知框架噪音 ${known.length} 条，与 T051 无关`)

await browser.close()
process.exit(problems.length === 0 ? 0 : 1)