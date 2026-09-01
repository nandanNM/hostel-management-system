"use client"

import * as React from "react"
import type { DataTableFilterField } from "@/types"
import {
  CaretLeft as ChevronLeft,
  CaretRight as ChevronRight,
  CurrencyInr,
  ForkKnife,
  Receipt,
} from "@phosphor-icons/react"
import { parseAsInteger, useQueryStates } from "nuqs"

import { formatIST } from "@/lib/date"
import { GuestMealStatusType, MealTimeType } from "@/lib/generated/prisma"
import { useDataTable } from "@/hooks/use-data-table"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/data-table/data-table"
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar"

import {
  getGuestMealLogsForManager,
  type GuestMealLogRow,
} from "../_lib/actions"
import { shiftMonth } from "../../reports/monthly-meals/_lib/aggregate"
import { getColumns } from "./guest-meal-logs-columns"

function monthLabel(year: number, month: number) {
  // `month` is 1-based here. Noon UTC keeps the label on the intended day in
  // every timezone before it is re-read in IST.
  return formatIST(new Date(Date.UTC(year, month - 1, 1, 6, 0, 0)), "MMMM yyyy")
}

function prettify(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase()
}

// Lowest-priority columns on a phone-width screen — still reachable any time
// via the toolbar's "View" column toggle.
const MOBILE_HIDDEN_COLUMNS = ["mealTime", "type", "numberOfMeals"]

interface GuestMealLogsTableProps {
  logsPromise: ReturnType<typeof getGuestMealLogsForManager>
}

export function GuestMealLogsTable({ logsPromise }: GuestMealLogsTableProps) {
  const { data, pageCount, totalRows, totals, period } = React.use(logsPromise)

  const columns = React.useMemo(() => getColumns(), [])

  // The month drives a server query, so the URL update must reach the
  // server: shallow false, unlike the table's own client-side state.
  const [, setPeriod] = useQueryStates(
    { year: parseAsInteger, month: parseAsInteger, page: parseAsInteger },
    { shallow: false, history: "push" }
  )

  const filterFields: DataTableFilterField<GuestMealLogRow>[] = [
    {
      label: "Requested By",
      value: "requestedBy",
      placeholder: "Search boarder name or email...",
    },
    {
      label: "Meal Time",
      value: "mealTime",
      options: Object.values(MealTimeType).map((mealTime) => ({
        label: prettify(mealTime),
        value: mealTime,
        withCount: true,
      })),
    },
    {
      label: "Status",
      value: "status",
      options: Object.values(GuestMealStatusType).map((status) => ({
        label: prettify(status),
        value: status,
        withCount: true,
      })),
    },
  ]

  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    filterFields,
    state: { sorting: [{ id: "date", desc: true }] },
  })

  // Only the table's own row area scrolls horizontally on a phone; these
  // secondary columns drop out by default there and come back via "View".
  const isMobile = useIsMobile()
  React.useEffect(() => {
    if (!isMobile) return
    for (const id of MOBILE_HIDDEN_COLUMNS) {
      table.getColumn(id)?.toggleVisibility(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile])

  const goToMonth = (by: number) => {
    const next = shiftMonth(period.year, period.month - 1, by)
    // Back to page 1: page 4 of last month is rarely page 4 of this one.
    void setPeriod({ year: next.year, month: next.month + 1, page: 1 })
  }

  const now = new Date()
  const isCurrentMonth =
    period.year === Number(formatIST(now, "yyyy")) &&
    period.month === Number(formatIST(now, "M"))

  const summary = [
    { label: "Total Requests", value: totals.totalRequests, icon: Receipt },
    { label: "Billed Meals", value: totals.billedMeals, icon: ForkKnife },
    {
      label: "Billed Charges",
      value: `₹${totals.billedCharges.toFixed(2)}`,
      icon: CurrencyInr,
    },
  ]

  return (
    <div className="space-y-6">
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

      <div className="grid gap-4 sm:grid-cols-3">
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
    </div>
  )
}
