import { delay, http, HttpResponse } from 'msw'
import {
  H014_BUDDY_PHONE_INVITE_PATH,
  H014_BUDDY_PHONE_SEARCH_PATH,
  H111_BUDDY_INBOX_PATH,
} from '../../services/buddyPhone'
import { H014_BUDDY_PHONE_SCENARIOS, H014_SLOW_RESPONSE_MS } from '../fixtures/h014Scenarios'

/** Isolated one-account demonstration only. No real identities/notifications or persistent relationship writes. */
const outgoingPhones = new Set<string>()
const completedIncomingIds = new Set<string>()
const incomingId = 'mock-incoming-1'
const demoUser = (phone: string) => ({
  id: `mock-user-${phone}`,
  nickname: '演示搭子',
  avatarUrl: null,
})

function searchData(phone: string) {
  if (phone === H014_BUDDY_PHONE_SCENARIOS.empty) return { outcome: 'not-found' as const }
  if (phone === H014_BUDDY_PHONE_SCENARIOS.self) {
    return { outcome: 'self' as const, user: demoUser(phone) }
  }
  if (phone === H014_BUDDY_PHONE_SCENARIOS.alreadyBuddies ||
      (phone === H014_BUDDY_PHONE_SCENARIOS.incoming && completedIncomingIds.has(incomingId))) {
    return { outcome: 'already-buddies' as const, user: demoUser(phone) }
  }
  if (phone === H014_BUDDY_PHONE_SCENARIOS.incoming) {
    return { outcome: 'incoming-pending' as const, user: demoUser(phone), invitationId: incomingId }
  }
  if (outgoingPhones.has(phone) || phone === H014_BUDDY_PHONE_SCENARIOS.invited) {
    return { outcome: 'invited' as const, user: demoUser(phone) }
  }
  return { outcome: 'invitable' as const, user: demoUser(phone) }
}

async function readPhone(request: Request) {
  const body: unknown = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') return ''
  const phone = (body as { phone?: unknown }).phone
  return typeof phone === 'string' ? phone.trim() : ''
}

export const buddyPhoneHandlers = [
  http.get(`*${H014_BUDDY_PHONE_SEARCH_PATH}`, async ({ request }) => {
    const phone = new URL(request.url).searchParams.get('phone')?.trim() ?? ''
    if (phone === H014_BUDDY_PHONE_SCENARIOS.networkFailure) return HttpResponse.error()
    if (phone === H014_BUDDY_PHONE_SCENARIOS.http4xx) {
      return HttpResponse.json({ message: 'H014 mock client error' }, { status: 422 })
    }
    if (phone === H014_BUDDY_PHONE_SCENARIOS.http5xx) {
      return HttpResponse.json({ message: 'H014 mock server error' }, { status: 503 })
    }
    if (phone === H014_BUDDY_PHONE_SCENARIOS.businessError) {
      return HttpResponse.json({ ok: false, message: '当前请求未通过业务校验' })
    }
    if (phone === H014_BUDDY_PHONE_SCENARIOS.slow) await delay(H014_SLOW_RESPONSE_MS)
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return HttpResponse.json({ ok: false, message: '请输入完整手机号' })
    }
    return HttpResponse.json({ ok: true, ...searchData(phone) })
  }),

  http.post(`*${H014_BUDDY_PHONE_INVITE_PATH}`, async ({ request }) => {
    const phone = await readPhone(request)
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return HttpResponse.json({ message: '完整手机号必填' }, { status: 400 })
    }
    const state = searchData(phone)
    if (state.outcome !== 'invitable' && state.outcome !== 'invited') {
      return HttpResponse.json({ ok: false, message: '当前用户状态不可发送邀请' })
    }
    if (outgoingPhones.has(phone) || state.outcome === 'invited') {
      return HttpResponse.json({ ok: true, result: 'already-pending' })
    }
    outgoingPhones.add(phone)
    return HttpResponse.json({ ok: true, result: 'sent' })
  }),

  http.get(`*${H111_BUDDY_INBOX_PATH}`, () => HttpResponse.json({
    ok: true,
    items: [{
      id: incomingId,
      inviter: demoUser(H014_BUDDY_PHONE_SCENARIOS.incoming),
      status: completedIncomingIds.has(incomingId) ? 'completed' : 'pending',
      createdAt: '2026-10-09T08:00:00+08:00',
    }],
  })),

  http.post(`*${H111_BUDDY_INBOX_PATH}/:id/accept`, ({ params }) => {
    if (params.id !== incomingId) {
      return HttpResponse.json({ ok: false, message: '邀请不存在或无权限确认' })
    }
    if (completedIncomingIds.has(incomingId)) {
      return HttpResponse.json({ ok: true, result: 'already-buddies' })
    }
    completedIncomingIds.add(incomingId)
    return HttpResponse.json({ ok: true, result: 'accepted' })
  }),
]
