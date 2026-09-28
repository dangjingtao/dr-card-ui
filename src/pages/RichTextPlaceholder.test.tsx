import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import RichTextPlaceholder from './RichTextPlaceholder'

describe('RichTextPlaceholder', () => {
  it('provides an empty rich-text host for the selected route', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/cause']}>
        <RichTextPlaceholder routePath="/cause" />
      </MemoryRouter>,
    )

    const host = container.querySelector('[data-rich-text-placeholder="/cause"]')
    expect(host).toBeTruthy()
    expect(host?.textContent).toBe('')
    expect(screen.getByRole('main')).toBeTruthy()
  })
})
