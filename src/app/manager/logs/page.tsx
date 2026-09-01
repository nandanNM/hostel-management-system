import React from "react"
import { Metadata } from "next"
import { SearchParams } from "@/types"
import { ClipboardText } from "@phosphor-icons/react/ssr"

import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton"
import { PageContainer, PageHeader } from "@/components/page-container"

import { ActivityLogsTable } from "./_components/activity-logs-table"
import { getActivityLogsForManager } from "./_lib/actions"
import { searchParamsSchema } from "./_lib/validations"

export const metadata: Metadata = {
  title: "Activity Logs",
  description: "Every change made in the hostel, who made it and when.",
}

export interface ActivityLogsPageProps {
  searchParams: Promise<SearchParams>
}

export default async function ActivityLogsPage({
  searchParams,
}: ActivityLogsPageProps) {
  const resolved = await searchParams
  const search = searchParamsSchema.parse(resolved)

  const logsPromise = getActivityLogsForManager(search)

  return (
    <PageContainer className="flex-1 p-4 sm:p-6">
      <PageHeader
        icon={ClipboardText}
        title="Activity Logs"
        description="Every change made in the hostel, who made it and when."
      />
      <React.Suspense
        fallback={
          <DataTableSkeleton
            columnCount={5}
            searchableColumnCount={2}
            filterableColumnCount={1}
            cellWidths={["10rem", "12rem", "20rem", "12rem", "4rem"]}
            shrinkZero
          />
        }
      >
        <ActivityLogsTable logsPromise={logsPromise} />
      </React.Suspense>
    </PageContainer>
  )
}
