import { z } from 'zod'

/**
 * H024 confirmed backend facts.
 *
 * Source:
 * - docs/api/dearseed-openapi.json → UserPointsSave/UserPointsIndex
 * - docs/api/dearseed-api.md → confirmed CRUD envelope/pagination contract
 *
 * Keep backend field names unchanged here. UI naming belongs in adapter.ts.
 */
export const userPointEntitySchema = z.object({
  id: z.number(),
  user_id: z.number(),
  points: z.number(),
  before_points: z.number(),
  after_points: z.number(),
  type: z.union([z.literal(10), z.literal(20)]),
  object: z.number().optional(),
  object_type: z.enum(['task', 'order']).optional(),
  operator: z.string().optional(),
  // Generic CRUD examples expose model timestamps as strings. Keep it optional because
  // UserPointsSave itself does not require this column.
  create_time: z.string().min(1).optional(),
})

export const userPointsIndexResponseSchema = z.object({
  code: z.literal(200),
  msg: z.string(),
  data: z.object({
    data: z.array(userPointEntitySchema),
    current_page: z.number().int().positive(),
    per_page: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    last_page: z.number().int().positive(),
  }),
})

export type UserPointEntity = z.infer<typeof userPointEntitySchema>
export type UserPointsIndexResponse = z.infer<typeof userPointsIndexResponseSchema>

export interface UserPointsIndexParams {
  page?: number
  pageSize?: number
}
