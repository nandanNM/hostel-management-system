import "server-only"

import { getDaysInMonth } from "date-fns"

import {
  istCalendarMonthEnd,
  istCalendarMonthStart,
  istEndOfMonth,
  istParts,
  istStartOfMonth,
} from "@/lib/date"
import {
  GuestMealStatusType,
  MealTimeType,
  UserStatusType,
} from "@/lib/generated/prisma"
import prisma from "@/lib/prisma"

import {
  buildMonthlyMealRows,
  sumMonthlyMeals,
  type MonthlyMealRow,
  type MonthlyMealTotals,
} from "./aggregate"

export type DailyMealPoint = {
  day: number
  lunch: number
  dinner: number
  guest: number
  total: number
}

export type MonthlyMealReport = {
  period: { year: number; month: number }
  rows: MonthlyMealRow[]
  totals: MonthlyMealTotals
  /** One point per calendar day, zero-filled - what the KPI sparklines plot. */
  dailySeries: DailyMealPoint[]
}

/**
 * Day-by-day lunch/dinner/guest counts across an India month, zero-filled for
 * every day so a sparkline reads as a real trend, not a sparse scatter.
 */
async function getMonthlyMealDailySeries(
  year: number,
  month: number
): Promise<DailyMealPoint[]> {
  const [attendance, guests] = await Promise.all([
    // `meal_attendances.date` is a day-key column.
    prisma.mealAttendance.groupBy({
      by: ["date", "mealTime"],
      where: {
        date: {
          gte: istCalendarMonthStart(year, month),
          lte: istCalendarMonthEnd(year, month),
        },
      },
      _count: { _all: true },
    }),

    // `guest_meals.date` holds mixed conventions, so it needs the true
    // India-month window, same as the per-boarder query above.
    prisma.guestMeal.groupBy({
      by: ["date"],
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

  const daysInMonth = getDaysInMonth(new Date(year, month, 1))
  const points: DailyMealPoint[] = Array.from(
    { length: daysInMonth },
    (_, index) => ({ day: index + 1, lunch: 0, dinner: 0, guest: 0, total: 0 })
  )

  for (const row of attendance) {
    const point = points[istParts(row.date).day - 1]
    if (!point) continue
    if (row.mealTime === MealTimeType.LUNCH) point.lunch += row._count._all
    else point.dinner += row._count._all
  }

  for (const row of guests) {
    const point = points[istParts(row.date).day - 1]
    if (!point) continue
    point.guest += row._sum.numberOfMeals ?? 0
  }

  for (const point of points)
    point.total = point.lunch + point.dinner + point.guest

  return points
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
  const [users, attendance, guests, dailySeries] = await Promise.all([
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

    getMonthlyMealDailySeries(year, month),
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
    dailySeries,
  }
}
