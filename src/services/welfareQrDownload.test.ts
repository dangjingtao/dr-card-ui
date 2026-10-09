import { afterEach, describe, expect, it, vi } from 'vitest'
import { requestWelfareQrDownload } from './welfareQrDownload'

const originalCreate = URL.createObjectURL
const originalRevoke = URL.revokeObjectURL

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.useRealTimers()
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: originalCreate })
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: originalRevoke })
})

function withBrowserDownload() {
  const createUrl = vi.fn().mockReturnValue('blob:download-qr')
  const revokeUrl = vi.fn()
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createUrl })
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeUrl })
  const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    expect(this.download).toBe('brand-welfare-qr.png')
    expect(this.href).toContain('blob:download-qr')
    expect(document.body.contains(this)).toBe(true)
  })
  return { createUrl, revokeUrl, anchorClick }
}

describe('welfare QR H5 download attempt', () => {
  it('requests cross-origin image as a blob and triggers browser download without claiming album storage', async () => {
    vi.useFakeTimers()
    const { createUrl, revokeUrl, anchorClick } = withBrowserDownload()
    const response = new Response(new Blob(['qr-image'], { type: 'image/png' }), {
      status: 200, headers: { 'Content-Type': 'image/png' },
    })
    const fetchMock = vi.fn().mockResolvedValue(response)
    vi.stubGlobal('fetch', fetchMock)

    await requestWelfareQrDownload('https://cdn.example.com/qr.png')
    expect(fetchMock).toHaveBeenCalledWith('https://cdn.example.com/qr.png', {
      mode: 'cors', credentials: 'omit',
    })
    expect(createUrl).toHaveBeenCalledOnce()
    expect(anchorClick).toHaveBeenCalledOnce()
    expect(revokeUrl).not.toHaveBeenCalled()
    vi.advanceTimersByTime(30_000)
    expect(revokeUrl).toHaveBeenCalledWith('blob:download-qr')
  })

  it('fails safely when CORS/network prevents fetching the image', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    await expect(requestWelfareQrDownload('https://cdn.example.com/qr.png'))
      .rejects.toThrow('Failed to fetch')
  })

  it('rejects an HTML response instead of downloading a fake QR', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(new Blob(['<html>login</html>'], { type: 'text/html' }), { status: 200 }),
    ))
    await expect(requestWelfareQrDownload('https://cdn.example.com/qr.png'))
      .rejects.toThrow('图片格式或大小')
  })
})
