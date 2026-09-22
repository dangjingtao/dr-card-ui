import { http, HttpResponse } from 'msw'

import { H014_EXCHANGE_REDEEM_PATH } from '../../services/exchange'
import { H014_EXCHANGE_REDEEM_SUCCESS } from '../fixtures/h014Scenarios'

async function readProductId(request: Request) {
  const body: unknown = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') return ''
  const productId = (body as { productId?: unknown }).productId
  return typeof productId === 'string' ? productId.trim() : ''
}

export const exchangeHandlers = [
  http.post(`*${H014_EXCHANGE_REDEEM_PATH}`, async ({ request }) => {
    const productId = await readProductId(request)
    if (!productId) {
      return HttpResponse.json({ message: 'productId is required' }, { status: 400 })
    }

    // B-026 settlement rules are still unconfirmed. H014 only migrates the existing successful
    // request lifecycle to the network boundary; it does not invent stock/balance settlement rules.
    return HttpResponse.json(H014_EXCHANGE_REDEEM_SUCCESS)
  }),
]
