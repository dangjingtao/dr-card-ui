import { describe, expect, it, vi } from 'vitest'

const mode = vi.hoisted(() => ({ dataMode: 'mock' }))
const profiles = vi.hoisted(() => ({ fetchUserProfile: vi.fn() }))
vi.mock('../app/config/runtime', () => ({ runtimePolicy: mode }))
vi.mock('./userProfile', () => ({ fetchUserProfile: profiles.fetchUserProfile }))

import { BuddyQrError, buildBuddyInviteUrl, loadOwnBuddyQr, validateBuddyQrUrl } from './buddyQr'

const origin = 'https://card.example.org'
const valid = `${origin}/buddy/invite/scan?token=secure-non-user-identifier-12345678`

describe('buddy QR contract boundary', () => {
  it('renders only an unmistakable non-binding demo in mock builds', async () => {
    const qr = await loadOwnBuddyQr()
    expect(qr.demo).toBe(true)
    expect(qr.url).toMatch(/^https:\/\/test\.dr-card-ui\.pages\.dev\/buddy\/invite\/scan/)
    expect(qr.url).toContain('demo=')
  })

  it('generates the official QR from the authenticated profile in API mode', async () => {
    const code = '123e4567-e89b-42d3-a456-426614174000'
    mode.dataMode = 'api'
    vi.stubEnv('VITE_BUDDY_PUBLIC_ORIGIN', origin)
    profiles.fetchUserProfile.mockResolvedValue({ identifyCode: code })
    try {
      expect(await loadOwnBuddyQr()).toEqual({ url: `${origin}/buddy/invite/scan?code=${code}`, demo: false })
      expect(buildBuddyInviteUrl(code, origin)).toContain(`code=${code}`)
    } finally {
      mode.dataMode = 'mock'
      vi.unstubAllEnvs()
      profiles.fetchUserProfile.mockReset()
    }
  })

  it('reports a missing identifier or public domain explicitly', async () => {
    mode.dataMode = 'api'
    try {
      profiles.fetchUserProfile.mockResolvedValue({ identifyCode: undefined })
      await expect(loadOwnBuddyQr()).rejects.toMatchObject({ reason: 'missing-code' })
      profiles.fetchUserProfile.mockResolvedValue({ identifyCode: '123e4567-e89b-42d3-a456-426614174000' })
      vi.stubEnv('VITE_BUDDY_PUBLIC_ORIGIN', '')
      await expect(loadOwnBuddyQr()).rejects.toMatchObject({ reason: 'missing-origin' })
      expect(() => buildBuddyInviteUrl('invalid', origin)).toThrow(BuddyQrError)
    } finally {
      mode.dataMode = 'mock'
      vi.unstubAllEnvs()
      profiles.fetchUserProfile.mockReset()
    }
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
