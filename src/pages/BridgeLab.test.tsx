import { afterEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import BridgeLab from './BridgeLab'

type AndroidLabWindow = Window & {
  androidBridge?: Record<string, unknown>
}

const labWindow = window as AndroidLabWindow

afterEach(() => {
  delete labWindow.androidBridge
})

describe('Bridge Lab page', () => {
  it('renders the capability registry without fixed per-capability top-level actions', () => {
    render(<BridgeLab />)

    expect(screen.getByRole('heading', { name: 'Bridge Lab' })).toBeTruthy()
    expect(document.querySelector('[data-capability-name="getLoginToken"]')).not.toBeNull()
    expect(document.querySelector('[data-capability-name="closeWebView"]')).not.toBeNull()
    expect(screen.getByRole('button', { name: /调用 getLoginToken/i })).toBeTruthy()
  })

  it('redacts a sensitive Android Raw Probe result until explicit reveal', async () => {
    labWindow.androidBridge = {
      getLoginToken() {
        return 'super-secret-token'
      },
    }

    render(<BridgeLab />)
    fireEvent.change(screen.getByLabelText('Android method'), {
      target: { value: 'getLoginToken' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Run Android Probe' }))

    await waitFor(() => {
      expect(screen.getByText('[REDACTED]')).toBeTruthy()
    })
    expect(screen.queryByText('super-secret-token')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: '显式显示原始结果' }))
    expect(screen.getByText('super-secret-token')).toBeTruthy()
  })

  it('shows browser/host absence as an explicit error instead of fake success', async () => {
    render(<BridgeLab />)
    fireEvent.change(screen.getByLabelText('Android method'), {
      target: { value: 'missingMethod' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Run Android Probe' }))

    await waitFor(() => {
      expect(screen.getByText(/window\.androidBridge is not available/i)).toBeTruthy()
    })
  })
})
