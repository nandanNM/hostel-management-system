"use server"

import {
  GuestMealStatusType,
  MealTimeType,
  Prisma,
} from "@/lib/generated/prisma"
import prisma from "@/lib/prisma"
import { requireUser } from "@/lib/require-user"
import { parseEnumList } from "@/lib/utils"

import { GetGuestMealHistorySchema } from "./validations"

// Only requests that actually went through — a request that was rejected,
// cancelled, or is still pending never resulted in a real guest meal, so it
// doesn't belong in a history of meals that happened. A caller can still
// narrow between the two within that scope via the status facet below.
const HISTORY_STATUSES: GuestMealStatusType[] = [
  GuestMealStatusType.APPROVED,
  GuestMealStatusType.SERVED,
]

export interface GuestMealHistoryRow {
  id: string
  name: string
  date: Date
  numberOfMeals: number
  mealTime: MealTimeType
  mealCharge: number
  status: GuestMealStatusType
  /** Set when the guest was an alumnus, which is why the charge is lower. */
  alumniId: string | null
}

interface PaginatedGuestMealHistory {
  data: GuestMealHistoryRow[]
  totalRows: number
  pageCount: number
}

export async function getPaginatedGuestMealHistory(
  input: GetGuestMealHistorySchema
): Promise<PaginatedGuestMealHistory> {
  const session = await requireUser()

  const { page, per_page, name, status, mealTime } = input
  const offset = (page - 1) * per_page

  const statusList = parseEnumList(status, GuestMealStatusType).filter((s) =>
    HISTORY_STATUSES.includes(s)
  )
  const mealTimeList = parseEnumList(mealTime, MealTimeType)

  const whereClause: Prisma.GuestMealWhereInput = {
    userId: session.user.id,
    status: { in: statusList.length > 0 ? statusList : HISTORY_STATUSES },
    ...(mealTimeList.length > 0 && { mealTime: { in: mealTimeList } }),
    ...(name && { name: { contains: name, mode: "insensitive" } }),
  }

  const [data, totalRows] = await Promise.all([
    prisma.guestMeal.findMany({
      where: whereClause,
      skip: offset,
      take: per_page,
      orderBy: { date: "desc" },
      select: {
        id: true,
        name: true,
        date: true,
        numberOfMeals: true,
        mealTime: true,
        mealCharge: true,
        status: true,
        alumniId: true,
      },
    }),
    prisma.guestMeal.count({ where: whereClause }),
  ])

  return {
    data,
    totalRows,
    pageCount: Math.max(1, Math.ceil(totalRows / per_page)),
  }
}
