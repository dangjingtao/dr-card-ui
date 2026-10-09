import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

const bridgeMocks = vi.hoisted(() => ({
  closeWebView: vi.fn(() => Promise.resolve()),
}))

vi.mock('../services/nativeBridge', () => bridgeMocks)

import ErrorPage from './ErrorPage'

afterEach(() => {
  bridgeMocks.closeWebView.mockClear()
})

function renderAt(paths: string[]) {
  render(
    <MemoryRouter initialEntries={paths}>
      <Routes>
        <Route path="/" element={<div>home-marker</div>} />
        <Route path="/previous" element={<div>previous-marker</div>} />
        <Route path="/error" element={<ErrorPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ErrorPage', () => {
  it('renders the reference copy contract (title / subtitle / actions)', () => {
    renderAt(['/error'])

    expect(screen.getByRole('heading', { name: '卡博士' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: '页面开小差了' })).toBeTruthy()
    expect(screen.getByText('当前页面暂时无法加载，请返回 APP 后继续使用。')).toBeTruthy()
    expect(screen.getByRole('button', { name: '返回 APP' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: '返回' })).toBeNull()
  })

  it('honors a custom title bar label', () => {
    render(
      <MemoryRouter initialEntries={['/error']}>
        <Routes>
          <Route path="/error" element={<ErrorPage title="诗得丽" />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: '诗得丽' })).toBeTruthy()
  })

  it('invokes the confirmed closeWebView capability from the return-to-app button', async () => {
    renderAt(['/error'])

    fireEvent.click(screen.getByRole('button', { name: '返回 APP' }))

    expect(bridgeMocks.closeWebView).toHaveBeenCalledTimes(1)
    await vi.waitFor(() =>
      expect(bridgeMocks.closeWebView.mock.results[0].value).resolves.toBeUndefined(),
    )
  })

  it('falls back to home when the host has no closeWebView (browser preview)', async () => {
    bridgeMocks.closeWebView.mockRejectedValueOnce(
      Object.assign(new Error('capability-unsupported'), { capability: 'closeWebView' }),
    )

    renderAt(['/error'])

    fireEvent.click(screen.getByRole('button', { name: '返回 APP' }))

    await screen.findByText('home-marker')
  })

})
