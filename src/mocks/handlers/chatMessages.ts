import { http, HttpResponse } from 'msw'
import { CHAT_MESSAGES_INDEX_PATH } from '../../services/chatMessages'

/** Preview/dev only, same envelope as the real authenticated history endpoint. */
const history = [
  { id: 3, content: 'Mock·体验券在卡包里查看', user_id: '7', sender_id: '0', msg_type: 1, create_time: '2026-10-09 10:10:00' },
  { id: 2, content: 'Mock·我的体验券在哪里？', user_id: '7', sender_id: '7', msg_type: 1, create_time: '2026-10-09 10:09:00' },
  { id: 1, content: 'Mock·欢迎查看客服历史记录', user_id: '7', sender_id: 0, msg_type: 7, create_time: '2026-10-09 10:08:00' },
]
export const chatMessageHandlers = [
  http.get(`*${CHAT_MESSAGES_INDEX_PATH}`, ({ request }) => {
    const query = new URL(request.url).searchParams
    const page = Math.max(1, Number(query.get('page')) || 1)
    const size = Math.max(1, Math.min(100, Number(query.get('pageSize')) || 30))
    const result = {
      data: history.slice((page - 1) * size, page * size),
      current_page: page, per_page: size, total: history.length,
      last_page: Math.max(1, Math.ceil(history.length / size)),
    }
    return HttpResponse.json({ code: 0, msg: 'success', status: 'succ', data: result })
  }),
]
