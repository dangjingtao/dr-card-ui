// T023 体验券核销弹窗与 H5 商城入口 375×812 验收截图与交互断言
// 用法: BASE_URL=http://127.0.0.1:4173 node scripts/capture-t023.mjs
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const outDir = join(root, 'docs/workbench/evidence/screenshots')
mkdirSync(outDir, { recursive: true })

const base = process.env.BASE_URL ?? 'http://127.0.0.1:4173'
const REMOVED_COPY = '出示二维码，由门店扫码完成核销'
const SHEET_URL = '/card?state=available&overlay=use&coupon=c1'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1 })

const problems = []
const known = []
page.on('console', (msg) => {
  if (msg.type() !== 'error' && msg.type() !== 'warning') return
  const text = msg.text()
  if (text.includes('React Router Future Flag Warning')) known.push(text)
  else problems.push(`[${msg.type()}] ${text}`)
})
page.on('pageerror', (error) => problems.push(`[pageerror] ${error.message}`))

const shot = async (name) => {
  await page.waitForTimeout(250)
  await page.screenshot({ path: join(outDir, `t023-${name}.png`), fullPage: false })
  console.log(`captured t023-${name}`)
}

const go = async (path) => {
  await page.goto(base + path, { waitUntil: 'networkidle' })
  await page.waitForTimeout(200)
}

const pathOf = () => new URL(page.url()).pathname
const bodyText = () => page.evaluate(() => document.body.innerText)

const expect = (ok, message) => {
  if (!ok) problems.push(`[assert] ${message}`)
}

const assertNoOverflow = async (label) => {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  console.log(`  ${label} 横向溢出=${overflow}px`)
  expect(overflow <= 0, `${label} 在 375×812 下横向溢出 ${overflow}px`)
}

// —— 弹窗默认态：辅助文案已删除，两个核销入口与关闭按钮均在 ——
await go(SHEET_URL)
const sheetText = await bodyText()
expect(!sheetText.includes(REMOVED_COPY), `弹窗仍出现已删除文案「${REMOVED_COPY}」`)
expect(sheetText.includes('扫码核销'), '弹窗缺少「扫码核销」')
expect(sheetText.includes('消费密码核销'), '弹窗缺少「消费密码核销」')
console.log(`  默认态已删除文案残留=${sheetText.includes(REMOVED_COPY)}`)

// 可访问文本层同样不得残留该文案（aria-label / title 等）
const ariaResidue = await page.evaluate(
  (copy) =>
    Array.from(document.querySelectorAll('[aria-label], [title], [alt]')).filter((node) =>
      [node.getAttribute('aria-label'), node.getAttribute('title'), node.getAttribute('alt')]
        .filter(Boolean)
        .some((value) => value.includes(copy)),
    ).length,
  REMOVED_COPY,
)
console.log(`  可访问文本残留节点=${ariaResidue}（预期 0）`)
expect(ariaResidue === 0, `可访问文本中仍残留「${REMOVED_COPY}」`)

const dialogButtons = (await page.locator('[role="dialog"] button').allInnerTexts()).map((t) =>
  t.replace(/\s+/g, ' ').trim(),
)
console.log(`  弹窗按钮: ${JSON.stringify(dialogButtons.filter(Boolean))}`)
await assertNoOverflow('弹窗默认态')
await shot('54-use-sheet-default')

// —— 商品信息区：整体可点击进入商城占位页，返回后仍回到弹窗 ——
await page.getByRole('button', { name: '查看商城体验券商品' }).click()
await page.waitForURL(/\/mall$/)
console.log(`  商品信息区 → ${pathOf()}`)
await shot('54-goods-to-mall')
await page.goBack()
await page.waitForTimeout(300)
const backSearch = new URL(page.url()).search
console.log(`  商城返回 → ${pathOf()}${backSearch}`)
expect(pathOf() === '/card', `商品区返回应回到 /card，实际 ${pathOf()}`)
expect(backSearch.includes('overlay=use'), `商品区返回应仍在使用弹窗，实际 ${backSearch}`)
await shot('54-goods-back-to-sheet')

// —— 核销控件保持独立：点扫码核销去核销页，不得误跳商城 ——
await go(SHEET_URL)
await page.getByRole('button', { name: /扫码核销/ }).click()
await page.waitForTimeout(350)
console.log(`  扫码核销 → ${pathOf()}`)
expect(pathOf() === '/card/verify', `扫码核销应进入 /card/verify，实际 ${pathOf()}`)
await shot('54-verify-scan-selected')

await go(SHEET_URL)
await page.getByRole('button', { name: /消费密码核销/ }).click()
await page.waitForTimeout(350)
console.log(`  消费密码核销 → ${pathOf()}`)
expect(pathOf() === '/card/verify/password', `消费密码核销应进入 /card/verify/password，实际 ${pathOf()}`)
await shot('54-verify-password-selected')

