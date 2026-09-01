import * as z from "zod"

export const searchParamsSchema = z.object({
  page: z.coerce.number().default(1),
  per_page: z.coerce.number().default(20),
  sort: z.string().optional(),
  details: z.string().optional(),
  actor: z.string().optional(),
  actionType: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
})

export type ActivityLogsSearch = z.infer<typeof searchParamsSchema>
