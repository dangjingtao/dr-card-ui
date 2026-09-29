import { describe, expect, it } from 'vitest'

import {
  SIGN_ACTIVITY_STATUS_ACTIVE,
  SIGN_ACTIVITY_STATUS_CLOSED,
  SIGN_ACTIVITY_STATUS_PENDING,
  type SignActivity,
} from '../services/signrecords'
import { toActivityView } from './Points'

function activity(status: number, signedDays = 2, maxDays = 7): SignActivity {
  return {
    id: 1,
    title: '连续签到',
    type: 10,
    image: null,
    is_makeup: 1,
    status,
    sort_number: 1,
    max_days: maxDays,
    signed_days: signedDays,
  }
}

describe('Points sign-activity view mapping', () => {
  it('keeps pending, active, and closed backend states semantically distinct', () => {
    expect(toActivityView(activity(SIGN_ACTIVITY_STATUS_PENDING)).stateLabel).toBe('未开始')
    expect(toActivityView(activity(SIGN_ACTIVITY_STATUS_ACTIVE)).stateLabel).toBe('进行中')
    expect(toActivityView(activity(SIGN_ACTIVITY_STATUS_CLOSED)).stateLabel).toBe('已关闭')
  })

  it('keeps completed progress as completed even when the activity is closed', () => {
    expect(toActivityView(activity(SIGN_ACTIVITY_STATUS_CLOSED, 7, 7))).toMatchObject({
      state: 'done',
      stateLabel: '已完成',
    })
  })
})
