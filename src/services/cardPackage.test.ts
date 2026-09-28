import { describe, expect, it } from 'vitest'

import {
  assembleCardApiParams,
  buildDiscountCardListRequest,
  createCardApiSignature,
  formatCardApiTimesp,
} from './cardPackage'

describe('card package signing', () => {
  it('formats timesp using the upstream local-time shape', () => {
    expect(formatCardApiTimesp(new Date(2026, 8, 23, 13, 14, 15))).toBe('2026-09-23 13:14:15')
  })

  it('sorts keys and excludes secstr/callback before signing', () => {
    const params = {
      type: 'unused',
      startIndex: 0,
      pageSize: 50,
      platform: 'h5',
      timesp: '2026-09-23 13:14:15',
      token: 'token',
      secstr: 'old-signature',
      callback: 'ignored',
    }

    expect(assembleCardApiParams(params)).toBe(
      'pageSize50platformh5startIndex0timesp2026-09-23 13:14:15tokentokentypeunused',
    )
    expect(createCardApiSignature(params, 'salt')).toBe('25596793abe3b05093b661c8a06f4f6c')
  })

  it('builds an unsigned request without credentials and a signed request with credentials', () => {
    const now = new Date(2026, 8, 23, 13, 14, 15)
    const unsigned = buildDiscountCardListRequest({ type: 'unused' }, undefined, now)
    expect(unsigned).toEqual({
      type: 'unused',
      startIndex: 0,
      pageSize: 50,
      platform: 'h5',
      timesp: '2026-09-23 13:14:15',
    })

    const signed = buildDiscountCardListRequest(
      { type: 'unused' },
      { token: 'token', salt: 'salt' },
      now,
    )
    expect(signed.token).toBe('token')
    expect(signed.secstr).toBe('25596793abe3b05093b661c8a06f4f6c')
  })
})
