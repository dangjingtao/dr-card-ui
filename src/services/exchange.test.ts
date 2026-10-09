import { afterEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  mode: 'mock' as 'mock' | 'api',
  request: vi.fn(),
}))
vi.mock('../app/config/runtime', () => ({
  runtimePolicy: { get dataMode() { return mocks.mode } },
}))
vi.mock('./http', () => ({
  httpClient: { request: mocks.request },
  createBusinessError: (message: string) => new Error(message),
}))
import {
  redeemExchangeProduct, H014_EXCHANGE_REDEEM_PATH, H014_EXCHANGE_REDEEM_UNAVAILABLE_COPY,
} from './exchange'

afterEach(() => {
  mocks.mode = 'mock'
  mocks.request.mockReset()
})

describe('H014 redemption is a Mock-only contract pending #74', () => {
  it('fails closed in API/test/prod without invoking H014 network endpoint', async () => {
    mocks.mode = 'api'
    await expect(redeemExchangeProduct('1')).rejects.toThrow(H014_EXCHANGE_REDEEM_UNAVAILABLE_COPY)
    expect(mocks.request).not.toHaveBeenCalled()
  })

  it('permits a clearly simulated response only when Mock mode is enabled', async () => {
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
