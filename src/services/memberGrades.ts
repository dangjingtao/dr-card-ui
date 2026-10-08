import { z } from 'zod'

import { parseApiEnvelope } from './contracts/apiEnvelope'
import { createBusinessError, httpClient } from './http'

/** 后端 API/docs/api-membership—levels.md；等级列表无需登录。 */
export const MEMBER_GRADES_PATH = '/api/usergrade/index'

const memberGradeSchema = z.object({
  id: z.number(),
  name: z.string(),
  icon_image: z.string().nullish(),
  min_exp_number: z.number(),
  benefit_desc: z.string().nullish(),
  sort_number: z.number(),
  is_default_switch: z.number(),
  status: z.number(),
}).passthrough()

const memberGradePageSchema = z.object({
  data: z.array(memberGradeSchema),
  current_page: z.number().int().positive(),
  per_page: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  last_page: z.number().int().positive(),
}).passthrough()

export type MemberGrade = z.infer<typeof memberGradeSchema>

const PAGE_SIZE = 100
const MAX_PAGES = 20

/** 所有已启用等级。真实 HTTP 与 MSW 共用此 service，不接受静态等级兜底。 */
export async function fetchMemberGrades(): Promise<MemberGrade[]> {
  const grades: MemberGrade[] = []

  for (let page = 1; page <= MAX_PAGES; page++) {
    const payload = await httpClient.request<unknown>({
      method: 'GET',
      url: MEMBER_GRADES_PATH,
      params: { status: 10, page, pageSize: PAGE_SIZE, 'orderBy[sort_number]': 'ASC' },
    })
    const result = parseApiEnvelope(payload, memberGradePageSchema, {
      contract: 'member-grades.index',
      fallbackMessage: '会员等级获取失败',
    })
    grades.push(...result.data)

    if (page >= result.last_page) {
      return grades
        .filter((grade) => grade.status === 10)
        .sort((a, b) => a.sort_number - b.sort_number || a.min_exp_number - b.min_exp_number)
    }
    if (result.data.length === 0) {
      throw createBusinessError('会员等级分页异常，请稍后重试')
    }
  }
  throw createBusinessError('会员等级页数超出支持范围')
}
