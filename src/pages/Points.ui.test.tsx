import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'

const mock = vi.hoisted(() => ({
  activity: { state: 'loading' } as
    | { state: 'loading' }
    | { state: 'error'; message: string }
    | { state: 'success'; data: Array<{
        id: number; title: string; type: number; image: null; is_makeup: number
        status: number; sort_number: number; max_days: number; signed_days: number
      }> },
  reload: vi.fn(),
}))

vi.mock('./points/usePointsFeed', () => ({
  useUserPointsStat: () => ({
    remote: { state: 'success', data: { points: 123, income: 200, expense: 77 } },
    reload: vi.fn(),
  }),
  useSignActivityList: () => ({ remote: mock.activity, reload: mock.reload }),
}))
vi.mock('../app/router/routes', () => ({
  findRouteByPathname: () => ({ path: '/points' }),
}))
vi.mock('../components/mobile/PageContainer', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))
vi.mock('../components/mobile/DebugPanel', () => ({ default: () => null }))

import Points from './Points'

function showPoints() {
  return render(<MemoryRouter><Points /></MemoryRouter>)
}

afterEach(() => {
  mock.activity = { state: 'loading' }
  mock.reload.mockReset()
})

describe('Points task truthfulness (UX-03)', () => {
  it('renders actual sign activity without adding video or invite reward cards', () => {
    mock.activity = { state: 'success', data: [{
      id: 12, title: '每日签到', type: 10, image: null, is_makeup: 1,
      status: 20, sort_number: 1, max_days: 31, signed_days: 1,
    }] }
    showPoints()
    expect(screen.getByText('每日签到')).toBeTruthy()
    expect(screen.getByText('1/31')).toBeTruthy()
    expect(screen.queryByText('观看视频')).toBeNull()
    expect(screen.queryByText('邀请好友')).toBeNull()
    expect(screen.queryByText('+50')).toBeNull()
  })

  it('renders a genuine empty task state when the API has no activities', () => {
    mock.activity = { state: 'success', data: [] }
    showPoints()
    expect(screen.getByRole('heading', { name: '暂无签到任务' })).toBeTruthy()
    expect(screen.queryByText('观看视频')).toBeNull()
    expect(screen.queryByText('邀请好友')).toBeNull()
  })

  it('shows loading without fabricated tasks', () => {
    showPoints()
    expect(screen.getByRole('heading', { name: '正在加载签到任务' })).toBeTruthy()
    expect(screen.queryByText('观看视频')).toBeNull()
  })

  it('shows an actionable error instead of substituting fake rewards', () => {
    mock.activity = { state: 'error', message: '签到活动服务暂不可用' }
    showPoints()
    expect(screen.getByRole('heading', { name: '签到任务加载失败' })).toBeTruthy()
    expect(screen.getByText('签到活动服务暂不可用')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '重试' }))
    expect(mock.reload).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('邀请好友')).toBeNull()
  })
})
