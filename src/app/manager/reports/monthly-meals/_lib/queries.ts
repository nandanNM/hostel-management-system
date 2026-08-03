import "server-only"

import {
  istCalendarMonthEnd,
  istCalendarMonthStart,
  istEndOfMonth,
  istStartOfMonth,
} from "@/lib/date"
import { GuestMealStatusType, UserStatusType } from "@/lib/generated/prisma"
import prisma from "@/lib/prisma"

import {
  buildMonthlyMealRows,
  sumMonthlyMeals,
  type MonthlyMealRow,
  type MonthlyMealTotals,
} from "./aggregate"

export type MonthlyMealReport = {
  period: { year: number; month: number }
  rows: MonthlyMealRow[]
  totals: MonthlyMealTotals
}

/**
 * One row per boarder for an India month, plus the month totals.
 *
 * Shared by the page (first render, server side) and the API route (month
 * switching via React Query) so both can never disagree. Callers are
 * responsible for the authorization check.
 *
 * `month` is 0-based, like everything in @/lib/date.
 */
export async function getMonthlyMealReport(
  year: number,
  month: number
): Promise<MonthlyMealReport> {
  const [users, attendance, guests] = await Promise.all([
    prisma.user.findMany({
      where: {
        deletedAt: null,
        status: { notIn: [UserStatusType.INACTIVE, UserStatusType.FORMA] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        roomNo: true,
        status: true,
      },
      orderBy: { name: "asc" },
    }),

    // `meal_attendances.date` is a day-key column.
    prisma.mealAttendance.groupBy({
      by: ["userId", "mealTime"],
      where: {
        date: {
          gte: istCalendarMonthStart(year, month),
          lte: istCalendarMonthEnd(year, month),
        },
      },
      _count: { _all: true },
    }),

    // `guest_meals.date` holds mixed conventions, so it needs the true
    // India-month window - day-key bounds file a meal taken on the 1st under
    // the previous month.
    prisma.guestMeal.groupBy({
      by: ["userId"],
      where: {
        date: {
          gte: istStartOfMonth(year, month),
          lte: istEndOfMonth(year, month),
        },
        status: {
          in: [GuestMealStatusType.APPROVED, GuestMealStatusType.SERVED],
        },
      },
      _sum: { numberOfMeals: true },
    }),
  ])

  const rows = buildMonthlyMealRows(
    users,
    attendance.map((a) => ({
      userId: a.userId,
      mealTime: a.mealTime,
      count: a._count._all,
    })),
    // Guests are counted by meals, not requests: one booking for three guests
    // is three meals cooked.
    guests.map((g) => ({
      userId: g.userId,
      meals: g._sum.numberOfMeals ?? 0,
    }))
  )

  return {
    period: { year, month: month + 1 },
    rows,
    totals: sumMonthlyMeals(rows),
  }
}
