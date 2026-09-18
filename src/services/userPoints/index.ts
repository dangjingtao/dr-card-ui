import { parseContract } from '../contracts'
import { httpClient } from '../http'
import { toUserPointRecordViewModel, type UserPointRecordViewModel } from './adapter'
import {
  userPointsIndexResponseSchema,
  type UserPointsIndexParams,
} from './contracts'

/**
 * Confirmed current backend CRUD endpoint from DearSeed OpenAPI.
 *
 * H024 uses it as a temporary read transport for the formal H5 points-detail page. This does not
 * assert that raw CRUD is the final product API, and it does not invent auth headers. H008 remains
 * blocked until the real backend base URL/auth/product endpoint contract is confirmed.
 */
export const USER_POINTS_INDEX_PATH = '/api/userpoints/index'

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
    url: USER_POINTS_INDEX_PATH,
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
