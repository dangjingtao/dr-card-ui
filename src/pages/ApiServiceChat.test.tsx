import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'

const mock = vi.hoisted(() => ({
  state: { status: 'ready', messages: [], hasMore: false, loadingMore: false, moreError: null } as {
    status: string; messages: Array<{ id: string; role: 'bot' | 'user'; text: string; status: 'sent' }>;
    hasMore: boolean; loadingMore: boolean; moreError: string | null; message?: string;
  },
  reload: vi.fn(), loadMore: vi.fn(),
}))
vi.mock('./serviceChat/useChatHistory', () => ({
  useChatHistory: () => ({ ...mock.state, reload: mock.reload, loadMore: mock.loadMore }),
}))
vi.mock('../components/mobile/PageContainer', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))
vi.mock('../components/mobile/WecomQrPlaceholder', () => ({
  default: () => <div>企业微信二维码入口</div>,
}))
vi.mock('../components/ui', async original => {
  const real = await original<typeof import('../components/ui')>()
  return { ...real, BottomSheet: ({ open, children }: { open: boolean; children: ReactNode }) => open ? <div>{children}</div> : null }
})
import ApiServiceChat from './ApiServiceChat'

const mount = (path = '/service/chat') => render(
  <MemoryRouter initialEntries={[path]}><ApiServiceChat /></MemoryRouter>,
)

afterEach(() => {
  mock.state = { status: 'ready', messages: [], hasMore: false, loadingMore: false, moreError: null }
  mock.reload.mockReset(); mock.loadMore.mockReset()
})

describe('#135 real API chat page', () => {
  it('renders authoritative history, never mock welcome/AI response or fake human queue', () => {
    mock.state.messages = [
      { id: '1', role: 'user', text: '真实用户内容', status: 'sent' },
      { id: '2', role: 'bot', text: '真实客服历史', status: 'sent' },
    ]
    mount()
    expect(screen.getByText('真实用户内容')).toBeTruthy()
    expect(screen.getByText('真实客服历史')).toBeTruthy()
    expect(screen.queryByText('前面还有 2 位')).toBeNull()
    expect(screen.queryByText('已收到你的问题，我先为你查询。')).toBeNull()
    expect((screen.getByRole('button', { name: '发送待接入' }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole('button', { name: '人工客服待接入' }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByText('历史消息可查看，AI 发送与转人工服务正在接入')).toBeTruthy()
  })

  it('supports empty, loading, errors, explicit retry and older pagination', () => {
    mock.state = { status: 'error', message: '请先登录后查看客服记录', messages: [], hasMore: false, loadingMore: false, moreError: null }
    const view = mount()
    expect(screen.getByRole('alert').textContent).toContain('请先登录')
    fireEvent.click(screen.getByRole('button', { name: '重新加载历史' }))
    expect(mock.reload).toHaveBeenCalledOnce()
    view.unmount()

    mock.state = { status: 'ready', messages: [], hasMore: true, loadingMore: false, moreError: null }
    mount()
    expect(screen.getByText('暂无客服聊天记录')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '加载更早消息' }))
    expect(mock.loadMore).toHaveBeenCalledOnce()
  })

  it('preserves the independent WeCom QR hash entry', () => {
    mount('/service/chat#wecom')
    expect(screen.getByText('企业微信二维码入口')).toBeTruthy()
  })
})
