import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'

const mocks = vi.hoisted(() => ({
  useRemoteData: vi.fn(),
  reload: vi.fn(),
}))

vi.mock('./profile/useProfileFeed', () => ({ useRemoteData: mocks.useRemoteData }))
vi.mock('../components/mobile/PageContainer', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

import WelfareOfficer from './WelfareOfficer'

afterEach(() => {
  cleanup()
  mocks.useRemoteData.mockReset()
  mocks.reload.mockReset()
})

const config = {
  title: '欢迎联系福利官',
  subtitle: '诗得丽品牌福利官',
  qrcodeUrl: 'https://cdn.example.com/wecom-qr.png',
  qrcodeUnavailable: false,
  configured: true,
  benefits: [
    { imageUrl: 'https://cdn.example.com/benefit.png', title: '人工客服', description: '全天候帮助' },
    { imageUrl: undefined, title: '福利抽奖', description: '福利活动介绍' },
  ],
}

describe('WelfareOfficer page remote states', () => {
  it('renders loading without stale fixture content or fake QR', () => {
    mocks.useRemoteData.mockReturnValue({ remote: { state: 'loading' }, reload: mocks.reload })
    render(<WelfareOfficer />)
    expect(screen.getByText('正在加载福利官信息…')).toBeTruthy()
    expect(screen.queryByText('吴哥')).toBeNull()
    expect(screen.queryByRole('img', { name: '福利官企业微信二维码' })).toBeNull()
  })

  it('shows retriable API failure rather than mock content', () => {
    mocks.useRemoteData.mockReturnValue({
      remote: { state: 'error', message: '后端暂不可用' }, reload: mocks.reload,
    })
    render(<WelfareOfficer />)
    expect(screen.getByRole('alert').textContent).toContain('后端暂不可用')
    fireEvent.click(screen.getByRole('button', { name: '重试' }))
    expect(mocks.reload).toHaveBeenCalledOnce()
  })

  it('renders explicit empty configuration and no placeholder QR', () => {
    mocks.useRemoteData.mockReturnValue({
      remote: { state: 'success', data: { ...config, configured: false, title: '', subtitle: '', qrcodeUrl: undefined, benefits: [] } },
      reload: mocks.reload,
    })
    render(<WelfareOfficer />)
    expect(screen.getByText('福利官信息尚未配置')).toBeTruthy()
    expect(screen.queryByRole('img')).toBeNull()
  })

  it('renders actual configured QR, title, subtitle and benefit detail', () => {
    mocks.useRemoteData.mockReturnValue({ remote: { state: 'success', data: config }, reload: mocks.reload })
    render(<WelfareOfficer />)
    expect(screen.getByText('欢迎联系福利官')).toBeTruthy()
    expect(screen.getByText('诗得丽品牌福利官')).toBeTruthy()
    expect(screen.getByText('人工客服')).toBeTruthy()
    expect(screen.getByText('全天候帮助')).toBeTruthy()
    expect(screen.getByText('福利抽奖')).toBeTruthy()
    expect(screen.getByRole('img', { name: '福利官企业微信二维码' }).getAttribute('src')).toBe(config.qrcodeUrl)
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('never presents the loopback QR URL as a usable image', () => {
    mocks.useRemoteData.mockReturnValue({
      remote: { state: 'success', data: { ...config, qrcodeUrl: undefined, qrcodeUnavailable: true } },
      reload: mocks.reload,
    })
    render(<WelfareOfficer />)
    expect(screen.getByText('二维码暂不可用，请稍后查看')).toBeTruthy()
    expect(screen.queryByRole('img', { name: '福利官企业微信二维码' })).toBeNull()
  })

  it('handles image load failure without resurrecting a fake QR', () => {
    mocks.useRemoteData.mockReturnValue({ remote: { state: 'success', data: config }, reload: mocks.reload })
    render(<WelfareOfficer />)
    fireEvent.error(screen.getByRole('img', { name: '福利官企业微信二维码' }))
    expect(screen.getByText('二维码加载失败，请稍后再试')).toBeTruthy()
    expect(screen.queryByRole('img', { name: '福利官企业微信二维码' })).toBeNull()
    expect(screen.queryByText('长按或扫描二维码，联系福利官')).toBeNull()
  })
})
