import { http, HttpResponse } from 'msw'
import { NOTIFICATION_FIXTURES } from '../../app/fixtures/notifications'
import {
  NOTICES_DETAIL_PATH, NOTICES_INDEX_PATH, NOTICES_READ_ALL_PATH, NOTICES_UNREAD_PATH,
} from '../../services/notices'

/** Preview/dev HTTP contract exercise only. Production never loads MSW/fixture notices. */
const typeByCategory = { system: 10, activity: 20, balance: 30, event: 40, service: 50, reward: 30, transfer: 40, other: 50, buddy: 60 } as const
const source = NOTIFICATION_FIXTURES.map((item, index) => ({
  id: index + 1,
  title: item.title,
  content: item.paragraphs.join('<p>') || item.summary,
  type: typeByCategory[item.cat],
  user_id: 1, sender_user: 0,
  send_time: 1791500000 - index * 3600,
  create_time: '2026-10-09 09:00:00',
  extra_json: null,
  is_read: item.unread ? 0 : 1,
}))
const readIds = new Set(source.filter(item => item.is_read === 1).map(item => item.id))
const ok = (data: unknown) => HttpResponse.json({ code: 0, msg: 'success', status: 'succ', data })
const fail = (message: string) => HttpResponse.json({ code: 500, message, data: [] })

export const noticeHandlers = [
  http.get(`*${NOTICES_INDEX_PATH}`, ({ request }) => {
    const url = new URL(request.url)
    const type = url.searchParams.get('type')
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1)
    const pageSize = Math.max(1, Math.min(100, Number(url.searchParams.get('pageSize')) || 15))
    const items = source.filter(item => type == null || item.type === Number(type))
    const sorted = items.sort((a, b) => b.id - a.id)
    return ok({
      data: sorted.slice((page - 1) * pageSize, page * pageSize).map(item => ({
        ...item, is_read: readIds.has(item.id) ? 1 : 0,
      })),
      current_page: page, per_page: pageSize, total: items.length,
      last_page: Math.max(1, Math.ceil(items.length / pageSize)),
    })
  }),
  http.get(`*${NOTICES_DETAIL_PATH}`, ({ request }) => {
    const id = Number(new URL(request.url).searchParams.get('id'))
    const notice = source.find(item => item.id === id)
    if (!notice) return fail('通知不存在')
    readIds.add(id)
    return ok({ ...notice, is_read: 1, read_time: Math.floor(Date.now() / 1000) })
  }),
  http.get(`*${NOTICES_UNREAD_PATH}`, () => {
    const items = [
      [10, '系统公告'], [20, '活动通知'], [30, '奖励通知'],
      [40, '转赠通知'], [50, '其它'], [60, '好友申请'],
    ].map(([type, name]) => ({
      type, name,
      unread: source.filter(item => item.type === type && !readIds.has(item.id)).length,
    }))
    return ok({ total: items.reduce((sum, item) => sum + item.unread, 0), items })
  }),
  http.post(`*${NOTICES_READ_ALL_PATH}`, async ({ request }) => {
    const data = await request.json().catch(() => ({})) as { type?: number }
    const pending = source.filter(item =>
      !readIds.has(item.id) && (data.type == null || item.type === data.type))
    for (const item of pending) readIds.add(item.id)
    return ok({ count: pending.length })
  }),
]
