import { afterEach, describe, expect, it, vi } from 'vitest'
import { httpClient } from './http'
import { REDEEM_CARD_CODE_PATH, redeemCardCode } from './redeemCode'

afterEach(() => vi.restoreAllMocks())

const receipt = {
  user_card_id: 21,
  card_id: 4,
  card_name: '洗护体验卡',
  card_sn: 'RC00000000000014',
}

describe('redeemCardCode confirmed backend contract', () => {
  it('sends original code without changing whitespace/case and returns validated receipt', async () => {
    const request = vi.spyOn(httpClient, 'request').mockResolvedValue({
      code: 0, msg: 'success', status: 'succ', data: receipt,
    })
    await expect(redeemCardCode('Abc- 123456')).resolves.toEqual(receipt)
    expect(request).toHaveBeenCalledWith({
      method: 'POST', url: REDEEM_CARD_CODE_PATH, data: { code: 'Abc- 123456' },
    })
  })

  it('HTTP 200 business failures are not success', async () => {
    vi.spyOn(httpClient, 'request').mockResolvedValue({
      code: 500, message: '该兑换码已被使用', data: [],
    })
    await expect(redeemCardCode('ABC123456789')).rejects.toThrow('该兑换码已被使用')
  })

  it('rejects code=0 with incomplete user-card receipt', async () => {
    vi.spyOn(httpClient, 'request').mockResolvedValue({
      code: 0, msg: 'success', status: 'succ', data: { card_id: 4 },
    })
    await expect(redeemCardCode('ABC123456789')).rejects.toThrow()
  })
})
