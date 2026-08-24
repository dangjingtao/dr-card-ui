// T008 洗护兑换与商城链路 375×812 验收截图（含交互链路记录）
// 用法: BASE_URL=http://localhost:5173 node scripts/capture-t008.mjs
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
  await page.screenshot({ path: join(outDir, `t008-${name}.png`), fullPage: false })
  console.log(`captured t008-${name}`)
}

const go = async (path) => {
  await page.goto(base + path, { waitUntil: 'networkidle' })
  await page.waitForTimeout(200)
}

const assert = (ok, message) => {
  if (!ok) problems.push(`[assert] ${message}`)
}

/**
 * 页面内容作用域。shell（TitleBar/BottomNav）自带 h1 与 aria-label="返回" 的控件，
 * 直接用全局 role 定位会撞 Playwright strict mode，因此页面内交互统一走 main。
 */
const main = () => page.getByRole('main')

/** 商品列表当前渲染顺序，用于验证排序状态真的改变了列表而不只是高亮 Tab */
const productNames = async () => {
  const cards = main().locator('ul[aria-live="polite"] > li')
  const count = await cards.count()
  const names = []
  for (let i = 0; i < count; i += 1) {
    names.push((await cards.nth(i).locator('p').first().innerText()).trim())
  }
  return names
}

// —— #18 洗护兑换专区默认（综合排序）——
await go('/exchange')
await shot('18-exchange-default')

const balance = await main().locator('section').first().innerText()
console.log(`  #18 余额条: ${balance.replace(/\s+/g, ' ')}`)
assert(/1,280/.test(balance), `#18 未渲染原型 §3 的 1280 泡泡值余额: ${balance}`)

const defaultOrder = await productNames()
console.log(`  #18 综合排序: ${defaultOrder.join(' / ')}`)
assert(defaultOrder.length === 5, `#18 商品数量与夹具不一致: ${defaultOrder.length}`)
assert(/DearSeed 洗发水样包/.test(defaultOrder[0]), `#18 首卡未按原型渲染 DearSeed 洗发水样包: ${defaultOrder[0]}`)

// 原型 §1：商品卡需同时给出所需泡泡值与兑换量
const firstCard = (await main().locator('ul[aria-live="polite"] > li').first().innerText()).replace(/\s+/g, ' ')
console.log(`  #18 首卡内容: ${firstCard}`)
for (const field of ['200', '兑换量', '2000+']) {
  assert(firstCard.includes(field), `#18 首卡缺字段「${field}」: ${firstCard}`)
}

// 三个排序维度必须落在同一列表上（原型 §2：排序状态，不是独立业务模块）
const sortTabs = await main().getByRole('tab').count()
console.log(`  #18 排序维度数量: ${sortTabs}`)
assert(sortTabs === 3, `排序维度数量异常: ${sortTabs}`)

// —— #37 兑换量排行 ——
await main().getByRole('tab', { name: '兑换量' }).click()
await page.waitForURL(/state=sort-exchange/)
await shot('37-exchange-sort-redeemed')
const redeemedOrder = await productNames()
console.log(`  #37 兑换量排行: ${redeemedOrder.join(' / ')}`)
assert(
  redeemedOrder.join('|') !== defaultOrder.join('|'),
  `#37 切换兑换量排行后列表顺序未变化: ${redeemedOrder.join(' / ')}`,
)
const redeemedTab = await main().getByRole('tab', { selected: true }).innerText()
assert(/兑换量/.test(redeemedTab), `#37 选中态未同步到兑换量: ${redeemedTab}`)

// —— #38 泡泡值排行 ——
await main().getByRole('tab', { name: '泡泡值' }).click()
await page.waitForURL(/state=sort-points/)
await shot('38-exchange-sort-points')
const pointsOrder = await productNames()
console.log(`  #38 泡泡值排行: ${pointsOrder.join(' / ')}`)
assert(
  pointsOrder.join('|') !== redeemedOrder.join('|'),
  `#38 切换泡泡值排行后列表顺序未变化: ${pointsOrder.join(' / ')}`,
)
const pointsTab = await main().getByRole('tab', { selected: true }).innerText()
assert(/泡泡值/.test(pointsTab), `#38 选中态未同步到泡泡值: ${pointsTab}`)

// 回到综合：URL 去掉 state，列表恢复夹具声明顺序
await main().getByRole('tab', { name: '综合' }).click()
await page.waitForURL((url) => !/state=/.test(url.search))
const backOrder = await productNames()
console.log(`  综合排序回归: ${backOrder.join(' / ')}`)
assert(backOrder.join('|') === defaultOrder.join('|'), `回到综合后列表未恢复: ${backOrder.join(' / ')}`)

