import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'

const mock = vi.hoisted(() => ({
  gradeId: null as number | null,
  loading: false,
}))

vi.mock('./profile/useProfileFeed', () => ({
  useProfileFeed: () => ({
    remote: mock.loading
      ? { state: 'loading' }
      : {
          state: 'success',
          data: {
            nickname: '测试会员', grade: mock.gradeId == null ? '尚未配置' : '会员',
            gradeId: mock.gradeId, points: 100, kbsId: 'test-1', nextGrade: null,
            couponsCount: 0, avatar: null,
          },
        },
    reload: vi.fn(),
  }),
}))
vi.mock('./points/usePointsFeed', () => ({
  useUserPointsStat: () => ({
    remote: { state: 'success', data: { points: 123, income: 200, expense: 77 } },
    reload: vi.fn(),
  }),
}))
vi.mock('../app/router/routes', () => ({
  findRouteByPathname: () => ({ path: '/membership' }),
}))
vi.mock('../components/mobile/PageContainer', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))
vi.mock('../components/mobile/DebugPanel', () => ({ default: () => null }))

import Membership from './Membership'
import { getMemberCardTheme, UNASSIGNED_MEMBER_CARD_THEME } from './membership/memberCardTheme'

function showMembership() {
  return render(<MemoryRouter><Membership /></MemoryRouter>)
}

afterEach(() => {
  mock.gradeId = null
  mock.loading = false
})

describe('Membership service entry theme (UX-04)', () => {
  it('uses the member card theme for the four service entries in each known grade', () => {
    for (const gradeId of [1, 2, 3, 4]) {
      mock.gradeId = gradeId
      const { unmount, container } = showMembership()
      const palette = getMemberCardTheme(gradeId)!
      expect(screen.getByLabelText('会员等级与泡泡值').getAttribute('data-member-card-grade')).toBe(String(gradeId))
      const rings = Array.from(container.querySelectorAll('[data-member-entry-ring]')) as HTMLElement[]
      expect(rings).toHaveLength(4)
      for (const ring of rings) {
        const inner = ring.firstElementChild as HTMLElement
        const icon = inner.firstElementChild as HTMLElement
        expect(ring.style.backgroundColor).toBe(cssColor(palette.badgeBackground))
        expect(inner.style.backgroundColor).toBe(cssColor(palette.surface))
        expect(icon.style.color).toBe(cssColor(palette.accent))
      }
      unmount()
    }
  })

  it('keeps neutral colors for unknown and unavailable membership grades', () => {
    for (const [gradeId, loading] of [[null, false], [99, false], [null, true]] as const) {
      mock.gradeId = gradeId
      mock.loading = loading
      const { container, unmount } = showMembership()
      const rings = Array.from(container.querySelectorAll('[data-member-entry-ring]')) as HTMLElement[]
      expect(rings).toHaveLength(4)
      rings.forEach((ring) => {
        expect(ring.style.backgroundColor).toBe(cssColor(UNASSIGNED_MEMBER_CARD_THEME.badgeBackground))
        expect((ring.firstElementChild as HTMLElement).style.backgroundColor)
          .toBe(cssColor(UNASSIGNED_MEMBER_CARD_THEME.surface))
      })
      unmount()
    }
  })
})

function cssColor(color: string): string {
  const value = color.replace('#', '')
  if (value.length !== 6) return color
  return `rgb(${parseInt(value.slice(0, 2), 16)}, ${parseInt(value.slice(2, 4), 16)}, ${parseInt(value.slice(4, 6), 16)})`
}
