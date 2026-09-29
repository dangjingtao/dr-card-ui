import { buddyPhoneHandlers } from './buddyPhone'
import { checkinHandlers } from './checkin'
import { exchangeHandlers } from './exchange'
import { homeHandlers } from './home'
import { networkProbeHandler } from './networkProbe'
import { userProfileHandlers } from './userProfile'
import { userpointsHandlers } from './userpoints'

export const handlers = [
  networkProbeHandler,
  ...buddyPhoneHandlers,
  ...checkinHandlers,
  ...exchangeHandlers,
  ...homeHandlers,
  ...userProfileHandlers,
  ...userpointsHandlers,
]