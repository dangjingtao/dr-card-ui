import { chromium } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const evidenceDir = join(root, 'docs/workbench/evidence')
const shotDir = join(evidenceDir, 'screenshots')
mkdirSync(shotDir, { recursive: true })

const base = process.env.BASE_URL ?? 'http://127.0.0.1:4173'

const BOTTOM_NAV = 'nav[aria-label="主导航"]'
const SCROLL = '[data-page-scroll]'
const SHEET = '/card?state=available&overlay=use&coupon=c1'
const REMOVED_COPY = '出示二维码，由门店扫码完成核销'

const problems = []
const known = []
const checks = []
const shots = []

const record = (id, requirement, ok, detail) => {
  checks.push({ id, requirement, result: ok ? 'PASS' : 'FAIL', detail })
  if (!ok) problems.push(`[${id}] ${requirement} :: ${detail}`)
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1 })

page.on('console', (msg) => {
  if (msg.type() !== 'error' && msg.type() !== 'warning') return
  const text = msg.text()
  if (text.includes('React Router Future Flag Warning')) known.push(text)
  else problems.push(`[${msg.type()}] ${text}`)
})
page.on('pageerror', (error) => problems.push(`[pageerror] ${error.message}`))

const go = async (path) => {
  await page.goto(base + path, { waitUntil: 'networkidle' })
  await page.waitForTimeout(200)
}
const shot = async (name) => {
  await page.waitForTimeout(250)
  const file = `t024-${name}.png`
  await page.screenshot({ path: join(shotDir, file), fullPage: false })
  shots.push(file)
  return file
}
const pathOf = () => new URL(page.url()).pathname
const bodyText = () => page.evaluate(() => document.body.innerText)
const overflowOf = () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)

// ---------- 要点 1：基准视口 375 × 812 ----------
await go('/?newcomer=off')
const viewport = page.viewportSize()
record(
  'R7-01',
  '以 375 × 812 为主要移动端验收尺寸',
  viewport.width === 375 && viewport.height === 812,
  `viewport=${viewport.width}x${viewport.height}`,
)

// ---------- 要点 2：首页保留搜索栏/头像/Banner，金刚区移除 ----------
const homeStructure = await page.evaluate(() => ({
  search: document.querySelectorAll('section[aria-label="搜索与用户入口"]').length,
  searchInput: document.querySelectorAll('input[aria-label="搜索商品"]').length,
  avatar: document.querySelectorAll('button[aria-label="进入卡博士商城"]').length,
  banner: document.querySelectorAll('section[aria-label="首页活动轮播"]').length,
}))
const homeText = await bodyText()
const gridWords = ['淋浴', '洗烘', '饮水', '吹风']
const leakedGrid = gridWords.filter((word) => homeText.includes(word))
record(
  'R7-02a',
  '首页保留搜索栏、头像与 Banner',
  homeStructure.search === 1 && homeStructure.searchInput === 1 && homeStructure.avatar === 1 && homeStructure.banner === 1,
  JSON.stringify(homeStructure),
)
record('R7-02b', '首页金刚区已完整移除', leakedGrid.length === 0, `残留词=${leakedGrid.join(',') || '无'}`)
await shot('01-home-baseline')

// ---------- 要点 3：打卡内容嵌入首页且无重复壳层 ----------
const homeShell = await page.evaluate(() => ({
  statusBars: document.querySelectorAll('[data-mobile-status-bar]').length,
  titleBars: document.querySelectorAll('[data-title-bar]').length,
  backBars: document.querySelectorAll('[data-title-bar="back"]').length,
  navs: document.querySelectorAll('nav[aria-label="主导航"]').length,
  scrolls: document.querySelectorAll('[data-page-scroll]').length,
}))
const boardSections = ['今日签到状态', '当月签到日历', '是日任务', '为你精选']
const boardCounts = {}
for (const label of boardSections) {
  boardCounts[label] = await page.locator(`[aria-label="${label}"]`).count()
}
const boardOk = boardSections.every((label) => boardCounts[label] === 1)
record('R7-03a', '/checkin 内容完整嵌入首页', boardOk, JSON.stringify(boardCounts))
record(
  'R7-03b',
  '首页不出现重复标题栏或重复底部导航',
  homeShell.statusBars === 1 && homeShell.titleBars === 1 && homeShell.backBars === 0 && homeShell.navs === 1 && homeShell.scrolls === 1,
  JSON.stringify(homeShell),
)

