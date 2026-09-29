import { z } from 'zod'

import { parseApiEnvelope } from './contracts/apiEnvelope'
import { httpClient } from './http'

/**
 * 品牌文化 / 公益富文本配置。
 * `GET /api/settings/detail?key=...`，无需登录。
 */
export const SETTINGS_DETAIL_PATH = '/api/settings/detail'
export const SETTINGS_KEY_BRAND_CULTURE = 'brand_culture_setting'
export const SETTINGS_KEY_WELFARE = 'welfare'

export type RichTextSettingKey = typeof SETTINGS_KEY_BRAND_CULTURE | typeof SETTINGS_KEY_WELFARE

const richTextAliases = ['content', 'value', 'description', 'desc', 'text', 'html', 'rich_text'] as const

function readRichText(data: unknown): string {
  if (typeof data === 'string') return data
  if (!data || typeof data !== 'object') return ''
  const record = data as Record<string, unknown>
  for (const key of richTextAliases) {
    if (typeof record[key] === 'string') return record[key] as string
  }
  return ''
}

export function parseRichTextSetting(payload: unknown): string {
  const data = parseApiEnvelope(payload, z.unknown(), {
    contract: 'settings.richText',
    fallbackMessage: '页面内容获取失败',
  })
  return readRichText(data)
}

export async function fetchRichTextSetting(key: RichTextSettingKey): Promise<string> {
  const payload = await httpClient.request<unknown>({
    method: 'GET',
    url: SETTINGS_DETAIL_PATH,
    params: { key },
  })
  return parseRichTextSetting(payload)
}
