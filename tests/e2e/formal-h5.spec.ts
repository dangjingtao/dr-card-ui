import { expect, test, type Page } from '@playwright/test'
import { ACTIVE_FORMAL_H5_ROUTES } from '../../src/app/router/routeScope'

const staticFormalRoutes = ACTIVE_FORMAL_H5_ROUTES
  .filter((route) => !route.path.includes(':'))
  .map((route) => ({ path: route.path, title: route.title }))
  .sort((a, b) => a.path.localeCompare(b.path))

function routeUrl(path: string) {
  return path === '/' ? '/?newcomer=off' : path
}

function collectRuntimeErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`)
  })
  return errors
}

async function waitForRouteReadiness(page: Page) {
  const routeFrame = page.locator('[data-h5-route-active="true"]')
  await expect(routeFrame).toBeVisible()
  await page.evaluate(async () => {
    await document.fonts.ready
  })
  await expect
    .poll(
      () =>
        page.locator('img:visible').evaluateAll((nodes) =>
          nodes.every((node) => (node as HTMLImageElement).complete),
        ),
      { message: 'visible images did not settle before route health checks', timeout: 5_000 },
    )
    .toBe(true)
}

async function expectHealthyFormalRoute(page: Page) {
  await waitForRouteReadiness(page)

  const overflow = await page.locator('[data-page-scroll]').evaluate((node) => {
    const element = node as HTMLElement
    return {
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
    }
  })
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1)

  const brokenImages = await page.locator('img:visible').evaluateAll((nodes) =>
    nodes.flatMap((node) => {
      const image = node as HTMLImageElement
      if (!image.currentSrc && !image.src) return []
      return image.complete && image.naturalWidth === 0
        ? [image.currentSrc || image.src]
        : []
    }),
  )
  expect(brokenImages, `broken visible image(s): ${brokenImages.join(', ')}`).toEqual([])
}

test.describe('@formal-h5 active route smoke', () => {
  for (const route of staticFormalRoutes) {
    test(`${route.path} · ${route.title}`, async ({ page }) => {
      const runtimeErrors = collectRuntimeErrors(page)

      await page.goto(routeUrl(route.path), { waitUntil: 'domcontentloaded' })
      await expectHealthyFormalRoute(page)

      expect(runtimeErrors, runtimeErrors.join('\n')).toEqual([])
    })
  }
})

test('@formal-h5 first-level tab uses CSS fade without root snapshot', async ({ page }) => {
  const runtimeErrors = collectRuntimeErrors(page)

  await page.goto('/?newcomer=off', { waitUntil: 'domcontentloaded' })
  await expectHealthyFormalRoute(page)

  const rootTransitionName = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('view-transition-name').trim(),
  )
  expect(rootTransitionName).toBe('none')

  await page.getByRole('button', { name: '泡泡' }).click()
  await expect(page).toHaveURL(/\/points$/)
  const routeFrame = page.locator('[data-h5-route-active="true"]')
  await expect(routeFrame).toHaveAttribute('data-h5-route-transition', 'tab')
  await expectHealthyFormalRoute(page)

  expect(runtimeErrors, runtimeErrors.join('\n')).toEqual([])
})

test('@formal-h5 @business profile notification navigation remains inside formal H5', async ({ page }) => {
  const runtimeErrors = collectRuntimeErrors(page)

  await page.goto('/profile', { waitUntil: 'domcontentloaded' })
  await expectHealthyFormalRoute(page)

  await page.getByRole('button', { name: '通知' }).click()
  await expect(page).toHaveURL(/\/notifications$/)
  await expectHealthyFormalRoute(page)

  await page.goBack()
  await expect(page).toHaveURL(/\/profile$/)
  await expectHealthyFormalRoute(page)

  expect(runtimeErrors, runtimeErrors.join('\n')).toEqual([])
})


test('@formal-h5 H021 active routes render as pure pages without simulated top shell', async ({ page }) => {
  const runtimeErrors = collectRuntimeErrors(page)

  for (const path of ['/?newcomer=off', '/notifications']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' })
    await expectHealthyFormalRoute(page)
    await expect(page.locator('[data-mobile-status-bar]')).toHaveCount(0)
    await expect(page.locator('[data-title-bar]')).toHaveCount(0)
  }

  expect(runtimeErrors, runtimeErrors.join('\n')).toEqual([])
})

test('@formal-h5 H021 page-local actions survive shell removal', async ({ page }) => {
  const runtimeErrors = collectRuntimeErrors(page)

  await page.goto('/notifications', { waitUntil: 'domcontentloaded' })
  await expectHealthyFormalRoute(page)
  await expect(page.getByRole('button', { name: /一键已读|全部已读/ })).toBeVisible()

  await page.goto('/service/chat', { waitUntil: 'domcontentloaded' })
  await expectHealthyFormalRoute(page)
  await expect(page.locator('[data-chat-wecom-entry]')).toBeVisible()

  expect(runtimeErrors, runtimeErrors.join('\n')).toEqual([])
})


test('@formal-h5 H021 active formal H5 fills a wide WebView', async ({ page }) => {
  const runtimeErrors = collectRuntimeErrors(page)

  await page.setViewportSize({ width: 900, height: 800 })
  await page.goto('/?newcomer=off', { waitUntil: 'domcontentloaded' })
  await expectHealthyFormalRoute(page)

  const widths = await page.evaluate(() => {
    const scroll = document.querySelector('[data-page-scroll]') as HTMLElement | null
    const container = document.querySelector('[data-page-container]') as HTMLElement | null
    const nav = document.querySelector('nav[aria-label="主导航"]') as HTMLElement | null
    if (!scroll || !container || !nav) throw new Error('H021 wide-layout evidence nodes missing')
    return {
      scroll: scroll.getBoundingClientRect().width,
      container: container.getBoundingClientRect().width,
      nav: nav.getBoundingClientRect().width,
    }
  })

  expect(Math.abs(widths.container - widths.scroll)).toBeLessThanOrEqual(1)
  expect(Math.abs(widths.nav - widths.scroll)).toBeLessThanOrEqual(1)
  expect(widths.container).toBeGreaterThan(480)

  expect(runtimeErrors, runtimeErrors.join('\n')).toEqual([])
})

test('@formal-h5 H021 page back stays reachable while content scrolls', async ({ page }) => {
  const runtimeErrors = collectRuntimeErrors(page)

  await page.goto('/dearseed?picker=off', { waitUntil: 'domcontentloaded' })
  await expectHealthyFormalRoute(page)
  await page.getByRole('button', { name: '品牌文化' }).click()
  await expect(page).toHaveURL(/\/brand-culture$/)
  await expectHealthyFormalRoute(page)

  const back = page.locator('[data-h5-back]')
  await expect(back).toBeVisible()
  const before = await back.boundingBox()

  await page.locator('[data-page-scroll]').evaluate((node) => {
    ;(node as HTMLElement).scrollTop = 700
  })
  await expect
    .poll(() => page.locator('[data-page-scroll]').evaluate((node) => (node as HTMLElement).scrollTop))
    .toBeGreaterThan(0)

  await expect(back).toBeVisible()
  const after = await back.boundingBox()
  expect(before).not.toBeNull()
  expect(after).not.toBeNull()
  expect(Math.abs((after?.y ?? 0) - (before?.y ?? 0))).toBeLessThanOrEqual(1)

  await back.click()
  await expect(page).toHaveURL(/\/dearseed\?picker=off$/)
  await expectHealthyFormalRoute(page)

  expect(runtimeErrors, runtimeErrors.join('\n')).toEqual([])
})
