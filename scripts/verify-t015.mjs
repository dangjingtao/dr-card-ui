import { chromium } from '@playwright/test'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const outDir = join(root, 'docs/workbench/evidence')
mkdirSync(outDir, { recursive: true })

const base = process.env.BASE_URL ?? 'http://127.0.0.1:4173'
const cases = [
  [2, '/dearseed', '本期活动'], [12, '/dearseed?overlay=newcomer', '见面礼已送达'],
  [13, '/dearseed?overlay=app-guide', '双倍泡泡积分'], [14, '/onboarding', '完善信息'],
  [15, '/claim/success', '领取成功'], [16, '/brand-culture', '品牌文化'],
  [23, '/dearseed?state=claimed', '已领取'], [24, '/onboarding?state=student', '年级'],
  [25, '/onboarding/success', '领取成功'],
  [4, '/checkin?overlay=reminder', '每日打卡'], [5, '/points', '泡泡值余额'],
  [6, '/membership', '会员中心'], [7, '/luck', '今日澡运'],
  [8, '/checkin?state=success', '查看完整签到状态'], [21, '/checkin', '本周期签到日历'],
  [22, '/checkin?overlay=make-up-success', '补打卡成功'], [26, '/membership/levels', '会员等级参考'],
  [41, '/luck/result', '恭喜你获得'],
  [27, '/buddy?state=empty', '还没有洗头搭子'], [28, '/buddy?state=list', '小美'],
  [29, '/buddy/invite', '快来成为我的洗头搭子'], [30, '/buddy/invite/scan?state=no-app', '应用商店H5'],
  [32, '/buddy/invite/phone', '输入手机号'], [33, '/buddy/invite/phone?state=success&phone=13900000000', '发送邀请成功'],
  [34, '/buddy/invite/qrcode?state=saved', '已保存到本地'],
  [35, '/buddy/invite/qrcode?state=link-copied', '链接复制成功'],
  [36, '/buddy/accept', '邀请你成为她的洗头搭子'],
  [17, '/mall?state=loaded', 'WebView 边界'], [18, '/exchange', '洗护兑换专区'],
  [37, '/exchange?state=sort-exchange', '兑换量'], [38, '/exchange?state=sort-points', '泡泡值'],
  [39, '/exchange?overlay=redeem', '确认兑换'], [40, '/exchange/result?product=e1', '兑换成功'],
  [48, '/mall/goods/e1?state=loaded', 'WebView 边界'], [49, '/mall/cart?state=loaded', 'WebView 边界'],
  [54, '/card', '卡包'], [62, '/card?state=available', '可用'], [63, '/card?state=used', '已使用'],
  [64, '/card?state=expired', '已过期'], [65, '/card/share?coupon=c1', '搭子列表'],
  [66, '/card/share?coupon=c1&state=success', '分享成功'], [67, '/card/verify', '请将二维码对准扫描框'],
  [68, '/redeem', '兑换卡券'], [69, '/redeem?state=success', '兑换成功'],
  [55, '/address', '地址管理'], [56, '/orders', '订单管理'], [60, '/address/new', '添加新地址'],
  [72, '/orders/o1', '订单详情'],
  [19, '/profile', '热门兑换'], [20, '/profile?overlay=app-prompt', 'APP使用'],
  [59, '/settings', '资料设置'], [61, '/settings?overlay=discard', '放弃修改'],
  [11, '/notifications', '一键已读'], [42, '/notifications?state=unread', '未读'],
  [43, '/notifications?overlay=clear', '全部标为已读'], [44, '/notifications/n1', '订单核销成功'],
  [57, '/service/welfare-officer', '品牌福利官'], [58, '/service/chat', '智能客服'],
  [70, '/service/chat/human?state=queuing', '正在为您接入人工客服'],
  [71, '/service/chat?overlay=request-human', '企业微信福利官'],
]

const closedNodes = [1, 3, 9, 10, 31, 45, 46, 47, 50, 51, 52, 53]
const uniqueNodes = new Set(cases.map(([node]) => node))
if (cases.length !== 60 || uniqueNodes.size !== 60) {
  throw new Error(`T015 用例必须是 60 个唯一节点，当前 cases=${cases.length}, unique=${uniqueNodes.size}`)
}

const routesSource = readFileSync(join(root, 'src/app/router/routes.ts'), 'utf8')
const registeredNodes = [...routesSource.matchAll(/nodes:\s*\[([^\]]*)\]/g)]
  .flatMap((match) => match[1].match(/\d+/g) ?? [])
  .map(Number)
const leakedClosedNodes = closedNodes.filter((node) => registeredNodes.includes(node))

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1 })
const runtimeErrors = []
page.on('console', (message) => {
  if (message.type() === 'error') runtimeErrors.push(`[console] ${message.text()}`)
})
page.on('pageerror', (error) => runtimeErrors.push(`[pageerror] ${error.message}`))

const results = []
for (const [node, path, marker] of cases) {
  const beforeErrors = runtimeErrors.length
  await page.goto(base + path, { waitUntil: 'networkidle' })
  await page.waitForTimeout(100)
  const result = await page.evaluate((expected) => {
    const text = document.body.innerText
    return {
      markerFound: text.includes(expected),
      placeholder: text.includes('施工中') || text.includes('NodeStub'),
      notFound: text.includes('页面不存在'),
      brokenImages: [...document.images].filter((image) => image.naturalWidth === 0).length,
      statusBars: document.querySelectorAll('[data-mobile-status-bar]').length,
      titleBars: document.querySelectorAll('[data-title-bar]').length,
      tabbars: document.querySelectorAll('nav[aria-label="主导航"]').length,
      overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth,
    }
  }, marker)
  const errors = runtimeErrors.slice(beforeErrors)
  const issues = []
  if (!result.markerFound) issues.push(`缺少标志文案「${marker}」`)
  if (result.placeholder) issues.push('命中施工中占位页')
  if (result.notFound) issues.push('命中 404')
  if (result.brokenImages) issues.push(`坏图 ${result.brokenImages}`)
  if (result.statusBars !== 1) issues.push(`状态栏数量应为 1，实际 ${result.statusBars}`)
  if (result.titleBars > 1) issues.push(`重复标题栏 ${result.titleBars}`)
  if (result.tabbars > 1) issues.push(`重复 Tabbar ${result.tabbars}`)
  if (result.overflow > 1) issues.push(`横向溢出 ${result.overflow}px`)
  if (errors.length) issues.push(`控制台错误 ${errors.length}`)
  results.push({ node, path, marker, ok: issues.length === 0, issues, ...result, errors })
  console.log(`${issues.length ? 'FAIL' : 'PASS'} #${node} ${path}${issues.length ? ` — ${issues.join('；')}` : ''}`)
}

await browser.close()
const failed = results.filter((result) => !result.ok)
const report = {
  generatedAt: new Date().toISOString(), base, viewport: { width: 375, height: 812 },
  summary: { total: results.length, passed: results.length - failed.length, failed: failed.length },
  closedNodes: { expected: closedNodes, leakedIntoRoutes: leakedClosedNodes }, results,
}
writeFileSync(join(outDir, 't015-results.json'), `${JSON.stringify(report, null, 2)}\n`)
console.log(`T015 汇总：${report.summary.passed}/${report.summary.total} 通过；关闭节点偷渡=${leakedClosedNodes.length}`)
process.exit(failed.length === 0 && leakedClosedNodes.length === 0 ? 0 : 1)
