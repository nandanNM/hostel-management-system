import * as React from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { SearchParams } from "@/types"
import { ArrowLeft, WarningCircle } from "@phosphor-icons/react/ssr"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton"
import { PageContainer, PageHeader } from "@/components/page-container"

import { AttentionTable } from "./_components/attention-table"
import { getAttentionRows } from "./_lib/actions"
import { ATTENTION_TABS, searchParamsSchema } from "./_lib/validations"

export const metadata: Metadata = {
  title: "Needs attention",
  description: "Boarders with outstanding or overdue mess dues.",
}

interface AttentionPageProps {
  searchParams: Promise<SearchParams>
}

export default async function AttentionPage({
  searchParams,
}: AttentionPageProps) {
  const resolved = await searchParams
  const search = searchParamsSchema.parse(resolved)

  // Not awaited — handed to the client table, which unwraps it under Suspense.
  const rowsPromise = getAttentionRows(search)
  const active = ATTENTION_TABS[search.type]

  return (
    <PageContainer className="flex-1 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          icon={WarningCircle}
          title="Needs attention"
          description={active.description}
        />
        <Link
          href="/mess-prefect/transactions"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          <ArrowLeft className="size-4" />
          Back to transactions
        </Link>
      </div>

      {/* One page, one query — the tab only swaps how rows are selected. */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(ATTENTION_TABS).map(([key, tab]) => (
          <Link
            key={key}
            href={`/mess-prefect/transactions/attention?type=${key}`}
            className={cn(
              buttonVariants({
                variant: key === search.type ? "default" : "outline",
                size: "sm",
              })
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Keyed on the tab only. With the search text in the key every
          keystroke threw the table away and replayed the skeleton, which read
          as a full page reload and took the focus out of the search box. The
          other tables key nothing, and let the transition hold the old rows
          until the new ones arrive. */}
      <React.Suspense
        key={search.type}
        fallback={
          <DataTableSkeleton
            columnCount={6}
            searchableColumnCount={1}
            filterableColumnCount={1}
            cellWidths={["2rem", "16rem", "8rem", "8rem", "10rem", "8rem"]}
            shrinkZero
          />
        }
      >
        <AttentionTable rowsPromise={rowsPromise} type={search.type} />
      </React.Suspense>
    </PageContainer>
  )
}
