import { describe, expect, it } from 'vitest'

import { SIGN_RECORD_STATUS_MAKEUP, SIGN_RECORD_STATUS_SIGNED } from '../../services/signrecords'
import type { SignRecordMock } from '../fixtures/checkin'
import { deriveMockActivitySignedDays, deriveMockSignStatus } from './checkin'

const record = (id: number, createTime: string, status: number): SignRecordMock => {
  const [year, month, day] = createTime.slice(0, 10).split('-')
  return {
    id,
    create_time: createTime,
    update_time: createTime,
    delete_time: null,
    user_id: 9001,
    points: 0,
    consecutive_days: 0,
    status,
    day,
    month,
    year,
  }
}

describe('checkin mock sign status', () => {
  it('does not treat a makeup operation created today as today signed', () => {
    const today = new Date(2026, 8, 29)
    const status = deriveMockSignStatus(
      [
        record(1, '2026-09-29 09:00:00', SIGN_RECORD_STATUS_MAKEUP),
        record(2, '2026-09-28 09:00:00', SIGN_RECORD_STATUS_SIGNED),
      ],
      today,
    )

    expect(status).toEqual({ signed: false, consecutiveDays: 2 })
  })

  it('reports activity signed_days as already-completed consecutive days', () => {
    const today = new Date(2026, 8, 29)
    const records = [
      record(1, '2026-09-28 09:00:00', SIGN_RECORD_STATUS_SIGNED),
      record(2, '2026-09-27 09:00:00', SIGN_RECORD_STATUS_SIGNED),
      record(3, '2026-09-26 09:00:00', SIGN_RECORD_STATUS_SIGNED),
      record(4, '2026-09-25 09:00:00', SIGN_RECORD_STATUS_MAKEUP),
    ]

    expect(deriveMockSignStatus(records, today)).toEqual({ signed: false, consecutiveDays: 4 })
    expect(deriveMockActivitySignedDays(records, today)).toBe(3)
  })

  it('returns the actual consecutive count once today is normally signed', () => {
    const today = new Date(2026, 8, 29)
    const status = deriveMockSignStatus(
      [
        record(1, '2026-09-29 09:00:00', SIGN_RECORD_STATUS_SIGNED),
        record(2, '2026-09-28 09:00:00', SIGN_RECORD_STATUS_SIGNED),
        record(3, '2026-09-27 09:00:00', SIGN_RECORD_STATUS_SIGNED),
        record(4, '2026-09-26 09:00:00', SIGN_RECORD_STATUS_MAKEUP),
      ],
      today,
    )

    expect(status).toEqual({ signed: true, consecutiveDays: 3 })
  })
})
