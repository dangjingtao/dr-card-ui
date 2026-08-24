/**
 * 搭子共享状态模块（T007）
 * -------------------------------------------------------------
 * 背景：任务卡要求「9 个节点逐一可定位并连成闭环」。#36 接受邀请与 #27/#28 搭子列表
 * 是两个独立路由，若各自用页面级 useState，「接受邀请 → 返回搭子页看到已绑定」
 * 这条闭环无法验收；#32 的「已邀请」重复邀请处理同理需要跨路由记忆。
 * 方案：沿用 state/addresses.ts 的模块级可变状态 + 订阅，初始数据来自 app/fixtures。
 *
 * 注意：这是 UI 还原用的最小共享状态，不是持久化存储；刷新页面回到夹具初始态，
 * 因此 `?state=` 夹具仍然可控可复现（截图时以 URL 为唯一事实源）。
 */
import { useEffect, useMemo, useState } from 'react'
import {
  BUDDY_LIST_MULTI,
  BUDDY_LIST_SINGLE,
  resolveBuddySearchOutcome,
  type BuddyFixture,
} from '../fixtures'

/** 列表档位：对应 routes.ts 的 `?state=` 三档（无 / 单 / 多） */
export type BuddyListPreset = 'empty' | 'single' | 'multi'

const PRESETS: Record<BuddyListPreset, BuddyFixture[]> = {
  empty: [],
  single: BUDDY_LIST_SINGLE,
  multi: BUDDY_LIST_MULTI,
}

let buddies: BuddyFixture[] = []
/** 本次会话内已发出邀请的手机号，用于 #32 的「已邀请」重复邀请提示 */
let invitedPhones = new Set<string>()
let seq = 0
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

/** 递增 id，不使用随机数，保证同一操作序列结果可复现 */
function nextId() {
  seq += 1
  return `buddy-accepted-${seq}`
}

/** 按 `?state=` 档位重置列表（夹具切换时调用） */
export function applyBuddyPreset(preset: BuddyListPreset) {
  buddies = PRESETS[preset].map((item) => ({ ...item }))
  emit()
}

/**
 * 接受邀请后绑定搭子（摹客 #36 → #28）
 * 昵称取自邀请话术里的「小美」，不编造新人物。
 */
export function acceptBuddyInvite(name: string): BuddyFixture {
  const created: BuddyFixture = { id: nextId(), name }
  buddies = [created, ...buddies]
  emit()
  return created
}

/** 记录一次已发出的手机号邀请（#32 重复邀请判定） */
export function markPhoneInvited(phone: string) {
  const trimmed = phone.trim()
  if (!trimmed || invitedPhones.has(trimmed)) return
  invitedPhones = new Set(invitedPhones).add(trimmed)
  emit()
}

/**
 * 手机号搜索结果：先看本次会话是否已邀请过，再落到夹具的确定性映射。
 * 这样「发送邀请成功后再搜同一号码 → 已邀请」这条重复邀请路径可被验收。
 */
export function resolveBuddyPhoneOutcome(phone: string) {
  const trimmed = phone.trim()
  if (trimmed && invitedPhones.has(trimmed)) return 'invited' as const
  return resolveBuddySearchOutcome(trimmed)
}

/** 复位到夹具初始态（供夹具切换/调试使用） */
export function resetBuddies() {
  buddies = []
  invitedPhones = new Set()
  seq = 0
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** 订阅共享搭子集合 */
export function useBuddies(): { items: BuddyFixture[]; count: number } {
  const [version, setVersion] = useState(0)

  useEffect(() => subscribe(() => setVersion((value) => value + 1)), [])

  return useMemo(() => {
    void version
    return { items: buddies, count: buddies.length }
  }, [version])
}
