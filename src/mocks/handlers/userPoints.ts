import { http, HttpResponse } from 'msw'

import { USER_POINTS_INDEX_PATH } from '../../services/userPoints'
import { H024_USER_POINT_ROWS } from '../fixtures/h024UserPoints'

function positiveInt(raw: string | null, fallback: number, max?: number) {
  const parsed = Number(raw)
  if (!Number.isFinite(parsed)) return fallback
  const value = Math.max(1, Math.floor(parsed))
  return max ? Math.min(value, max) : value
}

/**
 * Mirrors the confirmed generic CRUD index envelope/pagination shape.
 * It does not model auth: DearSeed auth remains unconfirmed and H024 must not invent it.
 */
export const userPointsHandlers = [
  http.get(`*${USER_POINTS_INDEX_PATH}`, ({ request }) => {
    const url = new URL(request.url)
    const page = positiveInt(url.searchParams.get('page'), 1)
    const pageSize = positiveInt(url.searchParams.get('pageSize'), 15, 100)
    const total = H024_USER_POINT_ROWS.length
    const lastPage = Math.max(Math.ceil(total / pageSize), 1)
    const start = (page - 1) * pageSize
    const rows = H024_USER_POINT_ROWS.slice(start, start + pageSize)

    return HttpResponse.json({
      code: 200,
      msg: 'success',
      data: {
        data: rows,
        current_page: page,
        per_page: pageSize,
        total,
        last_page: lastPage,
      },
    })
  }),
]
