import { afterEach, describe, expect, it, vi } from 'vitest'
import { httpClient } from './http'
import { fetchMyRedeemedCards, MY_REDEEMED_CARDS_PATH } from './myRedeemedCards'

afterEach(() => vi.restoreAllMocks())

describe('fetchMyRedeemedCards', () => {
  it('请求当前用户兑换码领取的本地卡券', async () => {
    const request = vi.spyOn(httpClient, 'request').mockResolvedValue({
      code: 0, msg: 'success', status: 'succ',
      data: {
        data: [{ id: 21, source: 60, card_name: '洗护体验卡', face_value: null, status: 10 }],
        total: 1, current_page: 1, per_page: 100, last_page: 1,
      },
    })
    const result = await fetchMyRedeemedCards(10)
    expect(result.total).toBe(1)
    expect(result.data[0].card_name).toBe('洗护体验卡')
    expect(request).toHaveBeenCalledWith({
      method: 'GET', url: MY_REDEEMED_CARDS_PATH,
      params: { status: 10, source: 60, page: 1, pageSize: 100 },
    })
  })
})
