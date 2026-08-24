/**
 * 分享适配层（T007）
 * -------------------------------------------------------------
 * 背景：摹客 #34「保存到本地」要求把二维码生成海报并写入相册，#35「复制链接」要求
 * 写入系统粘贴板，#32/#33 要求向搭子发送邀请。这三件事都依赖真实端能力
 * （相册写入权限、Clipboard、短信/推送通道），任务卡明确「不实现真实通讯录、短信、
 * 系统分享或下载能力；用明确适配层模拟结果」。
 *
 * 因此本模块是**唯一**的分享出口：页面不直接碰 navigator.clipboard / a[download]，
 * 一律调用这里的 saveInvitePoster / copyInviteLink / sendPhoneInvite。
 * 真机接入时只需替换本文件实现，页面与状态机不必改动。
 *
 * 确定性约定（D-056，用户 2026-08-24 定案「失败态只用 ?state= 驱动」）：
 * - 页面内的真实操作**永不失败**，恒定返回成功分支；
 * - 失败态（poster-failed / link-failed）只能由 URL `?state=` 复现，
 *   不做关键字判定、不做随机失败、不做次数计数；
 * - 「进行中」用固定时长模拟一次往返（非随机），保证截图与 Playwright 可复现。
 */
import { BUDDY_INVITE_LINK, BUDDY_SHARE_FEEDBACK, type BuddyShareFeedback } from '../fixtures'

/** 模拟一次端能力往返的固定时长（ms）；固定值以保证可复现 */
export const SHARE_LATENCY = 600

/** 手机号搜索的固定「搜索中」时长（ms） */
export const SEARCH_LATENCY = 500

function delay<T>(value: T, ms: number): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), ms)
  })
}

/**
 * 保存邀请海报到本地相册（摹客 #34）
 * ⚠️ 适配层：不写相册、不下载文件，仅返回成功反馈供弹窗展示。
 */
export function saveInvitePoster(): Promise<BuddyShareFeedback> {
  return delay(BUDDY_SHARE_FEEDBACK['poster-saved'], SHARE_LATENCY)
}

/**
 * 复制邀请链接到粘贴板（摹客 #35）
 * ⚠️ 适配层：不调用 navigator.clipboard（夹具环境下受权限与 https 限制，
 *    且失败与否会变得不可复现），仅返回成功反馈供 Toast 展示。
 */
export function copyInviteLink(): Promise<BuddyShareFeedback> {
  return delay(BUDDY_SHARE_FEEDBACK['link-copied'], SHARE_LATENCY)
}

/** 邀请链接文本（#35 展示/复制的内容，来自夹具，非真实域名） */
export function getInviteLink(): string {
  return BUDDY_INVITE_LINK
}

/**
 * 向指定手机号发送搭子邀请（摹客 #32 → #33）
 * ⚠️ 适配层：不发短信、不查通讯录；结果由 fixtures 的确定性号码映射决定。
 */
export function sendPhoneInvite(phone: string): Promise<{ ok: true; phone: string }> {
  return delay({ ok: true as const, phone }, SHARE_LATENCY)
}
