import { z } from 'zod'
import type { ChatMessage } from '../app/fixtures'
import { parseApiEnvelope } from './contracts/apiEnvelope'
import { httpClient } from './http'

export const CHAT_MESSAGES_INDEX_PATH = '/api/chatmessages/index'
export const CHAT_HISTORY_PAGE_SIZE = 30

/** Backend history returns SQL date strings; Socket.IO may later use epoch seconds. */
const identity = z.union([z.number().int().nonnegative(), z.string().regex(/^\d+$/)])
export const chatRecordSchema = z.object({
  id: z.number().int().positive(),
  content: z.string(),
  user_id: identity,
  sender_id: identity,
  msg_type: z.number().int(),
  create_time: z.union([z.string().min(1), z.number().int().nonnegative()]),
}).passthrough()
const chatPageSchema = z.object({
  data: z.array(chatRecordSchema),
  current_page: z.number().int().positive(),
  per_page: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  last_page: z.number().int().positive(),
}).passthrough()

export type BackendChatRecord = z.infer<typeof chatRecordSchema>
export type BackendChatPage = z.infer<typeof chatPageSchema>
export interface ChatHistoryMessage extends ChatMessage {
  kind: 'user' | 'service' | 'system'
  msgType: number
  createdAt: string | number
}

export function mapChatRecord(record: BackendChatRecord): ChatHistoryMessage {
  const system = record.msg_type === 7
  const fromService = String(record.sender_id) === '0'
  return {
    id: String(record.id),
    role: system || fromService ? 'bot' : 'user',
    kind: system ? 'system' : fromService ? 'service' : 'user',
    text: record.content,
    status: 'sent',
    msgType: record.msg_type,
    createdAt: record.create_time,
  }
}

/** Stable server ID order; neither timestamp format nor array position decides identity. */
export function mergeChatHistory(
  existing: readonly ChatHistoryMessage[],
  incoming: readonly ChatHistoryMessage[],
): ChatHistoryMessage[] {
  const merged = new Map(existing.map(message => [message.id, message]))
  for (const message of incoming) merged.set(message.id, message)
  return Array.from(merged.values()).sort((a, b) => Number(a.id) - Number(b.id))
}

export async function fetchChatHistoryPage(
  page = 1,
  pageSize = CHAT_HISTORY_PAGE_SIZE,
  signal?: AbortSignal,
): Promise<BackendChatPage> {
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    throw new Error('客服历史分页参数无效')
  }
  const payload = await httpClient.request<unknown>({
    method: 'GET', url: CHAT_MESSAGES_INDEX_PATH, params: { page, pageSize }, signal,
  })
  return parseApiEnvelope(payload, chatPageSchema, {
    contract: 'chatmessages.index', fallbackMessage: '客服聊天历史获取失败',
  })
}
