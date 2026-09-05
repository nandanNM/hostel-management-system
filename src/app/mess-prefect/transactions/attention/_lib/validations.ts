import * as z from "zod"

export const ATTENTION_TABS = {
  dues: {
    label: "Boarders with dues",
    description: "Active boarders carrying an outstanding balance.",
  },
  overdue: {
    label: "Overdue bills",
    description: "Unpaid charges that are already past their due date.",
  },
} as const

export type AttentionType = keyof typeof ATTENTION_TABS

export const DEFAULT_TYPE: AttentionType = "dues"

/**
 * Ageing buckets: "unpaid for at least N days past the due date". Lets the
 * prefect chase only the boarders who have been sitting on a bill, rather
 * than everyone who happens to owe something today.
 */
export const AGEING_OPTIONS = [
  { label: "Any age", value: "0" },
  { label: "10+ days overdue", value: "10" },
  { label: "30+ days overdue", value: "30" },
  { label: "60+ days overdue", value: "60" },
  { label: "90+ days overdue", value: "90" },
] as const

export const searchParamsSchema = z.object({
  type: z.enum(["dues", "overdue"]).catch(DEFAULT_TYPE).default(DEFAULT_TYPE),
  page: z.coerce.number().int().min(1).catch(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).catch(10).default(10),
  sort: z.string().optional(),
  /** Free-text match against boarder name or email. */
  name: z.string().optional(),
  /** Minimum days past due, as a string so it round-trips through the URL. */
  days: z.coerce.number().int().min(0).catch(0).default(0),
})

export type AttentionSearch = z.infer<typeof searchParamsSchema>

export const reminderSchema = z.object({
  userIds: z.array(z.string().min(1)).min(1, "Select at least one boarder."),
  type: z.enum(["dues", "overdue"]),
})

export type SendRemindersInput = z.input<typeof reminderSchema>

export type AttentionRow = {
  userId: string
  name: string
  email: string
  image: string | null
  /** Outstanding balance for `dues`, overdue total for `overdue`. */
  amount: number
  /** Unpaid bills past their due date. */
  overdueCount: number
  oldestDueDate: Date | null
  /** Days since the oldest unpaid bill fell due; 0 when nothing is overdue. */
  daysOverdue: number
}

export type AttentionResponse = {
  data: AttentionRow[]
  totalRows: number
  pageCount: number
}
