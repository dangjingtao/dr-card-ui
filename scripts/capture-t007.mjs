// T007 搭子与邀请闭环 375×812 验收截图（9 个节点 + 邀请闭环操作记录 + 失败态）
// 用法: BASE_URL=http://localhost:5173 node scripts/capture-t007.mjs
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
  await page.screenshot({ path: join(outDir, `t007-${name}.png`), fullPage: false })
  console.log(`captured t007-${name}`)
}
const go = async (path) => {
  await page.goto(base + path, { waitUntil: 'networkidle' })
  await page.waitForTimeout(200)
}
const expect = (ok, message) => {
  if (!ok) problems.push(`[assert] ${message}`)
}
const path = () => page.url().replace(base, '')

// —— 节点 #27 搭子（无）——
await go('/buddy?state=empty')
const emptyTitle = await page.getByText('还没有洗头搭子噢～').isVisible()
const emptyRows = await page.locator('section[aria-label="我的洗头搭子"] ul li').count()
const emptyEntries = await page.getByRole('button', { name: /邀请$/ }).count()
console.log(`  #27 空态文案=${emptyTitle} 搭子行=${emptyRows} 邀请入口=${emptyEntries}`)
expect(emptyTitle, '#27 未呈现原型空态文案「还没有洗头搭子噢～」')
expect(emptyRows === 0, `#27 空态不应出现搭子列表，实际 ${emptyRows} 行`)
expect(emptyEntries === 2, `#27 应保留二维码/手机号两个邀请入口，实际 ${emptyEntries}`)
await shot('27-buddy-empty')

// —— 节点 #28 搭子（有）：单搭子 / 多搭子共用业务模型 ——
await go('/buddy?state=list')
const singleRows = await page.locator('section[aria-label="我的洗头搭子"] ul li').count()
const introRows = await page.locator('section[aria-label="搭子功能介绍"] li').count()
console.log(`  #28 单搭子行=${singleRows} 功能介绍条=${introRows}`)
expect(singleRows === 1, `#28 ?state=list 应为 1 个搭子，实际 ${singleRows}`)
expect(introRows === 3, `#28 搭子功能介绍应有 3 条，实际 ${introRows}`)
await shot('28-buddy-single')

await go('/buddy?state=multi')
const multiRows = await page.locator('section[aria-label="我的洗头搭子"] ul li').count()
/** 验收标准：不得出现 #31 默契值入口，也不得偷渡历史 T07 稿的 4 人 mock 数值（B-004 / B-006）*/
const mutualValue = await page.getByText(/默契值/).count()
const legacyMock = await page.getByText(/\b(98|86|72|55)\b/).count()
const nonXiaomei = (await page.locator('section[aria-label="我的洗头搭子"] ul li').allInnerTexts())
  .filter((text) => !text.includes('小美')).length
console.log(
  `  #28 多搭子行=${multiRows} 默契值文案=${mutualValue} 历史数值=${legacyMock} 非小美行=${nonXiaomei}`,
)
expect(multiRows === 4, `#28 ?state=multi 应为 4 个搭子，实际 ${multiRows}`)
expect(mutualValue === 0, '#28 出现了 #31 默契值文案（应进入 T014，本任务不做）')
expect(legacyMock === 0, '#28 出现了历史 T07 稿的默契值数值 mock')
expect(nonXiaomei === 0, '#28 出现了原型之外的搭子昵称（原型 4 行均为「小美」占位）')
await shot('28-buddy-multi')

// —— 节点 #29 邀请搭子（二维码 + 更多分享方式）——
await go('/buddy/invite')
const qrSection = await page.locator('section[aria-label="邀请二维码"]').count()
const inviteCapsule = await page.getByText('快来成为我的洗头搭子吧～').isVisible()
const qrHint = await page.getByText('请截图保存').isVisible()
const shareSection = await page.locator('section[aria-label="更多分享方式"]').count()
const saveBtn = await page.getByRole('button', { name: '保存到本地' }).isVisible()
const copyBtn = await page.getByRole('button', { name: '复制链接' }).isVisible()
console.log(
  `  #29 二维码区=${qrSection} 话术胶囊=${inviteCapsule} 截图提示=${qrHint} 分享区=${shareSection} 保存=${saveBtn} 复制=${copyBtn}`,
)
expect(qrSection === 1 && inviteCapsule && qrHint, '#29 邀请二维码卡缺少原型已确认要素')
expect(shareSection === 1 && saveBtn && copyBtn, '#29 「更多分享方式」缺少保存到本地/复制链接入口')
await shot('29-buddy-invite')

