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

export const createUserFineSchema = z.object({
  targetUserId: z.string(),
  fineAmount: z.string().min(1, "Amount must be greater than 0"),
  fineReason: z.string().min(3, "Reason must be at least 3 characters"),
  fineDueDate: z.coerce.date().refine((date) => date > new Date(), {
    message: "Due date must be in the future",
  }),
})

export type CreateUserFineSchema = z.infer<typeof createUserFineSchema>
