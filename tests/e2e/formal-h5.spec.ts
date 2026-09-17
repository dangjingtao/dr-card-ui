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
  await page.waitForLoadState('networkidle')
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
      return image.naturalWidth === 0 ? [image.currentSrc || image.src] : []
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