// —— 闭环①「保存到本地」：分享适配层 → #34 成功态，结果写进 URL 可复现 ——
await page.getByRole('button', { name: '保存到本地' }).click()
const posterPendingVisible = await page.getByRole('status').filter({ hasText: '处理中…' }).count()
await page.waitForURL(/\/buddy\/invite\/qrcode\?state=saved/, { timeout: 5000 }).catch(() => {})
console.log(`  闭环① 点「保存到本地」→ 处理中提示=${posterPendingVisible} URL=${path()}`)
expect(posterPendingVisible === 1, '#29 分享操作缺少「处理中…」过程反馈')
expect(path().includes('/buddy/invite/qrcode?state=saved'), `闭环① 未落到 #34 成功态，实际 ${path()}`)

// —— 节点 #34 二维码保存到本地（成功）——
const savedDesc = await page.getByText('已保存到本地，快分享给好友吧！').isVisible()
const savedDialog = await page.getByRole('dialog').isVisible()
console.log(`  #34 成功弹窗=${savedDialog} 文案=${savedDesc}`)
expect(savedDialog && savedDesc, '#34 二维码保存成功反馈未正确渲染')
await shot('34-share-poster-saved')

// —— 节点 #34 失败态（D-056：只由 ?state= 驱动，页面内真实操作恒成功）——
await go('/buddy/invite/qrcode?state=poster-failed')
const posterFailHeading = await page.getByRole('heading', { name: '保存失败', exact: true }).isVisible()
const posterFailText = await page.getByText('海报保存失败，请检查相册权限后重试').isVisible()
console.log(`  #34 失败标题=${posterFailHeading} 失败文案=${posterFailText}`)
expect(posterFailHeading && posterFailText, '#34 海报保存失败态不可复现')
await shot('34-share-poster-failed')

// —— 闭环②「复制链接」→ 节点 #35 生成分享链接 ——
await go('/buddy/invite')
await page.getByRole('button', { name: '复制链接' }).click()
await page.waitForURL(/\/buddy\/invite\/qrcode\?state=link-copied/, { timeout: 5000 }).catch(() => {})
const linkToast = await page.getByRole('status').filter({ hasText: '链接复制成功，快去分享给好友吧！' }).count()
console.log(`  闭环②/#35 点「复制链接」→ URL=${path()} 轻提示=${linkToast}`)
expect(path().includes('/buddy/invite/qrcode?state=link-copied'), `闭环② 未落到 #35，实际 ${path()}`)
expect(linkToast === 1, '#35 复制成功缺少页内轻提示')
await shot('35-share-link-copied')

await go('/buddy/invite/qrcode?state=link-failed')
const linkFailAlert = await page.getByRole('alert').filter({ hasText: '链接复制失败，请稍后重试' }).count()
console.log(`  #35 失败提示=${linkFailAlert}`)
expect(linkFailAlert === 1, '#35 链接复制失败态不可复现')
await shot('35-share-link-failed')

// —— 节点 #32 手机号邀请：空闲 / 未找到 / 已邀请三档确定性结果 ——
await go('/buddy/invite/phone')
const searchSection = await page.locator('section[aria-label="搜索搭子"]').count()
const phoneInput = await page.locator('input[aria-label="输入手机号搜索搭子"]').count()
const idleHint = await page.getByText('输入手机号查找洗头搭子').isVisible()
console.log(`  #32 搜索区=${searchSection} 输入框=${phoneInput} 空闲提示=${idleHint}`)
expect(searchSection === 1 && phoneInput === 1, '#32 缺少搜索表单')
expect(idleHint, '#32 空闲态缺少引导文案')
await shot('32-phone-invite-idle')

await go('/buddy/invite/phone?state=not-found')
const notFound = await page.getByText('没有找到该用户，请核对手机号后重试').isVisible()
console.log(`  #32 未找到=${notFound}`)
expect(notFound, '#32 「未找到」失败态不可复现')
await shot('32-phone-invite-not-found')

await go('/buddy/invite/phone?state=invited')
const invitedHint = await page.getByText('已经向该用户发送过邀请，请等待对方确认').isVisible()
console.log(`  #32 重复邀请=${invitedHint}`)
expect(invitedHint, '#32 重复邀请处理未给出明确提示')
await shot('32-phone-invite-invited')

