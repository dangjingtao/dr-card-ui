// T005 新人流程 375×812 验收截图（含表单校验与提交闭环交互记录）
// 用法: BASE_URL=http://localhost:5173 node scripts/capture-t005.mjs
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
  await page.screenshot({ path: join(outDir, `t005-${name}.png`), fullPage: false })
  console.log(`captured t005-${name}`)
}

const go = async (path) => {
  await page.goto(base + path, { waitUntil: 'networkidle' })
  await page.waitForTimeout(200)
}

/** 「本期活动」区块主按钮文案，作为两态差异的文字证据 */
const campaignCta = () =>
  page.locator('section', { has: page.getByRole('heading', { name: '本期活动' }) }).getByRole('button').last().innerText()

// —— 节点 #2 专栏的打卡提示入口 ——
// T021 起需求 §2.2 删除了首页金刚区，原「首页卡片 → /dearseed?overlay=reminder」的点击入口
// 随金刚区一并移除；此处改为直连该 overlay，仅验证专栏侧的提示层与关闭出口仍成立。
// 首页与专栏的新入口关系由 T021 取证（capture-t021.mjs）覆盖，本卡不回改 T005 验收结论。
await go('/dearseed?overlay=reminder')
const reminderVisible = await page.getByRole('dialog').isVisible()
if (!reminderVisible) problems.push('[assert] 诗得丽专栏 overlay=reminder 未呈现打卡提示')
await page.getByRole('button', { name: '关闭打卡提示' }).click()
await page.waitForURL(/\/dearseed$/)
await shot('02-dearseed-entry')

// —— 节点 #2 专栏默认态：本期活动「前往领取」 ——
const ctaDefault = (await campaignCta()).replace(/\s+/g, '')
console.log(`  #2 本期活动主按钮: ${ctaDefault}`)
if (ctaDefault !== '前往领取') problems.push(`[assert] #2 主按钮应为「前往领取」，实际 ${ctaDefault}`)
await shot('02-dearseed-default')

// —— 节点 #2 顶部品牌 Banner：使用原始 375×210 比例，整体点击 → 新人弹窗 ——
const heroBanner = page.getByRole('button', { name: '诗得丽产品与活动推荐' })
const heroVisible = await heroBanner.isVisible()
const heroRatio = await heroBanner.locator('img').evaluate((img) => img.getBoundingClientRect().width / img.getBoundingClientRect().height)
console.log(`  #2 品牌 Banner: 可见=${heroVisible} 显示宽高比=${heroRatio.toFixed(3)}`)
if (!heroVisible) problems.push('[assert] #2 未渲染顶部品牌 Banner')
if (Math.abs(heroRatio - 375 / 210) > 0.02) problems.push(`[assert] #2 品牌 Banner 未按原始 375×210 展示，实际宽高比 ${heroRatio}`)
await shot('02-dearseed-banner')

// —— #2 Banner 整体点击 → 新人弹窗（摹客 carouselChart click → A2UYnlovN） ——
await heroBanner.click()
await page.waitForTimeout(200)
const carouselToNewcomer = new URL(page.url()).search.includes('overlay=newcomer')
console.log(`  #2 轮播点击跳转: URL=${new URL(page.url()).search || '（无参数）'}`)
if (!carouselToNewcomer) problems.push('[assert] #2 Banner 点击未打开新人弹窗')
await shot('02-carousel-to-newcomer')

// —— 节点 #2 「为你精选」：双卡横排，价格 200🫧 + 「去兑换」 ——
await go('/dearseed')
const picks = page.locator('section[aria-label="为你精选"]')
await picks.scrollIntoViewIfNeeded()
const pickCards = await picks.locator('[data-dearseed-pick]').count()
const pickCtas = await picks.getByRole('button', { name: '去兑换' }).count()
const pickCost = await picks.getByText('200🫧').first().isVisible()
console.log(`  #2 为你精选: 卡片数=${pickCards} 去兑换按钮=${pickCtas} 价格 200🫧=${pickCost}`)
if (pickCards !== 2) problems.push(`[assert] #2 为你精选应为原型的 2 张卡，实际 ${pickCards}`)
if (pickCtas !== 2) problems.push(`[assert] #2 为你精选应有 2 个「去兑换」按钮，实际 ${pickCtas}`)
if (!pickCost) problems.push('[assert] #2 为你精选缺少原型价格「200🫧」')
await shot('02-home-picks')

