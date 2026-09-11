/**
 * T046 PRD 检查用独立探针（临时文件，检查完删除）
 *
 * 目的：不复用 capture-t046.mjs 的断言逻辑，独立按 PRD 原文逐条取事实。
 * 只读：不改任何文件、不写证据截图。
 */
import { chromium } from '@playwright/test'

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:5183'
const CHANNEL = process.env.PW_CHANNEL ?? 'chrome'
const R = []
const rec = (id, verdict, detail) => {
  R.push({ id, verdict, detail })
  console.log(`[${verdict}] ${id} :: ${detail}`)
}
const pathOf = (u) => { try { return new URL(u).pathname } catch { return u } }

const browser = await chromium.launch({ channel: CHANNEL })

/* ── 检查 1：未登录访问 `/` 的落点与 query（PRD 矩阵第 2 行） ── */
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } })
  const page = await ctx.newPage()
  await page.goto(`${BASE}/`, { waitUntil: 'load' })
  await page.waitForTimeout(1800)
  const u = new URL(page.url())
  rec('C1 未登录访问 /', u.pathname === '/legacy-profile/login' ? '符合' : '不符合',
    `落点 ${u.pathname}${u.search}；from 参数=${u.searchParams.get('from') ?? '(无)'}`)
  await ctx.close()
}

/* ── 登录动线（后续检查共用） ── */
const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } })
const page = await ctx.newPage()
const http4xx = []
page.on('response', (res) => { if (res.status() >= 400) http4xx.push(`${res.status()} ${res.url()}`) })
await page.goto(`${BASE}/legacy-profile/login`, { waitUntil: 'load' })
await page.waitForTimeout(700)
await page.fill('input[placeholder="请输入手机号"]', '15047757139')
await page.fill('input[placeholder="请输入密码"]', '123456')
await page.click('button[aria-label="同意协议"]')
await page.click('button:has-text("立即登录")')
await page.waitForTimeout(1200)
const later = page.locator('button:has-text("稍后再说")')
if (await later.count()) { await later.first().click(); await page.waitForTimeout(500) }
// SPA 导航进根路由：legacy 三项导航「首页」→ /legacy-home → 专栏大卡片 → /
await page.locator('nav[aria-label="主导航"] button[aria-label="首页"]').click()
await page.waitForTimeout(900)
const toColumn = page.locator('button:has-text("诗得丽品牌专栏")').first()
if (await toColumn.count()) { await toColumn.click(); await page.waitForTimeout(1100) }
const closeIdp = page.locator('button[aria-label="关闭身份选择"]')
if (await closeIdp.count()) { await closeIdp.first().click(); await page.waitForTimeout(400) }
rec('C0 登录后进入 /', pathOf(page.url()) === '/' ? '符合' : '不符合', `落点 ${pathOf(page.url())}`)

/* ── 检查 2：头像锚点唯一性与可见性（PRD 实施要求：增加可见测试锚点） ── */
const anchorCount = await page.locator('[data-dearseed-avatar]').count()
const anchorVisible = anchorCount ? await page.locator('[data-dearseed-avatar]').first().isVisible() : false
rec('C2 头像测试锚点', anchorCount === 1 && anchorVisible ? '符合' : '不符合',
  `[data-dearseed-avatar] 数量=${anchorCount}，可见=${anchorVisible}`)

/* ── 检查 3：首页全页是否残留「进入卡博士商城」入口（PRD：不再出现跳商城） ── */
const mallLabelCount = await page.getByLabel('进入卡博士商城', { exact: true }).count()
rec('C3 商城入口残留', mallLabelCount === 0 ? '符合' : '不符合', `aria-label="进入卡博士商城" 命中 ${mallLabelCount} 处`)

/* ── 检查 4：点击头像 → 目标路由 + 标题栏文案（PRD 矩阵第 1 行） ── */
const before = pathOf(page.url())
await page.locator('[data-dearseed-avatar]').first().click()
await page.waitForTimeout(900)
const after = pathOf(page.url())
let titleText = ''
try { titleText = (await page.locator('header, [role="banner"]').first().innerText()).trim() } catch {}
if (!titleText) {
  const h = await page.locator('body').innerText()
  titleText = h.split('\n').find((l) => l.includes('会员中心')) ?? ''
}
rec('C4 头像跳转目标', after === '/dearseed/membership' ? '符合' : '不符合',
  `${before} → ${after}；目标路由是否 /mall=${after === '/mall'}；标题栏文本≈"${titleText.slice(0, 24)}"`)

/* ── 检查 5：会员中心返回落点（PRD 矩阵第 3 行称应回 /dearseed） ── */
await page.goBack()
await page.waitForTimeout(900)
const closeIdp2 = page.locator('button[aria-label="关闭身份选择"]')
if (await closeIdp2.count()) { await closeIdp2.first().click(); await page.waitForTimeout(400) }
const backTo = pathOf(page.url())
rec('C5 会员中心返回落点', backTo === '/dearseed' ? '符合' : '与 PRD 字面不符',
  `返回落到 ${backTo}；PRD 矩阵写「回 /dearseed」`)

/* ── 检查 6：主壳 /legacy-home 头像基线（PRD 第 3 条称仍指向 Profile 页） ── */
{
  const t2 = await ctx.newPage()
  await t2.goto(`${BASE}/legacy-home`, { waitUntil: 'load' })
  await t2.waitForTimeout(900)
  const shellAnchor = await t2.locator('[data-dearseed-avatar]').count()
  const shellLabel = await t2.getByLabel('进入会员中心', { exact: true }).count()
  let dest = '(未点到)'
  if (shellLabel) {
    await t2.getByLabel('进入会员中心', { exact: true }).first().click()
    await t2.waitForTimeout(800)
    dest = pathOf(t2.url())
  }
  rec('C6 主壳头像基线', dest === '/profile' ? '符合' : '与 PRD 字面不符',
    `/legacy-home 上 [data-dearseed-avatar]=${shellAnchor}；点击后 → ${dest}；PRD 写「仍指向 Profile 页」`)
  await t2.close()
}

/* ── 检查 7：控制台/网络阻塞性错误（PRD 工程门槛：控制台无阻塞性错误） ── */
const noise = http4xx.filter((s) => !s.includes('/favicon.ico'))
rec('C7 控制台/资源错误', noise.length === 0 ? '符合' : '不符合',
  noise.length === 0 ? `无（favicon 404 计 ${http4xx.length - noise.length} 条，已知噪音）` : noise.join(' | '))

await ctx.close()
await browser.close()

console.log('\n=== 汇总 ===')
for (const r of R) console.log(`${r.verdict.padEnd(12)} ${r.id}`)
