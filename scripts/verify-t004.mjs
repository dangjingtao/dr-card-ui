// T004 路由/状态夹具自检：断言关键路由渲染、404、弹层、Tab 高亮与确定性 fixture
// 用法: BASE_URL=http://localhost:5176 node scripts/verify-t004.mjs
import { chromium } from '@playwright/test'

const base = process.env.BASE_URL ?? 'http://127.0.0.1:5173'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 375, height: 812 } })

const cases = [
  // 首页带 ?newcomer=off 抑制 T021 的默认新人体验券弹窗，保证断言的是首页正文而非弹层
  ['/?newcomer=off', '卡博士', '根首页'],
  ['/card', '核心洗发水体验券', '卡包当前实现'],
  ['/exchange', '洗护兑换专区', '兑换语义纠正（非兑换码页）'],
  ['/profile', '热门兑换', '我的当前实现'],
  ['/membership', 'WebView 边界', '原会员中心已重定向到 /mall 商城占位页（T023）'],
  ['/mall?state=error', 'H5 加载失败', 'WebView 边界-错误态'],
  ['/exchange?overlay=redeem', '确认兑换', 'bottom-sheet 弹层可复现'],
  ['/dearseed?overlay=newcomer', '新人弹窗', '专栏 dialog 可复现'],
  ['/luck/result?state=good', '中吉', '隔离签运夹具（显式 state、去随机化）'],
  ['/no-such-page', '页面不存在', '404 捕获'],
  ['/checkin', '本周期签到日历', '深链直达刷新'],
]

let failed = 0
for (const [path, expect, label] of cases) {
  await page.goto(base + path, { waitUntil: 'networkidle' })
  const body = await page.textContent('body')
  const ok = body?.includes(expect) ?? false
  if (!ok) failed++
  console.log(`${ok ? 'PASS' : 'FAIL'} ${path} → 期望「${expect}」(${label})`)
}

// /card/verify 是当前一级「扫码」Tab，应高亮「扫码」。
await page.goto(base + '/card/verify', { waitUntil: 'networkidle' })
const activeTab = await page.textContent('[aria-current="page"]')
const tabOk = activeTab?.includes('扫码') ?? false
if (!tabOk) failed++
console.log(`${tabOk ? 'PASS' : 'FAIL'} /card/verify 高亮「${activeTab?.trim()}」`)

// 旧路由 /draw-success → /luck/result 重定向（消灭死链）
await page.goto(base + '/draw-success', { waitUntil: 'networkidle' })
const redirected = page.url().includes('/luck/result')
if (!redirected) failed++
console.log(`${redirected ? 'PASS' : 'FAIL'} /draw-success 重定向至 /luck/result`)

// 原会员中心 /membership → /mall 重定向（T023，需求 §6：原会员中心改为直接进入 H5 商城）
await page.goto(base + '/membership', { waitUntil: 'networkidle' })
const mallRedirected = new URL(page.url()).pathname === '/mall'
if (!mallRedirected) failed++
console.log(`${mallRedirected ? 'PASS' : 'FAIL'} /membership 重定向至 /mall（落点 ${new URL(page.url()).pathname}）`)

await browser.close()
process.exit(failed === 0 ? 0 : 1)