// —— #2 「去兑换」→ 兑换专区商品兑换弹窗（摹客 → 2OEnW_WOlm） ——
await picks.getByRole('button', { name: '去兑换' }).first().click()
await page.waitForURL(/\/exchange/)
console.log(`  #2 去兑换跳转: ${new URL(page.url()).pathname}${new URL(page.url()).search}`)
if (!new URL(page.url()).search.includes('overlay=redeem'))
  problems.push('[assert] #2 「去兑换」未打开兑换专区的商品兑换弹窗')
await shot('02-picks-to-redeem')

// —— 节点 #23 领取完专栏状态：主按钮变「已领取」且禁用 ——
await go('/dearseed?state=claimed')
const ctaClaimed = (await campaignCta()).replace(/\s+/g, '')
const claimedDisabled = await page
  .locator('section', { has: page.getByRole('heading', { name: '本期活动' }) })
  .getByRole('button')
  .last()
  .isDisabled()
console.log(`  #23 本期活动主按钮: ${ctaClaimed}（disabled=${claimedDisabled}）`)
if (ctaClaimed !== '已领取') problems.push(`[assert] #23 主按钮应为「已领取」，实际 ${ctaClaimed}`)
if (!claimedDisabled) problems.push('[assert] #23 已领取按钮应为禁用态')
await shot('23-home-claimed')

/** #15/#25 容器形态断言：专栏背景 + 遮罩 + 居中弹窗，且不出现调试文字与返回标题栏 */
const assertOverlayShape = async (node) => {
  const dialog = page.getByRole('dialog')
  const dialogVisible = await dialog.isVisible()
  const homeBehind = await page.getByRole('heading', { name: '本期活动' }).isVisible()
  const backBar = await page.locator('[data-title-bar="back"]').count()
  const debugText = await page.getByText(/fixture：\?from=/).count()
  console.log(
    `  ${node} 容器形态: 弹窗=${dialogVisible} 专栏背景=${homeBehind} 返回标题栏=${backBar} 调试文字=${debugText}`,
  )
  if (!dialogVisible) problems.push(`[assert] ${node} 未渲染居中弹窗（role=dialog）`)
  if (!homeBehind) problems.push(`[assert] ${node} 弹窗背景未呈现专栏内容`)
  if (backBar !== 0) problems.push(`[assert] ${node} 不应出现带返回箭头的标题栏`)
  if (debugText !== 0) problems.push(`[assert] ${node} 用户界面残留 fixture 调试文字`)
}

// —— 节点 #15 领取成功：专栏点「前往领取」→ /claim/success ——
await go('/dearseed')
await page.getByRole('button', { name: '前往领取' }).click()
await page.waitForURL(/\/claim\/success/)
await assertOverlayShape('#15')
await shot('15-claim-success')
// 关闭 → 回首页已领取态（remark：点击关闭回到主页面）
await page.getByRole('dialog').getByRole('button', { name: '关闭' }).click()
await page.waitForURL(/\/dearseed\?state=claimed$/)
const ctaAfterClaim = (await campaignCta()).replace(/\s+/g, '')
console.log(`  #15 关闭后回到专栏主按钮: ${ctaAfterClaim}`)
if (ctaAfterClaim !== '已领取') problems.push(`[assert] #15 关闭后专栏应为已领取态，实际 ${ctaAfterClaim}`)
await shot('15-close-back-home')

// —— 节点 #14 完善信息默认态 ——
await go('/onboarding')
await shot('14-onboarding-default')