// ---------- 要点 4：公益板块与品牌故事排在打卡内容下方 ----------
const order = await page.evaluate(() => {
  const board = document.querySelector('[aria-label="今日签到状态"]')
  const cause = document.querySelector('section[aria-label="公益板块与品牌故事"]')
  if (!board || !cause) return null
  const boardTop = board.getBoundingClientRect().top
  const causeTop = cause.getBoundingClientRect().top
  const text = cause.innerText
  return { boardTop, causeTop, hasCause: text.includes('公益板块'), hasStory: text.includes('品牌故事') }
})
record(
  'R7-04',
  '公益板块与品牌故事正确排列在打卡内容下方',
  Boolean(order) && order.causeTop > order.boardTop && order.hasCause && order.hasStory,
  order ? JSON.stringify(order) : '未找到打卡板或公益板块',
)

const scrollToBottom = async () => {
  await page.evaluate((selector) => {
    const el = document.querySelector(selector)
    if (el) el.scrollTop = el.scrollHeight
  }, SCROLL)
  await page.waitForTimeout(300)
}
await scrollToBottom()
const homeBottom = await page.evaluate((navSelector) => {
  const nav = document.querySelector(navSelector)
  return { navVisible: Boolean(nav) && nav.getBoundingClientRect().bottom > 0, innerHeight: window.innerHeight, navTop: nav ? nav.getBoundingClientRect().top : -1 }
}, BOTTOM_NAV)
record(
  'R2-01',
  '长页滚动后底部导航保持固定可见',
  homeBottom.navVisible && homeBottom.navTop < homeBottom.innerHeight,
  JSON.stringify(homeBottom),
)
await shot('02-home-bottom-cause-story')
record('R2-02', '首页无横向溢出', (await overflowOf()) <= 0, `overflow=${await overflowOf()}`)

// ---------- 要点 5：新人弹窗 1 张 / 2 张 + 确定 / 关闭 ----------
const couponExpect = {
  'coupon-1': ['DearSeed 洗发水体验券'],
  'coupon-2': ['DearSeed 洗发水体验券', '洗护组合体验券'],
}
for (const [stateKey, names] of Object.entries(couponExpect)) {
  await go(`/?state=${stateKey}&overlay=newcomer-coupon`)
  const dialog = page.locator('[role="dialog"]').first()
  const items = page.locator('ul[aria-label="本次赠送的体验券"] > li')
  const count = await items.count()
  const text = await dialog.innerText()
  const nameOk = names.every((name) => text.includes(name))
  const totalOk = new RegExp(`^本次共 ${names.length} 张体验券$`, 'm').test(text)
  record(
    `R7-05a-${stateKey}`,
    `新用户弹窗可演示 ${names.length} 张体验券状态`,
    count === names.length && nameOk && totalOk,
    `li=${count} 名称匹配=${nameOk} 汇总匹配=${totalOk}`,
  )
  await shot(`03-newcomer-${stateKey}`)
}

await go('/?state=coupon-2&overlay=newcomer-coupon')
await page.getByRole('button', { name: '确定' }).click()
await page.waitForTimeout(300)
const successText = await page.locator('[role="dialog"]').first().innerText()
record(
  'R7-05b',
  '新人弹窗确定路径进入领取成功态',
  successText.includes('领取成功'),
  `弹窗文本首行=${successText.split('\n')[0] ?? ''}`,
)
await shot('04-newcomer-success')
await page.getByRole('button', { name: '查看体验券' }).click()
await page.waitForURL(/\/exchange$/, { timeout: 5000 }).catch(() => {})
record('L1-01', '跨卡链路：首页领券 → 体验券', pathOf() === '/exchange', `落地=${pathOf()}`)
await shot('05-link-home-to-exchange')

await go('/?state=coupon-1&overlay=newcomer-coupon')
await page.locator('button[aria-label="关闭新人体验券"]').click()
await page.waitForTimeout(300)
const afterClose = await page.evaluate(() => document.querySelectorAll('[role="dialog"]').length)
record('R7-05c', '新人弹窗关闭路径可关闭且停留首页', afterClose === 0 && pathOf() === '/', `弹窗数=${afterClose} 路径=${pathOf()}`)