// —— 闭环③ 手机号搜索 → 发送邀请 → #33 成功 → 回搭子页 → 再搜同号得「已邀请」——
await go('/buddy/invite/phone')
await page.locator('input[aria-label="输入手机号搜索搭子"]').fill('13900000000')
await page.getByRole('button', { name: '搜索' }).click()
const searchingHint = await page.getByRole('status').filter({ hasText: '正在搜索…' }).count()
await page.getByRole('button', { name: '发送邀请' }).waitFor({ timeout: 5000 }).catch(() => {})
const invitableName = await page.getByText('小美').first().isVisible()
console.log(`  闭环③ 搜索中提示=${searchingHint} 可邀请结果=${invitableName}`)
expect(searchingHint === 1, '#32 搜索过程缺少「正在搜索…」反馈')
expect(invitableName, '#32 可邀请结果未渲染')
await shot('32-phone-invite-invitable')

await page.getByRole('button', { name: '发送邀请' }).click()
await page.waitForURL(/\/buddy\/invite\/phone\?state=success/, { timeout: 5000 }).catch(() => {})
const successCapsule = await page.getByRole('heading', { name: '发送邀请成功！', exact: true }).last().isVisible()
const successAction = await page.getByRole('button', { name: '我知道了' }).isVisible()
console.log(`  #33 URL=${path()} 成功文案=${successCapsule} 主操作=${successAction}`)
expect(path().includes('state=success'), `#33 邀请成功未写入可复现 ?state=，实际 ${path()}`)
expect(successCapsule && successAction, '#33 手机号邀请成功弹窗要素缺失')
await shot('33-phone-invite-success')

await page.getByRole('button', { name: '我知道了' }).click()
await page.waitForURL(/\/buddy(\?|$)/, { timeout: 5000 }).catch(() => {})
console.log(`  闭环③ 「我知道了」→ 返回=${path()}`)
expect(/\/buddy(\?|$)/.test(path()), `#33 成功后返回路径不正确，实际 ${path()}`)

await page.getByRole('button', { name: '手机号邀请' }).click()
await page.waitForURL(/\/buddy\/invite\/phone/, { timeout: 5000 }).catch(() => {})
await page.locator('input[aria-label="输入手机号搜索搭子"]').fill('13900000000')
await page.getByRole('button', { name: '搜索' }).click()
await page.getByText('已经向该用户发送过邀请，请等待对方确认').waitFor({ timeout: 5000 }).catch(() => {})
const repeatBlocked = await page.getByText('已经向该用户发送过邀请，请等待对方确认').isVisible()
const repeatSendBtn = await page.getByRole('button', { name: '发送邀请' }).count()
console.log(`  闭环③ 同号二次搜索 → 已邀请=${repeatBlocked} 仍可再次发送=${repeatSendBtn}`)
expect(repeatBlocked, '重复邀请未被拦截：同一号码二次搜索应变为「已邀请」')
expect(repeatSendBtn === 0, '重复邀请仍暴露「发送邀请」按钮')
await shot('32-phone-invite-repeat')

// —— 节点 #30 邀请搭子（没 APP）：D-055 WebView 边界页 + 唤起弹窗两态 ——
await go('/buddy/invite/scan?state=no-app')
const boundary = await page.locator('section[aria-label="应用商店 H5 承接边界"]').count()
const boundaryTitle = await page.getByRole('heading', { name: '应用商店H5' }).isVisible()
const boundaryNote = await page.getByText('外部应用商店承接边界，不伪造商店页面').isVisible()
const fakeStore = await page.getByText(/App Store|安装|下载卡博士/).count()
console.log(`  #30 边界区=${boundary} 标题=${boundaryTitle} 边界标注=${boundaryNote} 伪造商店元素=${fakeStore}`)
expect(boundary === 1 && boundaryTitle, '#30 未按边界页承载「应用商店H5」')
expect(boundaryNote, '#30 缺少显式边界标注（B-005）')
expect(fakeStore === 0, '#30 出现了伪造的应用商店视觉/文案')
await shot('30-scan-no-app')

await go('/buddy/invite/scan?state=has-app')
const hasAppDialog = await page.getByRole('dialog').isVisible()
const openAppBtn = await page.getByRole('button', { name: '打开 APP' }).isVisible()
const cancelBtn = await page.getByRole('button', { name: '取消' }).isVisible()
console.log(`  #30 已装 APP 弹窗=${hasAppDialog} 打开=${openAppBtn} 取消=${cancelBtn}`)
expect(hasAppDialog && openAppBtn && cancelBtn, '#30 已安装 APP 的唤起弹窗要素缺失')
await shot('30-scan-has-app')

await page.getByRole('button', { name: '取消' }).click()
await page.waitForTimeout(200)
console.log(`  #30 取消路径 → URL=${path()} 弹窗=${await page.getByRole('dialog').count()}`)
expect(path().includes('state=no-app'), `#30 取消后应回到边界页，实际 ${path()}`)

