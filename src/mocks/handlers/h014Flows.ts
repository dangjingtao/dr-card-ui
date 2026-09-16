import { delay, http, HttpResponse } from 'msw'

import {
  exchangeAvailability,
  resolveBuddySearchOutcome,
  resolveExchangeProduct,
} from '../../app/fixtures'
import {
  H014_BUDDY_INVITE_PATH,
  H014_BUDDY_SEARCH_PATH,
  H014_EXCHANGE_REDEEM_PATH,
} from '../../services/contracts/h014Flows'
import {
  H014_SLOW_DELAY_MS,
  readH014Scenario,
  type H014MockScenario,
} from '../fixtures/h014Scenarios'

const invitedPhones = new Set<string>()

function businessFailure(code: string, message: string) {
  return HttpResponse.json({ ok: false, error: { code, message } })
}

async function applyEdgeScenario(request: Request): Promise<
  | H014MockScenario
  | Response
  | null
> {
  const scenario = readH014Scenario(request)
  if (!scenario) return null

  if (scenario === 'slow') {
    await delay(H014_SLOW_DELAY_MS)
    return scenario
  }
  if (scenario === 'network-failure') return HttpResponse.error()
  if (scenario === 'http-4xx') {
    return HttpResponse.json(
      { error: { code: 'H014_BAD_REQUEST', message: 'Mock 4xx response' } },
      { status: 400 },
    )
  }
  if (scenario === 'http-5xx') {
    return HttpResponse.json(
      { error: { code: 'H014_SERVER_ERROR', message: 'Mock 5xx response' } },
      { status: 503 },
    )
  }
  return scenario
}

function isResponse(value: H014MockScenario | Response | null): value is Response {
  return value instanceof Response
}

export function resetH014MockState() {
  invitedPhones.clear()
}

export const buddyPhoneSearchHandler = http.get(`*${H014_BUDDY_SEARCH_PATH}`, async ({ request }) => {
  const edge = await applyEdgeScenario(request)
  if (isResponse(edge)) return edge

  const url = new URL(request.url)
  const phone = url.searchParams.get('phone')?.trim() ?? ''
  if (!phone) {
    return HttpResponse.json(
      { error: { code: 'PHONE_REQUIRED', message: '手机号不能为空' } },
      { status: 400 },
    )
  }

  if (edge === 'business-error') {
    return businessFailure('BUDDY_SEARCH_UNAVAILABLE', '暂时无法搜索搭子，请稍后再试')
  }

  const outcome = edge === 'empty'
    ? 'not-found'
    : invitedPhones.has(phone)
      ? 'invited'
      : resolveBuddySearchOutcome(phone)

  const normalizedOutcome = outcome === 'idle' || outcome === 'searching' ? 'not-found' : outcome
  return HttpResponse.json({
    ok: true,
    data: {
      outcome: normalizedOutcome,
      phone,
      ...(normalizedOutcome === 'invitable' ? { name: '小美' } : {}),
    },
  })
})

export const buddyPhoneInviteHandler = http.post(`*${H014_BUDDY_INVITE_PATH}`, async ({ request }) => {
  const edge = await applyEdgeScenario(request)
  if (isResponse(edge)) return edge

  const body = await request.json().catch(() => null)
  const phone = body && typeof body === 'object' && 'phone' in body && typeof body.phone === 'string'
    ? body.phone.trim()
    : ''
  if (!phone) {
    return HttpResponse.json(
      { error: { code: 'PHONE_REQUIRED', message: '手机号不能为空' } },
      { status: 400 },
    )
  }

  if (edge === 'business-error') {
    return businessFailure('BUDDY_INVITE_REJECTED', '邀请发送失败，请稍后重试')
  }

  invitedPhones.add(phone)
  return HttpResponse.json({ ok: true, data: { phone } })
})

export const exchangeRedeemHandler = http.post(`*${H014_EXCHANGE_REDEEM_PATH}`, async ({ request }) => {
  const edge = await applyEdgeScenario(request)
  if (isResponse(edge)) return edge

  const body = await request.json().catch(() => null)
  const productId = body && typeof body === 'object' && 'productId' in body && typeof body.productId === 'string'
    ? body.productId
    : ''
  if (!productId) {
    return HttpResponse.json(
      { error: { code: 'PRODUCT_REQUIRED', message: '兑换商品不能为空' } },
      { status: 400 },
    )
  }

  if (edge === 'business-error') {
    return businessFailure('EXCHANGE_REDEEM_REJECTED', '兑换暂时不可用，请稍后重试')
  }

  const product = resolveExchangeProduct(productId)
  if (product.id !== productId) {
    return HttpResponse.json(
      { error: { code: 'PRODUCT_NOT_FOUND', message: '兑换商品不存在' } },
      { status: 404 },
    )
  }

  const availability = exchangeAvailability(product)
  if (availability === 'sold-out') return businessFailure('EXCHANGE_SOLD_OUT', '已兑完')
  if (availability === 'insufficient') return businessFailure('EXCHANGE_INSUFFICIENT', '泡泡值不足')

  return HttpResponse.json({ ok: true, data: { productId } })
})

export const h014FlowHandlers = [
  buddyPhoneSearchHandler,
  buddyPhoneInviteHandler,
  exchangeRedeemHandler,
]
