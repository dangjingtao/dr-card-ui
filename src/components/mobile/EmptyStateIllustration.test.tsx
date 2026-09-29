import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'

import EmptyStateIllustration from './EmptyStateIllustration'

describe('EmptyStateIllustration', () => {
  it('renders the brand illustration as decorative by default', () => {
    const { container } = render(<EmptyStateIllustration />)

    const wrapper = container.querySelector('[data-empty-state-illustration]')
    expect(wrapper).toBeTruthy()

    const illustration = container.querySelector('img')
    expect(illustration).toBeTruthy()
    expect(illustration?.getAttribute('alt')).toBe('')
    expect(illustration?.getAttribute('aria-hidden')).toBe('true')
    expect(illustration?.getAttribute('src')).toContain('empty-illustration')
  })

  it('exposes an accessible image when a label is provided', () => {
    const { container, getByRole } = render(<EmptyStateIllustration label="暂无记录" />)

    const illustration = container.querySelector('img')
    expect(illustration?.getAttribute('alt')).toBe('暂无记录')
    expect(illustration?.getAttribute('aria-hidden')).toBeNull()
    expect(getByRole('img', { name: '暂无记录' })).toBeTruthy()
  })

  it('merges the caller className without changing the fixed size', () => {
    const { container } = render(<EmptyStateIllustration className="mb-4" />)

    const wrapper = container.querySelector('[data-empty-state-illustration]')
    expect(wrapper?.className).toContain('mb-4')
    expect(wrapper?.className).toContain('flex')
  })
})
