import * as z from "zod"

import {
  istDaysBetween,
  istEndOfDay,
  istStartOfDay,
  istStartOfDaysAgo,
} from "@/lib/date"

export const RANGE_PRESETS = {
  "7d": { label: "Last 7 days", days: 7 },
  "30d": { label: "Last 30 days", days: 30 },
  "90d": { label: "Last 90 days", days: 90 },
  "365d": { label: "Last 12 months", days: 365 },
} as const

export type RangePreset = keyof typeof RANGE_PRESETS

export const DEFAULT_PRESET: RangePreset = "30d"

export const searchParamsSchema = z.object({
  range: z
    .enum(["7d", "30d", "90d", "365d", "custom"])
    .catch(DEFAULT_PRESET)
    .default(DEFAULT_PRESET),
  from: z.string().optional(),
  to: z.string().optional(),
})

export type TransactionsSearch = z.infer<typeof searchParamsSchema>

export interface ResolvedRange {
  /** Inclusive start instant (India midnight). */
  from: Date
  /** Inclusive end instant (India 23:59:59.999). */
  to: Date
  /** Whole India days covered, inclusive of both ends. */
  days: number
  preset: RangePreset | "custom"
  label: string
}

/**
 * Turns the `range`/`from`/`to` search params into a concrete instant range.
 *
 * Every boundary goes through the IST helpers: the server runs in UTC, so a
 * bare `startOfDay()` here would shift each end by 5h30m and silently pull in
 * the wrong day's bills. A malformed or inverted custom range falls back to
 * the default preset rather than querying a nonsense window.
 */
export function resolveRange(search: TransactionsSearch): ResolvedRange {
  if (search.range === "custom" && search.from && search.to) {
    const from = istStartOfDay(search.from)
    const to = istEndOfDay(search.to)

    if (from.getTime() <= to.getTime()) {
      return {
        from,
        to,
        days: istDaysBetween(from, to) + 1,
        preset: "custom",
        label: "Custom range",
      }
    }
  }

  const key: RangePreset =
    search.range === "custom" ? DEFAULT_PRESET : search.range
  const preset = RANGE_PRESETS[key]

  return {
    from: istStartOfDaysAgo(preset.days - 1),
    to: istEndOfDay(new Date()),
    days: preset.days,
    preset: key,
    label: preset.label,
  }
}
