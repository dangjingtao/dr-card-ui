import { beforeEach, describe, expect, it, vi } from 'vitest'

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
})
