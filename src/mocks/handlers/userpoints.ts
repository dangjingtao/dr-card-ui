import { http, HttpResponse } from 'msw'

import { USER_POINTS_INDEX_PATH, USER_POINTS_STAT_PATH } from '../../services/userpoints'
import { USER_POINTS_RECORDS_MOCK, USER_POINTS_STAT_MOCK } from '../fixtures/userpoints'

const DEFAULT_PAGE_SIZE = 15

function toPositiveInt(value: string | null, fallback: number) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 1) return fallback
  return Math.floor(parsed)
}

/**
 * 泡泡值 Mock：与真实服务同一路径、同一信封。
 * index 真实处理 type / page / pageSize（过滤 + 分页），使页面在 Mock 与真实 API 下
 * 走完全相同的代码路径（切 Tab、触底翻页都不产生模式分支）。
 */
export const userpointsHandlers = [
  http.get(`*${USER_POINTS_STAT_PATH}`, () => HttpResponse.json(USER_POINTS_STAT_MOCK)),

  http.get(`*${USER_POINTS_INDEX_PATH}`, ({ request }) => {
    const url = new URL(request.url)
    const typeParam = url.searchParams.get('type')
    const type = typeParam == null || typeParam === '' ? null : Number(typeParam)
    const page = toPositiveInt(url.searchParams.get('page'), 1)
    const pageSize = toPositiveInt(url.searchParams.get('pageSize'), DEFAULT_PAGE_SIZE)

    const filtered = type == null ? USER_POINTS_RECORDS_MOCK : USER_POINTS_RECORDS_MOCK.filter((item) => item.type === type)
    const start = (page - 1) * pageSize
    const data = filtered.slice(start, start + pageSize)

    return HttpResponse.json({
      code: 0,
      msg: 'success',
      status: 'succ',
      data: {
        data,
        current_page: page,
        per_page: pageSize,
        total: filtered.length,
        last_page: Math.max(1, Math.ceil(filtered.length / pageSize)),
      },
    })
  }),
]