await go('/buddy/invite/scan?state=has-app')
await page.getByRole('button', { name: '打开 APP' }).click()
await page.waitForURL(/\/buddy\/accept/, { timeout: 5000 }).catch(() => {})
console.log(`  闭环④ 「打开 APP」→ URL=${path()}`)
expect(path().includes('/buddy/accept'), `#30 「打开 APP」未接到 #36，实际 ${path()}`)

// —— 节点 #36 接受邀请：背景专栏页 + 邀请弹窗 ——
await go('/buddy/accept')
const acceptDialog = await page.getByRole('dialog').isVisible()
const acceptHeading = await page.getByRole('heading', { name: '小美邀请你成为她的洗头搭子' }).isVisible()
const acceptBtn = await page.getByRole('button', { name: '接受邀请' }).isVisible()
const closeIcon = await page.locator('button[aria-label="关闭搭子邀请"]').count()
console.log(`  #36 弹窗=${acceptDialog} 标题=${acceptHeading} 接受=${acceptBtn} 关闭图标=${closeIcon}`)
expect(acceptDialog && acceptHeading && acceptBtn, '#36 接受邀请弹窗要素缺失')
expect(closeIcon === 1, '#36 缺少原型右上角关闭图标（取消路径）')
await shot('36-buddy-accept')

// —— 闭环⑤ 接受邀请 → 回搭子页且已绑定（空态 → 有态）——
await page.getByRole('button', { name: '接受邀请' }).click()
await page.waitForURL(/\/buddy(\?|$)/, { timeout: 5000 }).catch(() => {})
const boundRows = await page.locator('section[aria-label="我的洗头搭子"] ul li').count()
console.log(`  闭环⑤ 接受邀请 → URL=${path()} 搭子行=${boundRows}`)
expect(/\/buddy(\?|$)/.test(path()), `#36 接受后返回路径不正确，实际 ${path()}`)
expect(boundRows === 1, `#36 接受邀请后搭子页未出现已绑定搭子，实际 ${boundRows} 行`)
await shot('36-buddy-accept-bound')

// —— #36 取消路径：关闭图标停留在专栏首页背景上 ——
await go('/buddy/accept?state=dismissed')
const dismissedDialog = await page.getByRole('dialog').count()
console.log(`  #36 ?state=dismissed 弹窗=${dismissedDialog}`)
expect(dismissedDialog === 0, '#36 取消路径仍残留邀请弹窗')
await shot('36-buddy-accept-dismissed')

// —— DebugPanel 可定位性（D-021）：只在 ?debug=1 且路由登记了状态时出现 ——
await go('/buddy')
expect((await page.locator('[data-debug-panel]').count()) === 0, '/buddy 未带 ?debug=1 却出现了调试面板')
await go('/buddy?debug=1')
const buddyStates = await page.locator('[data-debug-state]').count()
expect(buddyStates === 4, `/buddy 应有「默认 + empty + list + multi」4 个状态胶囊，实际 ${buddyStates}`)
await shot('debug-buddy')

await go('/buddy/invite?debug=1')
const invitePanels = await page.locator('[data-debug-panel]').count()
expect(invitePanels === 0, `/buddy/invite 未登记 states，不应出现调试面板，实际 ${invitePanels}`)

await go('/buddy/invite/qrcode?debug=1')
const shareStates = await page.locator('[data-debug-state]').count()
expect(shareStates === 5, `/buddy/invite/qrcode 应有 5 个状态胶囊，实际 ${shareStates}`)

await go('/buddy/invite/phone?debug=1')
const phoneStates = await page.locator('[data-debug-state]').count()
expect(phoneStates === 6, `/buddy/invite/phone 应有 6 个状态胶囊，实际 ${phoneStates}`)

await go('/buddy/invite/scan?debug=1')
const scanStates = await page.locator('[data-debug-state]').count()
expect(scanStates === 3, `/buddy/invite/scan 应有 3 个状态胶囊，实际 ${scanStates}`)

/** #36 自身不挂面板，页面上的唯一面板来自背景层 DearseedColumn（两者都是 fixed bottom-0，会完全重叠）*/
await go('/buddy/accept?debug=1')
const acceptPanels = await page.locator('[data-debug-panel]').count()
expect(acceptPanels === 1, `/buddy/accept 应只有背景层的 1 个调试面板，实际 ${acceptPanels}`)

await browser.close()
console.log(problems.length
  ? `\n控制台/断言问题 ${problems.length} 条:\n${problems.join('\n')}`
  : '\n控制台无 error/warning，断言全部通过')
if (known.length) console.log(`已知框架噪音（React Router v7 future flag）${known.length} 条，与 T007 无关`)
