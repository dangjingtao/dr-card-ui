import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'

vi.mock('eruda', () => ({
  default: {
    init: vi.fn(),
  },
}))

vi.mock('./App', () => ({
  default: () => <div>App</div>,
}))

vi.mock('./pages/UnsupportedHostNotice', () => ({
  default: () => <div>UnsupportedHostNotice</div>,
  isUnsupportedHost: () => false,
}))

describe('main bootstrap', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('initializes eruda in the test environment without changing the prod/test debugPanel contract', async () => {
    const erudaMock = (await import('eruda')).default as unknown as { init: ReturnType<typeof vi.fn> }

    await import('./main')

    expect(erudaMock.init).toHaveBeenCalledTimes(1)
  })

  it('continues booting when eruda initialization fails', async () => {
    const erudaMock = (await import('eruda')).default as unknown as { init: ReturnType<typeof vi.fn> }
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    erudaMock.init.mockImplementationOnce(() => {
      throw new Error('eruda failed')
    })

    await import('./main')

    await waitFor(() => expect(screen.getByText('App')).toBeTruthy())
    expect(warn).toHaveBeenCalledWith(
      '[debug] Eruda initialization failed; continuing without the mobile console.',
      expect.any(Error),
    )
    warn.mockRestore()
  })

})
