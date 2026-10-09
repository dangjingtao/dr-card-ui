import { http, HttpResponse } from 'msw'
import {
  USER_PROFILE_DETAIL_PATH,
  USER_PROFILE_PATH,
  USER_UPDATE_PATH,
} from '../../services/userProfile'
import { USER_AVATAR_UPLOAD_PATH } from '../../services/userAvatarUpload'
import {
  USER_PROFILE_DETAIL_MOCK,
  USER_PROFILE_MOCK,
  USER_UPDATE_MOCK,
} from '../fixtures/userProfile'

/** The browser Mock has a self-contained, visibly fake user; no production fallback. */
let mockEdits: { nick_name?: string; student_grade?: string; avatar_img?: string } = {}

export const userProfileHandlers = [
  http.get(`*${USER_PROFILE_DETAIL_PATH}`, () =>
    HttpResponse.json({
      ...USER_PROFILE_DETAIL_MOCK,
      data: {
        ...USER_PROFILE_DETAIL_MOCK.data,
        ...mockEdits,
      },
    }),
  ),

  // /profile models the backend login-time snapshot; it is not a read-after-write authority.
  http.get(`*${USER_PROFILE_PATH}`, () => HttpResponse.json(USER_PROFILE_MOCK)),

  http.post(`*${USER_AVATAR_UPLOAD_PATH}`, () =>
    HttpResponse.json({ code: 0, data: { url: 'https://example.com/mock-user-avatar.png' } }),
  ),

  http.post(`*${USER_UPDATE_PATH}`, async ({ request }) => {
    const data = await request.json() as Record<string, unknown>
    for (const key of ['nick_name', 'student_grade', 'avatar_img'] as const) {
      if (typeof data[key] === 'string') mockEdits[key] = data[key] as string
    }
    return HttpResponse.json({
      ...USER_UPDATE_MOCK,
      data: { ...USER_UPDATE_MOCK.data, ...mockEdits },
    })
  }),
]

/** For deterministic isolated tests, without persisting mock identity across scenarios. */
export function resetUserProfileMock() {
  mockEdits = {}
}
