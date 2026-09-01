import React from "react"
import { Metadata } from "next"
import { SearchParams } from "@/types"
import { ClipboardText } from "@phosphor-icons/react/ssr"

import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton"
import { PageContainer, PageHeader } from "@/components/page-container"

import { ActivityLogsTable } from "./_components/activity-logs-table"
import { getMyActivityLogs } from "./_lib/actions"
import { searchParamsSchema } from "./_lib/validations"

export const metadata: Metadata = {
  title: "Activity",
  description: "Your own account activity.",
}

export interface ActivityPageProps {
  searchParams: Promise<SearchParams>
}

export default async function ActivityPage({
  searchParams,
}: ActivityPageProps) {
  const resolved = await searchParams
  const search = searchParamsSchema.parse(resolved)

  const logsPromise = getMyActivityLogs(search)

  return (
    <PageContainer className="flex-1 p-4 sm:p-6">
      <PageHeader
        icon={ClipboardText}
        title="Activity"
        description="Your own account activity."
      />
      <React.Suspense
        fallback={
          <DataTableSkeleton
            columnCount={4}
            searchableColumnCount={1}
            filterableColumnCount={1}
            cellWidths={["10rem", "12rem", "24rem", "4rem"]}
            shrinkZero
          />
        }
      >
        <ActivityLogsTable logsPromise={logsPromise} />
      </React.Suspense>
    </PageContainer>
  )
}
