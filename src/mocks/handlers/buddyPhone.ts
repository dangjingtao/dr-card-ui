import { delay, http, HttpResponse } from 'msw'

import {
  H014_BUDDY_PHONE_INVITE_PATH,
  H014_BUDDY_PHONE_SEARCH_PATH,
} from '../../services/buddyPhone'
import { H014_BUDDY_PHONE_SCENARIOS, H014_SLOW_RESPONSE_MS } from '../fixtures/h014Scenarios'

const invitedPhones = new Set<string>()

function resolveSearchOutcome(phone: string) {
  if (invitedPhones.has(phone) || phone === H014_BUDDY_PHONE_SCENARIOS.invited) {
    return 'invited' as const
  }
  if (phone === H014_BUDDY_PHONE_SCENARIOS.empty) return 'not-found' as const
  return 'invitable' as const
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

    if (phone === H014_BUDDY_PHONE_SCENARIOS.networkFailure) {
      return HttpResponse.error()
    }
    if (phone === H014_BUDDY_PHONE_SCENARIOS.http4xx) {
      return HttpResponse.json({ message: 'H014 mock client error' }, { status: 422 })
    }
    if (phone === H014_BUDDY_PHONE_SCENARIOS.http5xx) {
      return HttpResponse.json({ message: 'H014 mock server error' }, { status: 503 })
    }
    if (phone === H014_BUDDY_PHONE_SCENARIOS.businessError) {
      return HttpResponse.json({ ok: false, message: '当前请求未通过业务校验' })
    }
    if (phone === H014_BUDDY_PHONE_SCENARIOS.slow) {
      await delay(H014_SLOW_RESPONSE_MS)
    }

    return HttpResponse.json({ ok: true, outcome: resolveSearchOutcome(phone) })
  }),

  http.post(`*${H014_BUDDY_PHONE_INVITE_PATH}`, async ({ request }) => {
    const phone = await readPhone(request)
    if (!phone) {
      return HttpResponse.json({ message: 'phone is required' }, { status: 400 })
    }

    invitedPhones.add(phone)
    return HttpResponse.json({ ok: true })
  }),
]
