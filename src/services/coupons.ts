import { z } from 'zod'

import { parseApiEnvelope } from './contracts/apiEnvelope'
import { httpClient } from './http'

/**
 * 7002「优惠券管理」接口（本地联调：dev server `/api` 透传到 7002，无需 salt / token）。
 * 契约来源：http://192.168.1.81:7002/swagger-ui/index.json
 * + 客户端《签到页面接口文档》第 4 节「体验券列表」（2026-09-29 对齐）。
 *
 * ℹ️ 该接口**不读取登录用户身份，不要求 `Authorization` 请求头**（文档明确）。
 * 全局 auth session provider 仍会按需注入头，但服务端不依赖它。
 *
 * 同路径两条消费方式并存：
 * - `fetchCouponList`：首页/卡券页在用，返回原始信封，容忍后端字段轻微漂移；
 * - `fetchCouponIndex`：我的页在用，走 zod 契约 + `parseApiEnvelope`，失败显式抛错。
 * 两者共用 `COUPON_LIST_PATH`，不重复定义路径。
 */
export const COUPON_LIST_PATH = '/api/coupons/index'

/** coupons.status：10=上架，20=下架（后端 schema 定义，非前端推断）。 */
export const COUPON_STATUS_ON_SHELF = 10

/** 文档口径每页条数上限（`pageSize` 最大 100）。 */
export const COUPON_PAGE_SIZE_MAX = 100

export interface CouponTemplate {
  id: number
  create_time?: string | null
  update_time?: string | null
  name: string
  short_desc?: string | null
  image?: string | null
  /** 兑换所需泡泡值 */
  points_number?: number | string | null
  /** 可兑换数量 */
  total_number?: number | null
  /** 已兑换数量（后端字段名即为 exchanged_nuuur） */
  exchanged_nuuur?: number | null
  /** 后端扩展字段，当前无消费方 */
  extra_data?: unknown
  status?: number | null
  category_id?: string | number | null
}

export interface CouponListPage {
  data: CouponTemplate[]
  current_page: number
  per_page: number
  total: number
  last_page: number
}

export interface CouponListEnvelope {
  code: number
  msg: string
  status?: string
  data: CouponListPage
}

/**
 * 我的页券模板契约：只强约束列表必备字段与分页结构，其余字段整体放行，
 * 避免后端新增字段触发契约失败。`points_number` 后端可能返回字符串，
 * 因此按 `number | string` 容错。未确认字段（包括可能存在的 `category_id`）由 passthrough 放行，
 * 但不进入当前正式消费契约。
 */
const couponTemplateSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    short_desc: z.string().nullish(),
    image: z.string().nullish(),
    points_number: z.union([z.number(), z.string()]).nullish(),
    total_number: z.number().nullish(),
    exchanged_nuuur: z.number().nullish(),
    status: z.number().nullish(),
    create_time: z.string().nullish(),
    update_time: z.string().nullish(),
    extra_data: z.unknown().nullish(),
    category_id: z.union([z.number(), z.string()]).nullish(),
  })
  .passthrough()

const couponListPageSchema = z
  .object({
    data: z.array(couponTemplateSchema),
    current_page: z.number(),
    per_page: z.number(),
    total: z.number(),
    last_page: z.number(),
  })
  .passthrough()

export interface CouponListParams {
  /** coupons.status：10=上架（首页/卡券页固定），20=下架。2026-09-28 联调文档起为必填。 */
  status?: number
  page?: number
  pageSize?: number
}

export async function fetchCouponList(params: CouponListParams = {}): Promise<CouponListEnvelope> {
  return httpClient.request<CouponListEnvelope>({
    method: 'GET',
    url: COUPON_LIST_PATH,
    params: {
      status: params.status ?? COUPON_STATUS_ON_SHELF,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 50,
    },
  })
}

/** 我的页券模板分页默认每页条数（文档第 4 节：默认 15，上限 100）。 */
export const COUPON_PAGE_SIZE_DEFAULT = 15

