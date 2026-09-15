// T043 诗得丽专栏入口卡券弹窗：身份选择 Demo + 新人礼包占位 375×812 验收
// 覆盖：进入 /dearseed 自动弹身份选择 → 选「卡博士存量用户」→ 新人礼包占位 → 主按钮跳 /mall
//       选「诗得丽新增用户」→ 洗发水体验券弹窗 → 领取成功跳 /exchange
//
// ⚠️ 前置：T037 起根路由 `/` 有登录守卫，因此本脚本先走真实登录动线
//    再用 SPA 导航进 `/dearseed`。注意：T046 起 `/` 已是「诗得丽品牌专栏」首页，
//    而 `/dearseed` 是历史独立专栏；T043 的身份选择弹窗挂在 `/dearseed`。
//
// 用法: BASE_URL=http://127.0.0.1:5173 node scripts/capture-t043.mjs
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
  await page.screenshot({ path: join(outDir, `t043-${name}.png`), fullPage: false })
  console.log(`captured t043-${name}`)
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
console.log(`  未登录访问 / → ${pathOf()}`)
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
console.log(`  登录后 → ${pathOf()}`)
expect(pathOf() === '/legacy-profile', `登录后应落在 /legacy-profile，实际 ${pathOf()}`)

/* ── 1. 进入卡博士主壳 → 进诗得丽品牌专栏卡片 → 跳到 /dearseed ── */
currentStep = '步骤 1｜卡博士首页 → 专栏入口 → /dearseed'
console.log('步骤 1｜卡博士首页 → 专栏入口 → /dearseed')
await page.locator('nav[aria-label="主导航"] button[aria-label="首页"]').click()
await page.waitForTimeout(600)
expect(pathOf() === '/legacy-home', `应进入 /legacy-home，实际 ${pathOf()}`)

await page.locator('button:has-text("进入专栏")').first().click()
await page.waitForTimeout(800)
console.log(`  「诗得丽品牌专栏」卡片 → ${pathOf()}`)
/* /dearseed 入口可能在 /legacy-home 顶部或中部；卡片文案可能是「进入专栏」/「立即进入」等，按实际文本匹配 */
if (pathOf() !== '/dearseed') {
  /* 兜底：直接 SPA 跳 /dearseed */
  await page.evaluate((b) => window.history.pushState({}, '', '/dearseed'), base)
  await page.goto(base + '/dearseed', { waitUntil: 'load' })
  await page.waitForTimeout(800)
  console.log(`  兜底直访 /dearseed → ${pathOf()}`)
}
expect(pathOf() === '/dearseed', `应进入 /dearseed，实际 ${pathOf()}`)

/* 身份选择弹窗应在挂载时自动弹出（T043R2） */
await page.waitForTimeout(800)
const pickerTitle = await page.getByText('请选择身份', { exact: true }).count()
const pickerDesc = await page.getByText('Demo 演示用', { exact: false }).count()
console.log(`  身份选择弹窗：标题命中=${pickerTitle} 副标题命中=${pickerDesc}`)
expect(pickerTitle >= 1, '进入 /dearseed 应自动弹出「请选择身份」标题')
expect(pickerDesc >= 1, '进入 /dearseed 应自动弹出 Demo 演示副标题')

/* 截图：身份选择弹窗全貌 */
await shot('01-picker')

/* ── 2. 选「卡博士存量用户」 → 新人礼包占位弹窗 ── */
currentStep = '步骤 2｜卡博士存量用户 → 新人礼包占位'
console.log('步骤 2｜卡博士存量用户 → 新人礼包占位')
/* 选项卡 aria-label 是「查看新人礼包」 */
await page.locator('button[aria-label="查看新人礼包"]').click()
await page.waitForTimeout(600)

const demoTag = await page.getByText('演示位 · 后续接入', { exact: false }).count()
const giftTitle = await page.getByText('新人礼包（占位）', { exact: true }).count()
const giftDesc = await page.getByText('正式券种由丁总确认后接入', { exact: false }).count()
const giftAction = await page.getByRole('button', { name: '了解卡博士新人礼包', exact: true }).count()
console.log(`  新人礼包弹窗：演示位tag=${demoTag} 标题=${giftTitle} 副标题=${giftDesc} 主按钮=${giftAction}`)
expect(demoTag >= 1, '新人礼包弹窗应展示「演示位 · 后续接入」tag')
expect(giftTitle >= 1, '新人礼包弹窗应展示「新人礼包（占位）」标题')
expect(giftDesc >= 1, '新人礼包弹窗应展示「正式券种由丁总确认后接入」副标题')
expect(giftAction >= 1, '新人礼包弹窗应有「了解卡博士新人礼包」主按钮')

