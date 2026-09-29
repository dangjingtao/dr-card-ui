import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import BubbleValueRedeemCard from './BubbleValueRedeemCard'

describe('BubbleValueRedeemCard', () => {
  it('keeps SVG definition ids unique across component instances', () => {
    const { container } = render(
      <>
        <BubbleValueRedeemCard value={1280} />
        <BubbleValueRedeemCard value={2560} />
      </>,
    )

    const ids = Array.from(container.querySelectorAll('defs [id]')).map((node) => node.id)
    expect(ids.length).toBeGreaterThan(0)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('exposes the redeem CTA to keyboard users', () => {
    const onRedeem = vi.fn()
    render(<BubbleValueRedeemCard value={1280} onRedeem={onRedeem} />)

    const action = screen.getByRole('button', { name: '立即兑换' })
    fireEvent.keyDown(action, { key: 'Enter' })
    fireEvent.keyDown(action, { key: ' ' })

    expect(onRedeem).toHaveBeenCalledTimes(2)
  })
})
