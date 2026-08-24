// T011 我的、设置与 APP 引导 375×812 验收截图（覆盖 #19 #20 #59 #61 与修改闭环）
// 用法: BASE_URL=http://127.0.0.1:5175 node scripts/capture-t011.mjs
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
  await page.screenshot({ path: join(outDir, `t011-${name}.png`), fullPage: false })
  console.log(`captured t011-${name}`)
}

const go = async (path) => {
  await page.goto(base + path, { waitUntil: 'networkidle' })
  await page.waitForTimeout(200)
}

const discardDialog = () => page.getByRole('dialog', { name: '放弃修改确认' })
const pathOf = () => new URL(page.url()).pathname + new URL(page.url()).search

/** 从 /profile 经真实入口进入 /settings，保证是 PUSH 导航（POP 拦截的前提） */
const enterSettings = async () => {
  await go('/profile')
  await page.getByRole('button', { name: '编辑资料' }).click()
  await page.waitForURL('**/settings')
  await page.waitForTimeout(200)
}

// —— 节点 #19 我的 ——
await go('/profile')
await shot('19-profile')

// —— #19 全量出口跳转：逐个点真实入口，校验落地 pathname ——
const profileJumps = [
  ['通知', '/notifications'],
  ['用户头像', '/settings'],
  ['编辑资料', '/settings'],
  [/卡包/, '/card'],
  [/泡泡值/, '/points'],
  [/专属权益/, '/membership'],
  ['卡券兑换', '/redeem'],
  ['订单管理', '/orders'],
  ['地址管理', '/address'],
  ['品牌福利官', '/service/welfare-officer'],
  ['客服中心', '/service/chat'],
  ['查看更多', '/exchange'],
]
for (const [name, expected] of profileJumps) {
  await go('/profile')
  await page.getByRole('button', { name }).first().click()
  await page.waitForTimeout(350)
  const landed = new URL(page.url()).pathname
  if (landed !== expected) problems.push(`[assert] 我的-「${name}」应跳 ${expected}，实际 ${landed}`)
  if (name === '通知') await shot('19-notifications-entry')
}

// —— 节点 #20 APP 弹窗：按当前路由夹具直达；「绑定搭子」现已由 T007 接入真实 /buddy ——
await go('/profile?overlay=app-prompt')
await shot('20-app-prompt')
if (!page.url().includes('overlay=app-prompt')) problems.push(`[assert] APP 弹窗未同步 URL: ${pathOf()}`)
await page.getByRole('button', { name: '下载链接' }).click()
await shot('20-app-prompt-download-hint')
await page.getByRole('button', { name: '我知道了' }).click()
await page.waitForTimeout(300)
if (page.url().includes('overlay=')) problems.push(`[assert] 关闭后 URL 未清理: ${pathOf()}`)

// —— 节点 #59 个人设置：默认态 ——
await enterSettings()
await shot('59-settings-default')

// —— #59 编辑态：头像 / 昵称 / 生日 / 消费密码 四个 sheet ——
for (const [label, name] of [
  ['修改头像', '59-sheet-avatar'],
  ['修改昵称', '59-sheet-nickname'],
  ['修改生日', '59-sheet-birthday'],
  ['去设置消费密码', '59-sheet-password'],
]) {
  await page.getByRole('button', { name: label }).first().click()
  await page.waitForTimeout(250)
  await shot(name)
  await page.getByRole('button', { name: '关闭' }).click()
  await page.waitForTimeout(200)
}

// —— #59 消费密码两步与保存成功 Toast ——
await page.getByRole('button', { name: '去设置消费密码' }).click()
await page.getByPlaceholder('请输入 6 位数字密码').fill('123456')
await page.getByRole('button', { name: '下一步' }).click()
await page.waitForTimeout(200)
await shot('59-password-step2')
await page.getByPlaceholder('再次输入 6 位数字密码').fill('123456')
await page.getByRole('button', { name: '完成' }).click()
await page.waitForTimeout(250)
await shot('59-toast-saved')
const bodyAfterPw = await page.evaluate(() => document.body.innerText)
if (!bodyAfterPw.includes('已设置')) problems.push('[assert] 设置消费密码后未变为「已设置」')

// —— 节点 #61 放弃修改：脏数据返回被拦截 ——
await enterSettings()
await page.getByRole('button', { name: '大三', exact: true }).click()
await page.waitForTimeout(150)
await shot('61-dirty-year-selected')
await page.getByRole('button', { name: '返回' }).click()
await page.waitForTimeout(400)
await shot('61-discard-dialog')
if (!(await discardDialog().isVisible())) problems.push('[assert] 脏数据返回未触发放弃修改弹窗')
if (new URL(page.url()).pathname !== '/settings') problems.push(`[assert] 拦截失败已离开设置页: ${pathOf()}`)

// —— #61 继续编辑：留在设置页且修改保留 ——
await discardDialog().getByRole('button', { name: '继续编辑' }).last().click()
await page.waitForTimeout(300)
await shot('61-keep-editing')
const yearClass = await page.getByRole('button', { name: '大三', exact: true }).getAttribute('class')
if (!yearClass.includes('border-primary')) problems.push('[assert] 继续编辑后年级选中态丢失')

// —— #61 确认放弃：应真正离开到 /profile ——
await page.getByRole('button', { name: '返回' }).click()
await page.waitForTimeout(400)
await discardDialog().getByRole('button', { name: '放弃修改', exact: true }).click()
await page.waitForTimeout(700)
await shot('61-discarded-to-profile')
if (new URL(page.url()).pathname !== '/profile') problems.push(`[assert] 确认放弃未离开设置页: ${pathOf()}`)

// —— #59 确认修改：Toast 后回到我的 ——
await enterSettings()
await page.getByRole('button', { name: '大二', exact: true }).click()
await page.getByRole('button', { name: '确认修改' }).first().click()
await page.waitForTimeout(250)
await shot('59-confirm-saved')
await page.waitForTimeout(900)
if (new URL(page.url()).pathname !== '/profile') problems.push(`[assert] 确认修改后未回到我的: ${pathOf()}`)

// —— 夹具直达：?overlay=discard ——
await go('/settings?overlay=discard')
await shot('61-fixture-overlay-discard')
if (!(await discardDialog().isVisible())) problems.push('[assert] ?overlay=discard 直达失效')

await browser.close()

console.log(problems.length ? `\n控制台/断言问题 ${problems.length} 条:\n${problems.join('\n')}` : '\n控制台无 error/warning，断言全部通过')
