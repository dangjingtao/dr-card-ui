import { z } from 'zod'

import { parseApiEnvelope } from './contracts/apiEnvelope'
import { httpClient } from './http'

/**
 * 品牌文化配置（契约来源：2026-09-28 首页联调文档）。
 * `GET /api/settings/detail`，无需登录。
 *
 * ⚠️ 后台文档只描述了语义（「品牌文化描述 + 公益板块描述」），未给出响应字段名。
 * 当前用集中别名读取作为联调期防御：字段名确认后，把命中的别名收敛为唯一字段并删除别名表。
 * 未命中时页面回退已确认的静态文案，不会渲染空白。
 */
export const SETTINGS_DETAIL_PATH = '/api/settings/detail'

/** data 可能为空数组 / null（后端信封默认 []），此时视为「无配置」。 */
const settingsDataSchema = z
  .union([z.object({}).passthrough(), z.array(z.unknown()), z.null()])
  .transform((value) => (value && !Array.isArray(value) ? value : {}) as Record<string, unknown>)

/**
 * 待联调确认的字段别名（按优先级）。
 * mock 数据（src/mocks/fixtures/home.ts）使用第一候选，保证 mock 模式与联调假设一致。
 */
const SETTINGS_TEXT_ALIASES = {
  /** 品牌文化（品牌故事）描述 */
  brandCulture: ['brand_culture', 'brand_culture_desc', 'brand_story'],
  /** 公益板块描述 */
  cause: ['cause', 'cause_desc', 'welfare_desc'],
} as const

export interface HomeSettings {
  brandCultureText?: string
  causeText?: string
}

function readText(data: Record<string, unknown>, aliases: readonly string[]): string | undefined {
  for (const key of aliases) {
    const value = data[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return undefined
}

export function parseHomeSettings(payload: unknown): HomeSettings {
  const data = parseApiEnvelope(payload, settingsDataSchema, {
    contract: 'home.settings',
    fallbackMessage: '品牌文化配置获取失败',
  })

  return {
    brandCultureText: readText(data, SETTINGS_TEXT_ALIASES.brandCulture),
    causeText: readText(data, SETTINGS_TEXT_ALIASES.cause),
  }
}

export async function fetchHomeSettings(): Promise<HomeSettings> {
  const payload = await httpClient.request<unknown>({
    method: 'GET',
    url: SETTINGS_DETAIL_PATH,
  })

  return parseHomeSettings(payload)
}