import { describe, expect, it } from 'vitest'

import { SIGN_RECORD_STATUS_MAKEUP, SIGN_RECORD_STATUS_SIGNED } from '../../services/signrecords'
import type { SignRecordMock } from '../fixtures/checkin'
import { deriveMockSignStatus } from './checkin'

const record = (id: number, createTime: string, status: number): SignRecordMock => ({
  id,
  create_time: createTime,
  update_time: createTime,
  delete_time: null,
  user_id: 9001,
  points: 0,
  consecutive_days: 0,
  status,
})

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
