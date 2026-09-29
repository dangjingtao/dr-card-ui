import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

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
        <ConfirmVerify />
      </MemoryRouter>,
    )

    expect(screen.getByRole('button', { name: '返回卡包' })).toBeTruthy()
    expect(screen.queryByText('即将核销此券')).toBeNull()
    expect(screen.queryByText(VERIFY_VOUCHER_FIXTURE.store)).toBeNull()
  })
})
