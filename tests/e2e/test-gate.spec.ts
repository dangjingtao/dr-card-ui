import { expect, test, type Page } from '@playwright/test'

/**
 * H036：test 产物只承载真实 API + Native Bridge，合法运行容器是 App WebView。
 * 这里的浏览器用例因此不再断言业务路由可渲染，而是断言：
 *   1. 产物身份仍是 test + api；
 *   2. 非原生宿主下展示宿主受限提示，且不进入应用路由、不发业务请求。
 * 真实业务验收仍在 App WebView + 真实 API + Native Bridge 下完成。
 */
const gatedRoutes = ['/', '/profile', '/settings'] as const

function routeUrl(path: string) {
  return path === '/' ? '/?newcomer=off' : path
}

function collectPageErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  return errors
}

/** 浏览器里不得再出现被业务路由驱动的 active route 帧。 */
function activeRouteFrame(page: Page) {
  return page.locator('[data-h5-route-active="true"]')
}

function unsupportedHostNotice(page: Page) {
  return page.locator('[data-unsupported-host]')
}

test('@test-gate build identity matches the production-like test policy', async ({ request }) => {
  const response = await request.get('/build-meta.json')
  expect(response.ok()).toBeTruthy()

  const metadata = await response.json()
  expect(metadata.appEnvironment).toBe('test')
  expect(metadata.dataMode).toBe('api')
})

test('@test-gate browser entry does not start the app router', async ({ page }) => {
  const pageErrors = collectPageErrors(page)

  await page.goto(routeUrl('/'), { waitUntil: 'domcontentloaded' })
  await expect(unsupportedHostNotice(page)).toBeVisible()
  await expect(activeRouteFrame(page)).toHaveCount(0)

  expect(pageErrors, pageErrors.join('\n')).toEqual([])
})

for (const path of gatedRoutes) {
  test(`@test-gate ${path} shows the unsupported-host notice in a browser`, async ({ page }) => {
    const pageErrors = collectPageErrors(page)

    await page.goto(routeUrl(path), { waitUntil: 'domcontentloaded' })
    await expect(unsupportedHostNotice(page)).toBeVisible()
    await expect(
      page.getByRole('heading', { name: '请在卡博士 App 内打开' }),
    ).toBeVisible()
    await expect(activeRouteFrame(page)).toHaveCount(0)

    expect(pageErrors, pageErrors.join('\n')).toEqual([])
  })
}

test('@test-gate gated browser entry issues no business API request', async ({ page }) => {
  const businessRequests: string[] = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.pathname.startsWith('/api/')) businessRequests.push(url.pathname)
  })

  await page.goto(routeUrl('/'), { waitUntil: 'domcontentloaded' })
  await expect(unsupportedHostNotice(page)).toBeVisible()

  expect(businessRequests, `unexpected business request(s): ${businessRequests.join(', ')}`).toEqual(
    [],
  )
})

test('@test-gate injected native host bypasses the notice and starts the app', async ({ page }) => {
  /* 只注入"宿主身份"所需的最小对象，不伪造任何已确认 Bridge 方法返回值。
   * 因此应用会被放行进入路由（后续真实登录仍会在 mock 宿主上失败，这是预期的）。 */
  await page.addInitScript(() => {
    Object.defineProperty(window, 'androidBridge', {
      value: {},
      configurable: true,
    })
  })

  await page.goto(routeUrl('/'), { waitUntil: 'domcontentloaded' })

  /* 关键断言：宿主合格时不得再展示宿主受限提示，且应用路由确实启动过。 */
  await expect(unsupportedHostNotice(page)).toHaveCount(0)
  await expect(page.locator('main')).toBeVisible()
})
