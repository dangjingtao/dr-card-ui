// T022 泡泡值任务页与独立明细 375×812 验收：长页浏览、安全区与层级不重叠
// 用法: BASE_URL=http://localhost:5173 node scripts/capture-t022.mjs
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
  await page.screenshot({ path: join(outDir, `t022-${name}.png`), fullPage: false })
  console.log(`captured t022-${name}`)
}

const go = async (path) => {
  await page.goto(base + path, { waitUntil: 'networkidle' })
  await page.waitForTimeout(200)
}

const expect = (ok, message) => {
  if (!ok) problems.push(`[assert] ${message}`)
}

const box = async (selector) => page.locator(selector).first().boundingBox()

/** 吸底主按钮容器没有 data hook，按既有页面实现用 sticky 类名定位，避免为取证改动源码 */
const STICKY_ACTION = 'div.sticky.bottom-0'
const BOTTOM_NAV = 'nav[aria-label="主导航"]'

// —— 验收标准：任务卡片层级清楚，不与福利区或底部按钮重叠 ——
await go('/points')
const benefits = await box('section[aria-labelledby="points-benefits-title"]')
const tasks = await box('section[aria-labelledby="points-tasks-title"]')
const stickyBar = await box(STICKY_ACTION)
console.log(
  `  §4.2 福利区 bottom=${benefits.y + benefits.height} 任务区 top=${tasks.y} bottom=${tasks.y + tasks.height} 底部按钮 top=${stickyBar.y}`,
)
expect(
  tasks.y >= benefits.y + benefits.height,
  `任务区不应与福利区重叠：福利区底 ${benefits.y + benefits.height}，任务区顶 ${tasks.y}`,
)

// —— 验收标准：375×812 长页可完整浏览，底部主按钮始终吸底且落在安全区内 ——
const scroll = page.locator('[data-page-scroll]')
const metrics = await scroll.evaluate((el) => ({ scrollHeight: el.scrollHeight, clientHeight: el.clientHeight }))
console.log(`  §4.4 页面可滚动高度=${metrics.scrollHeight} 视口高度=${metrics.clientHeight}`)
await scroll.evaluate((el) => {
  el.scrollTop = el.scrollHeight
})
await page.waitForTimeout(250)
const stickyBottom = await box(STICKY_ACTION)
const tabBar = await box(BOTTOM_NAV)
/**
 * 吸底按钮是 sticky bottom-0，始终钉在滚动容器底部，
 * 因此「不遮挡任务卡」只能在滚到底后比对最后一张任务卡的底边。
 */
const lastTask = await box('section[aria-labelledby="points-tasks-title"] > div:last-child > div:last-child')
console.log(
  `  §4.4 滚到底：末张任务卡 bottom=${lastTask.y + lastTask.height} 吸底按钮 top=${stickyBottom.y} bottom=${stickyBottom.y + stickyBottom.height} 底部导航 top=${tabBar?.y ?? 'none'}`,
)
expect(
  lastTask.y + lastTask.height <= stickyBottom.y + 1,
  `滚到底后末张任务卡不应被吸底按钮遮挡：卡片底 ${lastTask.y + lastTask.height}，按钮顶 ${stickyBottom.y}`,
)
expect(
  stickyBottom.y + stickyBottom.height <= (tabBar?.y ?? 812) + 1,
  '吸底主按钮不应压住底部 Tab 导航',
)
await shot('05-points-tasks-bottom')

// —— 明细页：二级页返回栏 + 无 Tab 导航 + 底部安全区留白 ——
await go('/points/detail')
const detailBackBar = await page.locator('[data-title-bar="back"]').count()
const detailTabBar = await page.locator(BOTTOM_NAV).count()
const lastRow = await box('section[aria-label="泡泡值变动记录"] > div > div:last-child')
console.log(
  `  §4.1 明细页 返回栏=${detailBackBar} 底部Tab=${detailTabBar} 末条记录 bottom=${lastRow.y + lastRow.height}`,
)
expect(detailBackBar === 1, '明细页应由 MobileLayout 提供唯一返回标题栏')
expect(detailTabBar === 0, '明细页为二级页，不应出现底部 Tab 导航')

// —— 明细页不得混入任务、福利或资产营销内容 ——
for (const forbidden of ['泡泡任务', '泡泡福利', '泡泡值兑换', '看明细']) {
  const hit = await page.getByText(forbidden, { exact: false }).count()
  expect(hit === 0, `明细页不应出现「${forbidden}」，实际命中 ${hit} 处`)
}
console.log('  §4.1 明细页未混入任务/福利/资产营销内容')

