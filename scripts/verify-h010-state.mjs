import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createServer } from 'vite'

const server = await createServer({
  appType: 'custom',
  logLevel: 'error',
  server: { middlewareMode: true },
})

try {
  const addresses = await server.ssrLoadModule('/src/app/state/addresses.ts')
  const notifications = await server.ssrLoadModule('/src/app/state/notifications.ts')
  const { NOTIFICATION_FIXTURES } = await server.ssrLoadModule('/src/app/fixtures/index.ts')

  addresses.resetAddresses()
  const addressBaseline = addresses.useAddressStore.getState().addresses.length

  const created = addresses.addAddress(
    {
      name: 'H010 Probe',
      phone: '13800138000',
      region: '广东省 深圳市 南山区',
      detail: 'Zustand 迁移验证地址',
    },
    true,
  )

  let addressState = addresses.useAddressStore.getState()
  assert.equal(created.id, 'a-new-1')
  assert.equal(addressState.addresses.length, addressBaseline + 1)
  assert.equal(addressState.addresses.find((item) => item.id === created.id)?.isDefault, true)
  assert.equal(addressState.addresses.filter((item) => item.isDefault).length, 1)

  addresses.updateAddress(
    created.id,
    {
      name: 'H010 Probe Updated',
      phone: '13900139000',
      region: '广东省 广州市 天河区',
      detail: '更新后的 Zustand 验证地址',
    },
    false,
  )
  addressState = addresses.useAddressStore.getState()
  assert.equal(
    addressState.addresses.find((item) => item.id === created.id)?.detail,
    '更新后的 Zustand 验证地址',
  )

  addresses.setDefaultAddress(created.id)
  addressState = addresses.useAddressStore.getState()
  assert.equal(addressState.addresses.find((item) => item.id === created.id)?.isDefault, true)
  assert.equal(addressState.addresses.filter((item) => item.isDefault).length, 1)

  addresses.resetAddresses()
  addressState = addresses.useAddressStore.getState()
  assert.equal(addressState.addresses.length, addressBaseline)
  assert.equal(addressState.seq, 0)

  notifications.resetNotifications()
  const unreadProbe = NOTIFICATION_FIXTURES.find((item) => item.unread)
  assert.ok(unreadProbe, 'H010 verification needs at least one initially unread notification fixture')

  let notificationState = notifications.useNotificationStore.getState()
  assert.equal(notificationState.readIds.has(unreadProbe.id), false)

  notifications.markNotificationRead(unreadProbe.id)
  notificationState = notifications.useNotificationStore.getState()
  assert.equal(notificationState.readIds.has(unreadProbe.id), true)

  notifications.markAllNotificationsRead()
  notificationState = notifications.useNotificationStore.getState()
  assert.equal(
    NOTIFICATION_FIXTURES.every((item) => notificationState.readIds.has(item.id)),
    true,
  )

  notifications.resetNotifications()
  notificationState = notifications.useNotificationStore.getState()
  const expectedInitialRead = NOTIFICATION_FIXTURES.filter((item) => !item.unread)
    .map((item) => item.id)
    .sort()
  assert.deepEqual([...notificationState.readIds].sort(), expectedInitialRead)

  for (const path of ['src/app/state/addresses.ts', 'src/app/state/notifications.ts']) {
    const source = await readFile(path, 'utf8')
    assert.equal(source.includes('const listeners ='), false, `${path} still contains a manual listener store`)
    assert.equal(source.includes('setVersion'), false, `${path} still contains version-bump subscriptions`)
    assert.equal(source.includes('localStorage'), false, `${path} must not directly access localStorage`)
    assert.equal(source.includes('sessionStorage'), false, `${path} must not directly access sessionStorage`)
  }

  console.log(
    'H010 STATE PASS: address and notification shared state use Zustand, preserve domain actions/reset behavior, and avoid manual listeners or direct Web Storage.',
  )
} finally {
  await server.close()
}
