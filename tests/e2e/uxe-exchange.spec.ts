import { expect, test } from '@playwright/test'

test('@formal-h5 UX-E exchange tabs and confirmation remain within one URL', async ({ page }) => {
  await page.goto('/exchange', { waitUntil: 'domcontentloaded' })
  const urlBefore = new URL(page.url())
  expect(urlBefore.pathname).toBe('/exchange')
  expect(urlBefore.search).toBe('')
  const tab = page.getByRole('tab', { name: '洗发体验' })
  await expect(tab).toBeVisible()
  await tab.click()
  await expect(tab).toHaveAttribute('aria-selected', 'true')
  expect(new URL(page.url()).pathname + new URL(page.url()).search).toBe('/exchange')

  const list = page.getByRole('region', { name: '洗护体验券列表' })
  const firstCoupon = list.locator('button').first()
  await expect(firstCoupon).toBeVisible()
  await firstCoupon.click()
  await expect(page.getByRole('dialog', { name: '确认兑换' })).toBeVisible()
  expect(new URL(page.url()).pathname + new URL(page.url()).search).toBe('/exchange')

  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: '确认兑换' })).toHaveCount(0)
  expect(new URL(page.url()).pathname + new URL(page.url()).search).toBe('/exchange')
})

test('@formal-h5 UX-E legacy result query must not show fake success', async ({ page }) => {
  await page.goto('/exchange/result?product=1&overlay=redeem', { waitUntil: 'domcontentloaded' })
  await expect(page).toHaveURL(/\/exchange$/)
  await expect(page.getByRole('dialog', { name: '模拟兑换结果' })).toHaveCount(0)
  await expect(page.getByRole('tab', { name: '全部' })).toBeVisible()
})
