import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

// This legacy T012 store test verifies the intentionally retained preview/mock fixture mode.
vi.mock('../config/runtime', () => ({ runtimePolicy: { dataMode: 'mock' } }))

import { NOTIFICATION_FIXTURES } from '../fixtures'
import {
  addAddress,
  resetAddresses,
  setDefaultAddress,
  updateAddress,
  useAddresses,
} from './addresses'
import {
  markAllNotificationsRead,
  markNotificationRead,
  resetNotifications,
  useNotifications,
} from './notifications'

afterEach(() => {
  resetAddresses()
  resetNotifications()
})

describe('Zustand domain stores', () => {
  it('updates address subscribers while keeping a single default address', () => {
    resetAddresses()
    const { result } = renderHook(() => useAddresses())
    const baselineLength = result.current.items.length

    let createdId = ''
    act(() => {
      const created = addAddress(
        {
          name: 'H017 Probe',
          phone: '13800138000',
          region: '广东省 深圳市 南山区',
          detail: 'RTL Zustand 验证地址',
        },
        true,
      )
      createdId = created.id
    })

    expect(result.current.items).toHaveLength(baselineLength + 1)
    expect(result.current.defaultId).toBe(createdId)
    expect(result.current.items.filter((item) => item.isDefault)).toHaveLength(1)

    act(() => {
      updateAddress(
        createdId,
        {
          name: 'H017 Probe Updated',
          phone: '13900139000',
          region: '广东省 广州市 天河区',
          detail: '更新后的 RTL Zustand 验证地址',
        },
        false,
      )
    })
    expect(result.current.items.find((item) => item.id === createdId)?.detail).toBe(
      '更新后的 RTL Zustand 验证地址',
    )

    act(() => {
      setDefaultAddress(createdId)
    })
    expect(result.current.defaultId).toBe(createdId)
    expect(result.current.items.filter((item) => item.isDefault)).toHaveLength(1)
  })

  it('updates notification subscribers for single-read and mark-all actions', () => {
    resetNotifications()
    const unreadProbe = NOTIFICATION_FIXTURES.find((item) => item.unread)
    expect(unreadProbe).toBeDefined()
    if (!unreadProbe) return

    const { result } = renderHook(() => useNotifications())
    const baselineUnread = result.current.unreadCount
    expect(result.current.items.find((item) => item.id === unreadProbe.id)?.unread).toBe(true)

    act(() => {
      markNotificationRead(unreadProbe.id)
    })
    expect(result.current.unreadCount).toBe(baselineUnread - 1)
    expect(result.current.items.find((item) => item.id === unreadProbe.id)?.unread).toBe(false)

    act(() => {
      markAllNotificationsRead()
    })
    expect(result.current.unreadCount).toBe(0)
    expect(result.current.items.every((item) => !item.unread)).toBe(true)
  })
})