/**
 * 我的页「优惠券列表」入参。
 *
 * 与 `fetchCouponList` 同路径（`GET /api/coupons/index`），差别只在本页按客户端文档口径消费：
 * - 走统一 `parseApiEnvelope` 契约校验，失败抛 `AppError`，页面按错误态渲染而非静默空列表；
 * - 默认 `page=1` / `pageSize=15`，分页结构取 `data.data` 嵌套两层。
 */
export interface CouponIndexParams {
  page?: number
  pageSize?: number
  /** 券状态过滤：10=上架，20=下架；不传由后端默认（全部）。 */
  status?: number
}

export async function fetchCouponIndex(
  params: CouponIndexParams = {},
): Promise<CouponListPage> {
  const pageSize = Math.min(params.pageSize ?? COUPON_PAGE_SIZE_DEFAULT, COUPON_PAGE_SIZE_MAX)

  const payload = await httpClient.request<unknown>({
    method: 'GET',
    url: COUPON_LIST_PATH,
    params: {
      status: params.status,
      page: params.page ?? 1,
      pageSize,
    },
  })

  return parseApiEnvelope(payload, couponListPageSchema, {
    contract: 'coupons.index',
    fallbackMessage: '优惠券列表获取失败',
  })
}

/**
 * 洗护体验券专区（/exchange）可消费的券视图模型。
 *
 * 由 `CouponTemplate` 收敛而来，页面只消费本模型，不再感知后端原始字段名与
 * `number | string` 漂移。字段映射（2026-09-29 与产品确认）：
 * - `cost` ← `points_number`（兑换所需泡泡值）；
 * - `redeemed` ← `exchanged_nuuur`（已兑换数量）；
 * - `soldOut` ← `exchanged_nuuur >= total_number` 或 `status !== 10`；
 * - `balance`（泡泡值不足）由页面持有的用户余额判定，不落在本模型里。
 *
 * 专区页字段口径（接口文档缺失字段用接口自身字段兜底，不臆造假字段）：
 * - 券详情说明取 `short_desc`；
 * - 商品图优先 `image`，接口返回空时由页面沿用本地品牌图兜底。
 */
export interface CouponRedeemView {
  id: number
  name: string
  /** 券详情说明；来自 `short_desc`。 */
  desc: string
  /** 兑换所需泡泡值；来自 `points_number`，非法值收敛为 0。 */
  cost: number
  /** 已兑换数量；来自 `exchanged_nuuur`，接口未给时为 0。 */
  redeemed: number
  /** 券图；`image` 为空串 / null 时收敛为 `undefined`，交由页面兜底。 */
  image?: string
  /** 是否已兑完（`exchanged_nuuur >= total_number` 或已下架）。 */
  soldOut: boolean
  /** Server category id (string/number normalized); absent means not safe to classify. */
  categoryId?: string
}

/** 后端数值字段可能以字符串返回，统一收敛为正整数。 */
function toCouponCount(value: number | string | null | undefined): number {
  const parsed = typeof value === 'string' ? Number(value) : value
  return typeof parsed === 'number' && Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

/** 纯解析：把券模板收成专区页视图模型（可单测，不触网）。 */
export function toCouponRedeemView(coupon: CouponTemplate): CouponRedeemView {
  const redeemed = toCouponCount(coupon.exchanged_nuuur)
  const total = coupon.total_number ?? null

  const rawCategoryId = coupon.category_id
  const categoryId = rawCategoryId == null ? undefined : String(rawCategoryId)

  return {
    categoryId,
    id: coupon.id,
    name: coupon.name,
    desc: coupon.short_desc?.trim() ?? '',
    cost: toCouponCount(coupon.points_number),
    redeemed,
    image: coupon.image?.trim() || undefined,
    soldOut: coupon.status !== COUPON_STATUS_ON_SHELF || (total !== null && redeemed >= total),
  }
}