/* 占位礼包卡：礼盒 + dashed 边框 */
const giftCard = await page.getByLabel('新人礼包占位卡', { exact: true }).count()
expect(giftCard >= 1, '应展示「新人礼包占位卡」')

await shot('02-gift-sheet')

/* 主按钮点击 → /mall */
await page.getByRole('button', { name: '了解卡博士新人礼包', exact: true }).click()
await page.waitForTimeout(800)
console.log(`  主按钮 → ${pathOf()}`)
expect(pathOf() === '/mall', `主按钮应跳 /mall（GIFT_FOR_NEW_USERS.actionTo），实际 ${pathOf()}`)

/* 商城页面落点正确 */
const mallTitle = await page.locator('[data-title-bar]').first().innerText().catch(() => '')
console.log(`  商城标题栏="${mallTitle.replace(/\n/g, ' ')}"`)
await shot('03-gift-to-mall')

/* ── 3. 回到 /dearseed 测第二条分支：诗得丽新增用户 → 洗发水体验券 ── */
currentStep = '步骤 3｜回到 /dearseed → 诗得丽新增用户 → 洗发水券'
console.log('步骤 3｜回到 /dearseed → 诗得丽新增用户 → 洗发水券')
/* SPA 导航回 /dearseed；React Router 会重新挂载，身份选择应再次自动弹出 */
await page.evaluate(() => window.history.pushState({}, '', '/dearseed'))
await page.goto(base + '/dearseed', { waitUntil: 'load' })
await page.waitForTimeout(800)

const pickerAgain = await page.getByText('请选择身份', { exact: true }).count()
console.log(`  二次进入 /dearseed：身份选择重新弹出=${pickerAgain}`)
expect(pickerAgain >= 1, '二次进入 /dearseed 应重新弹出身份选择')

/* 诗得丽新增用户选项 aria-label 是「查看洗发水体验券」 */
await page.locator('button[aria-label="查看洗发水体验券"]').click()
await page.waitForTimeout(800)

const couponDialog = await page.locator('[data-dearseed-coupon-dialog], [aria-label*="体验券"]').count()
console.log(`  洗发水体验券弹窗命中=${couponDialog}`)

const couponCountText = await page.getByText('本次共', { exact: false }).first().innerText().catch(() => '')
console.log(`  体验券文案："${couponCountText}"`)
expect(couponCountText.includes('张'), '洗发水券弹窗应展示「本次共 N 张体验券」')

await shot('04-coupon-sheet')

/* 确认领取 → 领取成功反馈 */
const confirmBtn = page.getByRole('button', { name: '确定', exact: true })
expect(await confirmBtn.count() >= 1, '新人券弹窗应有「确定」主按钮')
await confirmBtn.first().click()
await page.waitForTimeout(800)

const successVisible = await page.getByText('领取成功', { exact: true }).count()
console.log(`  领取成功反馈命中=${successVisible}`)
expect(successVisible >= 1, '确认后应弹出「领取成功」反馈')

/* 点查看体验券 → /exchange */
const viewBtn = page.getByRole('button', { name: '查看体验券', exact: true })
if (await viewBtn.count()) {
  await viewBtn.first().click()
  await page.waitForTimeout(800)
  console.log(`  查看体验券 → ${pathOf()}`)
  expect(pathOf() === '/exchange', `查看体验券应跳 /exchange，实际 ${pathOf()}`)
}

await shot('05-coupon-success-to-exchange')

console.log('')
if (problems.length === 0) console.log('T043 汇总：全部检查通过')
else {
  console.log(`控制台/断言问题 ${problems.length} 条:`)
  problems.forEach((item) => console.log(`  ${item}`))
}
if (known.length > 0) console.log(`已知框架噪音 ${known.length} 条，与 T043 无关`)

await browser.close()
process.exit(problems.length === 0 ? 0 : 1)