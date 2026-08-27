// T021 品牌专栏首页与新人体验券 375×812 验收：首屏结构、长页滚动、1/2 张券弹窗与领取成功链路
// 用法: BASE_URL=http://localhost:5173 node scripts/capture-t021.mjs
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
const known = []
/** React Router v6 的 v7 future flag 警告与本任务无关，且每次导航都会重复，单列计数不混进问题清单 */
const isKnownNoise = (text) => text.includes('React Router Future Flag Warning')
page.on('console', (msg) => {
  if (msg.type() !== 'error' && msg.type() !== 'warning') return
  const text = msg.text()
  if (isKnownNoise(text)) known.push(text)
  else problems.push(`[${msg.type()}] ${text}`)
})
page.on('pageerror', (error) => problems.push(`[pageerror] ${error.message}`))

const shot = async (name) => {
  await page.waitForTimeout(250)
  await page.screenshot({ path: join(outDir, `t021-${name}.png`), fullPage: false })
  console.log(`captured t021-${name}`)
}

const go = async (path) => {
  await page.goto(base + path, { waitUntil: 'networkidle' })
  await page.waitForTimeout(200)
}

const expect = (ok, message) => {
  if (!ok) problems.push(`[assert] ${message}`)
}

const box = async (selector) => page.locator(selector).first().boundingBox()

const BOTTOM_NAV = 'nav[aria-label="主导航"]'
const SCROLL = '[data-page-scroll]'

// —— §3.1 默认全是新用户（用户 2026-08-27 定案）：无参数进入 `/` 即弹出新人体验券 ——
await go('/')
const autoDialog = await page.locator('[role="dialog"]').count()
const autoCoupons = await page.locator('ul[aria-label="本次赠送的体验券"] > li').count()
console.log(`  §3.1 默认进入 / → 弹窗=${autoDialog} 券数=${autoCoupons}（1 张/2 张概率 1:1，随机呈现）`)
expect(autoDialog >= 1, '默认全是新用户：无参数进入 `/` 应自动弹出新人体验券')
expect(autoCoupons === 1 || autoCoupons === 2, `自动弹窗应展示 1 或 2 张券，实际 ${autoCoupons} 张`)
await shot('05-home-auto-newcomer')

// 关闭后同一次访问内不再复现（避免与纯 URL 驱动的 overlay 相互覆盖形成死循环）
await page.getByRole('button', { name: '关闭新人体验券' }).click()
await page.waitForTimeout(250)
const afterAutoClose = await page.locator('[role="dialog"]').count()
console.log(`  §3.2 关闭自动弹窗 → 弹窗=${afterAutoClose} pathname=${new URL(page.url()).pathname}`)
expect(afterAutoClose === 0, '关闭自动弹窗后不应再次弹出（不得出现删参后立刻复现的死循环）')

// `?newcomer=off` 为取证抑制参数：让首页拿到无遮挡形态，不改变产品行为
await go('/?newcomer=off')
const suppressed = await page.locator('[role="dialog"]').count()
console.log(`  取证：?newcomer=off → 弹窗=${suppressed}`)
expect(suppressed === 0, '`?newcomer=off` 应确定性地抑制自动弹窗')

// —— §2.2 首屏结构：标题 → 搜索栏与头像 → Banner；金刚区已移除 ——
await go('/?newcomer=off')
const titleBar = await page.locator('[data-title-bar]').first().innerText()
console.log(`  §2.2 页面标题=${titleBar.replace(/\n/g, ' ')}`)
expect(titleBar.includes('诗得丽品牌专栏'), `页面标题应为「诗得丽品牌专栏」，实际=${titleBar}`)

const searchBox = await box('section[aria-label="搜索与用户入口"]')
const banner = await box('section[aria-label="首页活动轮播"], [aria-label="首页活动轮播"]')
const checkinHero = await box('section[aria-label="今日签到状态"]')
console.log(
  `  §2.2 搜索区 bottom=${searchBox.y + searchBox.height} Banner top=${banner.y} bottom=${banner.y + banner.height} 打卡首块 top=${checkinHero.y}`,
)
expect(await page.locator('input[aria-label="搜索商品"]').isVisible(), '首屏缺少搜索栏')
expect(await page.locator('button[aria-label="进入卡博士商城"]').isVisible(), '首屏缺少头像入口')
expect(banner.y >= searchBox.y + searchBox.height, 'Banner 应排在搜索栏下方')
expect(checkinHero.y >= banner.y + banner.height, '打卡内容应排在 Banner 下方')

// 金刚区已完整移除：不保留淋浴、洗烘、饮水、吹风等入口
for (const forbidden of ['淋浴', '洗烘', '饮水', '吹风']) {
  const hit = await page.getByText(forbidden, { exact: false }).count()
  expect(hit === 0, `金刚区应已移除，仍命中「${forbidden}」${hit} 处`)
}
console.log('  §2.2 金刚区入口（淋浴/洗烘/饮水/吹风）命中 0 处')
await shot('01-home-first-screen')