// —— 校验：直接提交应出现必填错误且停留原页 ——
await page.getByRole('button', { name: '确认信息' }).click()
await page.waitForTimeout(200)
const nickErr = await page.getByText('请输入昵称').isVisible()
const pinErr = await page.getByText(/请输入 6 位消费密码/).isVisible()
console.log(`  #14 空表单提交校验: 昵称错误=${nickErr} 密码错误=${pinErr} URL=${new URL(page.url()).pathname}`)
if (!nickErr || !pinErr) problems.push('[assert] 空表单提交未给出必填错误提示')
if (new URL(page.url()).pathname !== '/onboarding') problems.push('[assert] 校验未通过却发生了跳转')
await shot('14-validation-error')

// —— 节点 #24 完善信息（学生）：身份选学生后出现年级 2 列网格 ——
await go('/onboarding')
await page.getByRole('radio', { name: '学生' }).click()
await page.waitForTimeout(150)
const gradeCount = await page.getByRole('radiogroup', { name: '年级' }).getByRole('radio').count()
console.log(`  #24 年级选项数: ${gradeCount}`)
if (gradeCount !== 8) problems.push(`[assert] 年级应为 8 项（大一–大五 / 研一–研三），实际 ${gradeCount}`)
await page.getByRole('radio', { name: '大三' }).click()
await shot('24-onboarding-student')

// —— 夹具直达学生态 ——
await go('/onboarding?state=student')
const gradeVisibleByFixture = await page.getByRole('radiogroup', { name: '年级' }).isVisible()
console.log(`  ?state=student 直达学生态: 年级可见=${gradeVisibleByFixture}`)
if (!gradeVisibleByFixture) problems.push('[assert] ?state=student 未展开年级')
await shot('24-state-student')

// —— 表单提交闭环：填齐 → 提交中 → #25 → 关闭回专栏已领取态 ——
await go('/onboarding')
await page.getByRole('radio', { name: '学生' }).click()
await page.getByRole('radio', { name: '大三' }).click()
await page.getByRole('radio', { name: '女' }).click()
await page.locator('#pf-nick').fill('小卡')
await page.locator('#pf-birth').fill('2004-09-01')
await page.getByLabel('6 位消费密码').last().fill('135790')
await shot('14-onboarding-filled')
await page.getByRole('button', { name: /确认信息|提交中/ }).click()
await page.waitForTimeout(150)
const submittingVisible = await page.getByRole('button', { name: '提交中' }).isVisible()
console.log(`  提交中态可见: ${submittingVisible}`)
if (!submittingVisible) problems.push('[assert] 未观察到「提交中」按钮态')
await shot('14-submitting')
await page.waitForURL(/\/onboarding\/success/)
await assertOverlayShape('#25')
await shot('25-onboarding-success')
await page.getByRole('dialog').getByRole('button', { name: '关闭' }).click()
await page.waitForURL(/\/dearseed\?state=claimed$/)
const ctaAfterOnboarding = (await campaignCta()).replace(/\s+/g, '')
console.log(`  #25 关闭后回到专栏主按钮: ${ctaAfterOnboarding}`)
if (ctaAfterOnboarding !== '已领取') problems.push(`[assert] #25 关闭后专栏应为已领取态，实际 ${ctaAfterOnboarding}`)
await shot('25-close-back-home')

// —— 节点 #12 新人弹窗：专栏 + 遮罩 + 居中弹窗，主操作「去完善信息」 ——
await go('/dearseed?overlay=newcomer')
// 摹客真值：标题为「恭喜你！」，「见面礼已送达」在正文话术中
const newcomerTitle = await page.getByRole('dialog').getByRole('heading', { name: '恭喜你！' }).isVisible()
const newcomerDesc = await page.getByRole('dialog').getByText(/见面礼已送达/).isVisible()
const newcomerHomeBehind = await page.getByRole('heading', { name: '本期活动' }).isVisible()
const newcomerStub = await page.getByText(/可复现弹层夹具/).count()
const newcomerCta = await page.getByRole('dialog').getByRole('button', { name: '去完善信息' }).isVisible()
console.log(
  `  #12 新人弹窗: 标题恭喜你=${newcomerTitle} 见面礼已送达话术=${newcomerDesc} 专栏背景=${newcomerHomeBehind} 去完善信息=${newcomerCta} 夹具占位壳=${newcomerStub}`,
)
if (!newcomerTitle) problems.push('[assert] #12 标题应为摹客真值「恭喜你！」')
if (!newcomerDesc) problems.push('[assert] #12 正文未呈现「见面礼已送达」核心话术')
if (!newcomerHomeBehind) problems.push('[assert] #12 弹窗背景未呈现专栏内容')
if (!newcomerCta) problems.push('[assert] #12 缺少「去完善信息」主操作')
if (newcomerStub !== 0) problems.push('[assert] #12 仍在渲染 T004 夹具占位壳')
await shot('12-newcomer')

