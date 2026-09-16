// T006 会员与打卡 375×812 验收截图（含 9 个节点的状态与交互记录）
// 用法: BASE_URL=http://localhost:5173 node scripts/capture-t006.mjs
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
const checkinOnly = process.env.CHECKIN_ONLY === '1'
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
  await page.screenshot({ path: join(outDir, `t006-${name}.png`), fullPage: false })
  console.log(`captured t006-${name}`)
}

const go = async (path) => {
  await page.goto(base + path, { waitUntil: 'networkidle' })
  await page.waitForTimeout(200)
}

const expect = (ok, message) => {
  if (!ok) problems.push(`[assert] ${message}`)
}

if (!checkinOnly) {
/**
 * 节点 #6 会员中心：T023 起 `/membership` 重定向到 /mall 商城占位页（需求 §6），
 * 原会员中心的等级 / 泡泡值余额 / 四入口 / 本期活动断言随之下线，
 * 变更前证据保留在 docs/workbench/evidence/screenshots/t006-06-membership.png。
 * 此处只保留「原路径确实不再展示会员中心」这一条可持续断言。
 */
await go('/membership')
await page.waitForTimeout(400)
const legacyPath = new URL(page.url()).pathname
const legacyText = await page.evaluate(() => document.body.innerText)
console.log(`  #6 /membership 落点=${legacyPath}（T023 起重定向到 /mall）`)
expect(legacyPath === '/mall', `#6 /membership 应重定向到 /mall，实际 ${legacyPath}`)
expect(!legacyText.includes('会员中心'), '#6 /membership 仍展示原会员中心内容')

// —— #6 原「泡泡值余额 → 泡泡值明细」入口随会员中心下线，泡泡值明细断言见下方 #5 ——

// —— 节点 #26 会员等级：T023 后唯一在线入口是诗得丽专栏会员卡「查看等级」——
await go('/dearseed')
await page.getByRole('button', { name: /查看等级/ }).click()
await page.waitForURL(/\/membership\/levels$/)
console.log(`  #26 专栏「查看等级」 → ${new URL(page.url()).pathname}`)

// —— 节点 #26 会员等级：明示原型「仅开会时作展示」，当前等级可定位 ——
const remarkVisible = await page.getByText('本页为会员等级分级，仅开会时作展示。').isVisible()
const levelCount = await page.locator('[data-level]').count()
const currentLevel = await page.locator('[data-level-current="true"]').getAttribute('data-level')
console.log(`  #26 原型备注=${remarkVisible} 等级数=${levelCount} 当前等级=${currentLevel}`)
expect(remarkVisible, '#26 未明示原型备注「本页为会员等级分级，仅开会时作展示。」')
expect(levelCount === 4, `#26 等级数应与夹具一致（4），实际 ${levelCount}`)
expect(currentLevel === 'LV.4', `#26 当前等级应为 LV.4，实际 ${currentLevel}`)
expect(
  (await page.locator('[data-rule-status="member-level"]').count()) === 1,
  '#26 未标注 B-023 权益/升级门槛未确认',
)
await shot('26-membership-levels')

/**
 * 节点 #5 泡泡值。T022 后一分为二：
 * `/points` 保留资产卡 + 泡泡福利 + 任务占位卡，`/points/detail` 才是纯流水明细。
 * 因此余额断言留在 `/points`，全部/收入/消耗/空态断言迁到 `/points/detail`。
 */
await go('/points')
const balance = (await page.getByText('1,280', { exact: true }).first().innerText()).trim()
const taskCards = await page.locator('section[aria-labelledby="points-tasks-title"] > div > div').count()
console.log(`  #5 余额=${balance} 任务占位卡=${taskCards} 张`)
expect(balance === '1,280', `#5 余额应读夹具 1,280，实际 ${balance}`)
expect(taskCards === 4, `#5 任务占位卡应为 4 张，实际 ${taskCards}`)
expect(
  await page.getByRole('button', { name: '泡泡值兑换' }).isVisible(),
  '#5 底部主按钮文案应为「泡泡值兑换」',
)
await shot('05-points-tasks')

// —— #5 交互：三个泡泡福利入口顺序与可达性 ——
const benefitTitles = await page
  .locator('section[aria-labelledby="points-benefits-title"] .grid > button')
  .evaluateAll((nodes) => nodes.map((node) => node.querySelector('span:nth-of-type(2)').textContent.trim()))
console.log(`  #5 泡泡福利入口=${benefitTitles.join(' / ')}`)
expect(
  benefitTitles.join('/') === '每日签到/澡运/体验券兑换',
  `#5 泡泡福利入口顺序应为「每日签到 / 澡运 / 体验券兑换」，实际 ${benefitTitles.join(' / ')}`,
)
for (const [index, [title, pathname]] of [
  ['每日签到', '/checkin'],
  ['澡运', '/luck'],
  ['体验券兑换', '/exchange'],
].entries()) {
  await go('/points')
  await page.locator('section[aria-labelledby="points-benefits-title"] .grid > button').nth(index).click()
  await page.waitForURL(new RegExp(`${pathname}$`))
  console.log(`  #5 →「${title}」: ${new URL(page.url()).pathname}`)
}

// —— #5 交互：资产卡「看明细」→ 纯明细页 ——
await go('/points')
await page.getByRole('button', { name: '看明细' }).click()
await page.waitForURL(/\/points\/detail$/)
console.log(`  #5 →「看明细」: ${new URL(page.url()).pathname}`)

const allRows = await page.locator('section[aria-label="泡泡值变动记录"] > div > div').count()
console.log(`  #5 明细页全部记录=${allRows} 条`)
expect(allRows > 0, '#5 明细页全部态无记录')
await shot('05-points-detail-all')

for (const [key, kind] of [
  ['income', '+'],
  ['expense', '-'],
]) {
  await go(`/points/detail?state=${key}`)
  const signs = await page
    .locator('section[aria-label="泡泡值变动记录"] > div > div span.font-semibold')
    .evaluateAll((nodes) => [...new Set(nodes.map((node) => node.textContent.trim().charAt(0)))])
  console.log(`  #5 ?state=${key} 金额符号集合=${signs.join(',')}`)
  expect(
    signs.length === 1 && signs[0] === kind,
    `#5 ?state=${key} 应只出现「${kind}」记录，实际 ${signs.join(',')}`,
  )
  await shot(`05-points-detail-${key}`)
}

await go('/points/detail?state=empty')
const emptyText = await page.getByText('暂时没有更多记录啦').isVisible()
console.log(`  #5 ?state=empty 空态文案=${emptyText}`)
expect(emptyText, '#5 空态未展示「暂时没有更多记录啦」')
await shot('05-points-detail-empty')
}

