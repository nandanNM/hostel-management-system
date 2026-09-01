import React from "react"
import Link from "next/link"
import { SearchParams } from "@/types"
import {
  ArrowLeft,
  ForkKnife as UtensilsCrossedIcon,
} from "@phosphor-icons/react/ssr"

import { requireUser } from "@/lib/require-user"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton"
import { PageContainer } from "@/components/page-container"

import { GuestMealHistoryTable } from "./_components/guest-meal-history-table"
import { getPaginatedGuestMealHistory } from "./_lib/actions"
import { searchParamsSchema } from "./_lib/validations"

export const metadata = {
  title: "Guest Meal History",
}

export interface GuestMealHistoryPageProps {
  searchParams: Promise<SearchParams>
}

export default async function GuestMealHistoryPage({
  searchParams,
}: GuestMealHistoryPageProps) {
  await requireUser()

  const resolvedSearchParams = await searchParams
  const search = searchParamsSchema.parse(resolvedSearchParams)
  const historyPromise = getPaginatedGuestMealHistory(search)

  return (
    <PageContainer>
      <Link
        href="/guest-meal"
        className="text-muted-foreground hover:text-foreground -mb-2 inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to guest meals
      </Link>
      <Card className="w-full shadow-sm">
        <CardHeader className="border-b">
          <CardTitle className="text-foreground flex items-center gap-3 text-2xl font-bold">
            <UtensilsCrossedIcon className="text-primary h-6 w-6" />
            Guest Meal History
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Your approved guest meal requests.
          </CardDescription>
        </CardHeader>

        <React.Suspense
          fallback={
            <DataTableSkeleton
              columnCount={6}
              searchableColumnCount={1}
              filterableColumnCount={2}
              cellWidths={["10rem", "8rem", "6rem", "8rem", "8rem", "8rem"]}
              shrinkZero
              className="p-4 md:p-6"
            />
          }
        >
          <div className="p-4 md:p-6">
            <GuestMealHistoryTable historyPromise={historyPromise} />
          </div>
        </React.Suspense>
      </Card>
    </PageContainer>
  )
}
