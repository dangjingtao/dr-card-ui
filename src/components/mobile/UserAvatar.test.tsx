import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import UserAvatar from './UserAvatar'

describe('UX-05 neutral user avatar fallback', () => {
  it('uses a neutral person icon when backend avatar is absent', () => {
    const { container } = render(<UserAvatar src={null} />)
    expect(screen.queryByAltText('会员头像')).toBeNull()
    expect(screen.getByLabelText('默认头像')).toBeTruthy()
    expect(container.querySelector('img')).toBeNull()
  })

  it('falls back on broken image and retries the new src when identity changes', async () => {
    const { rerender } = render(<UserAvatar src="https://cdn.example.com/404.png" />)
    fireEvent.error(screen.getByAltText('会员头像'))
    expect(screen.getByLabelText('默认头像')).toBeTruthy()
    rerender(<UserAvatar src="https://cdn.example.com/new.png" />)
    await waitFor(() => expect((screen.getByAltText('会员头像') as HTMLImageElement).src).toContain('/new.png'))
    expect(screen.queryByLabelText('默认头像')).toBeNull()
  })
})
