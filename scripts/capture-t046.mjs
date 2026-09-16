// T046 诗得丽品牌专栏首页右上角头像 → 会员中心 375×812 验收
// 覆盖：头像跳转目标、不再跳商城、卡博士主壳头像不受影响、返回路径闭合
//
// ⚠️ 前置：T037 起根路由 `/` 有登录守卫（未登录 → /legacy-profile/login），
//    因此本脚本先走一遍真实登录动线，再用 SPA 导航进入首页
//    （userInfoStore 是内存态，整页刷新会丢登录态，不能用 page.goto 进首页）。
//
// 用法: BASE_URL=http://127.0.0.1:5183 node scripts/capture-t046.mjs
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const outDir = join(root, 'docs/workbench/evidence/screenshots')
mkdirSync(outDir, { recursive: true })

const base = process.env.BASE_URL ?? 'http://127.0.0.1:5173'

/* 本机 Playwright 自带 chromium 版本与缓存不匹配，统一走系统 Chrome 通道 */
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL ?? 'chrome' })
const page = await browser.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1 })

const problems = []
const known = []
/** 当前步骤标签，用于给控制台/网络问题定位发生位置 */
let currentStep = '启动'
const tag = (text) => `[${currentStep}] ${text}`
/** React Router v6 的 v7 future flag 警告与本任务无关，且每次导航都会重复，单列计数不混进问题清单 */
const isKnownNoise = (text) => text.includes('React Router Future Flag Warning')
/** 项目未提供 favicon，Vite 预览服务对 /favicon.ico 固定返回 404；与本任务无关 */
const isFaviconNoise = (msg) => msg.text().includes('Failed to load resource') && (msg.location()?.url ?? '').includes('favicon.ico')
page.on('console', (msg) => {
  if (msg.type() !== 'error' && msg.type() !== 'warning') return
  const text = msg.text()
  if (isKnownNoise(text) || isFaviconNoise(msg)) known.push(text)
  else problems.push(tag(`[${msg.type()}] ${text}`))
})
page.on('pageerror', (error) => problems.push(tag(`[pageerror] ${error.message}`)))
/* 资源 404 只报 URL，便于定位；不靠控制台文案（控制台只说 "Failed to load resource"）*/
page.on('response', (res) => {
  if (res.status() >= 400) problems.push(tag(`[http ${res.status()}] ${res.url()}`))
})

const shot = async (name) => {
  await page.waitForTimeout(250)
  await page.screenshot({ path: join(outDir, `t046-${name}.png`), fullPage: false })
  console.log(`captured t046-${name}`)
}

const pathOf = () => new URL(page.url()).pathname

const expect = (ok, message) => {
  if (!ok) problems.push(`[assert] ${message}`)
}

/* ── 0. 登录动线（T037 守卫：未登录访问 `/` 会被重定向到登录页）── */
currentStep = '步骤 0｜登录动线'
console.log('步骤 0｜登录动线')
await page.goto(base + '/', { waitUntil: 'load' })
await page.waitForTimeout(800)
console.log(`  未登录访问 / → ${pathOf()}（预期被守卫重定向）`)
expect(pathOf() === '/legacy-profile/login', `未登录访问 / 应重定向到登录页，实际 ${pathOf()}`)

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
console.log(`  登录后 → ${pathOf()}`)
expect(pathOf() === '/legacy-profile', `登录后应落在 /legacy-profile，实际 ${pathOf()}`)

/* ── 1. 经真实入口进入诗得丽品牌专栏首页 ── */
currentStep = '步骤 1｜卡博士首页 → 诗得丽品牌专栏卡片'
console.log('步骤 1｜卡博士首页 → 诗得丽品牌专栏卡片')
await page.locator('nav[aria-label="主导航"] button[aria-label="首页"]').click()
await page.waitForTimeout(600)
console.log(`  底部 Tab「首页」 → ${pathOf()}`)
expect(pathOf() === '/legacy-home', `应进入 /legacy-home，实际 ${pathOf()}`)

await page.locator('button:has-text("进入专栏")').first().click()
await page.waitForTimeout(800)
console.log(`  「诗得丽品牌专栏」卡片 → ${pathOf()}`)
expect(pathOf() === '/', `专栏卡片应进入根路由 /，实际 ${pathOf()}`)

/* 首页默认自动弹身份选择（T043）；关闭后取干净形态 */
const pickerClose = page.locator('button[aria-label="关闭身份选择"]')
if (await pickerClose.count()) {
  await pickerClose.first().click()
  await page.waitForTimeout(400)
  console.log('  关闭 T043 身份选择弹窗，取首页干净形态')
}
const titleBar = await page.locator('[data-title-bar]').first().innerText()
console.log(`  页面标题栏="${titleBar.replace(/\n/g, ' ')}"`)
expect(titleBar.includes('诗得丽品牌专栏'), `首页标题栏应为「诗得丽品牌专栏」，实际="${titleBar.replace(/\n/g, ' ')}"`)

