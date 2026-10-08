import { buddyPhoneHandlers } from './buddyPhone'
import { checkinHandlers } from './checkin'
import { exchangeHandlers } from './exchange'
import { homeHandlers } from './home'
import { networkProbeHandler } from './networkProbe'
import { memberGradesHandlers } from './memberGrades'
import { myCouponsHandlers } from './myCoupons'
import { userProfileHandlers } from './userProfile'
import { userpointsHandlers } from './userpoints'

export const handlers = [
  networkProbeHandler,
  ...myCouponsHandlers,
  ...memberGradesHandlers,
  ...buddyPhoneHandlers,
  ...checkinHandlers,
  ...exchangeHandlers,
  ...homeHandlers,
  ...userProfileHandlers,
  ...userpointsHandlers,
]