// ---------- 弹窗遮罩与安全区抽查 ----------
await go('/?state=coupon-2&overlay=newcomer-coupon')
const scrim = await page.evaluate(() => {
  const host = document.querySelector('[role="presentation"].fixed')
  if (!host) return null
  const rect = host.getBoundingClientRect()
  const style = getComputedStyle(host)
  const dialog = host.querySelector('[role="dialog"]')
  return {
    coversViewport: rect.width >= window.innerWidth && rect.height >= window.innerHeight,
    background: style.backgroundColor,
    ariaModal: dialog?.getAttribute('aria-modal') ?? null,
    dialogWidth: dialog ? dialog.getBoundingClientRect().width : -1,
  }
})
record(
  'R3-01',
  '弹窗遮罩铺满视口且对话框语义正确',
  Boolean(scrim) && scrim.coversViewport && scrim.ariaModal === 'true' && scrim.dialogWidth <= 375,
  scrim ? JSON.stringify(scrim) : '未找到遮罩层',
)

// ---------- 要点 6：泡泡值明细三 Tab + 筛选 + 空态 ----------
await go('/points/detail')
const tabs = page.locator('[role="tablist"] [role="tab"]')
const tabLabels = await tabs.allInnerTexts()
record(
  'R7-06a',
  '泡泡值明细页三个 Tab 可用',
  (await tabs.count()) === 3 && tabLabels.join('/') === '全部/收入/消耗',
  `tabs=${tabLabels.join('/')}`,
)
const rowCount = () => page.locator('section[aria-label="泡泡值变动记录"] > div > div').count()
const allRows = await rowCount()
await tabs.nth(1).click()
await page.waitForTimeout(250)
const incomeRows = await rowCount()
await tabs.nth(2).click()
await page.waitForTimeout(250)
const expenseRows = await rowCount()
record(
  'R7-06b',
  '泡泡值明细列表筛选生效',
  allRows === 15 && incomeRows === 13 && expenseRows === 2,
  `全部=${allRows} 收入=${incomeRows} 消耗=${expenseRows}`,
)
await shot('06-points-detail-expense')
await go('/points/detail?state=empty')
const emptyText = await page.locator('section[aria-label="泡泡值变动记录"]').innerText()
const emptyRows = await rowCount()
record(
  'R7-06c',
  '泡泡值明细空态可用',
  emptyRows === 0 && emptyText.includes('暂时没有更多记录啦'),
  `行数=${emptyRows} 文案命中=${emptyText.includes('暂时没有更多记录啦')}`,
)
await shot('07-points-detail-empty')
const detailShell = await page.evaluate(() => ({
  navs: document.querySelectorAll('nav[aria-label="主导航"]').length,
  backBars: document.querySelectorAll('[data-title-bar="back"]').length,
}))
record(
  'R2-03',
  '泡泡值明细为二级页：有返回栏、无底部导航',
  detailShell.navs === 0 && detailShell.backBars === 1,
  JSON.stringify(detailShell),
)

// ---------- 要点 7：泡泡值页任务占位卡 + 看明细 ----------
await go('/points')
const tasksText = await page.locator('section[aria-labelledby="points-tasks-title"]').innerText()
const taskTitles = ['每日打卡', '连续签到', '观看视频', '邀请好友']
const taskHit = taskTitles.filter((title) => tasksText.includes(title))
const taskInteractive = await page.locator('section[aria-labelledby="points-tasks-title"] button, section[aria-labelledby="points-tasks-title"] a').count()
record(
  'R7-07a',
  '原泡泡值页面展示任务占位卡片',
  taskHit.length === 4 && tasksText.includes('占位') && taskInteractive === 0,
  `命中=${taskHit.length}/4 占位标记=${tasksText.includes('占位')} 交互控件=${taskInteractive}`,
)
await page.getByRole('button', { name: '看明细' }).click()
await page.waitForURL(/\/points\/detail$/, { timeout: 5000 }).catch(() => {})
record('R7-07b', '「看明细」可进入新明细页', pathOf() === '/points/detail', `落地=${pathOf()}`)
record('L2-01', '跨卡链路：泡泡值 → 明细', pathOf() === '/points/detail', `落地=${pathOf()}`)

