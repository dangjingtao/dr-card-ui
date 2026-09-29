import { describe, expect, it } from 'vitest'

import { buildCheckinCalendar } from './components/CheckinBoard'

const record = (id: number, createTime: string, status: number) => ({
  id,
  create_time: createTime,
  user_id: 3,
  points: 0,
  consecutive_days: 0,
  status,
})

describe('buildCheckinCalendar', () => {
  it('renders the local month with correct length and week offset', () => {
    // 2026-09：30 天，9 月 1 日是周二（offset = 2）。
    const calendar = buildCheckinCalendar({ today: new Date(2026, 8, 28), records: [] })

    expect(calendar.monthLabel).toBe('2026 年 9 月')
    expect(calendar.days).toHaveLength(30)
    expect(calendar.startOffset).toBe(2)
    expect(calendar.days[0].dateKey).toBe('2026-09-01')
    expect(calendar.days[29].dateKey).toBe('2026-09-30')
  })

  it('handles February in a leap year', () => {
    const calendar = buildCheckinCalendar({ today: new Date(2028, 1, 10), records: [] })

    expect(calendar.monthLabel).toBe('2028 年 2 月')
    expect(calendar.days).toHaveLength(29)
  })

  it('derives done / today / makeup / upcoming from records and local today', () => {
    const calendar = buildCheckinCalendar({
      today: new Date(2026, 8, 28),
      records: [record(1, '2026-09-26 09:00:00', 10), record(2, '2026-09-27 09:00:00', 20)],
    })

    const byDay = new Map(calendar.days.map((item) => [item.day, item]))
    expect(byDay.get(26)?.state).toBe('done')
    expect(byDay.get(27)?.state).toBe('done')
    expect(byDay.get(27)?.makeup).toBe(true)
    expect(byDay.get(28)?.state).toBe('today')
    expect(byDay.get(28)?.state).toBe('today')
    expect(byDay.get(25)?.state).toBe('makeup')
    expect(byDay.get(29)?.state).toBe('upcoming')
  })

  it('marks today as signed when a record exists for the local today', () => {
    const signed = buildCheckinCalendar({
      today: new Date(2026, 8, 28),
      records: [record(1, '2026-09-28 09:00:00', 10)],
    })
    expect(signed.todaySigned).toBe(true)

    const unsigned = buildCheckinCalendar({ today: new Date(2026, 8, 28), records: [] })
    expect(unsigned.todaySigned).toBe(false)
  })

  it('lights up optimistic makeup days not yet returned by the API', () => {
    const calendar = buildCheckinCalendar({
      today: new Date(2026, 8, 28),
      records: [],
      optimisticMakeupDays: ['2026-09-20'],
    })

    const day = calendar.days.find((item) => item.dateKey === '2026-09-20')
    expect(day?.state).toBe('done')
    expect(day?.makeup).toBe(true)
    expect(day?.makeupApplied).toBe(true)
  })

  it('does not flag an API-backed day as optimistic', () => {
    const calendar = buildCheckinCalendar({
      today: new Date(2026, 8, 28),
      records: [record(1, '2026-09-20 09:00:00', 20)],
      optimisticMakeupDays: ['2026-09-20'],
    })

    const day = calendar.days.find((item) => item.dateKey === '2026-09-20')
    expect(day?.makeupApplied).toBe(false)
  })

  it('counts lit days as signed days, including today when signed', () => {
    const unsignedToday = buildCheckinCalendar({
      today: new Date(2026, 8, 28),
      records: [record(1, '2026-09-26 09:00:00', 10), record(2, '2026-09-27 09:00:00', 10)],
    })
    // 26、27 已签 = 2；28 今天未签不计入。
    expect(unsignedToday.litDays).toBe(2)
    expect(unsignedToday.todaySigned).toBe(false)

    const signedToday = buildCheckinCalendar({
      today: new Date(2026, 8, 28),
      records: [record(1, '2026-09-26 09:00:00', 10), record(2, '2026-09-28 09:00:00', 10)],
    })
    // 26、28 已签 = 2；今天已签计入，且 state 仍为 today。
    expect(signedToday.litDays).toBe(2)
    expect(signedToday.todaySigned).toBe(true)
    expect(signedToday.days.find((item) => item.dateKey === '2026-09-28')?.state).toBe('today')
  })
})
