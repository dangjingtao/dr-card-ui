import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fetchHomeBanners, resolveBannerLink, type BannerItem } from './banners'

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
}))

vi.mock('./http', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./http')>()
  return { ...actual, httpClient: { request: mocks.request } }
})

/** 契约来源：2026-09-28 首页联调文档响应示例。 */
const verifiedEnvelope = {
  code: 0,
  msg: 'success',
  status: 'succ',
  data: {
    data: [
      {
        id: 3,
        title: '开学季活动',
        image: 'https://cdn.example.com/banner/1.png',
        link_url: 'https://app.example.com/h5/#/activity/9',
        link_type: 20,
        sort: 100,
        position: 10,
        status: 10,
        create_time: '2026-09-20 10:00:00',
        update_time: '2026-09-20 10:00:00',
        delete_time: null,
      },
    ],
    current_page: 1,
    per_page: 10,
    total: 1,
    last_page: 1,
  },
}

describe('home banners contract', () => {
  beforeEach(() => {
    mocks.request.mockReset()
  })

  it('requests home top banners with the documented params', async () => {
    mocks.request.mockResolvedValue(verifiedEnvelope)

    const items = await fetchHomeBanners()

    expect(mocks.request).toHaveBeenCalledWith({
      method: 'GET',
      url: '/api/banners/index',
      params: { position: 10, status: 10, page: 1, pageSize: 10, 'orderBy[sort]': 'DESC' },
    })
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({ id: 3, link_type: 20 })
  })

  it('throws a business error when code is not 0', async () => {
    mocks.request.mockResolvedValue({ code: 401, message: '请先登录', data: [] })

    await expect(fetchHomeBanners()).rejects.toMatchObject({
      kind: 'business',
      message: '请先登录',
    })
  })

  it('rejects payloads that miss the list shape', async () => {
    mocks.request.mockResolvedValue({ code: 0, msg: 'success', data: [] })

    await expect(fetchHomeBanners()).rejects.toMatchObject({ kind: 'contract' })
  })
})

describe('banner link resolution', () => {
  const banner = (overrides: Partial<BannerItem>): BannerItem => ({ id: 1, ...overrides })

  it('maps hash routes of full URLs to internal paths', () => {
    expect(
      resolveBannerLink(banner({ link_type: 10, link_url: 'https://app.example.com/h5/#/activity/9' })),
    ).toEqual({ kind: 'internal', to: '/activity/9' })
  })

  it('accepts relative paths and hash-only routes', () => {
    expect(resolveBannerLink(banner({ link_type: 10, link_url: '/checkin' }))).toEqual({
      kind: 'internal',
      to: '/checkin',
    })
    expect(resolveBannerLink(banner({ link_type: 10, link_url: '#/dearseed?overlay=newcomer' }))).toEqual({
      kind: 'internal',
      to: '/dearseed?overlay=newcomer',
    })
  })

  it('keeps external links as href', () => {
    expect(resolveBannerLink(banner({ link_type: 20, link_url: 'https://example.com/a' }))).toEqual({
      kind: 'external',
      href: 'https://example.com/a',
    })
  })

  it('returns null for display-only banners and unmappable links', () => {
    expect(resolveBannerLink(banner({ link_type: 0, link_url: 'https://example.com/a' }))).toBeNull()
    expect(resolveBannerLink(banner({ link_type: 10, link_url: 'https://example.com/no-hash' }))).toBeNull()
    expect(resolveBannerLink(banner({ link_type: 10, link_url: null }))).toBeNull()
  })
})