// ---------- 要点 8：三个福利入口顺序 + 澡运占位可达 ----------
await go('/points')
const benefits = page.locator('section[aria-labelledby="points-benefits-title"] .grid > button')
const benefitLabels = await benefits.allInnerTexts()
const benefitOrder = benefitLabels.map((text) => text.split('\n')[0])
record(
  'R7-08a',
  '泡泡福利入口按「每日签到 / 澡运 / 体验券兑换」排列',
  benefitOrder.join('/') === '每日签到/澡运/体验券兑换',
  `顺序=${benefitOrder.join('/')}`,
)
await shot('08-points-benefits-tasks')
await benefits.nth(1).click()
await page.waitForURL(/\/luck$/, { timeout: 5000 }).catch(() => {})
const luckText = await bodyText()
record(
  'R7-08b',
  '澡运占位可达',
  pathOf() === '/luck' && luckText.includes('敬请期待'),
  `落地=${pathOf()} 占位文案=${luckText.includes('敬请期待')}`,
)

// ---------- 要点 9：主按钮显示「泡泡值兑换」 ----------
await go('/points')
const mainButton = page.getByRole('button', { name: '泡泡值兑换' })
const mainButtonBox = await mainButton.boundingBox()
const mainButtonFixed = await page.evaluate(() => {
  const sticky = document.querySelector('div.sticky.bottom-0')
  if (!sticky) return null
  const rect = sticky.getBoundingClientRect()
  return { visible: rect.bottom <= window.innerHeight + 1 && rect.top < window.innerHeight, position: getComputedStyle(sticky).position }
})
record(
  'R7-09',
  '主按钮显示「泡泡值兑换」并吸底可见',
  (await mainButton.count()) === 1 && Boolean(mainButtonBox) && Boolean(mainButtonFixed) && mainButtonFixed.visible,
  `按钮数=${await mainButton.count()} 吸底=${JSON.stringify(mainButtonFixed)}`,
)
await mainButton.click()
await page.waitForURL(/\/exchange$/, { timeout: 5000 }).catch(() => {})
record('R7-09b', '「泡泡值兑换」进入体验券兑换页', pathOf() === '/exchange', `落地=${pathOf()}`)

// ---------- 要点 10：扫码核销辅助文案已删除且排版无异常 ----------
await go(SHEET)
const sheet = page.locator('[role="dialog"][aria-label="使用体验券"]')
const sheetText = await sheet.innerText()
record('R7-10a', '扫码核销指定辅助文案已删除', !sheetText.includes(REMOVED_COPY), `残留=${sheetText.includes(REMOVED_COPY)}`)
const rowGeometry = await page.evaluate(() => {
  const dialog = document.querySelector('[role="dialog"][aria-label="使用体验券"]')
  if (!dialog) return null
  const rows = [...dialog.querySelectorAll('div.space-y-1 > button')]
  if (rows.length !== 2) return { rows: rows.length }
  const [scan, password] = rows.map((row) => row.getBoundingClientRect())
  return {
    rows: rows.length,
    gap: Math.round(password.top - scan.bottom),
    scanHeight: Math.round(scan.height),
    passwordHeight: Math.round(password.height),
    scanLines: rows[0].innerText.trim().split('\n').length,
  }
})
record(
  'R7-10b',
  '删除文案后核销两项垂直间距紧凑无空洞',
  Boolean(rowGeometry) && rowGeometry.rows === 2 && rowGeometry.gap >= 0 && rowGeometry.gap <= 8 && rowGeometry.scanLines === 1 && rowGeometry.scanHeight <= rowGeometry.passwordHeight,
  rowGeometry ? JSON.stringify(rowGeometry) : '未找到核销行',
)
const sheetSafeArea = await page.evaluate(() => {
  const dialog = document.querySelector('[role="dialog"][aria-label="使用体验券"]')
  if (!dialog) return null
  const rect = dialog.getBoundingClientRect()
  return { bottom: Math.round(rect.bottom), innerHeight: window.innerHeight, paddingBottom: getComputedStyle(dialog).paddingBottom }
})
record(
  'R3-02',
  '使用体验券面板贴合底部并保留安全区内边距',
  Boolean(sheetSafeArea) && Math.abs(sheetSafeArea.bottom - sheetSafeArea.innerHeight) <= 1,
  sheetSafeArea ? JSON.stringify(sheetSafeArea) : '未找到面板',
)
await shot('09-use-sheet-verify-rows')