// —— 关闭按钮独立：关闭只收起弹层，停留在卡包 ——
await go(SHEET_URL)
await page.getByRole('button', { name: '关闭' }).click()
await page.waitForTimeout(300)
const closedDialog = await page.locator('[role="dialog"]').count()
console.log(`  关闭后弹层残留=${closedDialog}（预期 0），落点=${pathOf()}`)
expect(closedDialog === 0, '关闭按钮未收起弹层')
expect(pathOf() === '/card', `关闭按钮不应离开卡包，实际 ${pathOf()}`)

// —— 原会员中心入口统一进入商城：底部 Tab「服务」——
// T021 起首页默认弹出新人体验券，取证一律带 ?newcomer=off 抑制，避免模态遮挡点击
await go('/?newcomer=off')
await page.locator('nav[aria-label="主导航"] button[aria-label="服务"]').click()
await page.waitForURL(/\/mall$/)
console.log(`  底部 Tab「服务」 → ${pathOf()}`)
const tabActive = await page.locator('nav[aria-label="主导航"] [aria-current="page"]').getAttribute('aria-label')
console.log(`  商城页 Tab 高亮=${tabActive}`)
expect(tabActive === '服务', `商城页应高亮「服务」，实际 ${tabActive}`)
await shot('17-mall-from-tab')

// —— 原会员中心入口统一进入商城：首页头像 / 专栏会员空间 / 我的-专属权益 ——
// visit 是实际访问地址，backPath 是返回后预期的 pathname；首页需带 ?newcomer=off 抑制
// T021 的默认新人体验券弹窗（模态会遮挡点击），而 pathOf() 只比较 pathname，故两者分列。
const membershipEntries = [
  ['首页头像', '/?newcomer=off', '/', 'button[aria-label="进入卡博士商城"]'],
  ['专栏-会员空间', '/dearseed', '/dearseed', 'button:has-text("会员空间")'],
  ['我的-专属权益', '/profile', '/profile', 'button:has-text("专属权益")'],
]
for (const [label, visit, backPath, selector] of membershipEntries) {
  await go(visit)
  await page.locator(selector).first().click()
  await page.waitForTimeout(400)
  console.log(`  ${label} → ${pathOf()}`)
  expect(pathOf() === '/mall', `${label} 应进入 /mall，实际 ${pathOf()}`)
  await page.goBack()
  await page.waitForTimeout(300)
  console.log(`  ${label} 返回 → ${pathOf()}`)
  expect(pathOf() === backPath, `${label} 返回应回到 ${backPath}，实际 ${pathOf()}`)
}

// —— 商城占位页三态沿用现有 WebView 边界能力 ——
for (const [key, text] of [
  ['loading', 'H5 加载中'],
  ['loaded', 'WebView 边界'],
  ['error', 'H5 加载失败'],
]) {
  await go(`/mall?state=${key}`)
  const text0 = await bodyText()
  expect(text0.includes(text), `/mall?state=${key} 缺少「${text}」`)
  await assertNoOverflow(`/mall?state=${key}`)
  await shot(`17-mall-${key}`)
}

// —— 失败态重试回到已加载态（边界页既有能力，不新增业务）——
await go('/mall?state=error')
await page.getByRole('button', { name: '重试' }).click()
await page.waitForTimeout(400)
const retried = new URL(page.url()).search
console.log(`  失败态重试 → ${pathOf()}${retried}`)
expect(retried.includes('state=loaded'), `失败态重试应切到 loaded，实际 ${retried}`)
await shot('17-mall-error-retry')

// —— 需求 §6：/membership 直达不再展示原会员中心，最终落在商城占位页 ——
await go('/membership')
await page.waitForTimeout(400)
const legacyText = await bodyText()
console.log(`  /membership 直达落点=${pathOf()}，会员中心内容残留=${legacyText.includes('会员中心')}`)
expect(pathOf() === '/mall', `/membership 应重定向到 /mall，实际 ${pathOf()}`)
expect(legacyText.includes('WebView 边界'), '/membership 重定向后未进入商城占位页')
expect(!legacyText.includes('会员中心'), '/membership 仍展示原会员中心内容')
await shot('17-mall-from-membership')

await browser.close()

console.log(
  problems.length
    ? `\n控制台/断言问题 ${problems.length} 条:\n${problems.join('\n')}`
    : '\n控制台无 error/warning，断言全部通过',
)
if (known.length) console.log(`已知框架噪音（React Router future flag）${known.length} 条，与 T023 无关`)
process.exit(problems.length === 0 ? 0 : 1)
