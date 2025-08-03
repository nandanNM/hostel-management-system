import React from "react"
import { SearchParams } from "@/types"

import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton"
import { Shell } from "@/components/shell"

import { TasksTable } from "./_components/users-meal-table"
import { getMealsForManager } from "./_lib/actions"
import { getMealsSchema } from "./_lib/validations"

export interface UsersPageProps {
  searchParams: Promise<SearchParams>
}
export default async function UsersPage({ searchParams }: UsersPageProps) {
  const resolvedSearchParams = await searchParams
  const search = getMealsSchema.parse(resolvedSearchParams)

  const mealsPromise = getMealsForManager(search)
  return (
    <Shell className="gap-2">
      <React.Suspense
        fallback={
          <DataTableSkeleton
            columnCount={5}
            searchableColumnCount={1}
            filterableColumnCount={2}
            cellWidths={["10rem", "40rem", "12rem", "12rem", "8rem"]}
            shrinkZero
          />
        }
      >
        <TasksTable tasksPromise={mealsPromise} />
      </React.Suspense>
    </Shell>
  )
}
