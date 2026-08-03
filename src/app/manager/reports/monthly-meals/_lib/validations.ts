import * as z from "zod"

/**
 * Mirrors the users table's search params so the shared data-table stack works
 * unchanged, plus the month being reported on.
 */
export const monthlyMealsSearchParamsSchema = z.object({
  page: z.coerce.number().default(1),
  per_page: z.coerce.number().default(20),
  sort: z.string().optional(),
  user: z.string().optional(),
  status: z.string().optional(),

  /** 1-based in the URL, 0-based everywhere in @/lib/date. */
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
})

export type MonthlyMealsSearch = z.infer<typeof monthlyMealsSearchParamsSchema>
