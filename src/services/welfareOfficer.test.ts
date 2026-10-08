import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  fetchWelfareOfficerConfig,
  parseWelfareOfficerConfig,
  resolveWelfareImageUrl,
  WELFARE_OFFICER_SETTINGS_KEY,
} from './welfareOfficer'

const mocks = vi.hoisted(() => ({ request: vi.fn() }))

vi.mock('./http', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./http')>()
  return { ...actual, httpClient: { request: mocks.request } }
})

describe('welfare officer backend settings contract', () => {
  beforeEach(() => mocks.request.mockReset())

  it('requests dedicated welfare config key without mixing with rich-text welfare', async () => {
    mocks.request.mockResolvedValue({ code: 0, msg: 'success', data: {} })
    await expect(fetchWelfareOfficerConfig()).resolves.toMatchObject({ configured: false, benefits: [] })
    expect(mocks.request).toHaveBeenCalledWith({
      method: 'GET', url: '/api/settings/detail',
      params: { key: WELFARE_OFFICER_SETTINGS_KEY },
    })
    expect(WELFARE_OFFICER_SETTINGS_KEY).not.toBe('welfare')
  })

  it('reads a configured title, subtitle, QR and benefits', () => {
    expect(parseWelfareOfficerConfig({
      code: 0, msg: 'success', status: 'succ',
      data: {
        title: '福利官', subtitle: '扫码咨询',
        qrcode: 'https://cdn.example.com/welfare.png',
        benefits: [
          { image: 'https://cdn.example.com/benefit.png', title: '人工客服', description: '帮助答疑' },
        ],
      },
    })).toEqual({
      title: '福利官', subtitle: '扫码咨询',
      qrcodeUrl: 'https://cdn.example.com/welfare.png',
      qrcodeUnavailable: false,
      benefits: [{ title: '人工客服', description: '帮助答疑', imageUrl: 'https://cdn.example.com/benefit.png' }],
      configured: true,
    })
  })

  it('treats a missing or non-array benefits field as an empty collection', () => {
    for (const data of [{}, { benefits: null }, { benefits: 'no-benefits' }]) {
      expect(parseWelfareOfficerConfig({ code: 0, data })).toMatchObject({
        title: '', subtitle: '', benefits: [],
      })
    }
  })

  it('hides loopback/mixed-content QR URLs instead of making unscannable promises', () => {
    expect(parseWelfareOfficerConfig({
      code: 0, data: {
        title: '福利官',
        qrcode: 'http://127.0.0.1:7002/storage/qr.jpg',
        benefits: [{ image: 'http://127.0.0.1:7002/benefit.jpg', title: '福利抽奖', description: '' }],
      },
    })).toMatchObject({
      configured: true, qrcodeUnavailable: true,
      qrcodeUrl: undefined,
      benefits: [{ title: '福利抽奖', imageUrl: undefined }],
    })
  })

  it('only accepts HTTPS URLs and no embedded credentials', () => {
    for (const url of ['javascript:alert(1)', 'data:image/svg+xml;base64,PHN2Zz4=', '//cdn.example.com/qr.png', 'https://a:b@example.com/x', 'https://localhost/a', 'http://images.example.com/x']) {
      expect(resolveWelfareImageUrl(url)).toBeUndefined()
    }
    expect(resolveWelfareImageUrl('https://cdn.example.com/qr.png')).toBe('https://cdn.example.com/qr.png')
  })

  it('rejects unsuccessful business responses even if HTTP 200', () => {
    expect(() => parseWelfareOfficerConfig({ code: 500, message: '配置读取失败', data: [] })).toThrow('配置读取失败')
  })

  it('rejects malformed config field types instead of rendering untrusted content', () => {
    expect(() => parseWelfareOfficerConfig({ code: 0, data: { title: 23 } })).toThrow()
    expect(() => parseWelfareOfficerConfig({ code: 0, data: { benefits: [{ title: 23 }] } })).toThrow()
  })
})
