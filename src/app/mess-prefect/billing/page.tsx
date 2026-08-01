import Link from "next/link"
import {
  CaretLeft as ChevronLeft,
  CaretRight as ChevronRight,
  Receipt,
} from "@phosphor-icons/react/ssr"

import { istParts } from "@/lib/date"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

import { BillingWorkflow } from "./_components/billing-workflow"
import { getBillingData } from "./_lib/actions"

type SearchParams = Promise<{ year?: string; month?: string }>

export default async function BillingPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const sp = await searchParams
  const parsedYear = sp.year ? Number(sp.year) : undefined
  const parsedMonth = sp.month ? Number(sp.month) : undefined
  const hasValidInput =
    parsedYear !== undefined &&
    parsedMonth !== undefined &&
    Number.isInteger(parsedYear) &&
    Number.isInteger(parsedMonth) &&
    parsedMonth >= 1 &&
    parsedMonth <= 12

  const data = await getBillingData(
    hasValidInput ? { year: parsedYear!, month: parsedMonth! } : undefined
  )

  // Month navigation bounds: you can bill up to (but not including) the current,
  // still-incomplete month in Asia/Kolkata.
  const current = data.period
  const shiftMonth = (year: number, month: number, by: number) => {
    const total = year * 12 + (month - 1) + by
    return { year: Math.floor(total / 12), month: (total % 12) + 1 }
  }

  const prev = shiftMonth(current.year, current.month, -1)
  const next = shiftMonth(current.year, current.month, 1)

  // The latest billable month is the one before the current India month.
  const today = istParts()
  const maxBillable = shiftMonth(today.year, today.month + 1, -1)
  const canGoNext =
    next.year * 12 + next.month <= maxBillable.year * 12 + maxBillable.month

  const href = (m: { year: number; month: number }) =>
    `/mess-prefect/billing?year=${m.year}&month=${m.month}`

  return (
    <div className="w-full flex-1 space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Receipt className="h-6 w-6" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Monthly Billing
            </h1>
            <p className="text-muted-foreground mt-1">
              Audit, adjust, and distribute mess bills for {current.label}.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={href(prev)}
            className={cn(
              buttonVariants({ variant: "outline", size: "icon" }),
              "h-9 w-9"
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <span className="min-w-33 text-center text-sm font-semibold">
            {current.label}
          </span>
          {canGoNext ? (
            <Link
              href={href(next)}
              className={cn(
                buttonVariants({ variant: "outline", size: "icon" }),
                "h-9 w-9"
              )}
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <span
              className={cn(
                buttonVariants({ variant: "outline", size: "icon" }),
                "h-9 w-9 cursor-not-allowed opacity-50"
              )}
              aria-disabled
            >
              <ChevronRight className="h-4 w-4" />
            </span>
          )}
        </div>
      </div>

      <BillingWorkflow data={data} />
    </div>
  )
}