// —— #12 remark：点击弹窗本身继续查看 APP 下载引导（→ #13） ——
await page.getByRole('dialog').getByRole('heading', { name: '恭喜你！' }).click()
await page.waitForURL(/overlay=app-guide/)
const chainedTips = await page.getByRole('dialog').getByRole('heading', { name: 'TIPS' }).isVisible()
console.log(`  #12 点击弹窗链到 #13: TIPS=${chainedTips} URL=${new URL(page.url()).search}`)
if (!chainedTips) problems.push('[assert] #12 点击弹窗未进入 #13 APP 下载引导')
await shot('12-13-chain-app-guide')

// —— #12 「去完善信息」→ 完善信息页 ——
await go('/dearseed?overlay=newcomer')
await page.getByRole('dialog').getByRole('button', { name: '去完善信息' }).click()
await page.waitForURL(/\/onboarding/)
console.log(`  #12 去完善信息跳转: ${new URL(page.url()).pathname}`)
if (new URL(page.url()).pathname !== '/onboarding') problems.push('[assert] #12 「去完善信息」未跳到完善信息页')
await shot('12-to-onboarding')

// —— 节点 #13 引导弹窗（APP 下载）：TIPS + 双倍泡泡积分文案 + 下载链接 ——
await go('/dearseed?overlay=app-guide')
const guideTips = await page.getByRole('dialog').getByRole('heading', { name: 'TIPS' }).isVisible()
const guideCopy = await page.getByText(/双倍泡泡积分/).isVisible()
const guideStub = await page.getByText(/可复现弹层夹具/).count()
// 摹客「引导弹窗」为单按钮形态：只有「下载链接」，关闭走右上角图标；「我知道了」属 #20 强制版
const guideAck = await page.getByRole('dialog').getByRole('button', { name: '我知道了' }).count()
const guideClose = await page.getByRole('dialog').getByRole('button', { name: '关闭' }).isVisible()
console.log(
  `  #13 引导弹窗: TIPS=${guideTips} 双倍泡泡积分文案=${guideCopy} 右上关闭图标=${guideClose} 我知道了按钮数=${guideAck} 夹具占位壳=${guideStub}`,
)
if (!guideTips) problems.push('[assert] #13 未呈现 TIPS 弹窗标题')
if (!guideCopy) problems.push('[assert] #13 缺少「双倍泡泡积分」文案要点')
if (!guideClose) problems.push('[assert] #13 缺少摹客右上角关闭图标')
if (guideAck !== 0) problems.push('[assert] #13 引导弹窗不应出现 #20 强制版的「我知道了」按钮')
if (guideStub !== 0) problems.push('[assert] #13 仍在渲染 T004 夹具占位壳')
await shot('13-app-guide')

// —— #13 下载链接：地址未确认，只提示未开放（沿用 T011 #20 口径） ——
await page.getByRole('dialog').getByRole('button', { name: '下载链接' }).click()
await page.waitForTimeout(150)
const guideHint = await page.getByRole('status').isVisible()
console.log(`  #13 下载链接提示可见: ${guideHint}`)
if (!guideHint) problems.push('[assert] #13 点击下载链接未给出未开放提示')
await shot('13-download-hint')

