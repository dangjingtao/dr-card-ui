import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { VERIFY_VOUCHER_FIXTURE } from '../app/fixtures'
import ConfirmVerify from './ConfirmVerify'

describe('ConfirmVerify Native transaction result', () => {
  it('shows the completed H5 result without presenting fixture store details as real Native data', () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/card/verify/confirm',
            state: {
              nativeScanCode: 'REAL-SCAN-CODE',
              nativeVerifyResult: 'done',
            },
          },
        ]}
      >
        <Routes>
          <Route path="/card/verify/confirm" element={<ConfirmVerify />} />
          <Route path="/card" element={<div>real-card-route</div>} />
        </Routes>
      </MemoryRouter>,
    )

    const returnButton = screen.getByRole('button', { name: '返回卡包' })
    expect(returnButton).toBeTruthy()
    expect(screen.queryByText('即将核销此券')).toBeNull()
    expect(screen.queryByText(VERIFY_VOUCHER_FIXTURE.store)).toBeNull()

    fireEvent.click(returnButton)
    expect(screen.getByText('real-card-route')).toBeTruthy()
  })
})
