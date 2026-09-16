import { buddyPhoneHandlers } from './buddyPhone'
import { exchangeHandlers } from './exchange'
import { networkProbeHandler } from './networkProbe'

export const handlers = [networkProbeHandler, ...buddyPhoneHandlers, ...exchangeHandlers]
