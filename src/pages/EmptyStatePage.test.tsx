import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import EmptyStatePage from './EmptyStatePage'

function renderPage(element: React.ReactElement) {
  render(
    <MemoryRouter initialEntries={['/empty']}>
      <Routes>
        <Route path="/empty" element={element} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('EmptyStatePage', () => {
  it('renders the default title bar and empty copy contract', () => {
    renderPage(<EmptyStatePage />)

    expect(screen.getByRole('heading', { name: '卡博士' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: '这里还空空如也' })).toBeTruthy()
    expect(screen.getByText('暂时没有可展示的内容，去别处逛逛吧。')).toBeTruthy()
  })

  it('honors a custom title bar label and copy', () => {
    renderPage(
      <EmptyStatePage title="诗得丽" heading="暂无优惠券" description="领取后会自动出现在这里。" />,
    )

    expect(screen.getByRole('heading', { name: '诗得丽' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: '暂无优惠券' })).toBeTruthy()
    expect(screen.getByText('领取后会自动出现在这里。')).toBeTruthy()
  })

  it('hides the primary action when no label is provided', () => {
    renderPage(<EmptyStatePage />)

    expect(screen.queryByRole('button')).toBeNull()
  })

  it('invokes the injected primary action', () => {
    const onPrimaryAction = vi.fn()
    renderPage(<EmptyStatePage primaryActionLabel="去逛逛" onPrimaryAction={onPrimaryAction} />)

    const button = screen.getByRole('button', { name: '去逛逛' })
    fireEvent.click(button)

    expect(onPrimaryAction).toHaveBeenCalledTimes(1)
  })

  it('renders the empty illustration as decorative', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/empty']}>
        <Routes>
          <Route path="/empty" element={<EmptyStatePage />} />
        </Routes>
      </MemoryRouter>,
    )

    const illustration = container.querySelector('img')
    expect(illustration).toBeTruthy()
    expect(illustration?.getAttribute('alt')).toBe('')
    expect(illustration?.getAttribute('aria-hidden')).toBe('true')
  })
})
