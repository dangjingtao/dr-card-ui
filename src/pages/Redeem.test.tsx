import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ redeemCardCode: vi.fn() }))

vi.mock('../services/redeemCode', () => ({
  redeemCardCode: mocks.redeemCardCode,
}))

vi.mock('../app/config/runtime', async (importOriginal) => {
  const original = await importOriginal<typeof import('../app/config/runtime')>()
  return { ...original, runtimePolicy: { ...original.runtimePolicy, dataMode: 'api' } }
})

vi.mock('../app/fixtures/useFixture', () => ({
  useFixtureState: () => ({ state: null }),
}))

vi.mock('../app/router/routes', () => ({
  findRouteByPathname: () => ({ path: '/redeem' }),
}))

vi.mock('../components/mobile/DebugPanel', () => ({ default: () => null }))
vi.mock('../components/mobile/PageContainer', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

import Redeem from './Redeem'

const receipt = {
  user_card_id: 21, card_id: 4,
  card_name: '洗护体验卡',
  card_sn: 'RC00000000000014',
}

const renderRedeem = () => render(
  <MemoryRouter initialEntries={['/redeem']}><Redeem /></MemoryRouter>,
)

afterEach(() => mocks.redeemCardCode.mockReset())

describe('Redeem confirmed backend integration', () => {
  it('preserves exact code and displays actual issued card receipt only after backend success', async () => {
    mocks.redeemCardCode.mockResolvedValue(receipt)
    renderRedeem()
    fireEvent.change(screen.getByRole('textbox', { name: '兑换码' }), {
      target: { value: 'Abc- 123456' },
    })
    fireEvent.click(screen.getByRole('button', { name: '确认兑换' }))
    await waitFor(() => expect(mocks.redeemCardCode).toHaveBeenCalledWith('Abc- 123456'))
    expect(await screen.findByText('洗护体验卡')).toBeTruthy()
    expect(screen.getByText('卡券编号：RC00000000000014')).toBeTruthy()
    expect(screen.getByRole('button', { name: '查看我的卡包' })).toBeTruthy()
  })

  it('keeps the form for backend business errors and displays its error message', async () => {
    mocks.redeemCardCode.mockRejectedValue(new Error('该兑换码已被使用'))
    renderRedeem()
    fireEvent.change(screen.getByRole('textbox', { name: '兑换码' }), {
      target: { value: 'ABC123456789' },
    })
    fireEvent.click(screen.getByRole('button', { name: '确认兑换' }))
    expect(await screen.findByText('该兑换码已被使用')).toBeTruthy()
    expect(screen.queryByText('兑换成功')).toBeNull()
    expect(screen.getByRole('button', { name: '确认兑换' })).toBeTruthy()
  })

  it('disables submitting fewer than ten characters, but does not alter or uppercase content', () => {
    renderRedeem()
    fireEvent.change(screen.getByRole('textbox', { name: '兑换码' }), {
      target: { value: 'a1-b2+3' },
    })
    expect(screen.getByRole<HTMLInputElement>('textbox', { name: '兑换码' }).value).toBe('a1-b2+3')
    expect(screen.getByRole<HTMLButtonElement>('button', { name: '确认兑换' }).disabled).toBe(true)
    expect(mocks.redeemCardCode).not.toHaveBeenCalled()
  })
})
