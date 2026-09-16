// T001 最终事实刷新：五个种籽页面与五项底部 Tab 的可达性/高亮验收。
// 用法：BASE_URL=http://127.0.0.1:5173 node scripts/verify-t001.mjs
import { chromium } from '@playwright/test'

const base = process.env.BASE_URL ?? 'http://127.0.0.1:5173'
const seeds = [
  // 首页带 ?newcomer=off 抑制 T021 的默认新人体验券弹窗，保证 Tab 断言不受模态干扰
  ['首页', '/?newcomer=off', '卡博士'],
  ['泡泡', '/points', '泡泡值余额'],
  ['扫码', '/card/verify', '请将二维码对准扫描框'],
  ['服务', '/mall', '卡博士商城'],
  ['我的', '/profile', '我的'],
]

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 375, height: 812 } })
let failed = 0

await page.goto(`${base}/?newcomer=off`, { waitUntil: 'networkidle' })
const labels = await page.locator('nav[aria-label="主导航"] button').evaluateAll((items) =>
  items.map((item) => item.getAttribute('aria-label')),
)
const expectedLabels = seeds.map(([label]) => label)
const navOk = JSON.stringify(labels) === JSON.stringify(expectedLabels)
if (!navOk) failed++
console.log(`${navOk ? 'PASS' : 'FAIL'} 五项 Tab：${labels.join(' / ')}`)

for (const [label, path, heading] of seeds) {
  await page.goto(base + path, { waitUntil: 'networkidle' })
  const body = await page.textContent('body')
  const active = await page.locator('nav[aria-label="主导航"] [aria-current="page"]').getAttribute('aria-label')
  const ok = Boolean(body?.includes(heading)) && active === label
  if (!ok) failed++
  console.log(`${ok ? 'PASS' : 'FAIL'} ${path} → ${label}（标题=${heading}，高亮=${active}）`)
}

await browser.close()
process.exit(failed === 0 ? 0 : 1)
