import { afterEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
}))
vi.mock('./http', () => ({
  httpClient: { request: mocks.request },
  createBusinessError: (message: string) => new Error(message),
}))
import {
  redeemExchangeProduct, H014_EXCHANGE_REDEEM_PATH,
} from './exchange'

afterEach(() => {
  mocks.request.mockReset()
})

describe('H014 isolated transport contract pending #74', () => {
  it('parses a simulated successful response through the shared transport seam', async () => {
    mocks.request.mockResolvedValue({ ok: true })
    await expect(redeemExchangeProduct('1')).resolves.toBeUndefined()
    expect(mocks.request).toHaveBeenCalledWith({
      method: 'POST',
      url: H014_EXCHANGE_REDEEM_PATH,
      data: { productId: '1' },
    })
  })

  it('rejects an unsuccessful Mock response instead of displaying success', async () => {
    mocks.request.mockResolvedValue({ ok: false, message: '库存不足' })
    await expect(redeemExchangeProduct('2')).rejects.toThrow('库存不足')
  })
})
