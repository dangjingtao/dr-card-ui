import { afterEach, describe, expect, it, vi } from 'vitest'
import { httpClient } from './http'
import { REDEEM_CARD_CODE_PATH, redeemCardCode } from './redeemCode'

afterEach(() => vi.restoreAllMocks())

describe('redeemCardCode', () => {
  it('只提交原始兑换码，以后台 code=0 判成功', async () => {
    const request = vi.spyOn(httpClient, 'request').mockResolvedValue({
      code: 0, msg: 'success', status: 'succ', data: {},
    })
    await expect(redeemCardCode('Abc- 123456')).resolves.toBeUndefined()
    expect(request).toHaveBeenCalledWith({
      method: 'POST', url: REDEEM_CARD_CODE_PATH, data: { code: 'Abc- 123456' },
    })
  })

  it('HTTP 200 内的业务失败不能当作兑换成功', async () => {
    vi.spyOn(httpClient, 'request').mockResolvedValue({
      code: 500, message: '该兑换码已被使用', data: [],
    })
    await expect(redeemCardCode('ABC123456789')).rejects.toThrow('该兑换码已被使用')
  })

  it('服务端成功但返回其它 data 结构时不捏造额外限制', async () => {
    vi.spyOn(httpClient, 'request').mockResolvedValue({
      code: 0, msg: 'success', status: 'succ', data: [],
    })
    await expect(redeemCardCode('ABC123456789')).resolves.toBeUndefined()
  })
})
