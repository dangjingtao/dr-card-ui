import { chromium } from 'playwright'
import fs from 'node:fs'
const OUT = '/tmp/banner-crop'
fs.mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
const page = await ctx.newPage()
const logs = []
page.on('console', (m) => logs.push(m.type() + ': ' + m.text()))
page.on('pageerror', (e) => logs.push('pageerror: ' + e.message))
await page.goto('https://preview.dr-card-ui.pages.dev/', { waitUntil: 'domcontentloaded', timeout: 60000 })
try { await page.waitForSelector('input[type=search]', { timeout: 20000 }) } catch (err) { logs.push('no-search ' + page.url()) }
await page.waitForTimeout(600)
const diag = await page.evaluate(() => { const btn = document.querySelector('[data-carousel-slide]'); const r = btn ? btn.parentElement.parentElement.getBoundingClientRect() : null; const inp = document.querySelector('input[type=search]'); return { href: location.href, search: inp ? inp.getAttribute('placeholder') : null, slides: document.querySelectorAll('[data-carousel-slide]').length, dots: Array.from(document.querySelectorAll('[data-carousel-dot]')).map((d) => d.getAttribute('data-carousel-dot')), carousel: r ? { x: r.x, y: r.y, w: r.width, h: r.height } : null, bodyBg: getComputedStyle(document.body).backgroundColor, iw: innerWidth, ih: innerHeight, dpr: devicePixelRatio } })
console.log('DIAG ' + JSON.stringify(diag))
await page.screenshot({ path: OUT + '/diag-full.png' })
console.log('LOGS ' + JSON.stringify(logs.slice(0, 20)))
await browser.close()
