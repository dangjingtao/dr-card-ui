import { buddyPhoneHandlers } from './buddyPhone'
import { exchangeHandlers } from './exchange'
import { homeHandlers } from './home'
import { networkProbeHandler } from './networkProbe'
import { userProfileHandlers } from './userProfile'

export const handlers = [
  networkProbeHandler,
  ...buddyPhoneHandlers,
  ...exchangeHandlers,
  ...homeHandlers,
  ...userProfileHandlers,
]