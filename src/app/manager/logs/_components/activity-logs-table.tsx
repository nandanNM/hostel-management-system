"use client"

import * as React from "react"
import type { DataTableFilterField } from "@/types"
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs"

import {
  ACTIVITY_LOG_ACTION_TYPES,
  prettifyActivityLogAction,
} from "@/lib/activity-log-display"
import { useDataTable } from "@/hooks/use-data-table"
import { DataTable } from "@/components/data-table/data-table"
import { DataTableDateRangeFilter } from "@/components/data-table/data-table-date-range-filter"
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar"

import { getActivityLogsForManager, type ActivityLogRow } from "../_lib/actions"
import { getColumns } from "./activity-logs-columns"

interface ActivityLogsTableProps {
  logsPromise: ReturnType<typeof getActivityLogsForManager>
}

export function ActivityLogsTable({ logsPromise }: ActivityLogsTableProps) {
  const { data, pageCount, totalRows } = React.use(logsPromise)

  const columns = React.useMemo(() => getColumns(), [])

  // The date range drives a server query, so the URL update must reach the
  // server: shallow false, unlike the table's own client-side state.
  const [{ from, to }, setRange] = useQueryStates(
    { from: parseAsString, to: parseAsString, page: parseAsInteger },
    { shallow: false, history: "push" }
  )

  const filterFields: DataTableFilterField<ActivityLogRow>[] = [
    { label: "Details", value: "details", placeholder: "Search details..." },
    { label: "By", value: "actor", placeholder: "Search name or email..." },
    {
      label: "Action",
      value: "actionType",
      options: ACTIVITY_LOG_ACTION_TYPES.map((type) => ({
        label: prettifyActivityLogAction(type),
        value: type,
        withCount: true,
      })),
    },
  ]

  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    filterFields,
    state: { sorting: [{ id: "timestamp", desc: true }] },
  })

  return (
    <div className="space-y-6">
      <DataTableDateRangeFilter
        from={from ?? undefined}
        to={to ?? undefined}
        placeholder="Last 7 days"
        onChange={(range) => {
          // Back to page 1: page 4 of the old range is rarely page 4 of the
          // new one.
          if (range) void setRange({ from: range.from, to: range.to, page: 1 })
          else void setRange({ from: null, to: null, page: 1 })
        }}
      />

      <DataTable table={table} totalRows={totalRows}>
        <DataTableToolbar table={table} filterFields={filterFields} />
      </DataTable>
    </div>
  )
}