await page.locator('[data-page-scroll]').evaluate((el) => {
  el.scrollTop = el.scrollHeight
})
await shot('05-points-detail-bottom')

// —— §4.3 澡运占位页：整改为真正不可操作的占位态 ——
for (const path of ['/luck', '/luck?state=drawn']) {
  await go(path)
  const luckTag = await page.getByText('玩法待定').count()
  const luckNote = await page.getByText('澡运玩法与签运档位仍在确认中，当前入口与结果页为占位演示。').isVisible()
  const placeholder = await page.locator('[data-luck-placeholder]').isVisible()
  const placeholderText = await page.locator('[data-luck-placeholder]').innerText()
  const subline = await page.getByText('澡运玩法筹备中，抽签规则确认后再开放。').isVisible()
  console.log(
    `  §4.3 ${path} 占位：标签=${luckTag} 说明=${luckNote} 占位块=${placeholder}「${placeholderText}」副文案=${subline}`,
  )
  expect(luckTag >= 1, `${path} 缺少「玩法待定」占位标签`)
  expect(luckNote, `${path} 缺少占位说明文案`)
  expect(placeholder, `${path} 缺少占位状态块`)
  expect(placeholderText.includes('敬请期待'), `${path} 占位块未给出「敬请期待」状态`)
  expect(subline, `${path} 缺少「玩法筹备中」说明`)

  // 页面内容区不允许存在任何可操作控件（壳层返回按钮在 [data-page-scroll] 之外，不计入）
  const controls = await page.locator('[data-page-scroll]').locator('button, a, [role="button"], input').count()
  const drawCta = await page.getByText(/抽取今日澡运|查看今日澡运结果|立即抽取/).count()
  const resultLinks = await page.locator('[href*="/luck/result"]').count()
  console.log(`  §4.3 ${path} 可操作控件=${controls} 抽取类文案=${drawCta} 结果页链接=${resultLinks}`)
  expect(controls === 0, `${path} 占位态仍存在 ${controls} 个可操作控件`)
  expect(drawCta === 0, `${path} 占位态仍出现抽取入口文案`)
  expect(resultLinks === 0, `${path} 占位态仍存在指向 /luck/result 的链接`)

  // 点击占位块不得跳转结果页
  await page.locator('[data-luck-placeholder]').click()
  await page.waitForTimeout(300)
  const after = new URL(page.url())
  console.log(`  §4.3 ${path} 点击占位块后 URL=${after.pathname}${after.search}`)
  expect(after.pathname === '/luck', `${path} 点击占位块后离开了占位页（${after.pathname}）`)
}
await go('/luck')
await shot('07-luck-placeholder')

// —— #41 /luck/result 仍作为历史节点保留，只能直达 URL，不从占位页进入 ——
await go('/luck/result')
const resultReachable = await page.getByRole('heading', { name: /恭喜你获得 50/ }).isVisible()
console.log(`  §4.3 /luck/result 直达仍可复现（节点 #41）=${resultReachable}`)
expect(resultReachable, '/luck/result 直达失效，会破坏 60 节点台账')

// —— §4.3 泡泡值福利入口与澡运页共用同一份占位文案 ——
await go('/points')
const entryTag = await page
  .locator('section[aria-labelledby="points-benefits-title"] .grid > button')
  .nth(1)
  .innerText()
console.log(`  §4.3 澡运入口文案=${entryTag.replace(/\n/g, ' ')}`)
expect(entryTag.includes('玩法待定'), '澡运入口未标注占位文案')

// —— §4.4 底部主按钮改文案后跳转逻辑保持不变 ——
await go('/points')
await page.getByRole('button', { name: '泡泡值兑换' }).click()
await page.waitForURL(/\/exchange$/)
console.log(`  §4.4 →「泡泡值兑换」: ${new URL(page.url()).pathname}`)

console.log('')
if (problems.length === 0) console.log('T022 汇总：全部检查通过')
else {
  console.log(`控制台/断言问题 ${problems.length} 条:`)
  problems.forEach((item) => console.log(`  ${item}`))
}
if (known.length > 0) console.log(`已知框架噪音（React Router v7 future flag）${known.length} 条，与 T022 无关`)

await browser.close()
process.exit(problems.length === 0 ? 0 : 1)
