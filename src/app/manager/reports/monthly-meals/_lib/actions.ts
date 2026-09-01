"use server"

import { unstable_noStore as noStore } from "next/cache"
import requireManager from "@/data/manager/require-manager"

import { istParts } from "@/lib/date"

import {
  filterAndSortRows,
  paginateRows,
  resolveReportMonth,
  type MonthlyMealRow,
  type MonthlyMealTotals,
} from "./aggregate"
import { getMonthlyMealReport, type DailyMealPoint } from "./queries"
import { type MonthlyMealsSearch } from "./validations"

export type MonthlyMealsResponse = {
  data: MonthlyMealRow[]
  pageCount: number
  totalRows: number
  /** Totals for the whole month, not just the visible page. */
  totals: MonthlyMealTotals
  /** One point per calendar day - what the KPI sparklines plot. */
  dailySeries: DailyMealPoint[]
  period: { year: number; month: number }
}

export async function getMonthlyMealsForManager(
  input: MonthlyMealsSearch
): Promise<MonthlyMealsResponse> {
  noStore()
  // MessPrefect passes this guard too.
  await requireManager()

  const { year, month } = resolveReportMonth(
    { year: input.year?.toString(), month: input.month?.toString() },
    istParts()
  )

  const report = await getMonthlyMealReport(year, month)

  const statuses = input.status
    ? input.status
        .split(".")
        .map((value) => value.trim())
        .filter(Boolean)
    : []

  const matching = filterAndSortRows(report.rows, {
    search: input.user,
    statuses,
    sort: input.sort,
  })

  const { data, pageCount } = paginateRows(matching, input.page, input.per_page)

  return {
    data,
    pageCount,
    totalRows: matching.length,
    // Deliberately the unfiltered month totals: a manager filtering to one
    // boarder still needs the hostel's numbers for context.
    totals: report.totals,
    dailySeries: report.dailySeries,
    period: report.period,
  }
}
