import { describe, expect, it } from 'vitest'

import { AppError } from '../../lib/appError'
import { parseH009MockPayload } from './h009MockExample'

function captureAppError(run: () => unknown): AppError {
  try {
    run()
  } catch (error) {
    if (error instanceof AppError) return error
    throw error
  }

  throw new Error('Expected AppError to be thrown')
}

describe('runtime contracts', () => {
  it('parses valid transport data and strips additive fields', () => {
    expect(
      parseH009MockPayload({
        id: 'mock-1',
        label: 'H017 contract probe',
        enabled: true,
        additiveField: 'ignored safely',
      }),
    ).toEqual({
      id: 'mock-1',
      label: 'H017 contract probe',
      enabled: true,
    })
  })

  it('turns invalid transport data into a diagnosable contract AppError', () => {
    const error = captureAppError(() =>
      parseH009MockPayload({
        id: '',
        label: 'broken payload',
        enabled: 'yes',
      }),
    )

    expect(error.kind).toBe('contract')
    expect(error.code).toBe('CONTRACT_VALIDATION_FAILED')
    expect(error.details).toMatchObject({
      source: 'mock',
      contract: 'h009.mock-example',
    })

    const details = error.details as { issues?: Array<{ path?: string[] }> }
    expect(details.issues?.some((issue) => issue.path?.[0] === 'enabled')).toBe(true)
  })

  it('does not leak the raw rejected payload into error details', () => {
    const sensitiveValue = 'h017-secret-probe-do-not-leak'
    const error = captureAppError(() =>
      parseH009MockPayload({
        id: 'mock-2',
        label: 'sensitive probe',
        enabled: sensitiveValue,
      }),
    )

    expect(JSON.stringify(error.details)).not.toContain(sensitiveValue)
  })
})
