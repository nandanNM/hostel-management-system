import React from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import requireManager from "@/data/manager/require-manager"
import { ArrowLeft, Users } from "@phosphor-icons/react/ssr"

import { formatIST } from "@/lib/date"
import { MealTimeType } from "@/lib/generated/prisma"
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton"

import {
  BUCKET_LABELS,
  getMealBreakdownUsers,
  type MealBucket,
} from "../_lib/meal-breakdown"
import { MealBreakdownTable } from "./_components/meal-breakdown-table"
import { getPaginatedMealBreakdown } from "./_lib/actions"
import { searchParamsSchema } from "./_lib/validations"

const MEAL_TIMES: string[] = ["LUNCH", "DINNER"]
const BUCKETS: string[] = Object.keys(BUCKET_LABELS)

export interface MealBreakdownPageProps {
  searchParams: Promise<{
    mealTime?: string
    bucket?: string
    date?: string
    page?: string
    per_page?: string
    sort?: string
    name?: string
  }>
}

export default async function MealBreakdownPage({
  searchParams,
}: MealBreakdownPageProps) {
  await requireManager()

  const resolvedSearchParams = await searchParams
  const { mealTime, bucket, date: dateParam } = resolvedSearchParams
  const date = dateParam ? new Date(dateParam) : null

  if (
    !mealTime ||
    !bucket ||
    !date ||
    Number.isNaN(date.getTime()) ||
    !MEAL_TIMES.includes(mealTime) ||
    !BUCKETS.includes(bucket)
  ) {
    return notFound()
  }

  const search = searchParamsSchema.parse(resolvedSearchParams)

  // The exact day of the record being viewed, not "today" re-derived here —
  // a click right around midnight IST (or a stale cached card) could
  // otherwise silently look up a different day than the one on screen.
  const [allUsers, breakdownPromise] = [
    await getMealBreakdownUsers(
      mealTime as MealTimeType,
      date,
      bucket as MealBucket
    ),
    getPaginatedMealBreakdown(
      mealTime as MealTimeType,
      date,
      bucket as MealBucket,
      search
    ),
  ]

  const label = BUCKET_LABELS[bucket as MealBucket]
  const mealLabel = mealTime === "LUNCH" ? "Lunch" : "Dinner"
  const dateLabel = formatIST(date, "EEEE, dd MMM yyyy")

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6">
      <div>
        <Link
          href="/manager"
          className="text-muted-foreground hover:text-foreground mb-3 inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {label} — {mealLabel}
            </h1>
            <p className="text-muted-foreground mt-1">
              {allUsers.length} boarder{allUsers.length === 1 ? "" : "s"} having{" "}
              {label.toLowerCase()} on {dateLabel}.
            </p>
          </div>
        </div>
      </div>

      <React.Suspense
        fallback={
          <DataTableSkeleton
            columnCount={2}
            searchableColumnCount={1}
            filterableColumnCount={0}
            cellWidths={["20rem", "10rem"]}
            shrinkZero
          />
        }
      >
        <MealBreakdownTable breakdownPromise={breakdownPromise} />
      </React.Suspense>
    </div>
  )
}
