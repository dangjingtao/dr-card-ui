import { z } from 'zod'

import { parseApiEnvelope } from './contracts/apiEnvelope'
import { httpClient } from './http'
import { SETTINGS_DETAIL_PATH } from './settings'

/**
 * 福利官独立配置合同（#90）。与 settings.ts 的富文本 key='welfare' 不是同一业务。
 * 后端缺失配置时返回 code:0 / data:{}，不能用历史客服 fixture 冒充真实业务内容。
 */
export const WELFARE_OFFICER_SETTINGS_KEY = 'brand_welfare_setting'

const welfareBenefitSchema = z.object({
  image: z.string().optional().default(''),
  title: z.string().optional().default(''),
  description: z.string().optional().default(''),
}).passthrough()

const welfareSettingsSchema = z.object({
  title: z.string().optional().default(''),
  subtitle: z.string().optional().default(''),
  qrcode: z.string().optional().default(''),
  // 后端文档明确：benefits 未配置、非数组时按空数组处理。
  benefits: z.unknown().optional(),
}).passthrough()

/**
 * 微信二维码及权益图只允许可在 HTTPS App WebView 加载的公网 HTTPS URL。
 * 后端目前返回 http://127.0.0.1:7002/storage/...，绝不可猜公网域名或生成假二维码。
 */
export function resolveWelfareImageUrl(raw: string): string | undefined {
  const value = raw.trim()
  if (!value) return undefined
  try {
    const parsed = new URL(value)
    if (parsed.protocol !== 'https:' || !parsed.hostname || parsed.username || parsed.password) return undefined
    const host = parsed.hostname.toLowerCase()
    if (
      host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') ||
      host === '[::1]' || host === '0.0.0.0' ||
      /^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host) ||
      /^169\.254\./.test(host) || /^172\.(1[6-9]|2[0-9]|3[01])\./.test(host)
    ) return undefined
    return parsed.toString()
  } catch {
    return undefined
  }
}

export interface WelfareBenefit {
  title: string
  description: string
  imageUrl?: string
}

export interface WelfareOfficerConfig {
  title: string
  subtitle: string
  qrcodeUrl?: string
  /** 后端有二维码字段但 URL 不适合在手机加载；不能绘制占位 QR。 */
  qrcodeUnavailable: boolean
  benefits: WelfareBenefit[]
  configured: boolean
}

export function parseWelfareOfficerConfig(payload: unknown): WelfareOfficerConfig {
  const raw = parseApiEnvelope(payload, welfareSettingsSchema, {
    contract: 'settings.welfare-officer',
    fallbackMessage: '福利官配置获取失败',
  })
  const benefits = Array.isArray(raw.benefits)
    ? z.array(welfareBenefitSchema).parse(raw.benefits)
    : []

  const qrcodeUrl = resolveWelfareImageUrl(raw.qrcode)
  const title = raw.title.trim()
  const subtitle = raw.subtitle.trim()
  const rawQr = raw.qrcode.trim()
  return {
    title,
    subtitle,
    qrcodeUrl,
    qrcodeUnavailable: Boolean(rawQr && !qrcodeUrl),
    benefits: benefits.map((item) => ({
      title: item.title.trim(),
      description: item.description.trim(),
      imageUrl: resolveWelfareImageUrl(item.image),
    })),
    configured: Boolean(title || subtitle || rawQr || benefits.length),
  }
}

export async function fetchWelfareOfficerConfig(): Promise<WelfareOfficerConfig> {
  const payload = await httpClient.request<unknown>({
    method: 'GET',
    url: SETTINGS_DETAIL_PATH,
    params: { key: WELFARE_OFFICER_SETTINGS_KEY },
  })
  return parseWelfareOfficerConfig(payload)
}