// ---------- 要点 11 + 链路 3：会员中心与商品信息进入同一 H5 商城占位页 ----------
await sheet.locator('button[aria-label="查看商城体验券商品"]').click()
await page.waitForURL(/\/mall$/, { timeout: 5000 }).catch(() => {})
const goodsMallText = await bodyText()
record(
  'R7-11a',
  '体验券商品信息进入 H5 商城占位页',
  pathOf() === '/mall' && goodsMallText.includes('WebView 边界'),
  `落地=${pathOf()} 边界标记=${goodsMallText.includes('WebView 边界')}`,
)
await shot('10-mall-from-coupon-goods')
await page.goBack()
await page.waitForTimeout(400)
record('L3-01', '跨卡链路：商品信息 → 商城后可返回弹窗', pathOf() === '/card', `返回落地=${pathOf()}`)

await go('/membership')
const membershipText = await bodyText()
record(
  'R7-11b',
  '会员中心直接进入同一 H5 商城占位页',
  pathOf() === '/mall' && membershipText.includes('WebView 边界'),
  `落地=${pathOf()} 边界标记=${membershipText.includes('WebView 边界')}`,
)
await shot('11-mall-from-membership')

const mallStates = [
  ['loading', 'H5 加载中'],
  ['loaded', 'WebView 边界页'],
  ['error', 'H5 加载失败'],
]
for (const [stateKey, marker] of mallStates) {
  await go(`/mall?state=${stateKey}`)
  const text = await bodyText()
  record(`R6-${stateKey}`, `商城边界 ${stateKey} 态可用`, text.includes(marker), `标记「${marker}」命中=${text.includes(marker)}`)
}
await page.getByRole('button', { name: '重试' }).click()
await page.waitForTimeout(400)
const retryText = await bodyText()
record('R6-retry', '商城失败态重试回到已加载态', retryText.includes('WebView 边界页'), `重试后命中=${retryText.includes('WebView 边界页')}`)
await shot('12-mall-error-retry')

// ---------- 直达刷新 ----------
const deepLinks = ['/', '/points', '/points/detail', '/card?state=available&overlay=use&coupon=c1', '/mall?state=error', '/luck']
const deepResults = []
for (const link of deepLinks) {
  await go(link)
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(250)
  const text = await bodyText()
  const bad = text.includes('页面不存在') || text.includes('NodeStub') || text.trim().length === 0
  deepResults.push({ link, path: pathOf(), ok: !bad })
}
const deepOk = deepResults.every((item) => item.ok)
record('R4-01', '关键路径直达刷新不白屏不 404', deepOk, JSON.stringify(deepResults))

// ---------- 窄屏抽查 320 × 480 ----------
await page.setViewportSize({ width: 320, height: 480 })
const narrowPages = ['/?newcomer=off', '/points', '/points/detail', '/mall?state=loaded']
const narrowResults = []
for (const link of narrowPages) {
  await go(link)
  const overflow = await overflowOf()
  const navs = await page.locator(BOTTOM_NAV).count()
  narrowResults.push({ link, overflow, navs })
}
record(
  'R5-01',
  '窄屏 320 × 480 无横向溢出',
  narrowResults.every((item) => item.overflow <= 1),
  JSON.stringify(narrowResults),
)
await go('/?newcomer=off')
await shot('13-home-narrow-320')
await page.setViewportSize({ width: 375, height: 812 })

await browser.close()

const report = {
  task: 'T024',
  generatedAt: new Date().toISOString(),
  base,
  viewport: '375x812',
  narrowViewport: '320x480',
  total: checks.length,
  passed: checks.filter((item) => item.result === 'PASS').length,
  failed: checks.filter((item) => item.result === 'FAIL').length,
  checks,
  screenshots: shots,
  knownConsoleNoise: [...new Set(known)],
  problems,
}
writeFileSync(join(evidenceDir, 't024-results.json'), `${JSON.stringify(report, null, 2)}\n`)

console.log(`T024 验收：${report.passed}/${report.total} 通过，截图 ${shots.length} 张`)
for (const item of checks) {
  console.log(`${item.result === 'PASS' ? '✅' : '❌'} ${item.id} ${item.requirement} — ${item.detail}`)
}
if (known.length) console.log(`\n已知框架噪音 ${new Set(known).size} 类（不计入失败）`)
if (problems.length) {
  console.log(`\n问题清单（${problems.length}）：`)
  for (const item of problems) console.log(` - ${item}`)
}
process.exit(problems.length === 0 ? 0 : 1)
