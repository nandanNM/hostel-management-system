import React from "react"
import { Metadata } from "next"
import { SearchParams } from "@/types"
import { ChartBar } from "@phosphor-icons/react/ssr"

import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton"
import { PageContainer, PageHeader } from "@/components/page-container"

import { MonthlyMealsTable } from "./_components/monthly-meals-table"
import { getMonthlyMealsForManager } from "./_lib/actions"
import { monthlyMealsSearchParamsSchema } from "./_lib/validations"

export const metadata: Metadata = {
  title: "Monthly Meals",
  description: "Per-boarder lunch, dinner and guest meal totals by month.",
}

export interface MonthlyMealsPageProps {
  searchParams: Promise<SearchParams>
}

export default async function MonthlyMealsPage({
  searchParams,
}: MonthlyMealsPageProps) {
  const resolved = await searchParams
  const search = monthlyMealsSearchParamsSchema.parse(resolved)

  const reportPromise = getMonthlyMealsForManager(search)

  return (
    <PageContainer>
      <PageHeader
        icon={ChartBar}
        title="Monthly Meals"
        description="Every boarder's lunch, dinner and guest meals for the month."
      />
      <React.Suspense
        fallback={
          <DataTableSkeleton
            columnCount={7}
            searchableColumnCount={1}
            filterableColumnCount={1}
            cellWidths={[
              "14rem",
              "6rem",
              "8rem",
              "6rem",
              "6rem",
              "6rem",
              "6rem",
            ]}
            shrinkZero
          />
        }
      >
        <MonthlyMealsTable reportPromise={reportPromise} />
      </React.Suspense>
    </PageContainer>
  )
}
