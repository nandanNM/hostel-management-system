"use server"

import { unstable_noStore as noStore } from "next/cache"
import requireManager from "@/data/manager/require-manager"

import { istEndOfMonth, istParts, istStartOfMonth } from "@/lib/date"
import {
  GuestMealStatusType,
  MealTimeType,
  MealType,
  Prisma,
} from "@/lib/generated/prisma"
import prisma from "@/lib/prisma"
import { parseEnumList } from "@/lib/utils"

import { resolveReportMonth } from "../../reports/monthly-meals/_lib/aggregate"
import { GuestMealLogsSearch } from "./validations"

export interface GuestMealLogRow {
  id: string
  name: string
  date: Date
  mealTime: MealTimeType
  type: MealType
  nonVegType: string
  numberOfMeals: number
  mealCharge: number
  status: GuestMealStatusType
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
  } | null
  /** Flat, filterable copy of user.name/email — a DataTableFilterField needs
   *  a real key on the row, not a computed/nested one. */
  requestedBy: string
}

export interface GuestMealLogsTotals {
  totalRequests: number
  billedMeals: number
  billedCharges: number
}

export interface GuestMealLogsResponse {
  data: GuestMealLogRow[]
  totalRows: number
  pageCount: number
  totals: GuestMealLogsTotals
  /** 1-based month, for display. */
  period: { year: number; month: number }
}

// Only APPROVED/SERVED guest meals are actually billed to the user; PENDING,
// REJECTED and CANCELLED requests must never count toward the charge totals.
const BILLED_STATUSES: GuestMealStatusType[] = [
  GuestMealStatusType.APPROVED,
  GuestMealStatusType.SERVED,
]

export async function getGuestMealLogsForManager(
  input: GuestMealLogsSearch
): Promise<GuestMealLogsResponse> {
  noStore()
  // MessPrefect passes this guard too.
  await requireManager()

  const { year, month } = resolveReportMonth(
    { year: input.year?.toString(), month: input.month?.toString() },
    istParts()
  )

  // India-month instants: a meal booked for the 1st is stored at 18:30Z on
  // the last day of the previous month, so day-key bounds file it under the
  // wrong month.
  const from = istStartOfMonth(year, month)
  const to = istEndOfMonth(year, month)

  const statusList = parseEnumList(input.status, GuestMealStatusType)
  const mealTimeList = parseEnumList(input.mealTime, MealTimeType)

  const baseWhere: Prisma.GuestMealWhereInput = {
    date: { gte: from, lte: to },
  }

  const filters: Prisma.GuestMealWhereInput[] = []
  if (statusList.length > 0) filters.push({ status: { in: statusList } })
  if (mealTimeList.length > 0) filters.push({ mealTime: { in: mealTimeList } })
  if (input.requestedBy) {
    // One box, either name: the guest booked or the boarder who booked them.
    filters.push({
      OR: [
        { name: { contains: input.requestedBy, mode: "insensitive" } },
        {
          user: {
            name: { contains: input.requestedBy, mode: "insensitive" },
          },
        },
      ],
    })
  }

  const whereClause: Prisma.GuestMealWhereInput =
    filters.length > 0 ? { AND: [baseWhere, ...filters] } : baseWhere

  const select = {
    id: true,
    name: true,
    date: true,
    mealTime: true,
    type: true,
    nonVegType: true,
    numberOfMeals: true,
    mealCharge: true,
    status: true,
    user: { select: { id: true, name: true, email: true, image: true } },
  } satisfies Prisma.GuestMealSelect

  const [data, totalRows, monthRows] = await Promise.all([
    prisma.guestMeal.findMany({
      where: whereClause,
      skip: (input.page - 1) * input.per_page,
      take: input.per_page,
      orderBy: { date: "desc" },
      select,
    }),
    prisma.guestMeal.count({ where: whereClause }),
    // Unfiltered month totals for context — a manager filtering to one
    // boarder still needs the hostel-wide billed totals, not just the
    // filtered slice, same as the monthly-meals report does.
    prisma.guestMeal.findMany({
      where: baseWhere,
      select: { status: true, numberOfMeals: true, mealCharge: true },
    }),
  ])

  const billedRows = monthRows.filter((m) => BILLED_STATUSES.includes(m.status))

  const rows: GuestMealLogRow[] = data.map((m) => ({
    ...m,
    requestedBy: m.user?.name ?? m.user?.email ?? "Unknown",
  }))

  return {
    data: rows,
    totalRows,
    pageCount: Math.max(1, Math.ceil(totalRows / input.per_page)),
    totals: {
      totalRequests: monthRows.length,
      billedMeals: billedRows.reduce((s, m) => s + m.numberOfMeals, 0),
      billedCharges: billedRows.reduce((s, m) => s + m.mealCharge, 0),
    },
    period: { year, month: month + 1 },
  }
}
