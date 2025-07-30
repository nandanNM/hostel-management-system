import * as z from "zod"

export const searchParamsSchema = z.object({
  page: z.coerce.number().default(1),
  per_page: z.coerce.number().default(10),
  sort: z.string().optional(),
  user: z.string().optional(),
  status: z.string().optional(),
  nonVegType: z.string().optional(),

  from: z.string().optional(),
  to: z.string().optional(),

  operator: z.enum(["and", "or"]).default("and").optional(),
})

export const getMealsSchema = searchParamsSchema
export type GetMealsSchema = z.infer<typeof getMealsSchema>
