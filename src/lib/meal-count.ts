import "server-only"

import { istCalendarDay } from "@/lib/date"
import { MealTimeType } from "@/lib/generated/prisma"
import prisma from "@/lib/prisma"

/**
 * The slots on one India day whose count has already been generated.
 *
 * Once a count goes to the kitchen it is cooking to that number, so a guest
 * meal booked afterwards is a plate nobody bought. `daily_meal_activities` is
 * the record of that having happened and the only thing that actually knows.
 *
 * Assuming it instead is what this replaces: guest booking treated today's
 * lunch as gone the moment the day started, which closed lunch bookings on
 * every day the count was never generated at all.
 *
 * Deliberately uncached. It flips exactly once per slot per day, and serving
 * a stale answer either blocks a booking that should be allowed or takes one
 * the kitchen can no longer cook.
 */
export async function getGeneratedSlots(date: Date): Promise<MealTimeType[]> {
  const rows = await prisma.dailyMealActivity.findMany({
    where: { date: istCalendarDay(date) },
    select: { mealTime: true },
  })

  return [...new Set(rows.map((row) => row.mealTime))]
}

/** Whether one slot's count has already gone to the kitchen. */
export async function isMealCountGenerated(
  date: Date,
  mealTime: MealTimeType
): Promise<boolean> {
  const row = await prisma.dailyMealActivity.findFirst({
    where: { date: istCalendarDay(date), mealTime },
    select: { id: true },
  })

  return row !== null
}
