/**
 * 通知已读状态共享模块（T012）
 * -------------------------------------------------------------
 * 背景：列表页 `/notifications` 与详情页 `/notifications/:id` 是两个独立路由，
 * 页面级 useState 会在跳转/返回时重置，导致「进入详情后列表未读数变化」无法验收。
 * 方案（用户确认）：模块级已读集合 + 订阅，仅覆盖已读这一份可变状态；
 * 消息内容仍然来自 app/fixtures 的静态夹具，不在此处编造数据。
 *
 * 注意：这是 UI 还原用的最小共享状态，不是持久化存储；刷新页面会回到夹具初始态，
 * 因此 `?state=` 夹具仍然可控可复现。
 */
import { useEffect, useMemo, useState } from 'react'
import { NOTIFICATION_FIXTURES, type NotificationFixture } from '../fixtures'

export type NotificationItem = NotificationFixture

/** 夹具中初始为已读的消息 id */
const INITIAL_READ = NOTIFICATION_FIXTURES.filter((item) => !item.unread).map((item) => item.id)

let readIds = new Set<string>(INITIAL_READ)
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

/** 标记单条已读；已读时不触发多余渲染 */
export function markNotificationRead(id: string) {
  if (readIds.has(id)) return
  readIds = new Set(readIds).add(id)
  emit()
}

/** 一键已读（节点 #43 确认后调用） */
export function markAllNotificationsRead() {
  if (NOTIFICATION_FIXTURES.every((item) => readIds.has(item.id))) return
  readIds = new Set(NOTIFICATION_FIXTURES.map((item) => item.id))
  emit()
}

/** 复位到夹具初始态（供夹具切换/调试使用） */
export function resetNotifications() {
  readIds = new Set(INITIAL_READ)
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** 订阅共享已读集合，返回带 unread 的消息列表 */
export function useNotifications(): { items: NotificationItem[]; unreadCount: number } {
  const [version, setVersion] = useState(0)

  useEffect(() => subscribe(() => setVersion((value) => value + 1)), [])

  return useMemo(() => {
    void version
    const items = NOTIFICATION_FIXTURES.map((item) => ({ ...item, unread: !readIds.has(item.id) }))
    return { items, unreadCount: items.filter((item) => item.unread).length }
  }, [version])
}

/** 按 :id 取单条消息（含最新已读态） */
export function useNotification(id?: string): NotificationItem | undefined {
  const { items } = useNotifications()
  return items.find((item) => item.id === id)
}
