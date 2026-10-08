import { beforeEach, describe, expect, it, vi } from 'vitest'
import { requirePublicImageUrl, uploadUserAvatar } from './userAvatarUpload'

const mocks = vi.hoisted(() => ({ request: vi.fn() }))
vi.mock('./http', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./http')>()
  return { ...actual, httpClient: { request: mocks.request } }
})

describe('user avatar upload contract', () => {
  beforeEach(() => mocks.request.mockReset())

  it('rejects loopback/private/non-HTTPS image addresses returned by backend', () => {
    for (const url of [
      'http://cdn.example.com/a.png',
      'http://127.0.0.1:7002/storage/x.png',
      'https://localhost/storage/x.png',
      'https://192.168.1.1/x.png',
      'https://10.0.0.1/x.png',
      'javascript:alert(1)',
    ]) expect(() => requirePublicImageUrl(url)).toThrow()
    expect(requirePublicImageUrl('https://cdn.example.com/user/a.png')).toBe('https://cdn.example.com/user/a.png')
  })

  it('uploads multipart bytes, then requires a public HTTPS result', async () => {
    mocks.request.mockResolvedValue({ code: 0, data: { url: 'https://cdn.example.com/avatar.png' } })
    await expect(uploadUserAvatar({ mimeType: 'image/png', imageBase64: 'aGVsbG8=' }))
      .resolves.toBe('https://cdn.example.com/avatar.png')
    const config = mocks.request.mock.calls[0][0]
    expect(config.method).toBe('POST')
    expect(config.url).toBe('/api/upload/image')
    expect(config.data).toBeInstanceOf(FormData)
    expect(config.data.get('file')).toBeInstanceOf(File)
  })

  it('does not report success if upload returns a server-local URL', async () => {
    mocks.request.mockResolvedValue({ code: 0, data: { url: 'http://127.0.0.1:7002/storage/a.png' } })
    await expect(uploadUserAvatar({ mimeType: 'image/jpeg', imageBase64: 'aGVsbG8=' }))
      .rejects.toThrow('HTTPS')
  })

  it('rejects invalid MIME types without making a network call', async () => {
    await expect(uploadUserAvatar({ mimeType: 'application/pdf', imageBase64: 'aGVsbG8=' })).rejects.toThrow('JPG')
    expect(mocks.request).not.toHaveBeenCalled()
  })
})
