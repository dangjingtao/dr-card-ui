import { z } from 'zod'

import { parseApiEnvelope } from './contracts/apiEnvelope'
import { httpClient } from './http'

/**
 * 首页轮播（契约来源：2026-09-28 首页联调文档）。
 * `GET /api/banners/index`，无需登录；首页固定 position=10 / status=10，按 sort 倒序。
 */
export const BANNERS_INDEX_PATH = '/api/banners/index'

/** banners.position：10=模块首页顶部，20=兑换页面。 */
export const BANNER_POSITION_HOME_TOP = 10
/** banners.status：10=启用，20=禁用。 */
export const BANNER_STATUS_ENABLED = 10
/** banners.link_type：0=无跳转，10=内部链接，20=外部链接。 */
export const BANNER_LINK_TYPE_NONE = 0
export const BANNER_LINK_TYPE_INTERNAL = 10
export const BANNER_LINK_TYPE_EXTERNAL = 20

const bannerItemSchema = z
  .object({
    id: z.union([z.number(), z.string()]),
    title: z.string().nullish(),
    image: z.string().nullish(),
    link_url: z.string().nullish(),
    // 后端示例为 number，但同批接口存在 string 型数值字段先例（如 coupons.category_id），一并兼容。
    link_type: z.union([z.number(), z.string()]).nullish(),
  })
  .passthrough()

export type BannerItem = z.infer<typeof bannerItemSchema>

const bannerListSchema = z
  .object({
    data: z.array(bannerItemSchema),
  })
  .passthrough()

export interface FetchHomeBannersParams {
  pageSize?: number
}

export async function fetchHomeBanners(params: FetchHomeBannersParams = {}): Promise<BannerItem[]> {
  const payload = await httpClient.request<unknown>({
    method: 'GET',
    url: BANNERS_INDEX_PATH,
    params: {
      position: BANNER_POSITION_HOME_TOP,
      status: BANNER_STATUS_ENABLED,
      page: 1,
      pageSize: params.pageSize ?? 10,
      // 方括号由 axios 编码为 orderBy%5Bsort%5D=DESC，与联调文档要求一致。
      'orderBy[sort]': 'DESC',
    },
  })

  const page = parseApiEnvelope(payload, bannerListSchema, {
    contract: 'home.banners',
    fallbackMessage: '轮播加载失败',
  })
  return page.data
}

export type BannerLinkTarget =
  | { kind: 'internal'; to: string }
  | { kind: 'external'; href: string }

/**
 * 后台 link_url 收敛为 App 内路由：优先识别 hash 路由（`https://…/h5/#/activity/9`），
 * 其次相对路径（`/activity/9`）；其余形态（如不含 hash 的完整 URL）无法安全映射，返回 null 不跳转。
 */
export function toInternalRoute(linkUrl: string): string | null {
  const value = linkUrl.trim()
  if (!value) return null
  if (value.startsWith('/')) return value

  const hashIndex = value.indexOf('#')
  if (hashIndex >= 0) {
    const hashRoute = value.slice(hashIndex + 1)
    if (hashRoute.startsWith('/')) return hashRoute
  }

  return null
}

/** 按 link_type 解析点击行为：0=仅展示（null），10=内部路由，20=外部打开。 */
export function resolveBannerLink(item: BannerItem): BannerLinkTarget | null {
  const linkUrl = item.link_url?.trim()
  if (!linkUrl) return null

  const linkType = Number(item.link_type)

  if (linkType === BANNER_LINK_TYPE_INTERNAL) {
    const to = toInternalRoute(linkUrl)
    return to ? { kind: 'internal', to } : null
  }

  if (linkType === BANNER_LINK_TYPE_EXTERNAL) {
    return /^https?:\/\//i.test(linkUrl) ? { kind: 'external', href: linkUrl } : null
  }

  return null
}