// —— 搜索：命中 + 空态 ——
await main().getByRole('searchbox').fill('洗发')
await page.waitForTimeout(200)
const hit = await productNames()
console.log(`  搜索「洗发」命中 ${hit.length} 件: ${hit.join(' / ')}`)
assert(hit.length > 0 && hit.length < defaultOrder.length, `搜索未生效或未过滤: ${hit.length}`)
// 夹具 exchangeSearch 的检索范围是「商品名 + 商品说明」，
// 而商品卡只渲染名称 / 泡泡值 / 兑换量，商品说明只出现在 #39 弹窗里，
// 所以这里按夹具语义断言预期命中集合：
// 「洗护体验样包」靠商品说明「洗发水 / 护发素 / 沐浴露 体验装」命中，卡面上看不到关键词。
const expectedHit = ['DearSeed 洗发水样包', '洗护体验样包', '核心洗发水体验券', '洗发试用装']
assert(
  hit.join('|') === expectedHit.join('|'),
  `搜索命中集合与夹具语义不一致: ${hit.join(' / ')}`,
)
await shot('18-exchange-search-hit')

await main().getByRole('searchbox').fill('不存在的商品')
await page.waitForTimeout(200)
const emptyTitle = await main().getByText('没有找到相关商品').count()
console.log(`  搜索空态标题: ${emptyTitle}`)
assert(emptyTitle === 1, `搜索空态未渲染: ${emptyTitle}`)
await shot('18-exchange-search-empty')

// 清空搜索恢复全量
await main().getByRole('button', { name: '清空搜索' }).click()
await page.waitForTimeout(200)
const restored = await productNames()
console.log(`  清空搜索后恢复 ${restored.length} 件`)
assert(restored.length === defaultOrder.length, `清空搜索未恢复全量: ${restored.length}`)

// —— #39 兑换确认弹窗：可兑换 ——
await go('/exchange?overlay=redeem&product=e1')
const sheet = page.getByRole('dialog', { name: '确认兑换' })
assert(await sheet.isVisible(), '#39 兑换确认弹窗未渲染')
const sheetText = (await sheet.innerText()).replace(/\s+/g, ' ')
console.log(`  #39 弹窗内容: ${sheetText}`)
// 原型 §3：商品图名 / x1 / 商品说明 / 所需泡泡值 / 「立即兑换」
for (const field of ['DearSeed 洗发水样包', 'x1', '200', '立即兑换']) {
  assert(sheetText.includes(field), `#39 弹窗缺字段「${field}」: ${sheetText}`)
}
const redeemable = await sheet.getByRole('button', { name: '立即兑换' }).isEnabled()
console.log(`  #39 可兑换商品提交按钮 enabled=${redeemable}`)
assert(redeemable, '#39 可兑换商品的提交按钮被禁用')
await shot('39-redeem-sheet')

// —— #39 余额不足：e5 需 1500 泡泡值 > 1280 余额 ——
await go('/exchange?overlay=redeem&product=e5')
const lowText = (await page.getByRole('dialog', { name: '确认兑换' }).innerText()).replace(/\s+/g, ' ')
console.log(`  #39 余额不足弹窗: ${lowText}`)
assert(lowText.includes('泡泡值不足'), `余额不足态未提示: ${lowText}`)
const lowDisabled = await page.getByRole('dialog').getByRole('button', { name: '泡泡值不足' }).isDisabled()
console.log(`  #39 余额不足提交按钮 disabled=${lowDisabled}`)
assert(lowDisabled, '余额不足时提交按钮未禁用')
await shot('39-redeem-insufficient')

// —— #39 已售罄：e4 stock=sold-out ——
await go('/exchange?overlay=redeem&product=e4')
const soldText = (await page.getByRole('dialog', { name: '确认兑换' }).innerText()).replace(/\s+/g, ' ')
console.log(`  #39 售罄弹窗: ${soldText}`)
assert(soldText.includes('已售罄'), `售罄态未提示: ${soldText}`)
const soldDisabled = await page.getByRole('dialog').getByRole('button', { name: '已售罄' }).isDisabled()
console.log(`  #39 售罄提交按钮 disabled=${soldDisabled}`)
assert(soldDisabled, '售罄时提交按钮未禁用')
await shot('39-redeem-sold-out')

// 列表态也要能看出售罄与余额不足，不能只在弹窗里体现
await go('/exchange?state=sort-points')
const listText = (await main().locator('ul[aria-live="polite"]').innerText()).replace(/\s+/g, ' ')
assert(listText.includes('已售罄'), `列表未标记售罄商品: ${listText}`)
assert(listText.includes('泡泡值不足'), `列表未标记余额不足商品: ${listText}`)
await shot('18-exchange-list-badges')

// —— #40 成功存入卡包：从弹窗提交走完整链路 ——
await go('/exchange?overlay=redeem&product=e1')
await page.getByRole('dialog').getByRole('button', { name: '立即兑换' }).click()
await page.waitForTimeout(200)
await shot('39-redeem-submitting')
await page.waitForURL(/\/exchange\/result/, { timeout: 3000 })
await shot('40-exchange-result')
const successText = (await page.getByRole('dialog').innerText()).replace(/\s+/g, ' ')
console.log(`  #40 成功弹窗: ${successText}`)
assert(successText.includes('兑换成功，卡券已经存入你的卡包啦～'), `#40 成功文案未按原型渲染: ${successText}`)
assert(successText.includes('查看我的卡包'), `#40 缺少「查看我的卡包」入口: ${successText}`)

