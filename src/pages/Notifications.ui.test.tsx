import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import type { NotificationFixture } from '../app/fixtures/notifications'

const mocks = vi.hoisted(() => ({
  feed: {
    items: [] as NotificationFixture[], unreadCount: 2, total: 20,
    loading: false, loadingMore: false, loaded: true, hasMore: false,
    error: null as string | null,
  },
  scrollTo: vi.fn(),
  mode: 'mock' as 'mock' | 'api',
  markRead: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../app/config/runtime', () => ({ runtimePolicy: { get dataMode() { return mocks.mode } } }))
vi.mock('../app/fixtures/useFixture', () => ({
  useFixtureState: () => ({ state: undefined }),
  useOverlay: () => ({ overlay: null, close: vi.fn() }),
}))
vi.mock('../app/router/routes', () => ({ findRouteByPathname: () => ({ path: '/notifications' }) }))
vi.mock('../components/mobile/BuddyInvitationInbox', () => ({
  default: () => <aside aria-label="洗头搭子邀请通知">搭子邀请</aside>,
}))
vi.mock('../app/state/notifications', () => ({
  useNotifications: () => mocks.feed,
  markAllNotificationsRead: mocks.markRead,
  refreshRemoteNotices: vi.fn(),
  loadMoreRemoteNotices: vi.fn(),
}))

import Notifications, { notificationEmptyCopy } from './Notifications'

function Detail() {
  const navigate = useNavigate()
  return <button type="button" onClick={() => navigate(-1)}>返回通知</button>
}

let entrySequence = 0
function showPage() {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/notifications', key: `uxd-test-${++entrySequence}` }]}>
      <div data-page-scroll ref={(node) => { if (node) node.scrollTo = mocks.scrollTo }}>
        <Routes>
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/notifications/:id" element={<Detail />} />
        </Routes>
      </div>
    </MemoryRouter>,
  )
}

const item = (id: string, cat: NotificationFixture['cat'], unread: boolean): NotificationFixture => ({
  id, cat, unread, title: '通知' + id, summary: '真实列表摘要' + id,
  time: '今天 09:00', paragraphs: ['通知正文'],
})

afterEach(() => {
  cleanup()
  mocks.feed = {
    items: [], unreadCount: 2, total: 20, loading: false, loadingMore: false,
    loaded: true, hasMore: false, error: null,
  }
  mocks.scrollTo.mockReset()
  mocks.mode = 'mock'
  mocks.markRead.mockReset().mockResolvedValue(undefined)
})

describe('UX-D notification tabs, scroll and empty states', () => {
  it('pins tab controls under the shell header on warm background, with stable count semantics', () => {
    mocks.feed.items = [item('a', 'system', true), item('b', 'event', false)]
    showPage()
    const tabs = document.querySelector('[data-notifications-tabs]') as HTMLElement
    expect(tabs.className).toContain('sticky')
    expect(tabs.className).toContain('top-0')
    expect(tabs.className).toContain('bg-background')
    expect(tabs.className).not.toContain('bg-white')
    expect(screen.getByRole('tab', { name: /全部.*20/ }).getAttribute('aria-selected')).toBe('true')
    expect(screen.getByRole('tab', { name: /未读.*2/ })).toBeTruthy()
  })

  it('switches tabs in place, resets shell scroll, and gives each category a distinct truthful empty state', () => {
    mocks.feed.items = [item('a', 'system', true)]
    showPage()
    fireEvent.click(screen.getByRole('tab', { name: /活动/ }))
    expect(mocks.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'auto' })
    expect(screen.getByRole('heading', { name: '暂无活动通知' })).toBeTruthy()
    expect(screen.queryByText('下拉刷新看看')).toBeNull()

    fireEvent.click(screen.getByRole('tab', { name: /推送/ }))
    expect(screen.getByRole('button', { name: /通知a/ })).toBeTruthy()
    expect(mocks.scrollTo).toHaveBeenCalledTimes(2)

    fireEvent.click(screen.getByRole('tab', { name: /未读/ }))
    expect(screen.getByRole('button', { name: /通知a/ })).toBeTruthy()
  })

  it('keeps the selected tab when returning from notification detail via browser history', () => {
    mocks.feed.items = [item('a', 'system', true), item('b', 'event', true)]
    showPage()
    fireEvent.click(screen.getByRole('tab', { name: /活动/ }))
    expect(screen.queryByText('通知a')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /通知b/ }))
    fireEvent.click(screen.getByRole('button', { name: '返回通知' }))
    expect(screen.getByRole('tab', { name: /活动/ }).getAttribute('aria-selected')).toBe('true')
    expect(screen.getByRole('button', { name: /通知b/ })).toBeTruthy()
    expect(screen.queryByText('通知a')).toBeNull()
    expect(mocks.scrollTo).toHaveBeenCalledTimes(1)
  })

  it('distinguishes all/unread empty states, and never claims an incomplete paged category is exhausted', () => {
    expect(notificationEmptyCopy('all', false).title).toBe('暂无通知')
    expect(notificationEmptyCopy('unread', false).title).toBe('消息都已读完')
    expect(notificationEmptyCopy('system', false).title).toBe('暂无推送通知')
    expect(notificationEmptyCopy('event', false).title).toBe('暂无活动通知')
    expect(notificationEmptyCopy('event', true).title).toContain('当前已加载')
    mocks.feed = { ...mocks.feed, items: [], unreadCount: 0, total: 12 }
    showPage()
    fireEvent.click(screen.getByRole('tab', { name: /未读/ }))
    expect(screen.getByRole('heading', { name: '消息都已读完' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: /全部.*12/ })).toBeTruthy()
    expect(screen.getByRole('tab', { name: /未读.*0/ })).toBeTruthy()
  })

  it('retains the real API contract for loading and errors', () => {
    mocks.mode = 'api'
    mocks.feed = { ...mocks.feed, items: [], loaded: false, loading: true }
    const { rerender } = showPage()
    expect(screen.getByRole('status').textContent).toContain('正在加载通知')

    mocks.feed = { ...mocks.feed, loaded: true, loading: false, error: '请求失败' }
    rerender(
      <MemoryRouter initialEntries={['/notifications']}>
        <div data-page-scroll><Routes><Route path="/notifications" element={<Notifications />} /></Routes></div>
      </MemoryRouter>,
    )
    expect(screen.getByRole('alert').textContent).toContain('请求失败')
  })
})
