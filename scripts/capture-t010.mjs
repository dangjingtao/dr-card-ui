// T010 地址与订单 375×812 验收截图（含表单校验与新增回流交互）
// 用法: BASE_URL=http://localhost:5173 node scripts/capture-t010.mjs
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
page.on('console', (msg) => {
  if (msg.type() === 'error' || msg.type() === 'warning') problems.push(`[${msg.type()}] ${msg.text()}`)
})
page.on('pageerror', (error) => problems.push(`[pageerror] ${error.message}`))

const shot = async (name) => {
  await page.waitForTimeout(250)
  await page.screenshot({ path: join(outDir, `t010-${name}.png`), fullPage: false })
  console.log(`captured t010-${name}`)
}

const go = async (path) => {
  await page.goto(base + path, { waitUntil: 'networkidle' })
  await page.waitForTimeout(200)
}

// —— 节点 #55 地址管理：列表 / 空态 / 切换默认地址 ——
await go('/address')
await shot('55-address-list')

await go('/address?state=empty')
await shot('55-address-empty')

await go('/address')
const beforeDefault = await page.locator('article').first().innerText()
await page.locator('article').nth(1).getByRole('button', { name: /将 .+ 设为默认/ }).click()
await page.waitForTimeout(300)
await shot('55-address-default-toast')
const afterDefault = await page.locator('article').first().innerText()
console.log(`  默认地址置顶: ${beforeDefault.split('\n')[0]} -> ${afterDefault.split('\n')[0]}`)
if (beforeDefault === afterDefault) problems.push('[assert] 切换默认地址后置顶项未变化')

// —— 节点 #60 添加新地址：空表单 / 校验失败 / 粘贴识别提示 / 编辑回填 ——
await go('/address/new')
await shot('60-form-empty')

await go('/address/new?state=invalid')
await shot('60-form-invalid')

await go('/address/new')
await page.getByRole('button', { name: /粘贴/ }).click()
await page.waitForTimeout(250)
await shot('60-form-paste-hint')

await go('/address/new?id=a2')
await shot('60-form-edit')

// —— 新增地址后回流列表：保存 → Toast → 返回 #55 且新地址可见 ——
await go('/address/new')
await page.getByLabel('收货人姓名').fill('周未确认')
await page.getByLabel('手机号码').fill('13900002222')
await page.getByLabel('省市区县-乡镇').selectOption({ index: 1 })
await page.getByLabel(/详细地址|街道楼牌号/).fill('测试路 88 号 T010 验收楼 12F')
await page.getByRole('button', { name: '保存' }).click()
await page.waitForTimeout(300)
await shot('60-form-saved-toast')
await page.waitForURL(/\/address$/, { timeout: 3000 })
await page.waitForTimeout(300)
await shot('55-address-after-add')
const added = await page.getByText('周未确认').count()
console.log(`  新增地址回流列表可见: ${added > 0}`)
if (added === 0) problems.push('[assert] 保存后返回列表未看到新增地址')

// —— 节点 #56 订单管理：四个 Tab + 空态 ——
await go('/orders')
await shot('56-orders-all')
for (const [name, key] of [
  ['56-orders-completed', 'completed'],
  ['56-orders-ongoing', 'ongoing'],
  ['56-orders-aftersale', 'aftersale'],
  ['56-orders-empty', 'empty'],
]) {
  await go(`/orders?state=${key}`)
  await shot(name)
}

// —— 节点 #72 订单详情：常规 / 多商品长地址 / 售后 / 兜底 ——
await go('/orders')
await page.locator('article').first().click()
await page.waitForURL(/\/orders\/o\d+$/)
await shot('72-detail-completed')

await go('/orders/o3')
await shot('72-detail-multi-goods')

await go('/orders/o4')
await shot('72-detail-aftersale')

await go('/orders/none')
await shot('72-detail-fallback')

// —— 入口证据：我的 九宫格「地址管理」/「订单管理」（B-016 已定案卡包不加「使用记录」入口） ——
await go('/profile');                      await shot('entry-profile-grid')
await page.getByRole('button', { name: '订单管理' }).click()
await page.waitForURL(/\/orders$/, { timeout: 3000 }); await shot('entry-profile-to-orders')
await go('/profile')
await page.getByRole('button', { name: '地址管理' }).click()
await page.waitForURL(/\/address$/, { timeout: 3000 }); await shot('entry-profile-to-address')

await browser.close()

console.log(problems.length ? `\n控制台/断言问题 ${problems.length} 条:\n${problems.join('\n')}` : '\n控制台无 error/warning，断言全部通过')
