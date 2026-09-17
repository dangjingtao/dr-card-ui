import { expect, test, type Page } from '@playwright/test'

const criticalRoutes = ['/', '/profile', '/settings'] as const

function routeUrl(path: string) {
  return path === '/' ? '/?newcomer=off' : path
}

function collectPageErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  return errors
}

async function expectBasicRouteHealth(page: Page) {
  await expect(page.locator('[data-h5-route-active="true"]')).toBeVisible()

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

test('@test-gate build identity matches the production-like test policy', async ({ request }) => {
  const response = await request.get('/build-meta.json')
  expect(response.ok()).toBeTruthy()

  const metadata = await response.json()
  expect(metadata.appEnvironment).toBe('test')
  expect(metadata.dataMode).toBe('api')
})

for (const path of criticalRoutes) {
  test(`@test-gate ${path} renders without browser runtime failure`, async ({ page }) => {
    const pageErrors = collectPageErrors(page)

    await page.goto(routeUrl(path), { waitUntil: 'domcontentloaded' })
    await expectBasicRouteHealth(page)
    await page.waitForTimeout(100)

    expect(pageErrors, pageErrors.join('\n')).toEqual([])
  })
}
