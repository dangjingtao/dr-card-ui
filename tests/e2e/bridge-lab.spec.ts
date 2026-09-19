import { expect, test } from '@playwright/test'

test.describe('H027 Bridge Lab', () => {
  test('lists registered capabilities and reports missing browser host explicitly', async ({ page }) => {
    await page.goto('/__debug/bridge-lab', { waitUntil: 'domcontentloaded' })

    await expect(page.locator('[data-bridge-lab]')).toBeVisible()
    await expect(page.locator('[data-capability-name="getLoginToken"]')).toBeVisible()
    await expect(page.locator('[data-capability-name="closeWebView"]')).toBeVisible()

    await page.getByLabel('Android method').fill('missingMethod')
    await page.getByRole('button', { name: 'Run Android Probe' }).click()

    await expect(page.locator('[data-bridge-lab-logs]')).toContainText(
      'window.androidBridge is not available in the current host.',
    )
  })

  test('Android Raw Probe preserves receiver and masks a token result by default', async ({ page }) => {
    await page.addInitScript(() => {
      const bridge = {
        marker: 'real-receiver',
        getLoginToken() {
          return this.marker === 'real-receiver' ? 'e2e-secret-token' : 'wrong-receiver'
        },
      }
      ;(window as unknown as { androidBridge: typeof bridge }).androidBridge = bridge
    })

    await page.goto('/__debug/bridge-lab', { waitUntil: 'domcontentloaded' })
    await page.getByLabel('Android method').fill('getLoginToken')
    await page.getByRole('button', { name: 'Run Android Probe' }).click()

    const logs = page.locator('[data-bridge-lab-logs]')
    await expect(logs).toContainText('[REDACTED]')
    await expect(logs).not.toContainText('e2e-secret-token')

    await page.getByRole('button', { name: '显式显示原始结果' }).click()
    await expect(logs).toContainText('e2e-secret-token')
    await expect(logs).not.toContainText('wrong-receiver')
  })

  test('iOS Raw Probe posts payload and captures a temporary global callback', async ({ page }) => {
    await page.addInitScript(() => {
      const host = window as unknown as {
        webkit?: {
          messageHandlers?: Record<string, { postMessage(payload: unknown): void }>
        }
        labCallback?: (payload: unknown) => void
      }
      host.webkit = {
        messageHandlers: {
          demoHandler: {
            postMessage(payload) {
              setTimeout(() => host.labCallback?.({ token: 'ios-secret', echo: payload }), 0)
            },
          },
        },
      }
    })

    await page.goto('/__debug/bridge-lab', { waitUntil: 'domcontentloaded' })
    await page.getByLabel('iOS message handler').fill('demoHandler')
    await page.getByLabel('iOS callback').fill('labCallback')
    await page.getByRole('button', { name: 'Run iOS Probe' }).click()

    const logs = page.locator('[data-bridge-lab-logs]')
    await expect(logs).toContainText('iOS Raw · demoHandler')
    await expect(logs).toContainText('[REDACTED]')
    await expect(logs).not.toContainText('ios-secret')
  })
})
