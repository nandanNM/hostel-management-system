"use client"
"use memo"

import * as React from "react"
import { type DataTableFilterField } from "@/types"

import { GetMealWithUser } from "@/types/prisma.type"
import { MealStatusType, NonVegType } from "@/lib/generated/prisma"
import { useDataTable } from "@/hooks/use-data-table"
import { DataTable } from "@/components/data-table/data-table"
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar"

import { getMealsForManager } from "../_lib/actions"
import { getNonVegTypeIcon } from "../_lib/utils"
import { getColumns } from "./users-meal-table-columns"
import { TasksTableToolbarActions } from "./users-meal-table-toolbar-actions"

// import { TasksTableToolbarActions } from "./tasks-table-toolbar-actions"

interface TasksTableProps {
  tasksPromise: ReturnType<typeof getMealsForManager>
}

export function TasksTable({ tasksPromise }: TasksTableProps) {
  const { data, pageCount, totalRows } = React.use(tasksPromise)

  // Memoize the columns so they don't re-render on every render
  const columns = React.useMemo(() => getColumns(), [])

  /**
   * This component can render either a faceted filter or a search filter based on the `options` prop.
   *
   * @prop options - An array of objects, each representing a filter option. If provided, a faceted filter is rendered. If not, a search filter is rendered.
   *
   * Each `option` object has the following properties:
   * @prop {string} label - The label for the filter option.
   * @prop {string} value - The value for the filter option.
   * @prop {React.ReactNode} [icon] - An optional icon to display next to the label.
   * @prop {boolean} [withCount] - An optional boolean to display the count of the filter option.
   */
  const filterFields: DataTableFilterField<GetMealWithUser>[] = [
    {
      label: "User",
      value: "user",
      placeholder: "Filter users...",
    },
    {
      label: "Status",
      value: "status",
      options: Object.values(MealStatusType).map((status) => ({
        label: status[0]?.toUpperCase() + status.slice(1),
        value: status,
        withCount: true,
      })),
    },
    {
      label: "Non Veg Type",
      value: "nonVegType",
      options: Object.values(NonVegType).map((nonVegType) => ({
        label: nonVegType[0]?.toUpperCase() + nonVegType.slice(1),
        value: nonVegType,
        icon: getNonVegTypeIcon(nonVegType),
        withCount: true,
      })),
    },
  ]

  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    /* optional props */
    filterFields,
    state: {
      sorting: [{ id: "createdAt", desc: true }],
      pagination: { pageIndex: 0, pageSize: 10 },
      columnPinning: { right: ["actions"] },
    },
  })

  return (
    <DataTable totalRows={totalRows} table={table}>
      <DataTableToolbar table={table} filterFields={filterFields}>
        <TasksTableToolbarActions table={table} />
      </DataTableToolbar>
    </DataTable>
  )
}
