import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  loadOwnBuddyQr: vi.fn(),
  renderBuddyQrPng: vi.fn(),
  createBuddyPoster: vi.fn(),
  saveInvitePoster: vi.fn(),
}))

vi.mock('../app/fixtures/useFixture', () => ({
  useFixtureNavigate: () => mocks.navigate,
  useFixtureDebug: () => false,
}))

vi.mock('../services/buddyQr', () => ({
  loadOwnBuddyQr: mocks.loadOwnBuddyQr,
}))

vi.mock('../lib/buddyQrPoster', () => ({
  renderBuddyQrPng: mocks.renderBuddyQrPng,
  createBuddyPoster: mocks.createBuddyPoster,
}))

vi.mock('../app/adapters/buddyShare', () => ({
  saveInvitePoster: mocks.saveInvitePoster,
}))

import BuddyInvite from './BuddyInvite'

const demoUrl = 'https://test.dr-card-ui.pages.dev/buddy/invite/scan?demo=qr-preview-only-no-binding'
const png = 'data:image/png;base64,cXJpbWFnZQ=='
const poster = { imageType: 'base64', imageData: 'cG9zdGVy', fileName: 'buddy-invite-poster.png' }

afterEach(() => {
  Object.values(mocks).forEach(fn => fn.mockReset())
})

function setupReady() {
  mocks.loadOwnBuddyQr.mockResolvedValue({ url: demoUrl, demo: true })
  mocks.renderBuddyQrPng.mockResolvedValue(png)
  mocks.createBuddyPoster.mockResolvedValue(poster)
}

describe('BuddyInvite real QR image / poster workflow', () => {
  it('only shows QR generated from the fetched URL, never a copied invitation link', async () => {
    setupReady()
    render(<BuddyInvite />)

    await waitFor(() => expect(screen.getByRole('img', { name: /演示二维码/ })).toBeTruthy())
    expect(mocks.renderBuddyQrPng).toHaveBeenCalledWith(demoUrl)
    expect(screen.getByText(/演示二维码，仅用于预览/)).toBeTruthy()
    expect(screen.queryByRole('button', { name: /复制链接/ })).toBeNull()
    expect(mocks.saveInvitePoster).not.toHaveBeenCalled()
  })

  it('provides a disabled save action if the backend contract is unavailable', async () => {
    mocks.loadOwnBuddyQr.mockRejectedValue(new Error('二维码接口尚未接通'))
    render(<BuddyInvite />)
    await waitFor(() => expect(screen.getByText('二维码接口尚未接通')).toBeTruthy())
    expect(screen.getByRole('button', { name: /保存到本地/ }).hasAttribute('disabled')).toBe(true)
    expect(screen.getByRole('button', { name: /重试获取/ })).toBeTruthy()
  })

  it('saves the poster generated from the exact QR shown in UI', async () => {
    setupReady()
    mocks.saveInvitePoster.mockResolvedValue({ outcome: 'poster-saved', ok: true })
    render(<BuddyInvite />)
    await waitFor(() => expect(screen.getByRole('img', { name: /演示二维码/ })).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: /保存到本地/ }))
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/buddy/invite/qrcode', {
      state: 'saved', debug: null,
    }))
    expect(mocks.createBuddyPoster).toHaveBeenCalledWith(png, { demo: true })
    expect(mocks.saveInvitePoster).toHaveBeenCalledWith(poster)
  })

  it('does not claim save success when canvas export fails', async () => {
    setupReady()
    mocks.createBuddyPoster.mockRejectedValue(new Error('canvas denied'))
    render(<BuddyInvite />)
    await waitFor(() => expect(screen.getByRole('img', { name: /演示二维码/ })).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: /保存到本地/ }))
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/buddy/invite/qrcode', {
      state: 'poster-failed', debug: null,
    }))
    expect(mocks.saveInvitePoster).not.toHaveBeenCalled()
  })

  it('does not claim save success if Native rejects the write', async () => {
    setupReady()
    mocks.saveInvitePoster.mockResolvedValue({ outcome: 'poster-failed', ok: false })
    render(<BuddyInvite />)
    await waitFor(() => expect(screen.getByRole('img', { name: /演示二维码/ })).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: /保存到本地/ }))
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/buddy/invite/qrcode', {
      state: 'poster-failed', debug: null,
    }))
  })
})
