import { describe, expect, it, vi } from 'vitest'

vi.mock('../app/config/runtime', () => ({
  runtimePolicy: { dataMode: 'mock' },
}))

import { BuddyQrError, loadOwnBuddyQr, validateBuddyQrUrl } from './buddyQr'

const origin = 'https://card.example.org'
const valid = `${origin}/buddy/invite/scan?token=secure-non-user-identifier-12345678`

describe('buddy QR contract boundary', () => {
  it('renders only an unmistakable non-binding demo in mock builds', async () => {
    const qr = await loadOwnBuddyQr()
    expect(qr.demo).toBe(true)
    expect(qr.url).toMatch(/^https:\/\/test\.dr-card-ui\.pages\.dev\/buddy\/invite\/scan/)
    expect(qr.url).toContain('demo=')
  })

  it('accepts trusted HTTPS URLs with an opaque identifier', () => {
    expect(validateBuddyQrUrl(valid, origin)).toBe(valid)
  })

  it.each([
    'http://card.example.org/buddy/invite/scan?token=secure-non-user-identifier-12345678',
    'https://evil.example.org/buddy/invite/scan?token=secure-non-user-identifier-12345678',
    'https://name:password@card.example.org/buddy/invite/scan?token=secure-non-user-identifier-12345678',
    'https://card.example.org/buddy/invite/scan?token=x',
    'https://card.example.org/buddy/invite/scan',
    'https://card.example.org/buddy/invite/scan?token=secure-non-user-identifier-12345678#secret',
    'https://card.example.org/buddy/invite/scan?redirect=https://evil.example',
    'https://card.example.org/another?token=secure-non-user-identifier-12345678',
    'https://card.example.org:8443/buddy/invite/scan?token=secure-non-user-identifier-12345678',
    'https://card.example.org/buddy/invite/scan?token=secure-non-user-identifier-12345678\n',
  ])('rejects QR URL that violates trusted origin / format: %s', (value) => {
    expect(() => validateBuddyQrUrl(value, origin)).toThrow(BuddyQrError)
  })

  it('accepts backend-provided URLs without trusting a user ID from H5', async () => {
    const readMyQr = vi.fn().mockResolvedValue({ qrUrl: valid })
    expect(await loadOwnBuddyQr({ readMyQr, trustedOrigin: origin })).toEqual({
      url: valid,
      demo: false,
    })
    expect(readMyQr).toHaveBeenCalledOnce()
  })

  it('rejects malformed backend responses and converts network errors into visible failures', async () => {
    await expect(loadOwnBuddyQr({
      readMyQr: async () => ({ qrUrl: 'https://evil.example/buddy/invite/scan?token=bad' }),
      trustedOrigin: origin,
    })).rejects.toMatchObject({ reason: 'invalid-qr' })

    await expect(loadOwnBuddyQr({
      readMyQr: async () => { throw new Error('network failure') },
      trustedOrigin: origin,
    })).rejects.toMatchObject({ reason: 'fetch-failed' })
  })
})
