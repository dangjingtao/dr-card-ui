import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import CheckinBoard, { type HomeSignStatusView } from './CheckinBoard'

afterEach(cleanup)

function renderBoard(signStatus?: HomeSignStatusView) {
  render(
    <MemoryRouter>
      <CheckinBoard signStatus={signStatus} />
    </MemoryRouter>,
  )
  return within(screen.getByRole('region', { name: '每日任务' }))
}

describe('每日打卡奖励', () => {
  it('uses the same real sign status points as the 7-day status hint', () => {
    const mission = renderBoard({
      signed: false,
      consecutiveDays: 1,
      points: 10,
      rewardDesc: '',
    })
    expect(mission.getByText(/\+10 泡泡值/)).toBeTruthy()
    expect(mission.queryByText(/\+100 泡泡值/)).toBeNull()
    expect(mission.getByText('待完成')).toBeTruthy()
  })

  it('updates the reward with the returned value after signing in', () => {
    const mission = renderBoard({
      signed: true,
      consecutiveDays: 1,
      points: 20,
      rewardDesc: '',
    })
    expect(mission.getByText(/\+20 泡泡值/)).toBeTruthy()
    expect(mission.getByText('已完成')).toBeTruthy()
  })

  it('does not invent a reward while the sign status is unavailable', () => {
    const mission = renderBoard()
    expect(mission.queryByText(/\+\d+ 泡泡值/)).toBeNull()
  })
})
