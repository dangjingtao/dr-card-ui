import { http, HttpResponse } from 'msw'

import { H013_NETWORK_PROBE_PATH, H013_NETWORK_PROBE_PAYLOAD } from '../fixtures/networkProbe'

/**
 * Infrastructure-only handler used to prove the H013 network boundary.
 *
 * It is intentionally not a business API contract. H014 will migrate real prototype-era fake
 * network scenarios into domain handlers once those flows are selected for cleanup.
 */
export const networkProbeHandler = http.get(`*${H013_NETWORK_PROBE_PATH}`, () => {
  return HttpResponse.json(H013_NETWORK_PROBE_PAYLOAD)
})
