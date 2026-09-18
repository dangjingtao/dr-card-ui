import { buddyPhoneHandlers } from './buddyPhone'
import { exchangeHandlers } from './exchange'
import { networkProbeHandler } from './networkProbe'
import { userPointsHandlers } from './userPoints'

export const handlers = [networkProbeHandler, ...buddyPhoneHandlers, ...exchangeHandlers, ...userPointsHandlers]
