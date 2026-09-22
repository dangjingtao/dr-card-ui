/**
 * 通知已读状态共享模块（H010 Zustand migration）
 * -------------------------------------------------------------
 * 列表页 `/notifications` 与详情页 `/notifications/:id` 跨路由共享已读状态。
 * 消息正文仍来自 app/fixtures；Zustand 只保存本次会话中的客户端已读集合。
 *
 * 注意：这不是持久化存储；刷新页面会回到夹具初始态。未来若确认需要持久化，
 * 必须通过 H011 Storage Adapter，而不是在 store 内直接访问 Web Storage。
 */
import { useMemo } from 'react'
import { create } from 'zustand'

import { NOTIFICATION_FIXTURES, type NotificationFixture } from '../fixtures'

export type NotificationItem = NotificationFixture

const INITIAL_READ = NOTIFICATION_FIXTURES.filter((item) => !item.unread).map((item) => item.id)

interface NotificationStoreState {
  readIds: Set<string>
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  resetNotifications: () => void
}

function initialReadIds() {
  return new Set<string>(INITIAL_READ)
}

/**
 * Zustand 原始 store 仅供状态模块与基础验证使用。
 * 页面继续通过本文件导出的领域 hook/action 访问，避免把 getState/setState 散落到 UI。
 */
export const useNotificationStore = create<NotificationStoreState>((set, get) => ({
  readIds: initialReadIds(),

  markNotificationRead: (id) => {
    if (get().readIds.has(id)) return
    set((state) => ({ readIds: new Set(state.readIds).add(id) }))
  },

  markAllNotificationsRead: () => {
    if (NOTIFICATION_FIXTURES.every((item) => get().readIds.has(item.id))) return
    set({ readIds: new Set(NOTIFICATION_FIXTURES.map((item) => item.id)) })
  },

  resetNotifications: () => {
    set({ readIds: initialReadIds() })
  },
}))

/** 标记单条已读；已读时不触发多余渲染 */
export function markNotificationRead(id: string) {
  useNotificationStore.getState().markNotificationRead(id)
}

/** 一键已读（节点 #43 确认后调用） */
export function markAllNotificationsRead() {
  useNotificationStore.getState().markAllNotificationsRead()
}

/** 复位到夹具初始态（供夹具切换/调试使用） */
export function resetNotifications() {
  useNotificationStore.getState().resetNotifications()
}

/** 订阅共享已读集合，返回带 unread 的消息列表 */
export function useNotifications(): { items: NotificationItem[]; unreadCount: number } {
  const readIds = useNotificationStore((state) => state.readIds)

  return useMemo(() => {
    const items = NOTIFICATION_FIXTURES.map((item) => ({ ...item, unread: !readIds.has(item.id) }))
    return { items, unreadCount: items.filter((item) => item.unread).length }
  }, [readIds])
}

/** 按 :id 取单条消息（含最新已读态） */
export function useNotification(id?: string): NotificationItem | undefined {
  const readIds = useNotificationStore((state) => state.readIds)

  return useMemo(() => {
    const item = NOTIFICATION_FIXTURES.find((candidate) => candidate.id === id)
    return item ? { ...item, unread: !readIds.has(item.id) } : undefined
  }, [id, readIds])
}
