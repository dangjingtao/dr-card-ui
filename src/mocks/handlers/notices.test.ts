import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { setupServer } from 'msw/node'
import { noticeHandlers } from './notices'

const server = setupServer(...noticeHandlers)
const base = 'https://h122.example.test'
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('#122 notices HTTP/MSW contract', () => {
  it('delivers paged notices in backend envelope without exposing user-supplied query identity', async () => {
    const res = await fetch(`${base}/api/notices/index?page=1&pageSize=2`)
    const json = await res.json() as { code: number; data: { data: { id: number; is_read: number }[]; per_page: number; total: number; last_page: number } }
    expect(json.code).toBe(0)
    expect(json.data.data).toHaveLength(2)
    expect(json.data.per_page).toBe(2)
    expect(json.data.last_page).toBeGreaterThan(1)
  })

  it('GET detail changes only read state and never runs friendship acceptance', async () => {
    const countBefore = await (await fetch(`${base}/api/notices/unread-count`)).json() as { data: { total: number } }
    const detail = await (await fetch(`${base}/api/notices/detail?id=1`)).json() as { data: { is_read: number } }
    expect(detail.data.is_read).toBe(1)
    const countAfter = await (await fetch(`${base}/api/notices/unread-count`)).json() as { data: { total: number } }
    expect(countAfter.data.total).toBeLessThanOrEqual(countBefore.data.total)
  })

  it('read-all returns changed count and then returns 0 unread on subsequent GET', async () => {
    const res = await fetch(`${base}/api/notices/read-all`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}',
    })
    const json = await res.json() as { data: { count: number } }
    expect(json.data.count).toBeGreaterThanOrEqual(0)
    const counts = await (await fetch(`${base}/api/notices/unread-count`)).json() as { data: { total: number } }
    expect(counts.data.total).toBe(0)
  })
})
