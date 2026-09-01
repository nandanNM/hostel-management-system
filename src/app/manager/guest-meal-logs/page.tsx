import React from "react"
import { Metadata } from "next"
import { SearchParams } from "@/types"
import { ForkKnife as UtensilsCrossed } from "@phosphor-icons/react/ssr"

import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton"
import { PageContainer, PageHeader } from "@/components/page-container"

import { GuestMealLogsTable } from "./_components/guest-meal-logs-table"
import { getGuestMealLogsForManager } from "./_lib/actions"
import { searchParamsSchema } from "./_lib/validations"

export const metadata: Metadata = {
  title: "Guest Meal Logs",
  description:
    "All guest meal requests and their billing status for the month.",
}

export interface GuestMealLogsPageProps {
  searchParams: Promise<SearchParams>
}

export default async function GuestMealLogsPage({
  searchParams,
}: GuestMealLogsPageProps) {
  const resolved = await searchParams
  const search = searchParamsSchema.parse(resolved)

  const logsPromise = getGuestMealLogsForManager(search)

  return (
    <PageContainer className="flex-1 p-4 sm:p-6">
      <PageHeader
        icon={UtensilsCrossed}
        title="Guest Meal Logs"
        description="All guest meal requests and their billing status for the month."
      />
      <React.Suspense
        fallback={
          <DataTableSkeleton
            columnCount={8}
            searchableColumnCount={1}
            filterableColumnCount={2}
            cellWidths={[
              "8rem",
              "12rem",
              "8rem",
              "6rem",
              "6rem",
              "4rem",
              "6rem",
              "6rem",
            ]}
            shrinkZero
          />
        }
      >
        <GuestMealLogsTable logsPromise={logsPromise} />
      </React.Suspense>
    </PageContainer>
  )
}
