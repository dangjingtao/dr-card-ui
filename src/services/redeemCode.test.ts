import { afterEach, describe, expect, it, vi } from 'vitest'
import { httpClient } from './http'
import { REDEEM_CARD_CODE_PATH, redeemCardCode } from './redeemCode'

afterEach(() => vi.restoreAllMocks())

describe('redeemCardCode', () => {
  it('只提交原始兑换码并消费真实成功响应', async () => {
    const request = vi.spyOn(httpClient, 'request').mockResolvedValue({
      code: 0, msg: 'success', status: 'succ',
      data: { user_card_id: 12, card_id: 4, card_name: '体验卡', card_sn: 'RC00000000000014' },
    })
    await expect(redeemCardCode('Abc- 123456')).resolves.toMatchObject({
      user_card_id: 12, card_name: '体验卡',
    })
    expect(request).toHaveBeenCalledWith({
      method: 'POST', url: REDEEM_CARD_CODE_PATH, data: { code: 'Abc- 123456' },
    })
  })

  it('业务错误不能伪装成成功', async () => {
    vi.spyOn(httpClient, 'request').mockResolvedValue({
      code: 500, message: '该兑换码已被使用', data: [],
    })
    await expect(redeemCardCode('ABC123456789')).rejects.toThrow('该兑换码已被使用')
  })

  it('成功响应缺少发券凭证时拒绝通过', async () => {
    vi.spyOn(httpClient, 'request').mockResolvedValue({
      code: 0, msg: 'success', status: 'succ', data: {},
    })
    await expect(redeemCardCode('ABC123456789')).rejects.toThrow()
  })
})
