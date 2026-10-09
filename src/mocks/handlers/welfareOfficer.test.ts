import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { setupServer } from 'msw/node'

import { handlers } from './index'
import { WELFARE_OFFICER_CONFIG_MOCK } from '../fixtures/welfareOfficer'

const server = setupServer(...handlers)
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('welfare officer MSW settings/detail routing', () => {
  it('returns dedicated welfare config before the generic settings fallback', async () => {
    const response = await fetch('https://h041.example.test/api/settings/detail?key=brand_welfare_setting')
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(WELFARE_OFFICER_CONFIG_MOCK)
  })

  it('does not take over the existing welfare rich-text alias', async () => {
    const response = await fetch('https://h041.example.test/api/settings/detail?key=welfare')
    const data = await response.json() as { code: number; data: unknown }
    expect(data.code).toBe(0)
    expect(data.data).not.toEqual(WELFARE_OFFICER_CONFIG_MOCK.data)
  })

  it('keeps unsupported settings keys a business failure', async () => {
    const response = await fetch('https://h041.example.test/api/settings/detail?key=not-an-official-key')
    const data = await response.json() as { code: number }
    expect(data.code).toBe(500)
  })
})
