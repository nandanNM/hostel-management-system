import "server-only"

import { MealTimeType, MealType, NonVegType } from "@/lib/generated/prisma"
import { calculateActualNonVegMeal } from "@/lib/meal-priority"
import { getMessConfig } from "@/lib/mess-config"
import prisma from "@/lib/prisma"

export type MealBucket = "VEG" | "CHICKEN" | "FISH" | "EGG"

export const BUCKET_LABELS: Record<MealBucket, string> = {
  VEG: "Vegetarian",
  CHICKEN: "Chicken",
  FISH: "Fish",
  EGG: "Egg",
}

export interface MealBreakdownUser {
  id: string
  name: string | null
  image: string | null
  roomNo: string | null
}

/**
 * `date` must be the exact day-key of the DailyMealActivity row being
 * viewed (mealData.date), not "today" recomputed here — the caller may be
 * looking at a record from a different IST calendar day than the moment
 * this runs (stale client cache, a click right around midnight, etc.), and
 * re-deriving "today" independently silently queries the wrong day.
 */
export async function getMealBreakdownUsers(
  mealTime: MealTimeType,
  date: Date,
  bucket: MealBucket
): Promise<MealBreakdownUser[]> {
  const activity = await prisma.dailyMealActivity.findFirst({
    where: { mealTime, date },
    select: { actualNonVegServed: true },
  })

  if (!activity) return []

  const attendances = await prisma.mealAttendance.findMany({
    where: { mealTime, date },
    select: {
      user: { select: { id: true, name: true, image: true, roomNo: true } },
      meal: {
        select: { type: true, nonVegType: true, dislikedNonVegTypes: true },
      },
    },
  })

  const { nonVegPriority } = await getMessConfig()
  const offering = activity.actualNonVegServed

  const matches = attendances.filter(({ meal }) => {
    if (!meal) return false
    if (meal.type === MealType.VEG) return bucket === "VEG"

    if (!offering) {
      // No schedule that day: every non-veg boarder counted as a single
      // generic bucket, same as the fallback path at generation time.
      return bucket === "CHICKEN"
    }

    const actualType = calculateActualNonVegMeal(
      meal.nonVegType !== NonVegType.NONE
        ? meal.nonVegType
        : NonVegType.CHICKEN,
      meal.dislikedNonVegTypes,
      offering,
      nonVegPriority
    )

    if (actualType === NonVegType.NONE) return bucket === "VEG"
    return actualType === bucket
  })

  return matches
    .map(({ user }) => user)
    .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""))
}
