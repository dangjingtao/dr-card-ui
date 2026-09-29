import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('keeps eruda disabled in the production-like test environment', async () => {
    const erudaMock = (await import('eruda')).default as unknown as { init: ReturnType<typeof vi.fn> }

    await import('./main')

    expect(erudaMock.init).not.toHaveBeenCalled()
    await waitFor(() => expect(screen.getByText('App')).toBeTruthy())
  })

  it('continues booting in dev when eruda initialization fails', async () => {
    vi.stubEnv('MODE', 'development')
    vi.stubEnv('VITE_APP_ENV', 'dev')
    vi.stubEnv('VITE_DATA_MODE', 'api')

    const erudaMock = (await import('eruda')).default as unknown as { init: ReturnType<typeof vi.fn> }
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    erudaMock.init.mockImplementationOnce(() => {
      throw new Error('eruda failed')
    })

    await import('./main')

    await waitFor(() => expect(screen.getByText('App')).toBeTruthy())
    expect(erudaMock.init).toHaveBeenCalledTimes(1)
    expect(warn).toHaveBeenCalledWith(
      '[debug] Eruda initialization failed; continuing without the mobile console.',
      expect.any(Error),
    )
    warn.mockRestore()
  })

})
