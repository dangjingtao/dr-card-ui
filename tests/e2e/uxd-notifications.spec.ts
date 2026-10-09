import { expect, test } from '@playwright/test'

test('@formal-h5 UX-D notification tabs remain sticky and navigation retains selection', async ({ page }) => {
  await page.goto('/notifications', { waitUntil: 'domcontentloaded' })
  const shellScroll = page.locator('[data-page-scroll]')
  const tabs = page.locator('[data-notifications-tabs]')
  const header = page.locator('[data-title-bar]')
  await expect(tabs).toBeVisible()
  await expect(page.getByRole('tab', { name: /全部/ })).toHaveAttribute('aria-selected', 'true')
  const tabsBefore = await tabs.boundingBox()
  expect(tabsBefore).not.toBeNull()

  // Scroll the existing H5 shell: TitleBar and sticky tabs must stay above list cards.
  await shellScroll.evaluate((node) => {
    const element = node as HTMLElement
    element.scrollTop = element.scrollHeight
  })
  await expect.poll(() => shellScroll.evaluate((node) => (node as HTMLElement).scrollTop)).toBeGreaterThan(0)
  const topAfterScroll = (await tabs.boundingBox())!.y
  const viewportTitleBar = await header.count()
  if (viewportTitleBar) {
    const titleBox = await header.first().boundingBox()
    if (titleBox) expect(topAfterScroll).toBeGreaterThanOrEqual(titleBox.y + titleBox.height - 2)
  }
  expect(Math.abs(topAfterScroll - tabsBefore!.y)).toBeLessThanOrEqual(2)

  // Select an empty or shorter category while far down the long list.
  await page.getByRole('tab', { name: /活动/ }).click()
  await expect(page.getByRole('tab', { name: /活动/ })).toHaveAttribute('aria-selected', 'true')
  await expect.poll(() => shellScroll.evaluate((node) => (node as HTMLElement).scrollTop)).toBe(0)

  const event = page.getByRole('button', { name: /校内活动报名提醒|校外体验门店上新|双十一宠粉福利/ }).first()
  await expect(event).toBeVisible()
  await event.click()
  await expect(page).toHaveURL(/\/notifications\/[^/]+$/)
  await page.goBack()
  await expect(page).toHaveURL(/\/notifications$/)
  await expect(page.getByRole('tab', { name: /活动/ })).toHaveAttribute('aria-selected', 'true')

  await test.info().attach('uxd-notifications-375x812', {
    body: await page.screenshot({ fullPage: false }),
    contentType: 'image/png',
  })
})

test('@formal-h5 UX-D notifications tabs fit narrow mobile widths', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 480 })
  await page.goto('/notifications', { waitUntil: 'domcontentloaded' })
  const tablist = page.getByRole('tablist')
  await expect(tablist.getByRole('tab')).toHaveCount(4)
  const overflow = await page.locator('[data-page-scroll]').evaluate((node) => {
    const element = node as HTMLElement
    return element.scrollWidth - element.clientWidth
  })
  expect(overflow).toBeLessThanOrEqual(1)
})
