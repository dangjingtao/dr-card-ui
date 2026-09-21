/**
 * 搭子分享宿主适配层。
 *
 * H032 起，相册写入与剪贴板不再恒定模拟成功；正式 H5 只通过 Native Bridge 调用。
 * 页面仍只消费 BuddyShareFeedback，不直接接触 window.androidBridge / window.iosBridge。
 *
 * 注意：当前邀请二维码仍是明确的 placeholder，仓库没有真实邀请海报 bytes / URL。
 * 因此 saveInvitePoster() 只有在上游提供真实 poster payload 时才调用 Native，
 * 否则返回既有 poster-failed 反馈，避免拿伪造图片冒充真实海报。
 */
import { BUDDY_INVITE_LINK, BUDDY_SHARE_FEEDBACK, type BuddyShareFeedback } from '../fixtures'
import {
  copyText,
  saveImageToAlbum,
  type NativeSaveImageToAlbumInput,
} from '../../services/nativeBridge'

export type InvitePosterPayload = NativeSaveImageToAlbumInput

/** 保存真实邀请海报到系统相册。没有真实 poster payload 时明确失败，不伪造内容。 */
export async function saveInvitePoster(
  poster?: InvitePosterPayload,
): Promise<BuddyShareFeedback> {
  if (!poster) return BUDDY_SHARE_FEEDBACK['poster-failed']

  try {
    const result = await saveImageToAlbum(poster)
    return result.success
      ? BUDDY_SHARE_FEEDBACK['poster-saved']
      : BUDDY_SHARE_FEEDBACK['poster-failed']
  } catch {
    return BUDDY_SHARE_FEEDBACK['poster-failed']
  }
}

/**
 * 通过 Native copyText 写入系统剪贴板。
 *
 * 当前仓库只有 fixture 邀请链接，没有正式业务 invite URL；调用方未提供真实链接时明确失败，
 * 不把 drcard.example 写进用户剪贴板冒充线上邀请地址。
 */
export async function copyInviteLink(inviteLink?: string): Promise<BuddyShareFeedback> {
  if (!inviteLink) return BUDDY_SHARE_FEEDBACK['link-failed']

  try {
    const result = await copyText({ text: inviteLink })
    return result.success
      ? BUDDY_SHARE_FEEDBACK['link-copied']
      : BUDDY_SHARE_FEEDBACK['link-failed']
  } catch {
    return BUDDY_SHARE_FEEDBACK['link-failed']
  }
}

/** 邀请链接 fixture，仅供 mock/debug 展示；不得自动当作 production copy payload。 */
export function getInviteLink(): string {
  return BUDDY_INVITE_LINK
}