/* ── 2. 头像入口语义已由「商城」改为「会员中心」── */
currentStep = '步骤 2｜头像入口存在性与语义'
console.log('步骤 2｜头像入口存在性与语义')
const avatar = page.locator('[data-dearseed-avatar]')
const avatarCount = await avatar.count()
const label = await avatar.first().getAttribute('aria-label')
const staleLabel = await page.getByLabel('进入卡博士商城', { exact: true }).count()
console.log(`  头像锚点数=${avatarCount} aria-label="${label}"；残留「进入卡博士商城」入口=${staleLabel}`)
expect(avatarCount === 1, `首页应有且仅有 1 个 [data-dearseed-avatar] 入口，实际 ${avatarCount}`)
expect(await avatar.first().isVisible(), '首页头像入口应可见')
expect(label === '进入会员中心', `头像 aria-label 应为「进入会员中心」，实际="${label}"`)
expect(staleLabel === 0, `不应再存在 aria-label="进入卡博士商城" 的入口，实际 ${staleLabel} 处`)

const avatarBox = await avatar.first().boundingBox()
console.log(`  头像位置 x=${avatarBox.x} y=${avatarBox.y} w=${avatarBox.width} h=${avatarBox.height}`)
expect(
  avatarBox.x + avatarBox.width > 375 / 2 && avatarBox.y < 120,
  '头像应位于首页右上角（横向落在右半屏、纵向落在首屏顶部）',
)
await shot('01-home-avatar-before')

/* ── 3. 点击头像 → 专栏内会员中心，不再跳商城 ── */
currentStep = '步骤 3｜点击头像'
console.log('步骤 3｜点击头像')
await avatar.first().click()
await page.waitForTimeout(600)
console.log(`  点击头像 → ${pathOf()}`)
expect(pathOf() === '/dearseed/membership', `点击头像应进入 /dearseed/membership，实际 ${pathOf()}`)
expect(pathOf() !== '/mall', '点击头像不应再跳转商城 /mall')

const memberTitle = await page.locator('[data-title-bar]').first().innerText()
console.log(`  会员中心标题栏="${memberTitle.replace(/\n/g, ' ')}"`)
expect(
  memberTitle.includes('会员中心'),
  `进入后标题栏应为「会员中心」，实际="${memberTitle.replace(/\n/g, ' ')}"`,
)
await shot('02-membership-after')

/* ── 4. 返回路径闭合 ── */
currentStep = '步骤 4｜会员中心返回'
console.log('步骤 4｜会员中心返回')
await page.goBack()
await page.waitForTimeout(800)
console.log(`  返回 → ${pathOf()}`)
expect(pathOf() === '/', `会员中心返回应回到专栏首页 /，实际 ${pathOf()}`)
await shot('03-home-back')

/* 返回后首页重新挂载，T043 身份选择会再弹一次；关掉再继续 */
const pickerCloseAgain = page.locator('button[aria-label="关闭身份选择"]')
if (await pickerCloseAgain.count()) {
  await pickerCloseAgain.first().click()
  await page.waitForTimeout(400)
  console.log('  返回首页后再次关闭身份选择弹窗')
}

/* ── 5. 卡博士 APP 主壳头像行为不受影响 ── */
currentStep = '步骤 5｜卡博士主壳回归'
console.log('步骤 5｜卡博士主壳回归')
/* 主 Tab 的「首页」指向 `/` 本身，回卡博士首页要走首页左上角的返回入口 */
await page.locator('button[aria-label="返回卡博士首页"]').click()
await page.waitForTimeout(800)
console.log(`  返回卡博士首页 → ${pathOf()}`)
expect(pathOf() === '/legacy-home', `应进入 /legacy-home，实际 ${pathOf()}`)

const legacyAvatar = page.getByLabel('进入会员中心', { exact: true }).first()
expect(await legacyAvatar.isVisible(), '卡博士主壳 /legacy-home 头像应仍可见')
await legacyAvatar.click()
await page.waitForTimeout(600)
console.log(`  卡博士主壳头像 → ${pathOf()}`)
expect(pathOf() === '/membership', `卡博士主壳头像应仍进入 /membership，实际 ${pathOf()}`)

console.log('')
if (problems.length === 0) console.log('T046 汇总：全部检查通过')
else {
  console.log(`控制台/断言问题 ${problems.length} 条:`)
  problems.forEach((item) => console.log(`  ${item}`))
}
if (known.length > 0) console.log(`已知框架噪音（React Router v7 future flag）${known.length} 条，与 T046 无关`)

await browser.close()
process.exit(problems.length === 0 ? 0 : 1)
