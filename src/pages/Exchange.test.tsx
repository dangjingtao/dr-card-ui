import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'

const mocks = vi.hoisted(() => ({
  redeem: vi.fn(),
  close: vi.fn(),
  patchFixtureQueryControls: vi.fn(),
  useExchangeCoupons: vi.fn(),
  pointsRemote: { state: 'success', data: { points: 500, income: 0, expense: 0 } } as
    | { state: 'success'; data: { points: number; income: number; expense: number } }
    | { state: 'loading' }
    | { state: 'error'; message: string },
  overlay: null as string | null,
}))

vi.mock('../services/exchange', () => ({
  redeemExchangeProduct: mocks.redeem,
}))

vi.mock('./exchange/useExchangeFeed', () => ({
  useExchangeCoupons: mocks.useExchangeCoupons,
}))

vi.mock('./points/usePointsFeed', () => ({
  useUserPointsStat: () => ({
    remote: mocks.pointsRemote,
    reload: vi.fn(),
  }),
}))

vi.mock('../app/fixtures/useFixture', () => ({
  useFixtureState: () => ({ state: null }),
  useOverlay: () => ({ overlay: mocks.overlay, close: mocks.close }),
  useFixtureQueryControls: () => ({ patch: mocks.patchFixtureQueryControls }),
  useFixtureDebug: () => false,
}))

vi.mock('../app/router/routes', () => ({
  findRouteByPathname: () => ({ path: '/exchange', task: 'T008', nodes: [18], states: [], overlays: [] }),
}))

vi.mock('../components/mobile/DebugPanel', () => ({ default: () => null }))
vi.mock('../components/mobile/PageContainer', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))
vi.mock('../components/card/BubbleValueRedeemCard', () => ({
  default: ({ onRedeem }: { onRedeem?: () => void }) => (
    <button type="button" onClick={onRedeem}>顶部立即兑换</button>
  ),
}))

import Exchange from './Exchange'

/** 页面内使用 useNavigate / useSearchParams，需在 Router 上下文中渲染。 */
const renderExchange = (entry = '/exchange') =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Exchange />
    </MemoryRouter>,
  )

const COUPONS = [
  {
    id: 1,
    name: 'Mock·洗护体验券',
    desc: '洗发 / 护发 / 沐浴体验，限到店核销',
    cost: 200,
    redeemed: 12,
    image: undefined,
    soldOut: false,
  },
  {
    id: 2,
    name: 'Mock·已兑完券',
    desc: '单次体验',
    cost: 320,
    redeemed: 720,
    image: undefined,
    soldOut: true,
  },
  {
    id: 3,
    name: 'Mock·高价券',
    desc: '泡泡值不足',
    cost: 900,
    redeemed: 1,
    image: undefined,
    soldOut: false,
  },
]

function successRemote() {
  return { remote: { state: 'success', data: COUPONS }, reload: vi.fn() }
}

afterEach(() => {
  mocks.redeem.mockReset()
  mocks.close.mockReset()
  mocks.patchFixtureQueryControls.mockReset()
  mocks.useExchangeCoupons.mockReset()
  mocks.pointsRemote = { state: 'success', data: { points: 500, income: 0, expense: 0 } }
  mocks.overlay = null
})

describe('Exchange（洗护体验券专区接口接入）', () => {
  it('renders coupons from the API with cost / redemption count', async () => {
    mocks.useExchangeCoupons.mockReturnValue(successRemote())

    renderExchange()

    expect(await screen.findByText('Mock·洗护体验券')).toBeTruthy()
    expect(screen.getByText('Mock·已兑完券')).toBeTruthy()
    // 兑换量与所需泡泡值来自接口字段映射
    expect(screen.getByText('兑换量 12')).toBeTruthy()
    expect(screen.getAllByText('200', { exact: false }).length).toBeGreaterThan(0)
  })

  it('maps sold-out and insufficient balance states onto the card button', async () => {
    mocks.useExchangeCoupons.mockReturnValue(successRemote())

    renderExchange()
    await screen.findByText('Mock·洗护体验券')

    // exchanged_nuuur >= total_number → 已兑完
    const soldOutButtons = screen.getAllByText('已兑完')
    expect(soldOutButtons.length).toBeGreaterThan(0)
    // points_number > 我的余额(500) → 泡泡值不足
    expect(screen.getByText('泡泡值不足')).toBeTruthy()
  })

  it('updates category and closes the redeem overlay in one navigation', async () => {
    mocks.useExchangeCoupons.mockReturnValue(successRemote())

    renderExchange('/exchange?category=conditioner&product=1')
    await screen.findByText('Mock·洗护体验券')

    expect(mocks.useExchangeCoupons).toHaveBeenCalledWith()

    fireEvent.click(screen.getByRole('tab', { name: '洗发体验' }))

    expect(mocks.patchFixtureQueryControls).toHaveBeenCalledWith(
      { overlay: null },
      { category: 'shampoo', product: null },
    )
    expect(mocks.close).not.toHaveBeenCalled()
    expect(mocks.useExchangeCoupons).toHaveBeenCalledWith()
  })

  it('shows a retry action when the coupon list fails', async () => {
    mocks.useExchangeCoupons.mockReturnValue({
      remote: { state: 'error', message: '优惠券列表获取失败' },
      reload: vi.fn(),
    })

    renderExchange()

    expect(await screen.findByText('体验券加载失败')).toBeTruthy()
    expect(screen.getByRole('button', { name: '重新加载' })).toBeTruthy()
  })

  it('shows the empty state when the backend returns no coupons', async () => {
    mocks.useExchangeCoupons.mockReturnValue({
      remote: { state: 'success', data: [] },
      reload: vi.fn(),
    })

    renderExchange()

    expect(await screen.findByText('没有找到相关体验券')).toBeTruthy()
  })

  it('keeps the top redeem CTA inside the exchange page and scrolls to coupons', async () => {
    mocks.useExchangeCoupons.mockReturnValue(successRemote())

    renderExchange()
    await screen.findByText('Mock·洗护体验券')

    const couponList = screen.getByRole('region', { name: '洗护体验券列表' })
    couponList.scrollIntoView = vi.fn()

    fireEvent.click(screen.getByRole('button', { name: '顶部立即兑换' }))

    expect(couponList.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    })
  })

  it('does not substitute the first coupon when an explicit product id is invalid', async () => {
    mocks.overlay = 'redeem'
    mocks.useExchangeCoupons.mockReturnValue(successRemote())

    renderExchange('/exchange?overlay=redeem&product=999999')
    await screen.findByText('Mock·洗护体验券')

    expect(screen.queryByText('确认兑换')).toBeNull()
  })


  it('fails closed when the points balance is unavailable', async () => {
    mocks.overlay = 'redeem'
    mocks.pointsRemote = { state: 'error', message: '泡泡值获取失败' }
    mocks.useExchangeCoupons.mockReturnValue(successRemote())

    renderExchange('/exchange?overlay=redeem&product=1')
    await screen.findByRole('button', { name: /Mock·洗护体验券，200 泡泡值/ })

    const redeemButton = screen.getByRole('button', { name: '立即兑换' })
    expect((redeemButton as HTMLButtonElement).disabled).toBe(true)
    expect(screen.queryByText('泡泡值不足')).toBeNull()
  })

})