// —— §2.3 打卡内容完整迁入，且首页不出现两套页面外壳 ——
const boardSections = ['今日签到状态', '当月签到日历', '是日任务', '为你精选']
for (const label of boardSections) {
  const hit = await page.locator(`section[aria-label="${label}"]`).count()
  expect(hit === 1, `首页应完整承载打卡内容「${label}」，实际命中 ${hit} 处`)
}
const homeBackBar = await page.locator('[data-title-bar="back"]').count()
const homeTitleBars = await page.locator('[data-title-bar]').count()
const homeTabBar = await page.locator(BOTTOM_NAV).count()
console.log(
  `  §2.3 打卡四块均命中 1 处；返回栏=${homeBackBar} 标题栏总数=${homeTitleBars} 底部导航=${homeTabBar}`,
)
expect(homeBackBar === 0, '首页为一级 Tab，不应出现 /checkin 的返回按钮')
expect(homeTitleBars === 1, `首页应只有一套页面标题栏，实际 ${homeTitleBars} 套`)
expect(homeTabBar === 1, `首页应只有一套底部导航，实际 ${homeTabBar} 套`)

// —— §2.2 公益板块与品牌故事排在打卡内容下方，顺序正确 ——
const picks = await box('section[aria-label="为你精选"]')
const extra = await box('section[aria-label="公益板块与品牌故事"]')
const extraTitles = await page
  .locator('section[aria-label="公益板块与品牌故事"] > *')
  .evaluateAll((nodes) => nodes.map((node) => node.querySelector('span > span')?.textContent ?? ''))
console.log(`  §2.2 打卡末块 bottom=${picks.y + picks.height} 附加区 top=${extra.y} 顺序=${extraTitles.join(' / ')}`)
expect(extra.y >= picks.y + picks.height, '公益板块应排在打卡内容下方')
expect(
  extraTitles[0] === '公益板块' && extraTitles[1] === '卡博士品牌故事',
  `附加区顺序应为「公益板块 → 卡博士品牌故事」，实际=${extraTitles.join(' / ')}`,
)

// 公益板块暂不实现跳转（用户 2026-08-27 定案）：只保留品牌故事一个可点击入口
const extraButtons = await page
  .locator('section[aria-label="公益板块与品牌故事"] > button')
  .evaluateAll((nodes) => nodes.map((node) => node.querySelector('span > span')?.textContent ?? ''))
console.log(`  §2.2 附加区可点击入口=${extraButtons.join(' / ') || '无'}`)
expect(
  extraButtons.length === 1 && extraButtons[0] === '卡博士品牌故事',
  `公益板块应无跳转，可点击入口应只有「卡博士品牌故事」，实际=${extraButtons.join(' / ')}`,
)

// —— §2.3 §4 长页可完整浏览，公益板块与品牌故事随页面滚动、不吸底 ——
const metrics = await page.locator(SCROLL).evaluate((el) => ({
  scrollHeight: el.scrollHeight,
  clientHeight: el.clientHeight,
}))
console.log(`  §4 可滚动高度=${metrics.scrollHeight} 视口高度=${metrics.clientHeight}`)
expect(metrics.scrollHeight > metrics.clientHeight, '首页长页应可滚动')

const extraBeforeScroll = extra.y
await page.locator(SCROLL).evaluate((el) => {
  el.scrollTop = el.scrollHeight
})
await page.waitForTimeout(250)
const extraAfterScroll = await box('section[aria-label="公益板块与品牌故事"]')
const tabBar = await box(BOTTOM_NAV)
const lastCard = await box('section[aria-label="公益板块与品牌故事"] > *:last-child')
console.log(
  `  §2.3 滚到底：附加区 top ${extraBeforeScroll} → ${extraAfterScroll.y}（随页滚动）；末卡 bottom=${lastCard.y + lastCard.height} 底部导航 top=${tabBar.y}`,
)
expect(extraAfterScroll.y < extraBeforeScroll, '公益板块与品牌故事应随页面滚动，不得吸底或悬浮')
expect(
  lastCard.y + lastCard.height <= tabBar.y + 1,
  `滚到底后末张卡不应被底部导航遮挡：卡片底 ${lastCard.y + lastCard.height}，导航顶 ${tabBar.y}`,
)
await shot('02-home-bottom')

