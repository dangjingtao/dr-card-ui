import { z, type ZodType } from 'zod'

import { createBusinessError } from '../http'
import { parseContract } from './parseContract'

/**
 * 7002 业务接口通用信封（契约来源：2026-09-28 首页联调文档 + 后端确认）。
 *
 * 2026-09-28 后端已统一成功码为 `code: 0`（兼容原生；`GET /api/user/detail` 此前的
 * `code: 200` 也一并改回 0），正式接口共用本解析，不保留旧 200 口径的兼容分支。
 *
 * - 成功：HTTP 200 `{ code: 0, msg: 'success', data, status: 'succ' }`
 * - 失败：`{ code: 400|401|500, message, data: [] }`（字段名是 message，不是 msg，且没有 status）
 *
 * 判断成败只看 `code === 0`：参数校验失败时 HTTP 状态码仍是 200，axios 的 catch 拦不住，
 * 因此必须在解析层判 code，不能依赖 HTTP 状态码。
 */
const apiEnvelopeSchema = z
  .object({
    code: z.union([z.number(), z.string()]),
    msg: z.string().optional(),
    message: z.string().optional(),
    status: z.string().optional(),
    data: z.unknown(),
  })
  .passthrough()

export function isApiSuccessCode(code: number | string): boolean {
  return code === 0 || code === '0'
}

export function parseApiEnvelope<T>(
  payload: unknown,
  dataSchema: ZodType<T>,
  context: { contract: string; fallbackMessage: string },
): T {
  const envelope = parseContract(apiEnvelopeSchema, payload, {
    source: 'api',
    contract: `${context.contract}.envelope`,
  })

  if (!isApiSuccessCode(envelope.code)) {
    throw createBusinessError(envelope.message ?? envelope.msg ?? context.fallbackMessage)
  }

  return parseContract(dataSchema, envelope.data, {
    source: 'api',
    contract: `${context.contract}.data`,
  })
}