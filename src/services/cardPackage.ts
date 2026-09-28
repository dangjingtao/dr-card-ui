import { md5 } from 'js-md5'

import { httpClient } from './http'

const DEFAULT_CARD_API_BASE_URL = 'https://app.dev.9kbs.com'
const DISCOUNT_CARD_LIST_PATH = '/api/users/activity/myDiscountcardlogsList'

export type CardApiScalar = string | number | boolean | null | undefined
export type CardApiValue = CardApiScalar | CardApiValue[] | { [key: string]: CardApiValue }

export interface CardApiEnvelope<TData = unknown> {
  code: string
  status: string
  msg: string
  data: TData
}

export interface CardApiCredentials {
  token: string
  salt: string
}

export interface DiscountCardListParams {
  type: 'unused' | 'used' | 'out_of_date'
  startIndex?: number
  pageSize?: number
}

export interface DiscountCardListRequest extends DiscountCardListParams {
  platform: 'h5'
  timesp: string
  token?: string
  secstr?: string
}

export interface CardApiClientOptions {
  baseURL?: string
  credentials?: CardApiCredentials
  now?: Date
}

export class CardApiConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CardApiConfigurationError'
  }
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

/** Upstream-compatible local time format: yyyy-MM-dd hh:mm:ss. */
export function formatCardApiTimesp(date = new Date()): string {
  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`,
  ].join(' ')
}

function assembleValue(value: CardApiValue): string {
  if (Array.isArray(value)) {
    return value.map((item, index) => `${index}${assembleValue(item)}`).join('')
  }

  if (value !== null && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .map((key) => key + assembleValue(value[key]))
      .join('')
  }

  return String(value ?? '')
}

/** Implements the upstream rule: sorted key + value pairs, wrapped by salt, then MD5. */
export function assembleCardApiParams(params: Record<string, CardApiValue>): string {
  return Object.keys(params)
    .filter((key) => key !== 'secstr' && key !== 'callback')
    .sort()
    .map((key) => key + assembleValue(params[key]))
    .join('')
}

export function createCardApiSignature(
  params: Record<string, CardApiValue>,
  salt: string,
): string {
  if (!salt.trim()) throw new CardApiConfigurationError('卡包接口 salt 未配置')
  return md5(`${salt}${assembleCardApiParams(params)}${salt}`)
}

function resolveCredentials(credentials?: CardApiCredentials): CardApiCredentials | undefined {
  const token = credentials?.token?.trim() || import.meta.env.VITE_CARD_API_TOKEN?.trim()
  const salt = credentials?.salt?.trim() || import.meta.env.VITE_CARD_API_SALT?.trim()
  if (!token && !salt) return undefined
  if (!token) throw new CardApiConfigurationError('卡包接口 token 未配置')
  if (!salt) throw new CardApiConfigurationError('卡包接口 salt 未配置')
  return { token, salt }
}

export function buildDiscountCardListRequest(
  params: DiscountCardListParams,
  credentials?: CardApiCredentials,
  now = new Date(),
): DiscountCardListRequest {
  const request: DiscountCardListRequest = {
    type: params.type,
    startIndex: params.startIndex ?? 0,
    pageSize: params.pageSize ?? 50,
    platform: 'h5',
    timesp: formatCardApiTimesp(now),
  }
  const resolved = resolveCredentials(credentials)
  if (!resolved) return request

  request.token = resolved.token
  request.secstr = createCardApiSignature({ ...request }, resolved.salt)
  return request
}

export function getCardApiCredentialsFromEnv(): CardApiCredentials | undefined {
  return resolveCredentials()
}

export async function requestDiscountCardList<TData = unknown>(
  params: DiscountCardListParams,
  options: CardApiClientOptions = {},
): Promise<CardApiEnvelope<TData>> {
  const request = buildDiscountCardListRequest(params, options.credentials, options.now)
  const form = new URLSearchParams()
  for (const [key, value] of Object.entries(request)) {
    if (value !== undefined) form.set(key, String(value))
  }

  return httpClient.request<CardApiEnvelope<TData>>({
    method: 'POST',
    url: `${options.baseURL?.trim() || import.meta.env.VITE_CARD_API_BASE_URL?.trim() || DEFAULT_CARD_API_BASE_URL}${DISCOUNT_CARD_LIST_PATH}`,
    data: form,
    withCredentials: true,
  })
}
