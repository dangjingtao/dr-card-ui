import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'

const mock = vi.hoisted(() => ({
  state: { status: 'ready', messages: [], hasMore: false, loadingMore: false, moreError: null } as {
    status: string; messages: Array<{ id: string; role: 'bot' | 'user'; text: string; status: 'sent' }>;
    hasMore: boolean; loadingMore: boolean; moreError: string | null; message?: string;
  },
  reload: vi.fn(), loadMore: vi.fn(), syncLatest: vi.fn(),
  send: vi.fn(), cancel: vi.fn(), clear: vi.fn(),
  chat: { phase: 'idle', busy: false, blocked: false, humanAwait: false, error: null, messages: [] } as {
    phase: string; busy: boolean; blocked: boolean; humanAwait: boolean; error: string | null;
    messages: Array<{ id: string; role: 'user' | 'bot'; text: string; status: 'sent' }>;
  },
}))
vi.mock('./serviceChat/useChatHistory', () => ({
  useChatHistory: () => ({ ...mock.state, reload: mock.reload, loadMore: mock.loadMore, syncLatest: mock.syncLatest }),
}))
vi.mock('./serviceChat/useAiChatSend', () => ({
  useAiChatSend: () => ({ ...mock.chat, send: mock.send, cancel: mock.cancel, clear: mock.clear }),
  combineChatMessages: (history: unknown[], pending: unknown[]) => [...history, ...pending],
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
  mock.reload.mockReset(); mock.loadMore.mockReset(); mock.syncLatest.mockReset()
  mock.send.mockReset(); mock.cancel.mockReset(); mock.clear.mockReset()
  mock.chat = { phase: 'idle', busy: false, blocked: false, humanAwait: false, error: null, messages: [] }
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
    expect((screen.getByRole('button', { name: '发送' }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole('button', { name: '人工转接待接入' }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByText('AI 客服已可发送消息；人工转接功能尚未接入')).toBeTruthy()
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
    expect(screen.getByText('暂无客服聊天记录，可以发送第一条消息')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '加载更早消息' }))
    expect(mock.loadMore).toHaveBeenCalledOnce()
  })

  it('reloads changed pagination instead of retrying a guaranteed stale older page', () => {
    mock.state = {
      status: 'ready', messages: [{ id: '2', role: 'bot', text: '已有消息', status: 'sent' }],
      hasMore: true, loadingMore: false, moreError: '客服历史分页已变化，请重新加载',
    }
    mount()
    fireEvent.click(screen.getByRole('button', { name: '重新加载历史' }))
    expect(mock.reload).toHaveBeenCalledOnce()
    expect(mock.loadMore).not.toHaveBeenCalled()
  })

  it('enables the AI input in API mode and delegates to the real streaming handler', () => {
    mock.state.messages = [{ id: '3', role: 'bot', text: '真实历史', status: 'sent' }]
    mount()
    const input = screen.getByRole('textbox', { name: '输入你的问题' }) as HTMLInputElement
    expect(input.disabled).toBe(false)
    fireEvent.change(input, { target: { value: '请问营业时间' } })
    fireEvent.click(screen.getByRole('button', { name: '发送' }))
    expect(mock.send).toHaveBeenCalledWith('请问营业时间', mock.state.messages)
    expect(input.value).toBe('')
  })

  it('shows streaming status, cancellation and human mode without invented agent data', () => {
    mock.chat = { phase: 'streaming', busy: true, blocked: false, humanAwait: false, error: null,
      messages: [{ id: 'local-bot', role: 'bot', text: '正逐块回复', status: 'sent' }] }
    const view = mount()
    expect(screen.getByText('AI 正在流式回复…')).toBeTruthy()
    expect(screen.getByText('正逐块回复')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '中止等待回复' }))
    expect(mock.cancel).toHaveBeenCalledOnce()
    view.unmount()

    mock.chat = { phase: 'human', busy: false, blocked: true, humanAwait: true, error: null, messages: [] }
    mount()
    expect(screen.getByText('后台已进入人工模式；真人实时回复待接入')).toBeTruthy()
    expect((screen.getByRole('textbox', { name: '输入你的问题' }) as HTMLInputElement).disabled).toBe(true)
    expect(screen.queryByText('前面还有 2 位')).toBeNull()
  })

  it('shows uncertain delivery and requires explicit history checking before resuming', () => {
    mock.chat = { phase: 'failed', busy: false, blocked: true, humanAwait: false,
      error: 'AI未配置。本次消息可能保存，请先检查聊天历史', messages: [] }
    mount()
    expect(screen.getByRole('alert').textContent).toContain('请先检查聊天历史')
    fireEvent.click(screen.getByRole('button', { name: '检查最新历史记录' }))
    expect(mock.clear).toHaveBeenCalledOnce()
    expect(mock.reload).toHaveBeenCalledOnce()
  })

  it('preserves the independent WeCom QR hash entry', () => {
    mount('/service/chat#wecom')
    expect(screen.getByText('企业微信二维码入口')).toBeTruthy()
  })
})
