import { expect, test } from '@playwright/test'

const USER_POINTS_PATH = '/api/userpoints/index'

test('@formal-h5 H024 points detail crosses HTTP/MSW and renders adapter view-model', async ({ page }) => {
  const responsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'GET' &&
      new URL(response.url()).pathname === USER_POINTS_PATH,
  )

  await page.goto('/points/detail', { waitUntil: 'domcontentloaded' })
  const response = await responsePromise

  expect(response.status()).toBe(200)
  await expect(page.getByText('任务泡泡值').first()).toBeVisible()

  await page.getByRole('tab', { name: '消耗' }).click()
  await expect(page.getByText('兑换消耗').first()).toBeVisible()
  await expect(page.getByText('任务泡泡值')).toHaveCount(0)
})

test('@formal-h5 H024 empty fixture keeps the same service request path', async ({ page }) => {
  const responsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'GET' &&
      new URL(response.url()).pathname === USER_POINTS_PATH,
  )

  await page.goto('/points/detail?state=empty', { waitUntil: 'domcontentloaded' })
  const response = await responsePromise

  expect(response.status()).toBe(200)
  await expect(page.getByText('暂时没有更多记录啦')).toBeVisible()
})