// 原型 §4：「查看我的卡包」进入卡包
await page.getByRole('dialog').getByRole('button', { name: '查看我的卡包' }).click()
await page.waitForURL(/\/card/, { timeout: 3000 })
console.log(`  #40 查看我的卡包 → ${new URL(page.url()).pathname}`)

// 原型 §4：关闭回到洗护兑换专区
await go('/exchange/result?product=e1')
await page.getByRole('dialog').getByRole('button', { name: '关闭' }).click()
await page.waitForURL((url) => url.pathname === '/exchange', { timeout: 3000 })
console.log(`  #40 关闭 → ${new URL(page.url()).pathname}`)

// —— #17 / #48 / #49 H5 商城 WebView 边界三态 ——
for (const [path, name] of [
  ['/mall', '17-mall-webview'],
  ['/mall?state=loading', '17-mall-webview-loading'],
  ['/mall?state=error', '17-mall-webview-error'],
  ['/mall/goods/1001', '48-goods-webview'],
  ['/mall/cart', '49-cart-webview'],
]) {
  await go(path)
  await shot(name)
}
const boundaryText = (await main().innerText()).replace(/\s+/g, ' ')
console.log(`  #49 购物车边界页: ${boundaryText.slice(0, 120)}`)
assert(/WebView/.test(boundaryText), `#49 未表达 WebView 边界: ${boundaryText}`)

// —— 调试面板：仅 ?debug=1 出现；胶囊来自 routes.ts 登记的 states/overlays ——
await go('/exchange')
const panelWithoutFlag = await main().locator('[data-debug-panel]').count()
console.log(`  正常页面（无 debug=1）调试面板数量: ${panelWithoutFlag}`)
assert(panelWithoutFlag === 0, `未带 debug=1 时仍渲染调试面板: ${panelWithoutFlag}`)

await go('/exchange?debug=1')
const panelVisible = await main().locator('[data-debug-panel-body]').isVisible()
console.log(`  带 debug=1 后调试面板展开: ${panelVisible}`)
assert(panelVisible, '带 debug=1 后未渲染调试面板')
await shot('debug-panel-exchange')

const stateChips = await main().locator('[data-debug-state]').count()
const overlayChips = await main().locator('[data-debug-overlay]').count()
console.log(`  调试面板 /exchange：状态胶囊 ${stateChips} 个（含「默认」）、弹层胶囊 ${overlayChips} 个（含「关闭」）`)
assert(stateChips === 3, `兑换专区状态胶囊数量异常: ${stateChips}`)
assert(overlayChips === 2, `兑换专区弹层胶囊数量异常: ${overlayChips}`)

await main().locator('[data-debug-state="sort-exchange"]').click()
await page.waitForURL(/state=sort-exchange/)
const panelSortUrl = page.url()
console.log(`  调试面板切到 sort-exchange 后 URL: ${panelSortUrl.replace(base, '')}`)
assert(/debug=1/.test(panelSortUrl), `切换状态后丢失 debug=1: ${panelSortUrl}`)
const panelSortTab = await main().getByRole('tab', { selected: true }).innerText()
console.log(`  调试面板切到 sort-exchange 后选中 Tab: ${panelSortTab.replace(/\s+/g, ' ')}`)
assert(/兑换量/.test(panelSortTab), `面板切换状态未同步 Tab: ${panelSortTab}`)
await shot('debug-panel-exchange-sort')

await main().locator('[data-debug-overlay="redeem"]').click()
await page.waitForURL(/overlay=redeem/)
const panelSheetVisible = await page.getByRole('dialog', { name: '确认兑换' }).isVisible()
console.log(`  调试面板打开「商品兑换弹窗」: ${panelSheetVisible}`)
assert(panelSheetVisible, '面板切换弹层后未渲染兑换确认弹窗')
assert(/debug=1/.test(page.url()), `切换弹层后丢失 debug=1: ${page.url()}`)
await shot('debug-panel-exchange-overlay')

// WebView 边界页同样受 ?debug=1 约束
await go('/mall')
const mallPanelWithoutFlag = await main().locator('[data-debug-panel]').count()
assert(mallPanelWithoutFlag === 0, `商城边界页未带 debug=1 时仍渲染调试面板: ${mallPanelWithoutFlag}`)
await go('/mall?debug=1')
assert(await main().locator('[data-debug-panel-body]').isVisible(), '商城边界页带 debug=1 后未渲染调试面板')
await shot('debug-panel-mall')

await browser.close()

console.log(
  problems.length
    ? `\n控制台/断言问题 ${problems.length} 条:\n${problems.join('\n')}`
    : '\n控制台无 error，断言全部通过',
)
if (known.length) console.log(`已知既有 Router warning（React Router v7 future flag）${known.length} 条，与 T008 无关`)
