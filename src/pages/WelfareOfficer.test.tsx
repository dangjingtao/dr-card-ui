import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'

const mocks = vi.hoisted(() => ({
  useRemoteData: vi.fn(),
  reload: vi.fn(),
  download: vi.fn(),
}))

vi.mock('./profile/useProfileFeed', () => ({ useRemoteData: mocks.useRemoteData }))
vi.mock('../services/welfareQrDownload', () => ({ requestWelfareQrDownload: mocks.download }))
vi.mock('../components/mobile/PageContainer', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

import WelfareOfficer from './WelfareOfficer'

afterEach(() => {
  cleanup()
  mocks.useRemoteData.mockReset()
  mocks.reload.mockReset()
  mocks.download.mockReset()
  vi.useRealTimers()
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
    expect(screen.getByRole('status').getAttribute('aria-busy')).toBe('true')
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThanOrEqual(8)
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

  it('opens a dismissible save sheet on tap and contextmenu without changing the QR URL', () => {
    mocks.useRemoteData.mockReturnValue({ remote: { state: 'success', data: config }, reload: mocks.reload })
    render(<WelfareOfficer />)
    fireEvent.click(screen.getByRole('button', { name: '保存二维码' }))
    expect(screen.getByRole('dialog', { name: '保存福利官二维码' })).toBeTruthy()
    expect(screen.getByRole('link', { name: '打开二维码原图' }).getAttribute('href')).toBe(config.qrcodeUrl)
    fireEvent.click(screen.getByRole('button', { name: '取消' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.contextMenu(screen.getByRole('button', { name: '打开二维码保存菜单' }))
    expect(screen.getByRole('dialog', { name: '保存福利官二维码' })).toBeTruthy()
  })

  it('opens the sheet on long press and ignores touch scrolling', () => {
    vi.useFakeTimers()
    mocks.useRemoteData.mockReturnValue({ remote: { state: 'success', data: config }, reload: mocks.reload })
    render(<WelfareOfficer />)
    const qrButton = screen.getByRole('button', { name: '打开二维码保存菜单' })
    // jsdom lacks a native PointerEvent on some Node versions: preserve pointerType explicitly.
    const touch = (type: string, x: number, y: number) => {
      const event = new Event(type, { bubbles: true, cancelable: true })
      Object.defineProperties(event, {
        pointerType: { value: 'touch' },
        clientX: { value: x },
        clientY: { value: y },
      })
      fireEvent(qrButton, event)
    }
    touch('pointerdown', 10, 20)
    touch('pointermove', 30, 40)
    act(() => vi.advanceTimersByTime(600))
    expect(screen.queryByRole('dialog')).toBeNull()

    touch('pointerdown', 10, 20)
    act(() => vi.advanceTimersByTime(560))
    expect(screen.getByRole('dialog', { name: '保存福利官二维码' })).toBeTruthy()
  })

  it('says download requested, not album saved, even when H5 export succeeds', async () => {
    mocks.download.mockResolvedValue(undefined)
    mocks.useRemoteData.mockReturnValue({ remote: { state: 'success', data: config }, reload: mocks.reload })
    render(<WelfareOfficer />)
    fireEvent.click(screen.getByRole('button', { name: '保存二维码' }))
    fireEvent.click(screen.getByRole('button', { name: '尝试下载图片' }))
    await waitFor(() => expect(screen.getByText(/已向浏览器请求下载，但无法确认是否存入相册/)).toBeTruthy())
    expect(mocks.download).toHaveBeenCalledWith(config.qrcodeUrl)
    expect(screen.queryByText('保存成功')).toBeNull()
  })

  it('shows honest failure information when CORS or WebView blocks H5 download', async () => {
    mocks.download.mockRejectedValue(new Error('CORS rejected'))
    mocks.useRemoteData.mockReturnValue({ remote: { state: 'success', data: config }, reload: mocks.reload })
    render(<WelfareOfficer />)
    fireEvent.click(screen.getByRole('button', { name: '保存二维码' }))
    fireEvent.click(screen.getByRole('button', { name: '尝试下载图片' }))
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('H5 无法下载该图片'))
    expect(screen.queryByText('保存成功')).toBeNull()
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
