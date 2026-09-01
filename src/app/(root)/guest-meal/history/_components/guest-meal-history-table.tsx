"use client"

import * as React from "react"
import type { DataTableFilterField } from "@/types"

import { GuestMealStatusType, MealTimeType } from "@/lib/generated/prisma"
import { useDataTable } from "@/hooks/use-data-table"
import { DataTable } from "@/components/data-table/data-table"
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar"

import type { GuestMealHistoryRow } from "../_lib/actions"
import { getPaginatedGuestMealHistory } from "../_lib/actions"
import { getColumns } from "./guest-meal-history-table-columns"

function prettify(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ")
}

interface GuestMealHistoryTableProps {
  historyPromise: ReturnType<typeof getPaginatedGuestMealHistory>
}

export function GuestMealHistoryTable({
  historyPromise,
}: GuestMealHistoryTableProps) {
  const { data, pageCount, totalRows } = React.use(historyPromise)

  const columns = React.useMemo(() => getColumns(), [])

  const filterFields: DataTableFilterField<GuestMealHistoryRow>[] = [
    { label: "Guest", value: "name", placeholder: "Search by guest name..." },
    {
      label: "Time",
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
      options: [GuestMealStatusType.APPROVED, GuestMealStatusType.SERVED].map(
        (status) => ({
          label: prettify(status),
          value: status,
          withCount: true,
        })
      ),
    },
  ]

  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    filterFields,
    state: {
      sorting: [{ id: "date", desc: true }],
      pagination: { pageIndex: 0, pageSize: 10 },
    },
  })

  return (
    <DataTable totalRows={totalRows} table={table}>
      <DataTableToolbar table={table} filterFields={filterFields} />
    </DataTable>
  )
}
