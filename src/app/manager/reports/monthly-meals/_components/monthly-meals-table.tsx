"use client"

import * as React from "react"
import type { DataTableFilterField } from "@/types"
import {
  CaretLeft as ChevronLeft,
  CaretRight as ChevronRight,
  DownloadSimple,
  ForkKnife,
  Moon,
  Sun,
  Users,
} from "@phosphor-icons/react"
import { parseAsInteger, useQueryStates } from "nuqs"

import { formatIST } from "@/lib/date"
import { exportTableToCSV } from "@/lib/export"
import { useDataTable } from "@/hooks/use-data-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { P } from "@/components/custom/p"
import { DataTable } from "@/components/data-table/data-table"
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar"

import { getMonthlyMealsForManager } from "../_lib/actions"
import { shiftMonth, type MonthlyMealRow } from "../_lib/aggregate"
import { getMonthlyMealColumns } from "./monthly-meals-columns"

const STATUS_OPTIONS = ["ACTIVE", "SUSPENDED", "BANNED"] as const

function monthLabel(year: number, month: number) {
  // `month` is 1-based here. Noon UTC keeps the label on the intended day in
  // every timezone before it is re-read in IST.
  return formatIST(new Date(Date.UTC(year, month - 1, 1, 6, 0, 0)), "MMMM yyyy")
}

interface MonthlyMealsTableProps {
  reportPromise: ReturnType<typeof getMonthlyMealsForManager>
}

export function MonthlyMealsTable({ reportPromise }: MonthlyMealsTableProps) {
  const { data, pageCount, totalRows, totals, period } =
    React.use(reportPromise)

  const columns = React.useMemo(() => getMonthlyMealColumns(), [])

  // The month drives a server query, so the URL update must reach the server:
  // shallow false, unlike the table's own client-side state.
  const [, setPeriod] = useQueryStates(
    {
      year: parseAsInteger,
      month: parseAsInteger,
      page: parseAsInteger,
    },
    { shallow: false, history: "push" }
  )

  const filterFields: DataTableFilterField<MonthlyMealRow>[] = [
    { label: "Boarder", value: "name", placeholder: "Search name or room..." },
    {
      label: "Status",
      value: "status",
      options: STATUS_OPTIONS.map((status) => ({
        label: status.charAt(0) + status.slice(1).toLowerCase(),
        value: status,
      })),
    },
  ]

  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    filterFields,
    state: { sorting: [{ id: "total", desc: true }] },
  })

  const goToMonth = (by: number) => {
    // shiftMonth is 0-based; the URL is 1-based.
    const next = shiftMonth(period.year, period.month - 1, by)
    // Back to page 1: page 4 of last month is rarely page 4 of this one.
    void setPeriod({ year: next.year, month: next.month + 1, page: 1 })
  }

  const now = new Date()
  const isCurrentMonth =
    period.year === Number(formatIST(now, "yyyy")) &&
    period.month === Number(formatIST(now, "M"))

  const summary = [
    { label: "Boarders", value: totals.boarders, icon: Users },
    { label: "Lunch", value: totals.lunch, icon: Sun },
    { label: "Dinner", value: totals.dinner, icon: Moon },
    { label: "Guest meals", value: totals.guest, icon: Users },
    { label: "Total meals", value: totals.total, icon: ForkKnife },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous month"
            onClick={() => goToMonth(-1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-40 text-center font-medium">
            {monthLabel(period.year, period.month)}
          </span>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next month"
            disabled={isCurrentMonth}
            onClick={() => goToMonth(1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={data.length === 0}
          onClick={() =>
            exportTableToCSV(table, {
              filename: `meals-${period.year}-${String(period.month).padStart(2, "0")}`,
              excludeColumns: ["actions"],
            })
          }
        >
          <DownloadSimple className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {summary.map((item) => (
          <Card key={item.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                {item.label}
              </CardTitle>
              <item.icon className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">
                {item.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <DataTable table={table} totalRows={totalRows}>
        <DataTableToolbar table={table} filterFields={filterFields} />
      </DataTable>

      <P className="text-muted-foreground text-xs">
        Lunch and dinner count meals recorded when a manager generated the meal
        count, so a day nobody generated is missing for everyone. Guest meals
        count approved and served meals rather than requests — one booking for
        three guests counts as three.
      </P>
    </div>
  )
}