// —— §3.1 新人弹窗：1 张券与 2 张券两个确定性状态 ——
const couponExpect = {
  'coupon-1': { total: 1, names: ['DearSeed 洗发水体验券'] },
  'coupon-2': { total: 2, names: ['DearSeed 洗发水体验券', '洗护组合体验券'] },
}
for (const [stateKey, want] of Object.entries(couponExpect)) {
  await go(`/?state=${stateKey}&overlay=newcomer-coupon`)
  await page.locator('[role="dialog"]').first().waitFor()
  const names = await page
    .locator('ul[aria-label="本次赠送的体验券"] > li')
    .evaluateAll((nodes) => nodes.map((node) => node.querySelector('p')?.textContent ?? ''))
  const totalLabel = await page.getByText(/^本次共 \d+ 张体验券$/).innerText()
  console.log(`  §3.1 ${stateKey}: ${totalLabel} → ${names.join(' / ')}`)
  expect(names.length === want.total, `${stateKey} 应展示 ${want.total} 张券，实际 ${names.length} 张`)
  expect(totalLabel === `本次共 ${want.total} 张体验券`, `${stateKey} 数量文案错误：${totalLabel}`)
  want.names.forEach((name, index) => expect(names[index] === name, `${stateKey} 第 ${index + 1} 张券名应为 ${name}`))
  await shot(`03-newcomer-${stateKey}`)
}

// —— §3.2 关闭：不领取，停留 `/` ——
await go('/?state=coupon-2&overlay=newcomer-coupon')
await page.locator('[role="dialog"]').first().waitFor()
await page.getByRole('button', { name: '关闭新人体验券' }).click()
await page.waitForTimeout(250)
const afterClose = new URL(page.url())
const dialogAfterClose = await page.locator('[role="dialog"]').count()
console.log(
  `  §3.2 关闭 → pathname=${afterClose.pathname} overlay=${afterClose.searchParams.get('overlay') ?? 'none'} 弹窗=${dialogAfterClose}`,
)
expect(afterClose.pathname === '/', '关闭弹窗后应停留首页 `/`')
expect(dialogAfterClose === 0, '关闭后不应残留弹窗')
expect(afterClose.searchParams.get('state') === 'coupon-2', '关闭时应保留其他 search 参数')

// —— §3.2 确定 → 先出领取成功反馈 → 再进入体验券页面 ——
await go('/?state=coupon-1&overlay=newcomer-coupon')
await page.locator('[role="dialog"]').first().waitFor()
await page.getByRole('button', { name: '确定' }).click()
await page.waitForTimeout(250)
// PromptOverlay 会为无障碍注入 sr-only 标题「体验券领取成功」，此处只校验可见标题
const successTitle = await page.getByRole('heading', { name: '领取成功', exact: true }).isVisible()
const successOverlayParam = new URL(page.url()).searchParams.get('overlay')
console.log(`  §3.2 确定 → 领取成功可见=${successTitle} overlay=${successOverlayParam}`)
expect(successTitle, '点击确定后应先呈现领取成功反馈')
expect(successOverlayParam === 'coupon-success', '领取成功态应由 ?overlay=coupon-success 复现')
await shot('04-coupon-success')

await page.getByRole('button', { name: '查看体验券' }).click()
await page.waitForURL(/\/exchange$/)
console.log(`  §3.2 「查看体验券」→ ${new URL(page.url()).pathname}（用户定案跳转体验券专区）`)

// —— 打卡交互：首页内补签与 /checkin 回归 ——
await go('/?newcomer=off')
await page.locator('button[aria-label$="日补签"]').first().click()
await page.waitForTimeout(250)
const makeupVisible = await page.locator('[role="dialog"]').count()
const makeupParam = new URL(page.url()).searchParams.get('overlay')
console.log(`  §2.3 首页补签 → 弹窗=${makeupVisible} overlay=${makeupParam}`)
expect(makeupVisible >= 1, '首页内补签应弹出补签成功反馈')
expect(makeupParam === 'make-up-success', '首页补签弹窗应由 ?overlay=make-up-success 复现')

await go('/checkin')
const checkinBackBar = await page.locator('[data-title-bar="back"]').count()
const checkinTabBar = await page.locator(BOTTOM_NAV).count()
const checkinSections = []
for (const label of boardSections) checkinSections.push(await page.locator(`section[aria-label="${label}"]`).count())
console.log(
  `  回归 /checkin：返回栏=${checkinBackBar} 底部Tab=${checkinTabBar} 打卡四块=${checkinSections.join('/')}`,
)
expect(checkinBackBar === 1, '/checkin 仍应由 MobileLayout 提供唯一返回标题栏')
expect(checkinTabBar === 0, '/checkin 为二级页，不应出现底部 Tab 导航')
expect(
  checkinSections.every((count) => count === 1),
  `/checkin 抽取组件后四块内容应各命中 1 处，实际 ${checkinSections.join('/')}`,
)

console.log('')
if (problems.length === 0) console.log('T021 汇总：全部检查通过')
else {
  console.log(`控制台/断言问题 ${problems.length} 条:`)
  problems.forEach((item) => console.log(`  ${item}`))
}
if (known.length > 0) console.log(`已知框架噪音（React Router v7 future flag）${known.length} 条，与 T021 无关`)

await browser.close()
process.exit(problems.length === 0 ? 0 : 1)
