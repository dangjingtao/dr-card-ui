import { type ZodType, type ZodError } from 'zod'

import { createContractError } from '../http/appError'

export type ContractSource = 'api' | 'mock' | 'bridge'

export interface ContractContext {
  source: ContractSource
  contract: string
}

export interface ContractIssue {
  code: string
  path: string[]
  message: string
}

function normalizeIssues(error: ZodError): ContractIssue[] {
  return error.issues.map((issue) => ({
    code: issue.code,
    path: issue.path.map(String),
    message: issue.message,
  }))
}

/**
 * Parse data exactly where an untrusted transport boundary becomes application data.
 *
 * The raw payload is intentionally not copied into AppError.details: API and Bridge
 * payloads may contain sensitive data. Callers get the contract identity and Zod
 * issues needed for diagnostics without leaking the original payload.
 */
export function parseContract<T>(schema: ZodType<T>, input: unknown, context: ContractContext): T {
  const result = schema.safeParse(input)

  if (result.success) return result.data

  throw createContractError(`外部数据不符合 ${context.contract} 契约`, {
    code: 'CONTRACT_VALIDATION_FAILED',
    details: {
      source: context.source,
      contract: context.contract,
      issues: normalizeIssues(result.error),
    },
    cause: result.error,
  })
}
