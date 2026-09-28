import { describe, expect, it } from 'vitest'

import { parseLoginResponse } from './session'

describe('login response contract', () => {
  it('accepts the original top-level login response', () => {
    expect(parseLoginResponse({ userInfo: { id: 'user-1' }, accessToken: 'token-1' })).toEqual({
      userInfo: { id: 'user-1' },
      accessToken: 'token-1',
    })
  })

  it('unwraps a successful code/data response from the backend', () => {
    expect(
      parseLoginResponse({
        code: 0,
        data: { userInfo: { id: 'user-1' }, accessToken: 'token-1', is_new_user: false },
      }),
    ).toEqual({
      userInfo: { id: 'user-1' },
      accessToken: 'token-1',
    })
  })

  it('does not treat a non-success envelope as a valid session', () => {
    expect(() =>
      parseLoginResponse({
        code: 500,
        data: { message: 'backend failure' },
      }),
    ).toThrowError(expect.objectContaining({ code: 'AUTH_LOGIN_RESPONSE_INVALID' }))
  })
})