// —— 节点 #21 打卡日历：月历 + 已签到/今天/可补签/未到 ——
await go('/checkin')
const cycle = (await page.getByText(/2026\.06\.01/).innerText()).trim()
/** 「今日已签到」的 aria-label 也以「日已签到」结尾，需排除今天避免重复计数 */
const done = await page.locator('[aria-label$="日已签到"]:not([aria-label*="今日"])').count()
const today = await page.locator('[aria-label*="今日已签到"]').count()
const makeup = await page.getByRole('button', { name: /日补签$/ }).count()
const future = await page.locator('[aria-label$="日未到"]').count()
console.log(`  #21 周期=${cycle} 已签到=${done} 今天=${today} 可补签=${makeup} 未到=${future}`)
expect(cycle === '2026.06.01 - 2026.06.30', `#21 活动周期应为夹具值，实际 ${cycle}`)
expect(today === 1, `#21 应只有 1 个「今天」格，实际 ${today}`)
expect(done > 0 && makeup > 0 && future > 0, '#21 月历缺少已签到/可补签/未到中的某一类状态')
expect(done + today + makeup + future === 30, `#21 月历天数应为 30，实际 ${done + today + makeup + future}`)
await shot('21-checkin-calendar')
const dailyTask = page.locator('section[aria-label="是日任务"]')
expect(await dailyTask.isVisible(), '#21 未展示「是日任务」区域')
expect(await dailyTask.getByText('每日打卡', { exact: true }).isVisible(), '#21 是日任务缺少「每日打卡」')
expect(await dailyTask.getByText('已完成', { exact: true }).isVisible(), '#21 每日打卡任务未体现完成状态')
await dailyTask.scrollIntoViewIfNeeded()
await shot('21-checkin-task')
const checkinPicks = page.locator('section[aria-label="为你精选"]')
await checkinPicks.scrollIntoViewIfNeeded()
await shot('21-checkin-picks')

// —— 节点 #8 打卡成功态 ——
await go('/checkin?state=success')
const successVisible = await page.getByRole('button', { name: '查看完整签到状态' }).isVisible()
console.log(`  #8 打卡成功态=${successVisible}`)
expect(successVisible, '#8 ?state=success 未进入打卡成功态')
await shot('08-checkin-success')

// —— 节点 #4 打卡提示弹窗 ——
await go('/checkin?overlay=reminder')
const reminderDialog = await page.getByRole('dialog').isVisible()
const tipsVisible = await page.getByText(/^TIPS：/).isVisible()
console.log(`  #4 提示弹窗=${reminderDialog} TIPS=${tipsVisible}`)
expect(reminderDialog && tipsVisible, '#4 打卡提示弹窗未正确渲染')
await shot('04-checkin-reminder')

// —— 节点 #22 补打卡成功弹窗：由月历「补签」触发 ——
await go('/checkin')
await page.getByRole('button', { name: /日补签$/ }).first().click()
await page.waitForTimeout(200)
const makeupDialog = await page.getByRole('dialog').isVisible()
console.log(`  #22 点「补签」→ 弹窗=${makeupDialog} URL=${page.url().replace(base, '')}`)
expect(makeupDialog, '#22 点击补签未弹出补打卡成功弹窗')
expect(page.url().includes('overlay=make-up-success'), '#22 补签弹窗未写入可复现的 ?overlay=')
await shot('22-checkin-makeup-success')

