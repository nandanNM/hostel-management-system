"use client"

import * as React from "react"
import type { DataTableFilterField } from "@/types"

import { useDataTable } from "@/hooks/use-data-table"
import { DataTable } from "@/components/data-table/data-table"
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar"

import { getPaginatedMealBreakdown } from "../_lib/actions"
import type { MealBreakdownUser } from "../../_lib/meal-breakdown"
import { getColumns } from "./meal-breakdown-table-columns"

interface MealBreakdownTableProps {
  breakdownPromise: ReturnType<typeof getPaginatedMealBreakdown>
}

export function MealBreakdownTable({
  breakdownPromise,
}: MealBreakdownTableProps) {
  const { data, pageCount, totalRows } = React.use(breakdownPromise)

  const columns = React.useMemo(() => getColumns(), [])

  const filterFields: DataTableFilterField<MealBreakdownUser>[] = [
    { label: "User", value: "name", placeholder: "Search by name..." },
  ]

  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    filterFields,
    state: {
      sorting: [{ id: "name", desc: false }],
      pagination: { pageIndex: 0, pageSize: 10 },
    },
  })

  return (
    <DataTable totalRows={totalRows} table={table}>
      <DataTableToolbar table={table} filterFields={filterFields} />
    </DataTable>
  )
}
