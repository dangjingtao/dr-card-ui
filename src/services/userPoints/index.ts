import { parseContract } from '../contracts'
import { httpClient } from '../http'
import { toUserPointRecordViewModel, type UserPointRecordViewModel } from './adapter'
import {
  userPointsIndexResponseSchema,
  type UserPointsIndexParams,
} from './contracts'

/**
 * H024 frontend-proposed transport seam.
 *
 * DearSeed confirms the UserPoints model and a raw CRUD endpoint, but its auth mechanism and the
 * final H5 business API are still unknown. Do not wire the formal H5 page directly to
 * /api/userpoints/index: that would promote an admin/model CRUD surface into a production contract
 * before authentication and product semantics are confirmed.
 *
 * Mock and future real HTTP use this same page/service seam. Once backend confirms the real H5
 * endpoint/auth contract, replace this mapping here without changing the page.
 */
export const H024_USER_POINTS_LIST_PATH = '/__h024/user-points'

export interface UserPointsPage {
  records: UserPointRecordViewModel[]
  pagination: {
    page: number
    pageSize: number
    total: number
    lastPage: number
  }
}

export async function listUserPointRecords(
  params: UserPointsIndexParams = {},
): Promise<UserPointsPage> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 15

  const payload = await httpClient.request<unknown>({
    method: 'GET',
    url: H024_USER_POINTS_LIST_PATH,
    params: { page, pageSize },
  })

  const parsed = parseContract(userPointsIndexResponseSchema, payload, {
    source: 'api',
    contract: 'h024.user-points.index',
  })

  return {
    records: parsed.data.data.map(toUserPointRecordViewModel),
    pagination: {
      page: parsed.data.current_page,
      pageSize: parsed.data.per_page,
      total: parsed.data.total,
      lastPage: parsed.data.last_page,
    },
  }
}

export type { UserPointRecordViewModel, UserPointFlowKind } from './adapter'
export type { UserPointEntity, UserPointsIndexParams } from './contracts'
