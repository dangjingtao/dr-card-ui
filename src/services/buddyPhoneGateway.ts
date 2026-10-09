import { runtimePolicy } from '../app/config/runtime'
import {
  searchBuddyByPhone as mockLookup,
  sendBuddyPhoneInvite as mockSend,
  getBuddyPhoneInvitations as mockInbox,
  acceptBuddyPhoneInvitation as mockAccept,
} from './buddyPhone'
import {
  agreeBackendBuddyApplication,
  fetchBackendBuddyApplications,
  sendBackendBuddyApplication,
} from './buddyBackend'

/**
 * Backend master@b6d2821 supports phone POST /friends/add, not a read-only phone lookup.
 * Preview/dev mock retains the approved search prototype; API/test/prod shows direct send.
 */
export const buddyPhoneContractReady = runtimePolicy.dataMode === 'mock'
export const buddyPhoneInboxReady = true
export const buddyPhoneDirectSendReady = runtimePolicy.dataMode === 'api'

export async function searchBuddyByPhone(phone: string) {
  if (!buddyPhoneContractReady) throw new Error('手机号只读搜索接口尚未提供')
  return mockLookup(phone)
}

export async function sendBuddyPhoneInvite(phone: string) {
  if (runtimePolicy.dataMode === 'mock') return mockSend(phone)
  return sendBackendBuddyApplication(phone)
}

export async function getBuddyPhoneInvitations() {
  if (runtimePolicy.dataMode === 'mock') return mockInbox()
  return fetchBackendBuddyApplications()
}

export async function acceptBuddyPhoneInvitation(invitationId: string) {
  if (runtimePolicy.dataMode === 'mock') return mockAccept(invitationId)
  return agreeBackendBuddyApplication(invitationId)
}
