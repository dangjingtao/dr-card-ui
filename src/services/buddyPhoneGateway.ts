import { runtimePolicy } from '../app/config/runtime'
import {
  searchBuddyByPhone as lookup,
  sendBuddyPhoneInvite as send,
  getBuddyPhoneInvitations as inbox,
  acceptBuddyPhoneInvitation as accept,
} from './buddyPhone'

/** #105/#95 are not yet signed. Prevent production contacting reserved __h014 Mock routes. */
export const buddyPhoneContractReady = runtimePolicy.dataMode === 'mock'

function requireBackendContract() {
  if (!buddyPhoneContractReady) {
    throw new Error('搭子邀请接口尚未接通，请稍后再试')
  }
}

export async function searchBuddyByPhone(phone: string) {
  requireBackendContract()
  return lookup(phone)
}
export async function sendBuddyPhoneInvite(phone: string) {
  requireBackendContract()
  return send(phone)
}
export async function getBuddyPhoneInvitations() {
  requireBackendContract()
  return inbox()
}
export async function acceptBuddyPhoneInvitation(invitationId: string) {
  requireBackendContract()
  return accept(invitationId)
}
