import DOMPurify from 'dompurify'
import { z } from 'zod'
import type { NotificationFixture, NotificationCategory } from '../app/fixtures/notifications'
import { parseApiEnvelope } from './contracts/apiEnvelope'
import { httpClient } from './http'

export const NOTICES_INDEX_PATH = '/api/notices/index'
export const NOTICES_DETAIL_PATH = '/api/notices/detail'
export const NOTICES_UNREAD_PATH = '/api/notices/unread-count'
export const NOTICES_READ_ALL_PATH = '/api/notices/read-all'

/** Client-facing notices contract, backend API/master@7e1f710 (not proof of deployment). */
const noticeSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  content: z.string().nullable(),
  type: z.number().int(),
  send_time: z.number().nullable(),
  create_time: z.string(),
  extra_json: z.string().nullable().optional(),
  is_read: z.number().int(),
}).passthrough()

const pageSchema = z.object({
  data: z.array(noticeSchema),
  current_page: z.number().int().positive(),
  per_page: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  last_page: z.number().int().positive(),
}).passthrough()

const countsSchema = z.object({
  total: z.number().int().nonnegative(),
  items: z.array(z.object({
    type: z.number().int(),
    name: z.string(),
    unread: z.number().int().nonnegative(),
  }).passthrough()),
}).passthrough()

const readAllSchema = z.object({ count: z.number().int().nonnegative() }).passthrough()

export type BackendNotice = z.infer<typeof noticeSchema>
export type BackendNoticePage = z.infer<typeof pageSchema>
export type NoticeUnreadCounts = z.infer<typeof countsSchema>

export async function fetchNoticePage(page = 1, pageSize = 30, type?: number): Promise<BackendNoticePage> {
  const payload = await httpClient.request<unknown>({
    method: 'GET',
    url: NOTICES_INDEX_PATH,
    params: { page, pageSize, ...(type == null ? {} : { type }) },
  })
  return parseApiEnvelope(payload, pageSchema, {
    contract: 'notices.index',
    fallbackMessage: '通知列表获取失败',
  })
}

export async function fetchNoticeDetail(id: string): Promise<BackendNotice> {
  if (!/^[1-9]\d*$/.test(id)) throw new Error('无效通知编号')
  const payload = await httpClient.request<unknown>({
    method: 'GET', url: NOTICES_DETAIL_PATH, params: { id: Number(id) },
  })
  return parseApiEnvelope(payload, noticeSchema, {
    contract: 'notices.detail',
    fallbackMessage: '通知详情获取失败',
  })
}

export async function fetchNoticeUnreadCounts(): Promise<NoticeUnreadCounts> {
  const payload = await httpClient.request<unknown>({ method: 'GET', url: NOTICES_UNREAD_PATH })
  return parseApiEnvelope(payload, countsSchema, {
    contract: 'notices.unread-count', fallbackMessage: '未读消息数量获取失败',
  })
}

export async function readAllNotices(type?: number): Promise<number> {
  const payload = await httpClient.request<unknown>({
    method: 'POST', url: NOTICES_READ_ALL_PATH, data: type == null ? {} : { type },
  })
  return parseApiEnvelope(payload, readAllSchema, {
    contract: 'notices.read-all', fallbackMessage: '全部已读操作失败',
  }).count
}

/** Notice HTML is untrusted; produce TEXT, not innerHTML, and never invent a click-through CTA. */
export function noticeText(content: string | null): string {
  if (!content) return ''
  const withBreaks = content
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/(?:div|p|li|h[1-6])\s*>/gi, '\n')
  const clean = DOMPurify.sanitize(withBreaks, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    RETURN_DOM: true,
  })
  return (clean.textContent ?? '').replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').trim()
}

function noticeCategory(type: number): NotificationCategory {
  if (type === 20) return 'activity'
  if (type === 30) return 'balance'
  if (type === 40) return 'event'
  if (type === 50) return 'service'
  return 'system' // 10 system; 60 friend application (read-only; #111 handles confirmation)
}

function noticeTime(notice: BackendNotice): string {
  const timestamp = notice.send_time != null
    ? notice.send_time * 1000
    : Date.parse(notice.create_time.replace(' ', 'T') + '+08:00')
  if (!Number.isFinite(timestamp)) return notice.create_time
  const date = new Date(timestamp)
  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  const yesterdayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1).getTime()
  const time = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
  if (timestamp >= todayStart) return `今天 ${time}`
  if (timestamp >= yesterdayStart) return `昨天 ${time}`
  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
}

export function mapNotice(notice: BackendNotice): NotificationFixture {
  const plain = noticeText(notice.content)
  return {
    id: String(notice.id),
    cat: noticeCategory(notice.type),
    title: notice.title,
    summary: plain.slice(0, 110),
    time: noticeTime(notice),
    unread: notice.is_read === 0,
    paragraphs: plain.split(/\n+/).map(text => text.trim()).filter(Boolean),
  }
}
