import { http, HttpResponse } from 'msw'
import { MEMBER_GRADES_PATH } from '../../services/memberGrades'
import { MEMBER_GRADES_MOCK } from '../fixtures/memberGrades'

export const memberGradesHandlers = [
  http.get(`*${MEMBER_GRADES_PATH}`, ({ request }) => {
    const query = new URL(request.url).searchParams
    const page = Number(query.get('page') ?? '1')
    const pageSize = Math.min(100, Number(query.get('pageSize') ?? '15'))
    const start = (page - 1) * pageSize
    const enabled = MEMBER_GRADES_MOCK.filter((grade) => grade.status === 10)
    return HttpResponse.json({
      code: 0,
      msg: 'success',
      status: 'succ',
      data: {
        data: enabled.slice(start, start + pageSize),
        current_page: page,
        per_page: pageSize,
        total: enabled.length,
        last_page: Math.max(1, Math.ceil(enabled.length / pageSize)),
      },
    })
  }),
]
