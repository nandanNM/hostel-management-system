import * as z from "zod"

/** Mirrors the monthly-meals report's search params: same table stack, plus month. */
export const searchParamsSchema = z.object({
  page: z.coerce.number().default(1),
  per_page: z.coerce.number().default(20),
  sort: z.string().optional(),
  requestedBy: z.string().optional(),
  status: z.string().optional(),
  mealTime: z.string().optional(),

  /** 1-based in the URL, 0-based everywhere in @/lib/date. */
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
})

export type GuestMealLogsSearch = z.infer<typeof searchParamsSchema>