if (!checkinOnly) {
// —— 节点 #7 今日澡运：T022 整改后为不可操作占位页（无抽取 CTA、不进 /luck/result）——
await go('/luck')
const drawAction = await page.getByRole('button', { name: '抽取今日澡运' }).count()
const luckLinks = await page.locator('a[href*="/luck/result"]').count()
const placeholderBlock = await page.locator('[data-luck-placeholder]').isVisible()
console.log(`  #7 占位态：抽取按钮=${drawAction} 结果页链接=${luckLinks} 占位块=${placeholderBlock}`)
expect(drawAction === 0, '#7 占位期不应保留「抽取今日澡运」按钮')
expect(luckLinks === 0, '#7 占位期不应存在指向 /luck/result 的链接')
expect(placeholderBlock, '#7 缺少「敬请期待」占位状态块')
await shot('07-luck-default')

await go('/luck?state=drawn')
const drawnCta = await page.getByRole('button', { name: '查看今日澡运结果' }).count()
const drawnNote = await page.getByText(/^夹具态：/).isVisible()
console.log(`  #7 ?state=drawn 结果入口=${drawnCta} 未定稿标注=${drawnNote}`)
expect(drawnCta === 0, '#7 ?state=drawn 占位期不应提供结果入口')
expect(drawnNote, '#7 「当天已抽过」缺少未定稿标注（B-003 隔离）')
await shot('07-luck-drawn')

// —— 节点 #41 抽取成功：默认只呈现已确认奖励，三档仅隔离演示 ——
await go('/luck/result')
const rewardVisible = await page.getByRole('heading', { name: /恭喜你获得 50/ }).isVisible()
const isolatedBadgeDefault = await page.getByText(/隔离演示 · 未定稿/).count()
const gradeTextDefault = await page.getByText(/大吉|中吉|小吉/).count()
console.log(
  `  #41 默认: 奖励文案=${rewardVisible} 隔离标识=${isolatedBadgeDefault} 档位名=${gradeTextDefault}`,
)
expect(rewardVisible, '#41 未呈现原型确认的「恭喜你获得 50🫧」')
expect(isolatedBadgeDefault === 0, '#41 默认态不应出现隔离演示标识')
expect(gradeTextDefault === 0, '#41 默认态不应出现未确认的档位名称')
expect((await page.getByRole('button', { name: /再抽一次/ }).count()) === 0, '#41 默认态不应提供重抽按钮')
await shot('41-draw-success')

for (const [key, name] of [
  ['great', '大吉'],
  ['good', '中吉'],
  ['minor', '小吉'],
]) {
  await go(`/luck/result?state=${key}`)
  const badge = await page.getByText(/隔离演示 · 未定稿（B-003）/).isVisible()
  const gradeVisible = await page.getByText(name, { exact: true }).first().isVisible()
  console.log(`  #41 ?state=${key}: 档位=${gradeVisible ? name : '缺失'} 隔离标识=${badge}`)
  expect(gradeVisible, `#41 ?state=${key} 未呈现 ${name}`)
  expect(badge, `#41 ?state=${key} 缺少 B-003 隔离标识`)
  await shot(`41-draw-${key}`)
}

// —— #41 交互：关闭 / 主按钮回首页（T023 起由「返回会员中心」改为「返回首页」）——
await go('/luck/result')
await page.getByRole('button', { name: '返回首页' }).click()
await page.waitForURL(/\/$/)
console.log(`  #41 → 返回首页: ${new URL(page.url()).pathname}`)
}

// —— DebugPanel 可定位性（D-020）：面板只在 ?debug=1 时渲染，正常页面不留调试痕迹 ——
await go('/checkin')
const debugHiddenByDefault = await page.locator('[data-debug-panel]').count()
console.log(`  D-020 /checkin 默认态调试面板=${debugHiddenByDefault}`)
expect(debugHiddenByDefault === 0, '/checkin 未带 ?debug=1 却出现了调试面板')

await go('/checkin?debug=1')
const debugStates = await page.locator('[data-debug-state]').count()
const debugOverlays = await page.locator('[data-debug-overlay]').count()
console.log(`  D-020 /checkin?debug=1 调试入口: states=${debugStates}（含默认） overlays=${debugOverlays}（含关闭）`)
expect(debugStates === 2, `/checkin 调试面板应有「默认 + success」2 个状态胶囊，实际 ${debugStates}`)
expect(debugOverlays === 3, `/checkin 调试面板应有「关闭 + 2 弹层」3 个胶囊，实际 ${debugOverlays}`)
await shot('21-checkin-debug-panel')

await browser.close()

console.log(
  problems.length
    ? `\n控制台/断言问题 ${problems.length} 条:\n${problems.join('\n')}`
    : '\n控制台无 error/warning，断言全部通过',
)
if (known.length) console.log(`已知框架噪音（React Router v7 future flag）${known.length} 条，与 T006 无关`)