// —— #13 右上角关闭图标关闭回专栏（摹客单按钮形态） ——
await page.getByRole('dialog').getByRole('button', { name: '关闭' }).click()
await page.waitForTimeout(200)
const guideClosed = await page.getByRole('dialog').count()
console.log(`  #13 关闭后弹窗数: ${guideClosed} URL=${new URL(page.url()).search || '（无参数）'}`)
if (guideClosed !== 0) problems.push('[assert] #13 右上角关闭图标未关闭弹窗')
await shot('13-close-back-home')

// —— 两档领取成功文案对照（?from= 夹具） ——
await go('/claim/success?from=onboarding')
await shot('15-25-copy-onboarding')
await go('/onboarding/success?from=campaign')
await shot('15-25-copy-campaign')

// —— 节点 #16 品牌文化：只铺原型长图，无浮动 CTA（用户定案） ——
await go('/brand-culture')
const longPage = page.locator('[data-brand-culture-longpage]')
const longPageVisible = await longPage.isVisible()
const stubVisible = await page.getByText(/待施工|占位/).count()
/** 长图须全宽铺满（PageContainer inset={false}，无 px-4 贴边） */
const longPageBox = await longPage.boundingBox()
const fullBleed = longPageBox ? Math.round(longPageBox.width) === 375 && Math.round(longPageBox.x) === 0 : false
/** 原型全页 0 button；页面只应有 MobileLayout 的返回箭头 */
const pageButtons = await page.locator('[data-page-container] button').count()
const backBarOnCulture = await page.locator('[data-title-bar="back"]').count()
console.log(
  `  #16 品牌文化: 长图=${longPageVisible} 全宽铺满=${fullBleed}(w=${longPageBox?.width}) 页内按钮=${pageButtons} 返回栏=${backBarOnCulture} 占位文案=${stubVisible}`,
)
if (!longPageVisible) problems.push('[assert] #16 未渲染品牌文化长图')
if (!fullBleed) problems.push('[assert] #16 长图未全宽铺满（应为 375 且左对齐 0）')
if (stubVisible !== 0) problems.push('[assert] #16 仍在渲染占位页文案')
if (pageButtons !== 0) problems.push(`[assert] #16 原型无任何按钮/浮动 CTA，实际页内按钮 ${pageButtons} 个`)
if (backBarOnCulture !== 1) problems.push('[assert] #16 应由 MobileLayout 提供唯一返回标题栏')
await shot('16-brand-culture-top')

// —— #16 长图滚到底：确认整图可完整浏览、无裁切 ——
await page.locator('[data-page-scroll]').evaluate((el) => {
  el.scrollTop = el.scrollHeight
})
await shot('16-brand-culture-bottom')

// —— #16 返回：走真实入口链路（专栏「品牌文化」入口）后返回专栏 ——
/**
 * 摹客 remark：「点击左上角的返回按钮回到主页面」。
 * 项目返回栏由 MobileLayout/TitleBar 统一提供且为 history back（`navigate(-1)`，全局既有行为、
 * 不在 T005 修改边界内），因此必须从真实入口进入才能取证返回目标；
 * 直接 `page.goto('/brand-culture')` 只会退回脚本上一步的地址，不代表真实链路。
 */
await go('/dearseed')
await page.getByRole('button', { name: '品牌文化' }).click()
await page.waitForURL(/\/brand-culture/)
const enteredCulture = new URL(page.url()).pathname
if (enteredCulture !== '/brand-culture') problems.push(`[assert] #16 专栏入口应进入 /brand-culture，实际 ${enteredCulture}`)
await page.locator('[data-title-bar="back"] button').first().click()
await page.waitForTimeout(300)
const backFromCulture = new URL(page.url()).pathname
console.log(`  #16 入口→返回: /dearseed → ${enteredCulture} → ${backFromCulture}`)
if (backFromCulture !== '/dearseed') problems.push(`[assert] #16 返回应回到诗得丽专栏，实际 ${backFromCulture}`)
await shot('16-brand-culture-back-home')

await browser.close()

console.log(problems.length ? `\n控制台/断言问题 ${problems.length} 条:\n${problems.join('\n')}` : '\n控制台无 error/warning，断言全部通过')
