import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  fetchMyCoupons: vi.fn(),
  overlay: null as string | null,
  close: vi.fn(),
}))

vi.mock('../services/myCoupons', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/myCoupons')>()
  return { ...actual, fetchMyCoupons: mocks.fetchMyCoupons }
})

vi.mock('../services/cardPackageProbe', () => ({
  probeDiscountCardList: vi.fn(),
}))

vi.mock('../app/fixtures/useFixture', () => ({
  useFixtureState: () => ({ state: null }),
  useOverlay: () => ({ overlay: mocks.overlay, close: mocks.close }),
}))

vi.mock('../app/router/routes', () => ({
  findRouteByPathname: () => ({ path: '/card' }),
}))

vi.mock('../components/mobile/DebugPanel', () => ({
  default: () => null,
}))

vi.mock('../components/mobile/PageContainer', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

import Card from './Card'

function page(type: 'unused' | 'used' | 'out_of_date') {
  if (type === 'unused') {
    return {
      data: [
        {
          id: 1001,
          active_name: '新人体验活动',
          get_amount: '30.00',
          used_amount: '0.00',
          enable_amount: '30.00',
          valid_date_range: '2026-09-30 ~ 2026-10-30',
          dc_type: 10,
          dc_type_format: '满减券',
        },
      ],
      current_page: 1,
      per_page: 100,
      total: 12,
      last_page: 1,
    }
  }

  if (type === 'used') {
    return {
      data: [
        {
          id: 2001,
          active_name: '已使用体验券',
          get_amount: 20,
          used_amount: 20,
          enable_amount: 0,
          valid_date_range: '2026-09-01 ~ 2026-09-30',
          dc_type: '10',
          dc_type_format: '满减券',
        },
      ],
      current_page: 1,
      per_page: 100,
      total: 2,
      last_page: 1,
    }
  }

  return {
    data: [
      {
        id: 3001,
        active_name: '已过期体验券',
        get_amount: '10.00',
        used_amount: '0.00',
        enable_amount: '10.00',
        valid_date_range: '2026-08-01 ~ 2026-08-31',
        dc_type: 10,
        dc_type_format: '满减券',
      },
    ],
    current_page: 1,
    per_page: 100,
    total: 3,
    last_page: 1,
  }
}

function renderCard(entry = '/card') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Card />
    </MemoryRouter>,
  )
}

afterEach(() => {
  mocks.fetchMyCoupons.mockReset()
  mocks.overlay = null
  mocks.close.mockReset()
})

describe('Card MyCoupons integration', () => {
  it('loads all three documented categories and renders real user-held coupon fields', async () => {
    mocks.fetchMyCoupons.mockImplementation(({ type }: { type: 'unused' | 'used' | 'out_of_date' }) =>
      Promise.resolve(page(type)),
    )

    renderCard()

    expect(await screen.findByText('新人体验活动')).toBeTruthy()
    expect(screen.getByText('30.00')).toBeTruthy()
    expect(screen.getByText('2026-09-30 ~ 2026-10-30')).toBeTruthy()
    expect(screen.getByText('满减券')).toBeTruthy()

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /可用/ }).textContent).toContain('12')
      expect(screen.getByRole('tab', { name: /已使用/ }).textContent).toContain('2')
      expect(screen.getByRole('tab', { name: /已过期/ }).textContent).toContain('3')
    })

    expect(mocks.fetchMyCoupons).toHaveBeenCalledWith({ type: 'unused', page: 1, pageSize: 100 })
    expect(mocks.fetchMyCoupons).toHaveBeenCalledWith({ type: 'used', page: 1, pageSize: 100 })
    expect(mocks.fetchMyCoupons).toHaveBeenCalledWith({ type: 'out_of_date', page: 1, pageSize: 100 })
  })

  it('switches tabs without inventing lifecycle state from coupon template status', async () => {
    mocks.fetchMyCoupons.mockImplementation(({ type }: { type: 'unused' | 'used' | 'out_of_date' }) =>
      Promise.resolve(page(type)),
    )

    renderCard()
    await screen.findByText('新人体验活动')

    fireEvent.click(screen.getByRole('tab', { name: /已使用/ }))
    expect(await screen.findByText('已使用体验券')).toBeTruthy()

    fireEvent.click(screen.getByRole('tab', { name: /已过期/ }))
    expect(await screen.findByText('已过期体验券')).toBeTruthy()
  })

  it('renders the existing empty state for an empty category', async () => {
    mocks.fetchMyCoupons.mockImplementation(({ type }: { type: 'unused' | 'used' | 'out_of_date' }) => {
      if (type === 'used') {
        return Promise.resolve({
          data: [],
          current_page: 1,
          per_page: 100,
          total: 0,
          last_page: 1,
        })
      }
      return Promise.resolve(page(type))
    })

    renderCard()
    await screen.findByText('新人体验活动')
    fireEvent.click(screen.getByRole('tab', { name: /已使用/ }))

    expect(await screen.findByText('暂无已使用的体验券')).toBeTruthy()
  })

  it('surfaces the current category error instead of falling back to mock data', async () => {
    mocks.fetchMyCoupons.mockImplementation(({ type }: { type: 'unused' | 'used' | 'out_of_date' }) => {
      if (type === 'unused') return Promise.reject(new Error('卡包服务暂不可用'))
      return Promise.resolve(page(type))
    })

    renderCard()

    expect(await screen.findByText('卡包服务暂不可用')).toBeTruthy()
    expect(screen.queryByText('核心洗发水体验券')).toBeNull()
  })

  it('does not use the fixture coupon for an unmatched API-mode deep link', async () => {
    mocks.overlay = 'use'
    mocks.fetchMyCoupons.mockResolvedValue({
      data: [],
      current_page: 1,
      per_page: 100,
      total: 0,
      last_page: 1,
    })

    renderCard('/card?overlay=use&coupon=c1')

    await waitFor(() => {
      expect(mocks.fetchMyCoupons).toHaveBeenCalledTimes(3)
    })
    expect(screen.queryByRole('dialog', { name: '使用体验券' })).toBeNull()
    expect(screen.queryByText('核心洗发水体验券')).toBeNull()
  })
})
